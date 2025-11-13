#!/bin/bash

# =========================================
# Script de inicio para Netflix Clone
# =========================================

echo "🎬 Iniciando Netflix Clone..."
echo ""

# Verificar que PostgreSQL esté corriendo
echo "📊 Verificando PostgreSQL..."
if ! pg_isready > /dev/null 2>&1; then
    echo "❌ PostgreSQL no está corriendo. Iniciando..."
    sudo systemctl start postgresql
    sleep 2
fi

if pg_isready > /dev/null 2>&1; then
    echo "✅ PostgreSQL está corriendo"
else
    echo "❌ Error: No se pudo iniciar PostgreSQL"
    exit 1
fi

echo ""

# Verificar que la base de datos existe
echo "🗄️  Verificando base de datos..."
if psql -U postgres -lqt | cut -d \| -f 1 | grep -qw netflix_clone; then
    echo "✅ Base de datos 'netflix_clone' encontrada"
else
    echo "⚠️  Base de datos no encontrada. Creando..."
    psql -U postgres -c "CREATE DATABASE netflix_clone;"
    psql -U postgres -d netflix_clone -f backend/database.sql
    echo "✅ Base de datos creada y configurada"
fi

echo ""

# Verificar que las dependencias estén instaladas
echo "📦 Verificando dependencias..."

if [ ! -d "backend/node_modules" ]; then
    echo "⚠️  Instalando dependencias del backend..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "⚠️  Instalando dependencias del frontend..."
    cd frontend && npm install && cd ..
fi

echo "✅ Dependencias verificadas"
echo ""

# Verificar archivos .env
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Archivo .env no encontrado en backend"
    echo "📝 Copia backend/.env.example a backend/.env y configúralo"
    exit 1
fi

echo "✅ Configuración verificada"
echo ""

# Iniciar servidores en segundo plano
echo "🚀 Iniciando servidores..."
echo ""

# Iniciar backend
cd backend
npm start &
BACKEND_PID=$!
echo "✅ Backend iniciado (PID: $BACKEND_PID) en http://localhost:5000"
cd ..

# Esperar un momento para que el backend inicie
sleep 3

# Iniciar frontend
cd frontend
npm start &
FRONTEND_PID=$!
echo "✅ Frontend iniciado (PID: $FRONTEND_PID) en http://localhost:3000"
cd ..

echo ""
echo "╔═══════════════════════════════════════════════╗"
echo "║                                               ║"
echo "║   🎉 Netflix Clone está corriendo!           ║"
echo "║                                               ║"
echo "║   🌐 Frontend: http://localhost:3000         ║"
echo "║   🔌 Backend:  http://localhost:5000         ║"
echo "║   📊 Database: PostgreSQL (netflix_clone)    ║"
echo "║                                               ║"
echo "║   Para detener los servidores:               ║"
echo "║   kill $BACKEND_PID $FRONTEND_PID            ║"
echo "║                                               ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""

# Guardar PIDs en archivo
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

# Mantener el script corriendo
wait
