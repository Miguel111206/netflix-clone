const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Obtener todos los perfiles del usuario
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        id, name, avatar_url, is_kids, language, 
        maturity_level, is_main, created_at
       FROM user_profiles 
       WHERE user_id = $1
       ORDER BY is_main DESC, created_at ASC`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener perfiles:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener perfiles' 
    });
  }
});

// Crear nuevo perfil
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, avatar_url, is_kids = false, language = 'es' } = req.body;

    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: 'El nombre es requerido' 
      });
    }

    // Verificar límite de perfiles según suscripción
    const subscriptionResult = await db.query(
      `SELECT sp.screens 
       FROM user_subscriptions us
       INNER JOIN subscription_plans sp ON us.plan_id = sp.id
       WHERE us.user_id = $1 AND us.status = 'active'
       LIMIT 1`,
      [req.user.id]
    );

    if (subscriptionResult.rows.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'Necesitas una suscripción activa para crear perfiles' 
      });
    }

    const maxProfiles = subscriptionResult.rows[0].screens;

    // Contar perfiles existentes
    const countResult = await db.query(
      'SELECT COUNT(*) as count FROM user_profiles WHERE user_id = $1',
      [req.user.id]
    );

    const currentProfiles = parseInt(countResult.rows[0].count);

    if (currentProfiles >= maxProfiles) {
      return res.status(403).json({ 
        success: false, 
        message: `Tu plan solo permite ${maxProfiles} perfiles. Actualiza tu suscripción para agregar más.` 
      });
    }

    // Determinar si es el primer perfil (principal)
    const is_main = currentProfiles === 0;

    const result = await db.query(
      `INSERT INTO user_profiles 
       (user_id, name, avatar_url, is_kids, language, is_main)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, avatar_url, is_kids, language, is_main, created_at`,
      [req.user.id, name, avatar_url, is_kids, language, is_main]
    );

    res.status(201).json({
      success: true,
      message: 'Perfil creado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear perfil:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al crear perfil' 
    });
  }
});

// Actualizar perfil
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, avatar_url, is_kids, language, maturity_level } = req.body;

    const result = await db.query(
      `UPDATE user_profiles 
       SET 
         name = COALESCE($1, name),
         avatar_url = COALESCE($2, avatar_url),
         is_kids = COALESCE($3, is_kids),
         language = COALESCE($4, language),
         maturity_level = COALESCE($5, maturity_level)
       WHERE id = $6 AND user_id = $7
       RETURNING id, name, avatar_url, is_kids, language, maturity_level`,
      [name, avatar_url, is_kids, language, maturity_level, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Perfil no encontrado' 
      });
    }

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar perfil' 
    });
  }
});

// Eliminar perfil
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // No permitir eliminar el perfil principal
    const checkMain = await db.query(
      'SELECT is_main FROM user_profiles WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (checkMain.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Perfil no encontrado' 
      });
    }

    if (checkMain.rows[0].is_main) {
      return res.status(403).json({ 
        success: false, 
        message: 'No puedes eliminar el perfil principal' 
      });
    }

    await db.query(
      'DELETE FROM user_profiles WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    res.json({
      success: true,
      message: 'Perfil eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar perfil:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar perfil' 
    });
  }
});

// Obtener "Continuar viendo" para un perfil
router.get('/:id/continue-watching', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const limit = req.query.limit || 20;

    // Verificar que el perfil pertenezca al usuario
    const checkProfile = await db.query(
      'SELECT id FROM user_profiles WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (checkProfile.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Perfil no encontrado' 
      });
    }

    const result = await db.query(
      'SELECT * FROM get_continue_watching($1, $2)',
      [id, limit]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener continuar viendo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener continuar viendo' 
    });
  }
});

// Actualizar progreso de visualización
router.post('/:id/progress', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { movie_id, last_position, total_duration, completed, device_type } = req.body;

    if (!movie_id || last_position === undefined || !total_duration) {
      return res.status(400).json({ 
        success: false, 
        message: 'Datos de progreso incompletos' 
      });
    }

    await db.query(
      `INSERT INTO viewing_history 
       (profile_id, movie_id, last_position, total_duration, completed, device_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (profile_id, movie_id)
       DO UPDATE SET
         last_position = EXCLUDED.last_position,
         total_duration = EXCLUDED.total_duration,
         completed = EXCLUDED.completed,
         last_watched = CURRENT_TIMESTAMP,
         device_type = EXCLUDED.device_type`,
      [id, movie_id, last_position, total_duration, completed || false, device_type || 'web']
    );

    res.json({
      success: true,
      message: 'Progreso guardado exitosamente'
    });
  } catch (error) {
    console.error('Error al guardar progreso:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al guardar progreso' 
    });
  }
});

// Calificar película
router.post('/:id/ratings', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { movie_id, rating, review } = req.body;

    if (!movie_id || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Datos de calificación inválidos (1-5 estrellas)' 
      });
    }

    await db.query(
      `INSERT INTO movie_ratings (profile_id, movie_id, rating, review)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (profile_id, movie_id)
       DO UPDATE SET rating = EXCLUDED.rating, review = EXCLUDED.review`,
      [id, movie_id, rating, review || null]
    );

    res.json({
      success: true,
      message: 'Calificación guardada exitosamente'
    });
  } catch (error) {
    console.error('Error al guardar calificación:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al guardar calificación' 
    });
  }
});

// Obtener calificaciones del perfil
router.get('/:id/ratings', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT 
        mr.id,
        mr.movie_id,
        mr.rating,
        mr.review,
        mr.created_at,
        m.title,
        m.poster_path
       FROM movie_ratings mr
       INNER JOIN movies m ON mr.movie_id = m.id
       WHERE mr.profile_id = $1
       ORDER BY mr.created_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener calificaciones:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener calificaciones' 
    });
  }
});

module.exports = router;
