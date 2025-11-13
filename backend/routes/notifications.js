const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Obtener todas las notificaciones del usuario
router.get('/', authMiddleware, async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    
    const result = await db.query(
      `SELECT 
        id, type, title, message, is_read, 
        action_url, created_at
       FROM notifications 
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [req.user.id, limit]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener notificaciones' 
    });
  }
});

// Obtener contador de notificaciones no leídas
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [req.user.id]
    );

    res.json({
      success: true,
      data: {
        count: parseInt(result.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Error al obtener contador:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener contador de notificaciones' 
    });
  }
});

// Marcar notificación como leída
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notificación no encontrada' 
      });
    }

    res.json({
      success: true,
      message: 'Notificación marcada como leída'
    });
  } catch (error) {
    console.error('Error al marcar notificación:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al marcar notificación como leída' 
    });
  }
});

// Marcar todas las notificaciones como leídas
router.put('/mark-all-read', authMiddleware, async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE',
      [req.user.id]
    );

    res.json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas'
    });
  } catch (error) {
    console.error('Error al marcar todas las notificaciones:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al marcar notificaciones como leídas' 
    });
  }
});

module.exports = router;
