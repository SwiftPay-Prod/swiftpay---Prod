# 0006: Contabilidade Financeira em Livro-Razão de Dupla Entrada (Ledger)

A movimentação de saldos de lojistas, taxas de plataforma, retenções de reserva e liquidações de saques é processada via partidas dobradas imutáveis em `LedgerEntries` e `LedgerTransactions`.
Decidimos contra a atualização direta e mutável de colunas de saldo numérico, garantindo rastreabilidade contábil estrita à prova de auditoria e impossibilitando divergências financeiras ou saldos inconsistentes em condições de concorrência.
