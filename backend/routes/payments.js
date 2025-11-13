const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Obtener métodos de pago del usuario
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        id, type, card_last_four, card_brand, 
        expiry_month, expiry_year, billing_name, 
        is_default, created_at
       FROM payment_methods 
       WHERE user_id = $1 AND is_active = TRUE
       ORDER BY is_default DESC, created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener métodos de pago:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener métodos de pago' 
    });
  }
});

// Agregar método de pago
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { 
      type, 
      card_number, 
      card_brand, 
      expiry_month, 
      expiry_year, 
      billing_name,
      is_default = false 
    } = req.body;

    if (!type || !card_number || !expiry_month || !expiry_year || !billing_name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Todos los campos son requeridos' 
      });
    }

    // Solo guardar los últimos 4 dígitos
    const card_last_four = card_number.slice(-4);

    // Si es el método por defecto, desactivar otros
    if (is_default) {
      await db.query(
        'UPDATE payment_methods SET is_default = FALSE WHERE user_id = $1',
        [req.user.id]
      );
    }

    const result = await db.query(
      `INSERT INTO payment_methods 
       (user_id, type, card_last_four, card_brand, expiry_month, expiry_year, billing_name, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, type, card_last_four, card_brand, expiry_month, expiry_year, billing_name, is_default`,
      [req.user.id, type, card_last_four, card_brand, expiry_month, expiry_year, billing_name, is_default]
    );

    res.status(201).json({
      success: true,
      message: 'Método de pago agregado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al agregar método de pago:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al agregar método de pago' 
    });
  }
});

// Establecer método de pago por defecto
router.put('/:id/default', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el método pertenezca al usuario
    const checkResult = await db.query(
      'SELECT id FROM payment_methods WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Método de pago no encontrado' 
      });
    }

    // Desactivar otros como predeterminados
    await db.query(
      'UPDATE payment_methods SET is_default = FALSE WHERE user_id = $1',
      [req.user.id]
    );

    // Activar este como predeterminado
    await db.query(
      'UPDATE payment_methods SET is_default = TRUE WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: 'Método de pago establecido como predeterminado'
    });
  } catch (error) {
    console.error('Error al establecer método por defecto:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al establecer método por defecto' 
    });
  }
});

// Eliminar método de pago
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'UPDATE payment_methods SET is_active = FALSE WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Método de pago no encontrado' 
      });
    }

    res.json({
      success: true,
      message: 'Método de pago eliminado'
    });
  } catch (error) {
    console.error('Error al eliminar método de pago:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar método de pago' 
    });
  }
});

// Obtener historial de pagos
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    
    const result = await db.query(
      `SELECT 
        ph.id,
        ph.amount,
        ph.currency,
        ph.status,
        ph.transaction_id,
        ph.payment_date,
        ph.description,
        pm.card_last_four,
        pm.card_brand
       FROM payment_history ph
       LEFT JOIN payment_methods pm ON ph.payment_method_id = pm.id
       WHERE ph.user_id = $1
       ORDER BY ph.payment_date DESC
       LIMIT $2`,
      [req.user.id, limit]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener historial de pagos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener historial de pagos' 
    });
  }
});

module.exports = router;