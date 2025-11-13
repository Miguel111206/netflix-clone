-- Netflix Clone Database Schema
-- PostgreSQL Database Setup

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de películas
CREATE TABLE IF NOT EXISTS movies (
    id SERIAL PRIMARY KEY,
    tmdb_id INTEGER UNIQUE,
    title VARCHAR(500) NOT NULL,
    overview TEXT,
    poster_path VARCHAR(500),
    backdrop_path VARCHAR(500),
    release_date DATE,
    vote_average DECIMAL(3,1),
    genre_ids JSONB,
    trailer_key VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de favoritos
CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, movie_id)
);

-- Tabla de vistas/historial
CREATE TABLE IF NOT EXISTS watch_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
    watch_duration INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    last_watched TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de logs de actividad
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_movies_tmdb_id ON movies(tmdb_id);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_watch_history_user_id ON watch_history(user_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);

-- TRIGGER 1: Actualizar updated_at en users
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- TRIGGER 2: Registrar cuando se agrega un favorito
CREATE OR REPLACE FUNCTION log_favorite_added()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO activity_logs (user_id, action, details)
    VALUES (
        NEW.user_id,
        'favorite_added',
        jsonb_build_object(
            'movie_id', NEW.movie_id,
            'timestamp', CURRENT_TIMESTAMP
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_favorite_added
    AFTER INSERT ON favorites
    FOR EACH ROW
    EXECUTE FUNCTION log_favorite_added();

-- TRIGGER 3: Registrar cuando se elimina un favorito
CREATE OR REPLACE FUNCTION log_favorite_removed()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO activity_logs (user_id, action, details)
    VALUES (
        OLD.user_id,
        'favorite_removed',
        jsonb_build_object(
            'movie_id', OLD.movie_id,
            'timestamp', CURRENT_TIMESTAMP
        )
    );
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_favorite_removed
    AFTER DELETE ON favorites
    FOR EACH ROW
    EXECUTE FUNCTION log_favorite_removed();

-- STORED PROCEDURE 1: Obtener películas favoritas de un usuario con detalles
CREATE OR REPLACE FUNCTION get_user_favorites(p_user_id INTEGER)
RETURNS TABLE (
    movie_id INTEGER,
    title VARCHAR(500),
    overview TEXT,
    poster_path VARCHAR(500),
    backdrop_path VARCHAR(500),
    release_date DATE,
    vote_average DECIMAL(3,1),
    genre_ids JSONB,
    trailer_key VARCHAR(255),
    added_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.title,
        m.overview,
        m.poster_path,
        m.backdrop_path,
        m.release_date,
        m.vote_average,
        m.genre_ids,
        m.trailer_key,
        f.created_at
    FROM favorites f
    INNER JOIN movies m ON f.movie_id = m.id
    WHERE f.user_id = p_user_id
    ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- STORED PROCEDURE 2: Agregar o actualizar película
CREATE OR REPLACE FUNCTION upsert_movie(
    p_tmdb_id INTEGER,
    p_title VARCHAR(500),
    p_overview TEXT,
    p_poster_path VARCHAR(500),
    p_backdrop_path VARCHAR(500),
    p_release_date DATE,
    p_vote_average DECIMAL(3,1),
    p_genre_ids JSONB,
    p_trailer_key VARCHAR(255)
)
RETURNS INTEGER AS $$
DECLARE
    v_movie_id INTEGER;
BEGIN
    INSERT INTO movies (
        tmdb_id, title, overview, poster_path, backdrop_path,
        release_date, vote_average, genre_ids, trailer_key
    )
    VALUES (
        p_tmdb_id, p_title, p_overview, p_poster_path, p_backdrop_path,
        p_release_date, p_vote_average, p_genre_ids, p_trailer_key
    )
    ON CONFLICT (tmdb_id)
    DO UPDATE SET
        title = EXCLUDED.title,
        overview = EXCLUDED.overview,
        poster_path = EXCLUDED.poster_path,
        backdrop_path = EXCLUDED.backdrop_path,
        release_date = EXCLUDED.release_date,
        vote_average = EXCLUDED.vote_average,
        genre_ids = EXCLUDED.genre_ids,
        trailer_key = EXCLUDED.trailer_key
    RETURNING id INTO v_movie_id;
    
    RETURN v_movie_id;
END;
$$ LANGUAGE plpgsql;

-- STORED PROCEDURE 3: Agregar a favoritos (con manejo de duplicados)
CREATE OR REPLACE FUNCTION add_to_favorites(
    p_user_id INTEGER,
    p_movie_id INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO favorites (user_id, movie_id)
    VALUES (p_user_id, p_movie_id)
    ON CONFLICT (user_id, movie_id) DO NOTHING;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- STORED PROCEDURE 4: Obtener recomendaciones basadas en favoritos
CREATE OR REPLACE FUNCTION get_recommendations(p_user_id INTEGER, p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
    movie_id INTEGER,
    title VARCHAR(500),
    poster_path VARCHAR(500),
    vote_average DECIMAL(3,1),
    similarity_score BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH user_genres AS (
        SELECT jsonb_array_elements(m.genre_ids)::INTEGER as genre_id
        FROM favorites f
        INNER JOIN movies m ON f.movie_id = m.id
        WHERE f.user_id = p_user_id
    ),
    genre_counts AS (
        SELECT genre_id, COUNT(*) as count
        FROM user_genres
        GROUP BY genre_id
    )
    SELECT 
        m.id,
        m.title,
        m.poster_path,
        m.vote_average,
        COUNT(DISTINCT g.genre_id) as similarity_score
    FROM movies m
    CROSS JOIN LATERAL jsonb_array_elements(m.genre_ids) AS genres(genre)
    INNER JOIN genre_counts g ON (genres.genre)::INTEGER = g.genre_id
    WHERE m.id NOT IN (
        SELECT movie_id FROM favorites WHERE user_id = p_user_id
    )
    GROUP BY m.id, m.title, m.poster_path, m.vote_average
    ORDER BY similarity_score DESC, m.vote_average DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- STORED PROCEDURE 5: Obtener estadísticas del usuario
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id INTEGER)
RETURNS JSON AS $$
DECLARE
    v_stats JSON;
BEGIN
    SELECT json_build_object(
        'total_favorites', (SELECT COUNT(*) FROM favorites WHERE user_id = p_user_id),
        'total_watched', (SELECT COUNT(*) FROM watch_history WHERE user_id = p_user_id),
        'favorite_genres', (
            SELECT json_agg(genre_info)
            FROM (
                SELECT 
                    jsonb_array_elements(m.genre_ids)::INTEGER as genre_id,
                    COUNT(*) as count
                FROM favorites f
                INNER JOIN movies m ON f.movie_id = m.id
                WHERE f.user_id = p_user_id
                GROUP BY genre_id
                ORDER BY count DESC
                LIMIT 5
            ) as genre_info
        ),
        'recent_activity', (
            SELECT json_agg(activity_info)
            FROM (
                SELECT action, details, created_at
                FROM activity_logs
                WHERE user_id = p_user_id
                ORDER BY created_at DESC
                LIMIT 10
            ) as activity_info
        )
    ) INTO v_stats;
    
    RETURN v_stats;
END;
$$ LANGUAGE plpgsql;

-- Insertar datos de ejemplo
INSERT INTO users (email, password, name) VALUES
    ('demo@netflix.com', '$2b$10$rZ9EhqKPCWjDqHVLpvpbGOLfH7sJfFjBLzXzrXXxXXxXXxXXxXXxXX', 'Usuario Demo')
ON CONFLICT (email) DO NOTHING;
