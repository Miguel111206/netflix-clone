import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscriptionsAPI } from '../services/api';
import { FaLock, FaGift } from 'react-icons/fa';
import '../styles/Subscription.css';

const SubscriptionPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(null);
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    cardBrand: 'Visa',
    expiryMonth: '',
    expiryYear: '',
    billingName: '',
  });
  const navigate = useNavigate();

  const coupons = [
    { code: 'WELCOME50', desc: '50% OFF' },
    { code: 'NETFLIX10', desc: '$10 OFF' },
    { code: 'FIRST3MONTHS', desc: '30% x 3 meses' },
  ];

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await subscriptionsAPI.getPlans();
      setPlans(response.data.data);
      // Auto-seleccionar el plan estándar
      if (response.data.data.length >= 2) {
        setSelectedPlan(response.data.data[1]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setTimeout(() => {
      document.querySelector('.payment-container')?.scrollIntoView({ 
        behavior: 'smooth' 
      });
    }, 100);
  };

  const handleApplyCoupon = (code = couponCode) => {
    if (!code || !selectedPlan) return;
    
    subscriptionsAPI.validateCoupon(code, selectedPlan.id)
      .then(res => {
        setCouponDiscount(res.data.data);
        alert(`✅ Cupón aplicado: -$${res.data.data.discount_amount.toFixed(2)}`);
      })
      .catch(err => {
        alert('❌ ' + (err.response?.data?.message || 'Cupón inválido'));
        setCouponDiscount(null);
      });
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    
    if (!selectedPlan) {
      alert('Selecciona un plan');
      return;
    }

    try {
      const response = await subscriptionsAPI.subscribe({
        plan_id: selectedPlan.id,
        payment_method_id: 1,
        coupon_code: couponCode || null
      });

      if (response.data.success) {
        alert('🎉 ¡Suscripción exitosa!');
        navigate('/profiles');
      }
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || 'Intenta de nuevo'));
    }
  };

  const parseFeatures = (features) => {
    try {
      if (Array.isArray(features)) return features;
      if (typeof features === 'string') return JSON.parse(features);
      return [];
    } catch {
      return [];
    }
  };

  const getPrice = (plan) => {
    if (couponDiscount && selectedPlan?.id === plan.id) {
      return parseFloat(couponDiscount.final_price) || 0;
    }
    return parseFloat(plan.price) || 0;
  };

  const getBadge = (name) => {
    if (name.toLowerCase().includes('premium')) return 'Más popular';
    return null;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="subscription-page">
      <div className="subscription-header">
        <h1>Elige el plan ideal para ti</h1>
        <p>Baja de categoría o cancela en cualquier momento</p>
      </div>

      <div className="plans-grid">
        {plans.map((plan) => {
          const badge = getBadge(plan.name);
          const hasDiscount = couponDiscount && selectedPlan?.id === plan.id;
          
          return (
            <div
              key={plan.id}
              className={`plan-card ${selectedPlan?.id === plan.id ? 'selected' : ''}`}
              onClick={() => handleSelectPlan(plan)}
            >
              {badge && <div className="plan-badge">{badge}</div>}
              
              <div className="plan-header">
                <div className="plan-name">{plan.name}</div>
                <div className="plan-quality">{plan.quality}</div>
              </div>

              <div className="plan-body">
                <div className="plan-price">
                  <div className="price-label">Precio mensual</div>
                  <div className={`price-amount ${hasDiscount ? 'discounted' : ''}`}>
                    {hasDiscount ? (
                      <>
                        <span className="original-price">COP {(plan.price * 4000).toLocaleString()}</span>
                        <span className="final-price">COP {(getPrice(plan) * 4000).toLocaleString()}</span>
                      </>
                    ) : (
                      `COP ${(plan.price * 4000).toLocaleString()}`
                    )}
                  </div>
                </div>

                <div className="plan-features">
                  <div className="feature-item">
                    <div className="feature-label">Calidad de audio y video</div>
                    <div className="feature-value">
                      {plan.quality === 'SD' ? 'Buena' : plan.quality === 'HD' ? 'Excelente' : 'Óptima'}
                    </div>
                  </div>

                  <div className="feature-item">
                    <div className="feature-label">Resolución</div>
                    <div className="feature-value">
                      {plan.quality === 'SD' ? '720p (HD)' : plan.quality === 'HD' ? '1080p (Full HD)' : '4K (Ultra HD) + HDR'}
                    </div>
                  </div>

                  {plan.quality === '4K+HDR' && (
                    <div className="feature-item">
                      <div className="feature-label">Audio espacial (sonido inmersivo)</div>
                      <div className="feature-value">Incluido</div>
                    </div>
                  )}

                  <div className="feature-item">
                    <div className="feature-label">Dispositivos compatibles</div>
                    <div className="feature-value">TV, computadora, celular, tablet</div>
                  </div>

                  <div className="feature-item">
                    <div className="feature-label">Dispositivos del hogar en los que se puede ver Netflix al mismo tiempo</div>
                    <div className="feature-value">{plan.screens}</div>
                  </div>

                  <div className="feature-item">
                    <div className="feature-label">Dispositivos de descarga</div>
                    <div className="feature-value">{plan.downloads ? plan.screens : 1}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedPlan && (
        <div className="payment-container">
          <div className="payment-box">
            <h2>Información de pago</h2>

            <div className="coupons-available">
              <div className="coupons-title">
                <FaGift /> Cupones disponibles
              </div>
              <div className="coupon-tags">
                {coupons.map(c => (
                  <div key={c.code} className="coupon-tag" onClick={() => {
                    setCouponCode(c.code);
                    handleApplyCoupon(c.code);
                  }}>
                    {c.code} - {c.desc}
                  </div>
                ))}
              </div>
            </div>

            <div className="coupon-input-group">
              <input
                type="text"
                placeholder="Código de cupón"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="coupon-input"
              />
              <button onClick={() => handleApplyCoupon()} className="btn-apply-coupon">
                Aplicar
              </button>
            </div>

            <form onSubmit={handleSubscribe} className="payment-form">
              <div className="form-group">
                <label className="form-label">Número de tarjeta</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="1234 5678 9012 3456"
                  value={paymentData.cardNumber}
                  onChange={(e) => setPaymentData({...paymentData, cardNumber: e.target.value})}
                  maxLength="16"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tipo de tarjeta</label>
                <select
                  className="form-select"
                  value={paymentData.cardBrand}
                  onChange={(e) => setPaymentData({...paymentData, cardBrand: e.target.value})}
                  required
                >
                  <option value="Visa">Visa</option>
                  <option value="Mastercard">Mastercard</option>
                  <option value="American Express">American Express</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Mes</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="MM"
                    value={paymentData.expiryMonth}
                    onChange={(e) => setPaymentData({...paymentData, expiryMonth: e.target.value})}
                    min="1"
                    max="12"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Año</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="YYYY"
                    value={paymentData.expiryYear}
                    onChange={(e) => setPaymentData({...paymentData, expiryYear: e.target.value})}
                    min="2024"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nombre del titular</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nombre completo"
                  value={paymentData.billingName}
                  onChange={(e) => setPaymentData({...paymentData, billingName: e.target.value})}
                  required
                />
              </div>

              <button type="submit" className="btn-subscribe">
                Suscribirse - COP {(getPrice(selectedPlan) * 4000).toLocaleString()}
              </button>

              <div className="security-badge">
                <FaLock />
                <span className="security-text">Pago 100% seguro y encriptado</span>
              </div>

              <div className="payment-note">
                Al hacer clic en "Suscribirse", aceptas que tu suscripción se renovará automáticamente y que tu método de pago se cargará el precio de la suscripción hasta que canceles.
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlans;