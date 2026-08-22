# 0007: Roteamento Dinâmico de Adquirentes e Testes A/B Nominais

O motor de pagamentos `swiftpay-api-payment` distribui requisições de cobrança (Pix, Cartão e Boleto) dinamicamente entre múltiplos provedores e adquirentes (ex: PixHub, Bankizi).
Adotamos algoritmos de split e teste A/B com fallback automático para maximizar a taxa de conversão de pagamentos, proteger a operação contra indisponibilidade de adquirentes individuais e viabilizar negociações competitivas de taxas.
