import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import MovieModal from '../components/MovieModal';
import { favoritesAPI } from '../services/api';
import { FaHeart } from 'react-icons/fa';

const IMAGE_BASE_URL = process.env.REACT_APP_TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p';

const MyList = () => {
  const [favorites, setFavorites] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const response = await favoritesAPI.getAll();
      setFavorites(response.data.data);
    } catch (error) {
      console.error('Error al cargar favoritos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMovieClick = (movie) => {
    setSelectedMovie(movie);
  };

  const handleCloseModal = () => {
    setSelectedMovie(null);
    // Recargar favoritos por si el usuario eliminó alguno
    loadFavorites();
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="my-list-page">
      <Navbar />
      
      <h1 className="my-list-title">Mi lista</h1>
      
      {favorites.length === 0 ? (
        <div className="empty-list">
          <div className="empty-list-icon">
            <FaHeart />
          </div>
          <p className="empty-list-text">
            Aún no has agregado películas a tu lista
          </p>
          <p className="empty-list-text">
            Explora películas y agrégalas para verlas más tarde
          </p>
        </div>
      ) : (
        <div className="my-list-grid">
          {favorites.map((movie) => (
            <div key={movie.movie_id} style={{ position: 'relative' }}>
              <img
                className="movie-poster"
                src={`${IMAGE_BASE_URL}/w300${movie.poster_path}`}
                alt={movie.title}
                onClick={() => handleMovieClick({
                  id: movie.movie_id,
                  title: movie.title,
                  overview: movie.overview,
                  poster_path: movie.poster_path,
                  backdrop_path: movie.backdrop_path,
                  release_date: movie.release_date,
                  vote_average: movie.vote_average,
                })}
                style={{ cursor: 'pointer' }}
              />
            </div>
          ))}
        </div>
      )}

      {selectedMovie && (
        <MovieModal movie={selectedMovie} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default MyList;
