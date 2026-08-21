# 0003: Autenticação Híbrida Firebase Client e Troca de Token JWT Backend

A autenticação de usuários e lojistas combina Firebase Authentication no frontend client com emissão de token JWT proprietário e cookies `httpOnly` pelo backend da SwiftPay.
O frontend obtém o ID token do Firebase e o envia exclusivamente aos proxies `/api/auth/*`; o backend valida a assinatura criptográfica, provisiona o usuário na base relacional e emite o JWT de sessão (`swiftpay_access_token`), impedindo que tokens da plataforma fiquem expostos no cliente.
