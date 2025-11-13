const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.TMDB_BASE_URL;
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Helper para obtener trailer de una película
async function getMovieTrailer(movieId) {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/movie/${movieId}/videos`,
      { params: { api_key: TMDB_API_KEY } }
    );
    
    const trailer = response.data.results.find(
      video => video.type === 'Trailer' && video.site === 'YouTube'
    );
    
    return trailer ? trailer.key : null;
  } catch (error) {
    console.error('Error al obtener trailer:', error);
    return null;
  }
}

// Obtener películas populares desde TMDB
router.get('/popular', async (req, res) => {
  try {
    const page = req.query.page || 1;
    
    const response = await axios.get(
      `${TMDB_BASE_URL}/movie/popular`,
      {
        params: {
          api_key: TMDB_API_KEY,
          language: 'es-ES',
          page: page
        }
      }
    );

    res.json({
      success: true,
      data: {
        results: response.data.results,
        page: response.data.page,
        total_pages: response.data.total_pages,
        total_results: response.data.total_results
      }
    });
  } catch (error) {
    console.error('Error al obtener películas populares:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener películas populares' 
    });
  }
});

// Obtener películas en tendencia
router.get('/trending', async (req, res) => {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/trending/movie/week`,
      {
        params: {
          api_key: TMDB_API_KEY,
          language: 'es-ES'
        }
      }
    );

    res.json({
      success: true,
      data: response.data.results
    });
  } catch (error) {
    console.error('Error al obtener películas en tendencia:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener películas en tendencia' 
    });
  }
});

// Obtener películas mejor valoradas
router.get('/top-rated', async (req, res) => {
  try {
    const page = req.query.page || 1;
    
    const response = await axios.get(
      `${TMDB_BASE_URL}/movie/top_rated`,
      {
        params: {
          api_key: TMDB_API_KEY,
          language: 'es-ES',
          page: page
        }
      }
    );

    res.json({
      success: true,
      data: response.data.results
    });
  } catch (error) {
    console.error('Error al obtener películas mejor valoradas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener películas mejor valoradas' 
    });
  }
});

// Obtener películas por género
router.get('/genre/:genreId', async (req, res) => {
  try {
    const { genreId } = req.params;
    const page = req.query.page || 1;
    
    const response = await axios.get(
      `${TMDB_BASE_URL}/discover/movie`,
      {
        params: {
          api_key: TMDB_API_KEY,
          language: 'es-ES',
          with_genres: genreId,
          page: page
        }
      }
    );

    res.json({
      success: true,
      data: response.data.results
    });
  } catch (error) {
    console.error('Error al obtener películas por género:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener películas por género' 
    });
  }
});

// Buscar películas
router.get('/search', async (req, res) => {
  try {
    const { query, page = 1 } = req.query;
    
    if (!query) {
      return res.status(400).json({ 
        success: false, 
        message: 'Se requiere un término de búsqueda' 
      });
    }

    const response = await axios.get(
      `${TMDB_BASE_URL}/search/movie`,
      {
        params: {
          api_key: TMDB_API_KEY,
          language: 'es-ES',
          query: query,
          page: page
        }
      }
    );

    res.json({
      success: true,
      data: response.data.results
    });
  } catch (error) {
    console.error('Error al buscar películas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al buscar películas' 
    });
  }
});

// Obtener detalles de una película
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const response = await axios.get(
      `${TMDB_BASE_URL}/movie/${id}`,
      {
        params: {
          api_key: TMDB_API_KEY,
          language: 'es-ES',
          append_to_response: 'videos,credits,similar'
        }
      }
    );

    const trailer = response.data.videos.results.find(
      video => video.type === 'Trailer' && video.site === 'YouTube'
    );

    res.json({
      success: true,
      data: {
        ...response.data,
        trailer_key: trailer ? trailer.key : null
      }
    });
  } catch (error) {
    console.error('Error al obtener detalles de película:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener detalles de película' 
    });
  }
});

// Obtener géneros de películas
router.get('/genres/list', async (req, res) => {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/genre/movie/list`,
      {
        params: {
          api_key: TMDB_API_KEY,
          language: 'es-ES'
        }
      }
    );

    res.json({
      success: true,
      data: response.data.genres
    });
  } catch (error) {
    console.error('Error al obtener géneros:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener géneros' 
    });
  }
});

module.exports = router;
