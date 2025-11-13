# 📚 Documentación de la API - Netflix Clone

## Base URL
```
http://localhost:5000/api
```

---

## 🔐 Autenticación

### 1. Registrar Usuario
**POST** `/auth/register`

**Body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": {
      "id": 1,
      "email": "juan@example.com",
      "name": "Juan Pérez",
      "created_at": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Iniciar Sesión
**POST** `/auth/login`

**Body:**
```json
{
  "email": "juan@example.com",
  "password": "password123"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": {
      "id": 1,
      "email": "juan@example.com",
      "name": "Juan Pérez"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Obtener Perfil
**GET** `/auth/profile`

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "juan@example.com",
    "name": "Juan Pérez",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Obtener Estadísticas (Stored Procedure)
**GET** `/auth/stats`

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "total_favorites": 15,
    "total_watched": 8,
    "favorite_genres": [
      { "genre_id": 28, "count": 5 },
      { "genre_id": 878, "count": 4 },
      { "genre_id": 35, "count": 3 }
    ],
    "recent_activity": [
      {
        "action": "favorite_added",
        "details": { "movie_id": 550, "timestamp": "2024-01-15T14:20:00.000Z" },
        "created_at": "2024-01-15T14:20:00.000Z"
      }
    ]
  }
}
```

---

## 🎬 Películas

### 5. Obtener Películas Populares
**GET** `/movies/popular?page=1`

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": 550,
        "title": "Fight Club",
        "overview": "Un empleado de oficina insomne...",
        "poster_path": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
        "backdrop_path": "/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg",
        "release_date": "1999-10-15",
        "vote_average": 8.4,
        "genre_ids": [18, 53]
      }
    ],
    "page": 1,
    "total_pages": 500,
    "total_results": 10000
  }
}
```

### 6. Obtener Películas en Tendencia
**GET** `/movies/trending`

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 603,
      "title": "The Matrix",
      "overview": "Un hacker descubre la verdad...",
      "poster_path": "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
      "backdrop_path": "/icmmSD4vTTDKOq2vvdulafOGw93.jpg",
      "release_date": "1999-03-30",
      "vote_average": 8.2,
      "genre_ids": [878, 28]
    }
  ]
}
```

### 7. Obtener Películas Mejor Valoradas
**GET** `/movies/top-rated?page=1`

### 8. Obtener Películas por Género
**GET** `/movies/genre/28?page=1`

**Géneros comunes:**
- 28: Acción
- 35: Comedia
- 27: Terror
- 878: Ciencia Ficción
- 18: Drama
- 53: Thriller

### 9. Buscar Películas
**GET** `/movies/search?query=matrix&page=1`

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 603,
      "title": "The Matrix",
      "overview": "Un hacker descubre...",
      "poster_path": "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
      "vote_average": 8.2
    }
  ]
}
```

### 10. Obtener Detalles de Película
**GET** `/movies/550`

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": 550,
    "title": "Fight Club",
    "overview": "Un empleado de oficina insomne...",
    "poster_path": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    "backdrop_path": "/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg",
    "release_date": "1999-10-15",
    "vote_average": 8.4,
    "runtime": 139,
    "genres": [
      { "id": 18, "name": "Drama" },
      { "id": 53, "name": "Thriller" }
    ],
    "videos": {
      "results": [
        {
          "key": "BdJKm16Co6M",
          "site": "YouTube",
          "type": "Trailer"
        }
      ]
    },
    "trailer_key": "BdJKm16Co6M",
    "credits": {
      "cast": [...]
    },
    "similar": {
      "results": [...]
    }
  }
}
```

### 11. Obtener Lista de Géneros
**GET** `/movies/genres/list`

**Respuesta:**
```json
{
  "success": true,
  "data": [
    { "id": 28, "name": "Acción" },
    { "id": 12, "name": "Aventura" },
    { "id": 16, "name": "Animación" },
    { "id": 35, "name": "Comedia" },
    { "id": 80, "name": "Crimen" }
  ]
}
```

---

## ⭐ Favoritos

### 12. Obtener Favoritos del Usuario (Stored Procedure)
**GET** `/favorites`

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "movie_id": 1,
      "title": "Fight Club",
      "overview": "Un empleado de oficina...",
      "poster_path": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
      "backdrop_path": "/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg",
      "release_date": "1999-10-15",
      "vote_average": 8.4,
      "genre_ids": [18, 53],
      "trailer_key": "BdJKm16Co6M",
      "added_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### 13. Agregar a Favoritos (Trigger se activa automáticamente)
**POST** `/favorites`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "tmdb_id": 550
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Película agregada a favoritos",
  "data": {
    "movie_id": 1,
    "tmdb_id": 550
  }
}
```

**Nota:** El trigger `trigger_log_favorite_added` registra automáticamente esta acción en `activity_logs`.

### 14. Verificar si Está en Favoritos
**GET** `/favorites/check/550`

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "is_favorite": true
  }
}
```

### 15. Eliminar de Favoritos (Trigger se activa automáticamente)
**DELETE** `/favorites/550`

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Película eliminada de favoritos"
}
```

**Nota:** El trigger `trigger_log_favorite_removed` registra automáticamente esta acción en `activity_logs`.

### 16. Obtener Recomendaciones (Stored Procedure)
**GET** `/favorites/recommendations?limit=20`

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "movie_id": 105,
      "title": "Back to the Future",
      "poster_path": "/fNOH9f1aA7XRTzl1sAOx9iF553Q.jpg",
      "vote_average": 8.3,
      "similarity_score": 3
    }
  ]
}
```

**Nota:** Las recomendaciones se basan en los géneros de las películas en favoritos usando el stored procedure `get_recommendations`.

### 17. Obtener Logs de Actividad (Generados por Triggers)
**GET** `/favorites/activity?limit=50`

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "action": "favorite_added",
      "details": {
        "movie_id": 550,
        "timestamp": "2024-01-15T10:30:00.000Z"
      },
      "created_at": "2024-01-15T10:30:00.000Z",
      "movie_title": "Fight Club",
      "poster_path": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg"
    },
    {
      "id": 2,
      "action": "favorite_removed",
      "details": {
        "movie_id": 603,
        "timestamp": "2024-01-15T11:20:00.000Z"
      },
      "created_at": "2024-01-15T11:20:00.000Z",
      "movie_title": "The Matrix",
      "poster_path": "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg"
    }
  ]
}
```

---

## 🔍 Características Avanzadas de PostgreSQL

### Triggers Implementados:

1. **update_users_updated_at**
   - Se activa: Antes de actualizar un usuario
   - Acción: Actualiza automáticamente el campo `updated_at`

2. **trigger_log_favorite_added**
   - Se activa: Después de agregar un favorito
   - Acción: Registra la acción en `activity_logs` con detalles en JSON

3. **trigger_log_favorite_removed**
   - Se activa: Después de eliminar un favorito
   - Acción: Registra la acción en `activity_logs` con detalles en JSON

### Stored Procedures Implementados:

1. **get_user_favorites(user_id)**
   - Retorna todos los favoritos con detalles completos
   - Usado en: `GET /favorites`

2. **upsert_movie(...)**
   - Inserta o actualiza una película
   - Maneja conflictos automáticamente
   - Usado internamente al agregar favoritos

3. **add_to_favorites(user_id, movie_id)**
   - Agrega película a favoritos
   - Maneja duplicados automáticamente
   - Usado en: `POST /favorites`

4. **get_recommendations(user_id, limit)**
   - Genera recomendaciones basadas en géneros
   - Usa análisis de similitud
   - Usado en: `GET /favorites/recommendations`

5. **get_user_stats(user_id)**
   - Retorna estadísticas completas del usuario
   - Incluye géneros favoritos y actividad reciente
   - Usado en: `GET /auth/stats`

### Uso de JSONB:

```sql
-- Almacenamiento de genre_ids
"genre_ids": [18, 53, 28]

-- Almacenamiento de detalles de actividad
"details": {
  "movie_id": 550,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 🧪 Ejemplos de Uso con cURL

### Registrar usuario:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "password": "password123"
  }'
```

### Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "password": "password123"
  }'
```

### Obtener películas populares:
```bash
curl http://localhost:5000/api/movies/popular
```

### Agregar a favoritos:
```bash
curl -X POST http://localhost:5000/api/favorites \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {tu_token}" \
  -d '{"tmdb_id": 550}'
```

### Ver favoritos:
```bash
curl http://localhost:5000/api/favorites \
  -H "Authorization: Bearer {tu_token}"
```

---

## 📊 Códigos de Estado HTTP

- `200` - OK: Solicitud exitosa
- `201` - Created: Recurso creado exitosamente
- `400` - Bad Request: Datos inválidos
- `401` - Unauthorized: Token inválido o no proporcionado
- `404` - Not Found: Recurso no encontrado
- `500` - Internal Server Error: Error del servidor

---

## 🔒 Seguridad

- Todas las contraseñas se hashean con bcrypt
- Los tokens JWT expiran en 7 días
- Las rutas protegidas requieren token válido
- Se validan todos los inputs
- Se previenen ataques de inyección SQL usando prepared statements

---

## 💡 Consejos

1. Guarda el token después del login
2. Incluye el token en todas las peticiones protegidas
3. El token se debe enviar como: `Authorization: Bearer {token}`
4. Los triggers y stored procedures se ejecutan automáticamente
5. Consulta `activity_logs` para ver el historial de acciones
