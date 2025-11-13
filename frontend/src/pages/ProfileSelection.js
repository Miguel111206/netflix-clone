import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profilesAPI } from '../services/api';
import { FaUser, FaChild, FaPlus } from 'react-icons/fa';

const ProfileSelection = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const response = await profilesAPI.getAll();
      setProfiles(response.data.data);
    } catch (error) {
      console.error('Error al cargar perfiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProfile = (profile) => {
    localStorage.setItem('currentProfile', JSON.stringify(profile));
    navigate('/');
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#141414',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '40px' }}>¿Quién está viendo?</h1>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 150px))',
        gap: '30px',
        justifyContent: 'center'
      }}>
        {profiles.map((profile) => (
          <div
            key={profile.id}
            onClick={() => handleSelectProfile(profile)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'transform 0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{
              width: '150px',
              height: '150px',
              borderRadius: '8px',
              backgroundColor: profile.is_kids ? '#4a90e2' : '#e50914',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10px'
            }}>
              {profile.is_kids ? <FaChild size={60} /> : <FaUser size={60} />}
            </div>
            <span style={{ fontSize: '18px', color: '#808080' }}>{profile.name}</span>
          </div>
        ))}
        
        <div
          onClick={() => alert('Función de crear perfil en desarrollo')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer'
          }}
        >
          <div style={{
            width: '150px',
            height: '150px',
            borderRadius: '8px',
            border: '2px dashed #808080',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '10px'
          }}>
            <FaPlus size={40} color="#808080" />
          </div>
          <span style={{ fontSize: '18px', color: '#808080' }}>Agregar perfil</span>
        </div>
      </div>
    </div>
  );
};

export default ProfileSelection;
