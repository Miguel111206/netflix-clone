const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.TMDB_BASE_URL;

// Obtener todos los favoritos del usuario (usando stored procedure)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM get_user_favorites($1)',
      [req.user.id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener favoritos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener favoritos' 
    });
  }
});

// Agregar película a favoritos
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { tmdb_id } = req.body;

    if (!tmdb_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Se requiere el ID de TMDB de la película' 
      });
    }

    // Obtener detalles de la película desde TMDB
    const movieResponse = await axios.get(
      `${TMDB_BASE_URL}/movie/${tmdb_id}`,
      {
        params: {
          api_key: TMDB_API_KEY,
          language: 'es-ES',
          append_to_response: 'videos'
        }
      }
    );

    const movieData = movieResponse.data;
    
    // Obtener trailer
    const trailer = movieData.videos.results.find(
      video => video.type === 'Trailer' && video.site === 'YouTube'
    );

    // Insertar o actualizar película usando stored procedure
    const movieResult = await db.query(
      `SELECT upsert_movie($1, $2, $3, $4, $5, $6, $7, $8, $9) as movie_id`,
      [
        movieData.id,
        movieData.title,
        movieData.overview,
        movieData.poster_path,
        movieData.backdrop_path,
        movieData.release_date,
        movieData.vote_average,
        JSON.stringify(movieData.genre_ids || movieData.genres.map(g => g.id)),
        trailer ? trailer.key : null
      ]
    );

    const movieId = movieResult.rows[0].movie_id;

    // Agregar a favoritos usando stored procedure
    const favoriteResult = await db.query(
      'SELECT add_to_favorites($1, $2) as added',
      [req.user.id, movieId]
    );

    if (favoriteResult.rows[0].added) {
      res.status(201).json({
        success: true,
        message: 'Película agregada a favoritos',
        data: {
          movie_id: movieId,
          tmdb_id: movieData.id
        }
      });
    } else {
      res.json({
        success: true,
        message: 'La película ya estaba en favoritos',
        data: {
          movie_id: movieId,
          tmdb_id: movieData.id
        }
      });
    }
  } catch (error) {
    console.error('Error al agregar a favoritos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al agregar a favoritos' 
    });
  }
});

// Verificar si una película está en favoritos
router.get('/check/:tmdb_id', authMiddleware, async (req, res) => {
  try {
    const { tmdb_id } = req.params;

    const result = await db.query(
      `SELECT f.id 
       FROM favorites f
       INNER JOIN movies m ON f.movie_id = m.id
       WHERE f.user_id = $1 AND m.tmdb_id = $2`,
      [req.user.id, tmdb_id]
    );

    res.json({
      success: true,
      data: {
        is_favorite: result.rows.length > 0
      }
    });
  } catch (error) {
    console.error('Error al verificar favorito:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al verificar favorito' 
    });
  }
});

// Eliminar película de favoritos (el trigger registrará la acción)
router.delete('/:tmdb_id', authMiddleware, async (req, res) => {
  try {
    const { tmdb_id } = req.params;

    const result = await db.query(
      `DELETE FROM favorites 
       WHERE user_id = $1 
       AND movie_id IN (
         SELECT id FROM movies WHERE tmdb_id = $2
       )
       RETURNING id`,
      [req.user.id, tmdb_id]
    );

    if (result.rows.length > 0) {
      res.json({
        success: true,
        message: 'Película eliminada de favoritos'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Película no encontrada en favoritos'
      });
    }
  } catch (error) {
    console.error('Error al eliminar de favoritos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar de favoritos' 
    });
  }
});

// Obtener recomendaciones basadas en favoritos (usando stored procedure)
router.get('/recommendations', authMiddleware, async (req, res) => {
  try {
    const limit = req.query.limit || 20;
    
    const result = await db.query(
      'SELECT * FROM get_recommendations($1, $2)',
      [req.user.id, limit]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener recomendaciones:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener recomendaciones' 
    });
  }
});

// Obtener logs de actividad (generados por triggers)
router.get('/activity', authMiddleware, async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    
    const result = await db.query(
      `SELECT 
        al.id,
        al.action,
        al.details,
        al.created_at,
        m.title as movie_title,
        m.poster_path
       FROM activity_logs al
       LEFT JOIN movies m ON (al.details->>'movie_id')::INTEGER = m.id
       WHERE al.user_id = $1
       ORDER BY al.created_at DESC
       LIMIT $2`,
      [req.user.id, limit]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener actividad:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener actividad' 
    });
  }
});

module.exports = router;
