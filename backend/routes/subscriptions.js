const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Obtener todos los planes de suscripción
router.get('/plans', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM subscription_plans WHERE is_active = TRUE ORDER BY price ASC'
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener planes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener planes de suscripción' 
    });
  }
});

// Obtener suscripción activa del usuario
router.get('/active', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM get_active_subscription($1)',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No tienes una suscripción activa'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener suscripción activa:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener suscripción activa' 
    });
  }
});

// Crear nueva suscripción
router.post('/subscribe', authMiddleware, async (req, res) => {
  try {
    const { plan_id, payment_method_id, coupon_code } = req.body;

    if (!plan_id || !payment_method_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Plan y método de pago son requeridos' 
      });
    }

    // Verificar si ya tiene una suscripción activa
    const activeCheck = await db.query(
      'SELECT id FROM user_subscriptions WHERE user_id = $1 AND status = $2',
      [req.user.id, 'active']
    );

    if (activeCheck.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ya tienes una suscripción activa' 
      });
    }

    // Crear suscripción usando stored procedure
    const result = await db.query(
      'SELECT create_subscription($1, $2, $3, $4) as result',
      [req.user.id, plan_id, payment_method_id, coupon_code || null]
    );

    const subscriptionResult = result.rows[0].result;

    if (subscriptionResult.success) {
      res.status(201).json({
        success: true,
        message: 'Suscripción creada exitosamente',
        data: subscriptionResult
      });
    } else {
      res.status(400).json({
        success: false,
        message: subscriptionResult.message
      });
    }
  } catch (error) {
    console.error('Error al crear suscripción:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al crear suscripción' 
    });
  }
});

// Cancelar suscripción
router.post('/cancel', authMiddleware, async (req, res) => {
  try {
    const { subscription_id, immediate = false } = req.body;

    if (!subscription_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de suscripción es requerido' 
      });
    }

    const result = await db.query(
      'SELECT cancel_subscription($1, $2, $3) as cancelled',
      [req.user.id, subscription_id, immediate]
    );

    if (result.rows[0].cancelled) {
      res.json({
        success: true,
        message: immediate 
          ? 'Suscripción cancelada inmediatamente' 
          : 'Suscripción cancelada. Se mantendrá activa hasta el final del período'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Suscripción no encontrada'
      });
    }
  } catch (error) {
    console.error('Error al cancelar suscripción:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al cancelar suscripción' 
    });
  }
});

// Validar cupón
router.post('/validate-coupon', authMiddleware, async (req, res) => {
  try {
    const { code, plan_id } = req.body;

    if (!code || !plan_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Código de cupón y plan son requeridos' 
      });
    }

    // Obtener precio del plan
    const planResult = await db.query(
      'SELECT price FROM subscription_plans WHERE id = $1',
      [plan_id]
    );

    if (planResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Plan no encontrado' 
      });
    }

    const planPrice = planResult.rows[0].price;

    // Verificar cupón
    const couponResult = await db.query(
      `SELECT 
        id, code, discount_type, discount_value, 
        valid_until, max_uses, current_uses 
       FROM discount_coupons 
       WHERE code = $1 
       AND is_active = TRUE 
       AND (valid_until IS NULL OR valid_until >= CURRENT_TIMESTAMP)
       AND (max_uses IS NULL OR current_uses < max_uses)`,
      [code]
    );

    if (couponResult.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cupón inválido o expirado' 
      });
    }

    const coupon = couponResult.rows[0];
    let discount = 0;

    if (coupon.discount_type === 'percentage') {
      discount = planPrice * (coupon.discount_value / 100);
    } else {
      discount = coupon.discount_value;
    }

    const finalPrice = Math.max(0, planPrice - discount);

    res.json({
      success: true,
      data: {
        coupon_code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        original_price: planPrice,
        discount_amount: discount,
        final_price: finalPrice
      }
    });
  } catch (error) {
    console.error('Error al validar cupón:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al validar cupón' 
    });
  }
});

module.exports = router;
