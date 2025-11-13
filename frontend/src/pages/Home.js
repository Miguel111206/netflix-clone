import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Banner from '../components/Banner';
import MovieRow from '../components/MovieRow';
import MovieModal from '../components/MovieModal';
import { moviesAPI } from '../services/api';

const Home = () => {
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [actionMovies, setActionMovies] = useState([]);
  const [comedyMovies, setComedyMovies] = useState([]);
  const [horrorMovies, setHorrorMovies] = useState([]);
  const [bannerMovie, setBannerMovie] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Géneros disponibles
  const categories = [
    { id: 'all', name: 'Todas' },
    { id: 28, name: 'Acción' },
    { id: 35, name: 'Comedia' },
    { id: 27, name: 'Terror' },
    { id: 878, name: 'Ciencia Ficción' },
    { id: 10749, name: 'Romance' },
    { id: 18, name: 'Drama' },
    { id: 16, name: 'Animación' },
    { id: 80, name: 'Crimen' },
    { id: 53, name: 'Thriller' },
  ];

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    try {
      const [trending, popular, topRated, action, comedy, horror] = await Promise.all([
        moviesAPI.getTrending(),
        moviesAPI.getPopular(),
        moviesAPI.getTopRated(),
        moviesAPI.getByGenre(28), // Acción
        moviesAPI.getByGenre(35), // Comedia
        moviesAPI.getByGenre(27), // Terror
      ]);

      setTrendingMovies(trending.data.data);
      setPopularMovies(popular.data.data.results);
      setTopRatedMovies(topRated.data.data);
      setActionMovies(action.data.data);
      setComedyMovies(comedy.data.data);
      setHorrorMovies(horror.data.data);

      // Establecer película aleatoria para el banner
      const randomMovie = trending.data.data[
        Math.floor(Math.random() * trending.data.data.length)
      ];
      setBannerMovie(randomMovie);
    } catch (error) {
      console.error('Error al cargar películas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      handleClearSearch();
      return;
    }

    try {
      setIsSearching(true);
      setSelectedCategory('all');
      const response = await moviesAPI.search(query);
      setSearchResults(response.data.data);
    } catch (error) {
      console.error('Error al buscar películas:', error);
      setSearchResults([]);
    }
  };

  const handleClearSearch = () => {
    setIsSearching(false);
    setSearchResults([]);
    setSelectedCategory('all');
  };

  const handleCategoryFilter = async (categoryId) => {
    setSelectedCategory(categoryId);
    setIsSearching(false);
    setSearchResults([]);

    if (categoryId === 'all') {
      // Mostrar todas las categorías
      return;
    }

    // Si no tenemos las películas de esta categoría cargadas, las cargamos
    if (categoryId !== 28 && categoryId !== 35 && categoryId !== 27) {
      try {
        setLoading(true);
        const response = await moviesAPI.getByGenre(categoryId);
        // Temporalmente guardar en searchResults para mostrar
        setSearchResults(response.data.data);
        setIsSearching(true);
      } catch (error) {
        console.error('Error al cargar películas de categoría:', error);
      } finally {
        setLoading(false);
      }
    }

    // Scroll suave a las películas
    window.scrollTo({ top: 600, behavior: 'smooth' });
  };

  const handleMovieClick = (movie) => {
    setSelectedMovie(movie);
  };

  const handleCloseModal = () => {
    setSelectedMovie(null);
  };

  const getFilteredMovies = () => {
    if (selectedCategory === 'all') return null;
    
    switch(selectedCategory) {
      case 28: return { movies: actionMovies, title: 'Acción' };
      case 35: return { movies: comedyMovies, title: 'Comedia' };
      case 27: return { movies: horrorMovies, title: 'Terror' };
      default: return { movies: searchResults, title: categories.find(c => c.id === selectedCategory)?.name };
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  const filteredData = getFilteredMovies();

  return (
    <div className="home">
      <Navbar onSearch={handleSearch} onClearSearch={handleClearSearch} />
      
      {/* Filtros por categoría */}
      {!isSearching && (
        <div className="category-filters" style={{
          position: 'sticky',
          top: '70px',
          zIndex: 90,
          backgroundColor: '#141414',
          padding: '15px 50px',
          display: 'flex',
          gap: '10px',
          overflowX: 'auto',
          borderBottom: '1px solid #333'
        }}>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryFilter(category.id)}
              style={{
                padding: '8px 20px',
                backgroundColor: selectedCategory === category.id ? '#e50914' : 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontSize: '14px',
                fontWeight: selectedCategory === category.id ? '600' : '400',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                if (selectedCategory !== category.id) {
                  e.target.style.backgroundColor = 'rgba(255,255,255,0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCategory !== category.id) {
                  e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
                }
              }}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      {isSearching ? (
        <div style={{ paddingTop: '140px' }}>
          <MovieRow
            title={`Resultados de búsqueda (${searchResults.length})`}
            movies={searchResults}
            onMovieClick={handleMovieClick}
          />
          {searchResults.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              color: '#8c8c8c'
            }}>
              <p style={{ fontSize: '24px', marginBottom: '10px' }}>
                No se encontraron resultados
              </p>
              <p>Intenta con otro término de búsqueda</p>
            </div>
          )}
        </div>
      ) : filteredData && selectedCategory !== 'all' ? (
        <div style={{ paddingTop: '140px' }}>
          <MovieRow
            title={filteredData.title}
            movies={filteredData.movies}
            onMovieClick={handleMovieClick}
          />
        </div>
      ) : (
        <>
          <Banner
            movie={bannerMovie}
            onPlayClick={handleMovieClick}
            onInfoClick={handleMovieClick}
          />
          
          <MovieRow
            title="Tendencias"
            movies={trendingMovies}
            isLargeRow
            onMovieClick={handleMovieClick}
          />
          
          <MovieRow
            title="Populares en Netflix"
            movies={popularMovies}
            onMovieClick={handleMovieClick}
          />
          
          <MovieRow
            title="Mejor valoradas"
            movies={topRatedMovies}
            onMovieClick={handleMovieClick}
          />
          
          <MovieRow
            title="Acción y Aventura"
            movies={actionMovies}
            onMovieClick={handleMovieClick}
          />
          
          <MovieRow
            title="Comedias"
            movies={comedyMovies}
            onMovieClick={handleMovieClick}
          />
          
          <MovieRow
            title="Terror"
            movies={horrorMovies}
            onMovieClick={handleMovieClick}
          />
        </>
      )}

      {selectedMovie && (
        <MovieModal movie={selectedMovie} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default Home;
