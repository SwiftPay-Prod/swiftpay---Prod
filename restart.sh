#!/bin/bash
set -e

cd /home/matspectrum-ai/OpenGateway

echo "=== Matando processos antigos ==="
# Mata processos nas portas 5001, 5002, 3000, 3001
for port in 5001 5002; do
  pid=$(lsof -ti :$port 2>/dev/null)
  if [ -n "$pid" ]; then
    kill -9 $pid 2>/dev/null
    echo "  Porta $port: processo $pid morto"
  else
    echo "  Porta $port: livre"
  fi
done

sleep 2

echo ""
echo "=== Exportando chave MagicPay ==="
export MagicPay__ApiKey="geRBOFqMK7ZCrVmpqhUGuJjq8nqQzrSIrZVIJYVXRFE"

echo ""
echo "=== Subindo Docker ==="
docker compose up -d postgres redis rabbitmq 2>&1 | tail -3
sleep 3

echo ""
echo "=== Aplicando migrations ==="
dotnet ef database update --project src/Swiftpay.Api.Core --startup-project src/Swiftpay.Api.Gestao 2>&1 | tail -2
dotnet ef database update --project src/Swiftpay.Api.Core --startup-project src/Swiftpay.Api.Payment 2>&1 | tail -2

echo ""
echo "=== Iniciando Gestao API (:5001) ==="
cd /home/matspectrum-ai/OpenGateway
nohup dotnet run --project src/Swiftpay.Api.Gestao --urls "http://0.0.0.0:5001" > /tmp/swiftpay-gestao.log 2>&1 &
echo "  PID: $!"

echo ""
echo "=== Iniciando Payment API (:5002) ==="
nohup dotnet run --project src/Swiftpay.Api.Payment --urls "http://0.0.0.0:5002" > /tmp/swiftpay-payment.log 2>&1 &
echo "  PID: $!"

echo ""
echo "Aguardando APIs iniciarem (15s)..."
sleep 15

echo ""
echo "=== Verificando APIs ==="
curl -s -o /dev/null -w "Gestao (:5001): HTTP %{http_code}\n" http://localhost:5001
curl -s -o /dev/null -w "Payment (:5002): HTTP %{http_code}\n" http://localhost:5002

echo ""
echo "=== Logs das APIs ==="
tail -3 /tmp/swiftpay-gestao.log
echo "---"
tail -3 /tmp/swiftpay-payment.log

echo ""
echo "=== Iniciando Admin Dashboard (:3000) ==="
cd /home/matspectrum-ai/OpenGateway/web
nohup npm run dev > /tmp/swiftpay-admin.log 2>&1 &
echo "  PID: $!"
cd /home/matspectrum-ai/OpenGateway

echo ""
echo "=== Iniciando Checkout (:3001) ==="
cd /home/matspectrum-ai/OpenGateway/checkout
nohup npx next dev --port 3001 > /tmp/swiftpay-checkout.log 2>&1 &
echo "  PID: $!"
cd /home/matspectrum-ai/OpenGateway

sleep 10

echo ""
echo "=== STATUS FINAL ==="
for p in 3000 3001 5001 5002; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$p" 2>/dev/null || echo "down")
  echo "Port $p: HTTP $code"
done

echo ""
echo "=== Logs ==="
echo "--- Gestao ---"
tail -2 /tmp/swiftpay-gestao.log
echo "--- Payment ---"
tail -2 /tmp/swiftpay-payment.log
echo "--- Admin ---"
tail -2 /tmp/swiftpay-admin.log
echo "--- Checkout ---"
tail -2 /tmp/swiftpay-checkout.log

echo ""
echo "=== PRONTO! ACESSAR: ==="
echo "Admin:    http://localhost:3000"
echo "Checkout: http://localhost:3001/{slug}"
echo "Gestao:   http://localhost:5001/swagger"
echo "Payment:  http://localhost:5002/swagger"
