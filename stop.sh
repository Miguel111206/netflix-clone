#!/bin/bash

# =========================================
# Script para detener Netflix Clone
# =========================================

echo "🛑 Deteniendo Netflix Clone..."

# Leer PIDs de archivos
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill $BACKEND_PID
        echo "✅ Backend detenido"
    fi
    rm .backend.pid
fi

if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill $FRONTEND_PID
        echo "✅ Frontend detenido"
    fi
    rm .frontend.pid
fi

# Asegurar que todos los procesos Node.js de este proyecto se detengan
pkill -f "node.*netflix-clone" 2>/dev/null

echo "✅ Todos los servidores han sido detenidos"
