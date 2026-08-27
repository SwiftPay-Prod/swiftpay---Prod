# Pix Estático — E2E Checklist

## Bloqueio atual
- `Validar E2E com cliente Pix` está bloqueada porque não há confirmação de ambiente/sandbox Pix disponível para este fluxo.

## Pré-requisitos necessários
- Ambiente de sandbox/prod com conta Pix de teste homologada.
- App bancário ou simulador Pix que aceite QR estático/portável.
- `MerchantPayoutAccount.PixKey` válida para o(s) modo(s) desejado(s).

## Passos sugeridos
1. Criar `StaticFixed` → confirmar valor no campo 54 e pagamento exato.
2. Criar `StaticOpen` → confirmar ausência do valor e fluxo de digitação.
3. Criar `StaticPortable` → confirmar EMV decodável fora do checkout e reutilização sem expiração.
4. Validar que `PaymentId/ExpiresAt` permanecem `null` no start estático.
5. Validar notificações e ledger conforme contrato externo.

## Contrato externo
- `POST /v1/payment-links/{token}/start` para estático retorna `QrCode`/`CopyAndPaste` sem criar `Payment`.
- Estáticos não devem referenciar cartões/boletos; fluxo é PIX-only.
