import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaSignOutAlt, FaTimes } from 'react-icons/fa';

const Navbar = ({ onSearch, onClearSearch }) => {
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    if (onClearSearch) {
      onClearSearch();
    }
  };

  const handleLogoClick = () => {
    setSearchQuery('');
    if (onClearSearch) {
      onClearSearch();
    }
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-logo" onClick={handleLogoClick}>
        NETFLIX
      </div>

      <ul className="navbar-menu">
        <li onClick={handleLogoClick}>Inicio</li>
        <li onClick={() => navigate('/my-list')}>Mi lista</li>
        <li onClick={() => navigate('/account')}>Mi cuenta</li>
      </ul>

      <div className="navbar-right">
        {onSearch && (
          <form onSubmit={handleSearch} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              className="search-bar"
              placeholder="Buscar películas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Limpiar búsqueda"
              >
                <FaTimes size={16} />
              </button>
            )}
          </form>
        )}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span>{user.name}</span>
          <FaUser size={20} />
          <button 
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Cerrar sesión"
          >
            <FaSignOutAlt size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;