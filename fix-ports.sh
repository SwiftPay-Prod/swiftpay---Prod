#!/bin/bash

echo "=== Matando frontends ==="
pkill -f "next dev" 2>/dev/null
pkill -f "next-server" 2>/dev/null
sleep 2

# Mata processo na porta 3000 se existir
pid=$(lsof -ti :3000 2>/dev/null)
if [ -n "$pid" ]; then
  kill -9 $pid 2>/dev/null
  echo "Porta 3000 liberada"
fi

echo ""
echo "=== Iniciando Admin (:3000) ==="
cd /home/matspectrum-ai/OpenGateway/web
nohup npm run dev > /tmp/swiftpay-admin.log 2>&1 &
echo "Admin PID: $!"
cd /home/matspectrum-ai/OpenGateway

sleep 3

echo ""
echo "=== Iniciando Checkout (:3001) ==="
cd /home/matspectrum-ai/OpenGateway/checkout
nohup npx next dev --port 3001 > /tmp/swiftpay-checkout.log 2>&1 &
echo "Checkout PID: $!"
cd /home/matspectrum-ai/OpenGateway

sleep 8

echo ""
echo "=== STATUS ==="
for p in 3000 3001 5001 5002; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$p" 2>/dev/null || echo "down")
  echo "Port $p: HTTP $code"
done

echo ""
echo "=== ACESSAR ==="
echo "Admin:    http://localhost:3000"
echo "Checkout: http://localhost:3001/{slug}"
echo "Gestao:   http://localhost:5001/swagger"
echo "Payment:  http://localhost:5002/swagger"
