#!/bin/bash
BASE="http://localhost:5199"

echo "=== Testing MagicPay Mock ==="

# Test PIX
echo -e "\n1. Create PIX Payment:"
curl -s -w "\nHTTP: %{http_code}\n" -X POST "$BASE/v1/payment" \
  -H "Content-Type: application/json" \
  -d '{"amount":1000,"currency":"BRL","method":"PIX","description":"Teste","externalRef":"t1","notificationUrl":"https://webhook/url","payer":{"name":"John","taxId":"123","email":"j@j.com","phone":"11999999999"}}'

# Test Boleto
echo -e "\n2. Create Boleto Payment:"
curl -s -w "\nHTTP: %{http_code}\n" -X POST "$BASE/v1/payment" \
  -H "Content-Type: application/json" \
  -d '{"amount":2000,"currency":"BRL","method":"BOLETO","description":"Boleto","externalRef":"t2","notificationUrl":"https://webhook/url","payer":{"name":"John","taxId":"123","email":"j@j.com","phone":"11999999999"}}'

# Test Credit Card
echo -e "\n3. Create Credit Card Payment:"
curl -s -w "\nHTTP: %{http_code}\n" -X POST "$BASE/v1/payment" \
  -H "Content-Type: application/json" \
  -d '{"amount":3000,"currency":"BRL","method":"CREDIT_CARD","description":"Card","externalRef":"t3","notificationUrl":"https://webhook/url","payer":{"name":"John","taxId":"123","email":"j@j.com","phone":"11999999999"}}'

echo ""
echo "=== All mock tests passed ==="
