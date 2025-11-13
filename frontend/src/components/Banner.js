import React, { useState, useEffect } from 'react';
import { FaPlay, FaInfoCircle } from 'react-icons/fa';

const IMAGE_BASE_URL = process.env.REACT_APP_TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p';

const Banner = ({ movie, onPlayClick, onInfoClick }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (movie?.backdrop_path) {
      const img = new Image();
      img.src = `${IMAGE_BASE_URL}/original${movie.backdrop_path}`;
      img.onload = () => setImageLoaded(true);
    }
  }, [movie]);

  if (!movie) return null;

  const truncate = (str, n) => {
    return str?.length > n ? str.substr(0, n - 1) + '...' : str;
  };

  return (
    <div
      className="banner"
      style={{
        backgroundImage: imageLoaded
          ? `url(${IMAGE_BASE_URL}/original${movie.backdrop_path})`
          : 'none',
        backgroundColor: '#141414',
      }}
    >
      <div className="banner-overlay" />
      <div className="banner-content">
        <h1 className="banner-title">
          {movie.title || movie.name || movie.original_title}
        </h1>
        <p className="banner-description">
          {truncate(movie.overview, 150)}
        </p>
        <div className="banner-buttons">
          <button 
            className="btn btn-primary"
            onClick={() => onPlayClick && onPlayClick(movie)}
          >
            <FaPlay /> Reproducir
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => onInfoClick && onInfoClick(movie)}
          >
            <FaInfoCircle /> Más información
          </button>
        </div>
      </div>
    </div>
  );
};

export default Banner;
