import React from 'react';

const IMAGE_BASE_URL = process.env.REACT_APP_TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p';

const MovieRow = ({ title, movies, isLargeRow, onMovieClick }) => {
  if (!movies || movies.length === 0) return null;

  return (
    <div className="movie-row">
      <h2 className="movie-row-title">{title}</h2>
      <div className="movie-row-posters">
        {movies.map((movie) => (
          <img
            key={movie.id}
            className={`movie-poster ${isLargeRow ? 'movie-poster-large' : ''}`}
            src={`${IMAGE_BASE_URL}/${isLargeRow ? 'w500' : 'w300'}${
              isLargeRow ? movie.backdrop_path : movie.poster_path
            }`}
            alt={movie.title || movie.name}
            onClick={() => onMovieClick && onMovieClick(movie)}
            loading="lazy"
          />
        ))}
      </div>
    </div>
  );
};

export default MovieRow;
