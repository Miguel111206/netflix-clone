import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { subscriptionsAPI, paymentsAPI } from '../services/api';
import { FaCreditCard, FaCalendar, FaDollarSign } from 'react-icons/fa';

const Account = () => {
  const [subscription, setSubscription] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadAccountData();
  }, []);

  const loadAccountData = async () => {
    try {
      const [subRes, historyRes] = await Promise.all([
        subscriptionsAPI.getActive(),
        paymentsAPI.getHistory(10)
      ]);
      
      setSubscription(subRes.data.data);
      setPaymentHistory(historyRes.data.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (window.confirm('¿Estás seguro de cancelar tu suscripción?')) {
      try {
        await subscriptionsAPI.cancel(subscription.subscription_id, false);
        alert('Tu suscripción se cancelará al final del período actual');
        loadAccountData();
      } catch (error) {
        alert('Error al cancelar suscripción');
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingTop: '100px', padding: '100px 50px' }}>
      <Navbar />
      
      <h1 style={{ fontSize: '36px', marginBottom: '30px' }}>Mi cuenta</h1>

      {/* Información del usuario */}
      <div style={{
        backgroundColor: '#181818',
        padding: '30px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>Información personal</h2>
        <p><strong>Nombre:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
      </div>

      {/* Suscripción activa */}
      {subscription ? (
        <div style={{
          backgroundColor: '#181818',
          padding: '30px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>Suscripción actual</h2>
          <p><strong>Plan:</strong> {subscription.plan_name}</p>
          <p><strong>Precio:</strong> ${subscription.plan_price}/mes</p>
          <p><strong>Calidad:</strong> {subscription.quality}</p>
          <p><strong>Pantallas:</strong> {subscription.screens}</p>
          <p><strong>Renovación:</strong> {subscription.auto_renew ? 'Automática' : 'Cancelada'}</p>
          
          {subscription.auto_renew && (
            <button
              onClick={handleCancelSubscription}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                backgroundColor: '#e50914',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancelar suscripción
            </button>
          )}
        </div>
      ) : (
        <div style={{
          backgroundColor: '#181818',
          padding: '30px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>No tienes suscripción activa</h2>
          <p style={{ marginBottom: '20px' }}>Suscríbete para disfrutar de todo el contenido</p>
          <button
            onClick={() => window.location.href = '/subscription'}
            style={{
              padding: '15px 30px',
              backgroundColor: '#e50914',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Ver planes
          </button>
        </div>
      )}

      {/* Historial de pagos */}
      <div style={{
        backgroundColor: '#181818',
        padding: '30px',
        borderRadius: '8px'
      }}>
        <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>Historial de pagos</h2>
        {paymentHistory.length === 0 ? (
          <p>No hay pagos registrados</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Fecha</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Descripción</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Monto</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {paymentHistory.map((payment) => (
                <tr key={payment.id} style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '10px' }}>
                    {new Date(payment.payment_date).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '10px' }}>{payment.description}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    ${payment.amount}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <span style={{
                      padding: '5px 10px',
                      borderRadius: '4px',
                      backgroundColor: payment.status === 'completed' ? '#46d369' : '#e87c03',
                      fontSize: '12px'
                    }}>
                      {payment.status === 'completed' ? 'Completado' : 'Pendiente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Account;
