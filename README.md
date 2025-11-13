# 🎬 Netflix Clone - Aplicación Full Stack

Una aplicación web completa tipo Netflix con autenticación, películas, trailers, lista de favoritos y mucho más.

## 🌟 Características

### Backend
- ✅ **API RESTful** con Node.js + Express
- ✅ **PostgreSQL** como base de datos
- ✅ **Triggers** automáticos para registro de actividad
- ✅ **Stored Procedures** para operaciones complejas
- ✅ **Soporte JSONB** para datos flexibles
- ✅ **Autenticación JWT**
- ✅ **Integración con TMDB API** para datos de películas

### Frontend
- ✅ **Diseño idéntico a Netflix original**
- ✅ **React 18** con Hooks
- ✅ **React Router** para navegación
- ✅ **Reproductor de trailers** con YouTube
- ✅ **Sistema de búsqueda en tiempo real**
- ✅ **Lista de favoritos personalizada**
- ✅ **Responsive design**

### Base de Datos - Características Avanzadas

#### Triggers Implementados:
1. **update_users_updated_at**: Actualiza automáticamente la fecha de modificación
2. **trigger_log_favorite_added**: Registra cuando se agrega un favorito
3. **trigger_log_favorite_removed**: Registra cuando se elimina un favorito

#### Stored Procedures:
1. **get_user_favorites**: Obtiene favoritos con todos los detalles
2. **upsert_movie**: Inserta o actualiza información de películas
3. **add_to_favorites**: Agrega películas a favoritos (maneja duplicados)
4. **get_recommendations**: Recomendaciones basadas en géneros favoritos
5. **get_user_stats**: Estadísticas completas del usuario

## 📋 Requisitos Previos

- Node.js (v14 o superior)
- PostgreSQL (v12 o superior)
- Cuenta en TMDB (The Movie Database) - API gratuita

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
cd netflix-clone
```

### 2. Configurar la Base de Datos PostgreSQL

```bash
# Acceder a PostgreSQL
psql -U postgres

# Crear la base de datos
CREATE DATABASE netflix_clone;

# Salir de psql
\q

# Ejecutar el script de la base de datos
psql -U postgres -d netflix_clone -f backend/database.sql
```

### 3. Configurar el Backend

```bash
cd backend

# Instalar dependencias
npm install

# Copiar archivo de configuración
cp .env.example .env

# Editar .env con tus credenciales
nano .env
```

Configurar las siguientes variables en `.env`:

```env
# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=netflix_clone
DB_USER=postgres
DB_PASSWORD=tu_contraseña_postgres

# JWT Secret (genera uno aleatorio)
JWT_SECRET=tu_clave_secreta_super_segura

# TMDB API Key (obtener gratis en https://www.themoviedb.org/settings/api)
TMDB_API_KEY=tu_api_key_de_tmdb
```

### 4. Obtener API Key de TMDB

1. Regístrate gratis en https://www.themoviedb.org/
2. Ve a **Configuración** → **API**
3. Solicita una API Key (es instantánea y gratuita)
4. Copia tu API Key v3 y pégala en el `.env`

### 5. Configurar el Frontend

```bash
cd ../frontend

# Instalar dependencias
npm install

# El archivo .env ya está configurado correctamente
```

### 6. Iniciar la Aplicación

#### Terminal 1 - Backend:
```bash
cd backend
npm start
```

El backend estará en: http://localhost:5000

#### Terminal 2 - Frontend:
```bash
cd frontend
npm start
```

El frontend estará en: http://localhost:3000

## 📊 Estructura de la Base de Datos

### Tablas Principales:

```sql
users
├── id (SERIAL PRIMARY KEY)
├── email (VARCHAR UNIQUE)
├── password (VARCHAR)
├── name (VARCHAR)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

movies
├── id (SERIAL PRIMARY KEY)
├── tmdb_id (INTEGER UNIQUE)
├── title (VARCHAR)
├── overview (TEXT)
├── poster_path (VARCHAR)
├── backdrop_path (VARCHAR)
├── release_date (DATE)
├── vote_average (DECIMAL)
├── genre_ids (JSONB)
└── trailer_key (VARCHAR)

favorites
├── id (SERIAL PRIMARY KEY)
├── user_id (FK → users)
├── movie_id (FK → movies)
└── created_at (TIMESTAMP)

activity_logs
├── id (SERIAL PRIMARY KEY)
├── user_id (FK → users)
├── action (VARCHAR)
├── details (JSONB)
└── created_at (TIMESTAMP)
```

## 🎯 Uso de la Aplicación

### Registro e Inicio de Sesión
1. Abre http://localhost:3000
2. Haz clic en "Regístrate ahora"
3. Completa el formulario
4. Inicia sesión con tus credenciales

### Explorar Películas
- **Banner principal**: Película destacada con botones Reproducir e Info
- **Categorías**: Tendencias, Populares, Mejor valoradas, Acción, Comedia, Terror
- **Búsqueda**: Usa la barra de búsqueda en el navbar

### Lista de Favoritos
1. Haz clic en cualquier película
2. En el modal, haz clic en el botón "+" para agregar a favoritos
3. Ve a "Mi lista" en el navbar para ver tus favoritos
4. Los triggers registran automáticamente cada acción

### Ver Trailers
- Al hacer clic en una película, si tiene trailer disponible, se reproduce automáticamente
- Si no hay trailer, se muestra la imagen de fondo

## 🔧 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/profile` - Obtener perfil (requiere token)
- `GET /api/auth/stats` - Estadísticas del usuario (usa stored procedure)

### Películas
- `GET /api/movies/popular` - Películas populares
- `GET /api/movies/trending` - Películas en tendencia
- `GET /api/movies/top-rated` - Mejor valoradas
- `GET /api/movies/genre/:genreId` - Por género
- `GET /api/movies/search?query=` - Buscar películas
- `GET /api/movies/:id` - Detalles de película

### Favoritos
- `GET /api/favorites` - Obtener favoritos (usa stored procedure)
- `POST /api/favorites` - Agregar a favoritos (trigger registra acción)
- `DELETE /api/favorites/:tmdb_id` - Eliminar de favoritos (trigger registra acción)
- `GET /api/favorites/check/:tmdb_id` - Verificar si está en favoritos
- `GET /api/favorites/recommendations` - Recomendaciones (usa stored procedure)
- `GET /api/favorites/activity` - Logs de actividad (generados por triggers)

## 🗄️ Ejemplos de Consultas PostgreSQL

### Usando Stored Procedures:

```sql
-- Obtener favoritos de un usuario
SELECT * FROM get_user_favorites(1);

-- Agregar película a favoritos
SELECT add_to_favorites(1, 550);

-- Obtener recomendaciones
SELECT * FROM get_recommendations(1, 10);

-- Obtener estadísticas
SELECT get_user_stats(1);

-- Insertar/actualizar película
SELECT upsert_movie(
    550, 
    'Fight Club', 
    'An insomniac office worker...', 
    '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    '/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg',
    '1999-10-15',
    8.4,
    '["18", "53"]'::jsonb,
    'BdJKm16Co6M'
);
```

### Ver logs generados por triggers:

```sql
-- Ver toda la actividad de un usuario
SELECT * FROM activity_logs WHERE user_id = 1 ORDER BY created_at DESC;

-- Ver solo cuando agregó favoritos
SELECT * FROM activity_logs 
WHERE user_id = 1 AND action = 'favorite_added';
```

## 🎨 Personalización

### Cambiar colores:
Edita `frontend/src/App.css` y modifica las variables de color:
```css
/* Color principal de Netflix */
.btn-primary {
  background-color: #e50914; /* Cambia este valor */
}
```

### Agregar más categorías de películas:
Edita `frontend/src/pages/Home.js` y agrega nuevas llamadas a la API:
```javascript
const sciFiMovies = await moviesAPI.getByGenre(878); // Ciencia Ficción
```

## 🐛 Solución de Problemas

### Error de conexión a PostgreSQL:
```bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql

# Reiniciar PostgreSQL si es necesario
sudo systemctl restart postgresql
```

### Error "Cannot find module":
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### Las películas no cargan:
- Verifica que tu TMDB_API_KEY sea válida
- Comprueba la consola del navegador para ver errores
- Verifica que el backend esté corriendo

## 📝 Notas Importantes

- **Seguridad**: Cambia el `JWT_SECRET` en producción
- **Contraseñas**: Las contraseñas se hashean con bcrypt
- **CORS**: Configurado para desarrollo local
- **Rate Limits**: TMDB tiene límites de peticiones (40 requests/10 segundos)

## 🚀 Despliegue en Producción

### Backend (Heroku):
```bash
heroku create netflix-clone-api
heroku addons:create heroku-postgresql:hobby-dev
git push heroku main
```

### Frontend (Vercel/Netlify):
```bash
npm run build
# Subir carpeta build/ a Vercel o Netlify
```

## 📚 Tecnologías Utilizadas

### Backend:
- Node.js
- Express.js
- PostgreSQL
- JWT (jsonwebtoken)
- Bcrypt
- Axios

### Frontend:
- React 18
- React Router DOM
- Axios
- React Icons
- React YouTube

### Base de Datos:
- PostgreSQL 12+
- JSONB para datos flexibles
- Triggers para automatización
- Stored Procedures para lógica compleja

## 👨‍💻 Autor

Proyecto desarrollado como clon educativo de Netflix con tecnologías modernas.

## 📄 Licencia

Este proyecto es solo para fines educativos. Netflix y su logo son marcas registradas de Netflix, Inc.

---

## 🎉 ¡Listo!

Tu clon de Netflix está completo con:
- ✅ Backend con Node.js y Express
- ✅ PostgreSQL con triggers y stored procedures
- ✅ Frontend tipo Netflix original
- ✅ Sistema de autenticación
- ✅ Lista de favoritos
- ✅ Reproductor de trailers
- ✅ Búsqueda de películas
- ✅ Logs de actividad automáticos

¡Disfruta explorando películas! 🍿
