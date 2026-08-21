# 0004: Plataforma de E-mails com Padrão Outbox no Firestore e Resend

O disparo de e-mails transacionais e de autenticação utiliza o plano Spark gratuito do Firebase integrado ao Resend como transporte de envio.
Decidimos utilizar uma tabela PostgreSQL `email_intents` combinada com Firestore Outbox e worker na VPS para garantir entrega assíncrona desacoplada, idempotência com hash criptográfico e proteção contra estouro de cotas sem necessidade de plano faturável Blaze.
