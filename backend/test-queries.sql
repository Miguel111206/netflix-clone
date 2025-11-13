-- =========================================
-- QUERIES DE PRUEBA PARA NETFLIX CLONE
-- =========================================

-- 1. VERIFICAR TRIGGERS
-- ===================================

-- Ver todos los triggers activos
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- 2. PROBAR STORED PROCEDURES
-- ===================================

-- Insertar usuario de prueba
INSERT INTO users (email, password, name) VALUES
('test@example.com', '$2b$10$test', 'Usuario Test')
ON CONFLICT (email) DO NOTHING
RETURNING id;

-- Insertar película de prueba usando stored procedure
SELECT upsert_movie(
    550,  -- TMDB ID de Fight Club
    'Fight Club',
    'Un empleado de oficina insomne y un vendedor de jabón forman un club de lucha clandestino.',
    '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    '/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg',
    '1999-10-15',
    8.4,
    '[18, 53]'::jsonb,
    'BdJKm16Co6M'
) as movie_id;

-- Agregar a favoritos (trigger se activa automáticamente)
SELECT add_to_favorites(1, 1) as added;

-- Ver favoritos del usuario
SELECT * FROM get_user_favorites(1);

-- Obtener recomendaciones
SELECT * FROM get_recommendations(1, 10);

-- Ver estadísticas del usuario
SELECT get_user_stats(1);

-- 3. VERIFICAR LOGS DE TRIGGERS
-- ===================================

-- Ver todos los logs de actividad
SELECT 
    al.*,
    u.name as user_name,
    m.title as movie_title
FROM activity_logs al
LEFT JOIN users u ON al.user_id = u.id
LEFT JOIN movies m ON (al.details->>'movie_id')::INTEGER = m.id
ORDER BY al.created_at DESC;

-- Ver solo agregados a favoritos
SELECT * FROM activity_logs 
WHERE action = 'favorite_added'
ORDER BY created_at DESC;

-- Ver solo eliminados de favoritos
SELECT * FROM activity_logs 
WHERE action = 'favorite_removed'
ORDER BY created_at DESC;

-- 4. CONSULTAS DE ANÁLISIS
-- ===================================

-- Películas más populares en favoritos
SELECT 
    m.title,
    COUNT(f.id) as total_favorites,
    m.vote_average
FROM movies m
INNER JOIN favorites f ON m.id = f.movie_id
GROUP BY m.id, m.title, m.vote_average
ORDER BY total_favorites DESC
LIMIT 10;

-- Usuarios más activos
SELECT 
    u.name,
    u.email,
    COUNT(f.id) as total_favorites
FROM users u
LEFT JOIN favorites f ON u.id = f.user_id
GROUP BY u.id, u.name, u.email
ORDER BY total_favorites DESC;

-- Géneros más populares (usando JSONB)
SELECT 
    genre_id,
    COUNT(*) as count
FROM (
    SELECT jsonb_array_elements_text(m.genre_ids)::INTEGER as genre_id
    FROM movies m
    INNER JOIN favorites f ON m.id = f.movie_id
) as genres
GROUP BY genre_id
ORDER BY count DESC;

-- 5. PRUEBAS DE INTEGRIDAD
-- ===================================

-- Verificar que los triggers funcionan
-- (Agregar y eliminar un favorito, luego verificar logs)
DO $$
DECLARE
    v_user_id INTEGER := 1;
    v_movie_id INTEGER := 1;
    v_initial_count INTEGER;
    v_after_add_count INTEGER;
    v_after_remove_count INTEGER;
BEGIN
    -- Contar logs iniciales
    SELECT COUNT(*) INTO v_initial_count FROM activity_logs WHERE user_id = v_user_id;
    
    -- Agregar favorito
    PERFORM add_to_favorites(v_user_id, v_movie_id);
    
    -- Verificar que se agregó un log
    SELECT COUNT(*) INTO v_after_add_count FROM activity_logs WHERE user_id = v_user_id;
    
    -- Eliminar favorito
    DELETE FROM favorites WHERE user_id = v_user_id AND movie_id = v_movie_id;
    
    -- Verificar que se agregó otro log
    SELECT COUNT(*) INTO v_after_remove_count FROM activity_logs WHERE user_id = v_user_id;
    
    -- Mostrar resultados
    RAISE NOTICE 'Logs iniciales: %', v_initial_count;
    RAISE NOTICE 'Logs después de agregar: %', v_after_add_count;
    RAISE NOTICE 'Logs después de eliminar: %', v_after_remove_count;
    RAISE NOTICE 'Triggers funcionando: %', (v_after_remove_count = v_initial_count + 2);
END $$;

-- 6. VERIFICAR ÍNDICES
-- ===================================

-- Ver todos los índices
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 7. LIMPIEZA (USAR CON CUIDADO)
-- ===================================

-- Eliminar todos los datos de prueba (mantiene estructura)
-- TRUNCATE TABLE activity_logs CASCADE;
-- TRUNCATE TABLE favorites CASCADE;
-- TRUNCATE TABLE watch_history CASCADE;
-- TRUNCATE TABLE movies CASCADE;
-- TRUNCATE TABLE users CASCADE;

-- 8. BACKUP Y RESTORE
-- ===================================

-- Exportar datos
-- pg_dump -U postgres -d netflix_clone > backup.sql

-- Importar datos
-- psql -U postgres -d netflix_clone < backup.sql

-- 9. MONITOREO DE RENDIMIENTO
-- ===================================

-- Ver consultas lentas
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Tamaño de las tablas
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 10. EJEMPLOS DE CONSULTAS CON JSONB
-- ===================================

-- Buscar películas con un género específico
SELECT 
    title,
    genre_ids
FROM movies
WHERE genre_ids @> '[28]'::jsonb  -- 28 = Acción
LIMIT 10;

-- Extraer géneros como array
SELECT 
    title,
    jsonb_array_elements(genre_ids) as genre
FROM movies
LIMIT 10;

-- Agregar un género a una película
UPDATE movies
SET genre_ids = genre_ids || '[99]'::jsonb
WHERE id = 1;

-- Eliminar un género de una película
UPDATE movies
SET genre_ids = genre_ids - '99'
WHERE id = 1;

-- =========================================
-- FIN DE QUERIES DE PRUEBA
-- =========================================
