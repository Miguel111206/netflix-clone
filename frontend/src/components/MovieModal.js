import React, { useState, useEffect } from 'react';
import YouTube from 'react-youtube';
import { FaTimes, FaPlay, FaPlus, FaCheck } from 'react-icons/fa';
import { moviesAPI, favoritesAPI } from '../services/api';

const IMAGE_BASE_URL = process.env.REACT_APP_TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p';

const MovieModal = ({ movie, onClose }) => {
  const [movieDetails, setMovieDetails] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (movie?.id) {
      loadMovieDetails();
      checkFavoriteStatus();
    }
  }, [movie]);

  const loadMovieDetails = async () => {
    try {
      const response = await moviesAPI.getDetails(movie.id);
      const details = response.data.data;
      
      // Si no tiene trailer en TMDB, buscar en YouTube directamente
      if (!details.trailer_key) {
        console.log('No se encontró trailer en TMDB para:', details.title);
      }
      
      setMovieDetails(details);
    } catch (error) {
      console.error('Error al cargar detalles:', error);
      setMovieDetails(movie);
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const response = await favoritesAPI.check(movie.id);
      setIsFavorite(response.data.data.is_favorite);
    } catch (error) {
      console.error('Error al verificar favorito:', error);
    }
  };

  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        await favoritesAPI.remove(movie.id);
        setIsFavorite(false);
      } else {
        await favoritesAPI.add(movie.id);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error al actualizar favorito:', error);
    }
  };

  if (!movie) return null;

  const opts = {
    height: '480',
    width: '100%',
    playerVars: {
      autoplay: 1,
    },
  };

  const displayMovie = movieDetails || movie;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <FaTimes />
        </button>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner" />
          </div>
        ) : (
          <>
            {displayMovie.trailer_key ? (
              <YouTube videoId={displayMovie.trailer_key} opts={opts} />
            ) : (
              <div
                className="modal-video"
                style={{
                  backgroundImage: `url(${IMAGE_BASE_URL}/original${displayMovie.backdrop_path})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(displayMovie.title + ' trailer oficial')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ fontSize: '18px', padding: '15px 30px' }}
                >
                  <FaPlay style={{ marginRight: '10px' }} />
                  Buscar Trailer en YouTube
                </a>
              </div>
            )}

            <div className="modal-details">
              <h2 className="modal-title">{displayMovie.title || displayMovie.name}</h2>

              <div className="modal-info">
                <span className="modal-rating">
                  {displayMovie.vote_average?.toFixed(1)} ★
                </span>
                <span>{new Date(displayMovie.release_date).getFullYear()}</span>
                {displayMovie.runtime && <span>{displayMovie.runtime} min</span>}
              </div>

              <p className="modal-description">{displayMovie.overview}</p>

              {displayMovie.genres && (
                <div className="modal-genres">
                  {displayMovie.genres.map((genre) => (
                    <span key={genre.id} className="genre-tag">
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="modal-actions">
                <button className="btn btn-primary">
                  <FaPlay /> Reproducir
                </button>
                {displayMovie.trailer_key && (
                  <a
                    href={`https://www.youtube.com/watch?v=${displayMovie.trailer_key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <FaPlay /> Ver en YouTube
                  </a>
                )}
                <button
                  className={`favorite-btn ${isFavorite ? 'active' : ''}`}
                  onClick={toggleFavorite}
                  title={isFavorite ? 'Quitar de Mi lista' : 'Agregar a Mi lista'}
                >
                  {isFavorite ? <FaCheck /> : <FaPlus />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MovieModal;
