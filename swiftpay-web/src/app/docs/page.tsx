'use client';

import React, { useState } from 'react';

export default function PublicDocsPage() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('inicio');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const navItems = [
    { id: 'inicio', label: 'Início', icon: HomeIcon },
    { id: 'autenticacao', label: 'Autenticação', icon: LockIcon },
    { id: 'transacoes', label: 'Transações', icon: CardIcon },
    { id: 'recorrente', label: 'Pix Recorrente', icon: RefreshIcon },
    { id: 'consultas', label: 'Consultas', icon: SearchIcon },
    { id: 'vendedor', label: 'Dados do Vendedor', icon: UserIcon },
    { id: 'reembolsos', label: 'Reembolsos', icon: RefundIcon },
    { id: 'saques', label: 'Saques (AkkadPag)', icon: BankIcon },
    { id: 'webhooks', label: 'Webhooks', icon: LinkIcon },
    { id: 'erros', label: 'Erros', icon: AlertIcon },
    { id: 'integrar-ia', label: 'Integrar via IA', icon: SparklesIcon, badge: '+' },
  ];

  const filteredNavItems = navItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-pink-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            F
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-base leading-tight">SwiftPay</h1>
            <p className="text-xs text-slate-500">Documentação API</p>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <CloseIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-30 h-screen w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 hidden md:block">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
              F
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg leading-tight">SwiftPay</h2>
              <p className="text-xs text-slate-400 font-medium">Documentação API REST</p>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar endpoints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 text-slate-800 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-pink-50 text-pink-600 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-pink-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] bg-pink-100 text-pink-600 font-bold px-1.5 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Versão da API</span>
            <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-semibold">
              v1.0.0 (REST)
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl p-4 md:p-8 space-y-8 overflow-y-auto">
        {/* Top Header */}
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Documentação da API
          </h1>
          <p className="text-sm font-medium text-slate-500">SwiftPay Platform</p>
        </div>

        {/* Section 1: Guia de Início Rápido */}
        <section id="inicio" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Guia de Início Rápido
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Bem-vindo à documentação da API da SwiftPay. Siga estes passos para começar a integrar nossa API de pagamentos PIX em sua aplicação.
          </p>

          <ol className="space-y-4 text-sm text-slate-700">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center mt-0.5">
                1
              </span>
              <div>
                <strong className="font-semibold text-slate-900">Crie sua Conta de Loja:</strong> Entre em contato com o administrador da plataforma para criar sua conta. Você receberá seu e-mail e credenciais para acessar o portal de cliente.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center mt-0.5">
                2
              </span>
              <div>
                <strong className="font-semibold text-slate-900">Obtenha sua Chave Secreta:</strong> Faça login no seu portal, vá para a aba "Configurações e API" e copie sua Chave Secreta (<code className="text-xs bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded font-mono">publicKey</code> e <code className="text-xs bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded font-mono">secretKey</code>).
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center mt-0.5">
                3
              </span>
              <div>
                <strong className="font-semibold text-slate-900">Autentique suas Requisições:</strong> Para toda chamada à API, obtenha o token JWT em <code className="text-xs bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded font-mono">POST /v1/auth/token</code> e inclua no cabeçalho HTTP <code className="text-xs bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded font-mono">Authorization: Bearer &lt;token&gt;</code>.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center mt-0.5">
                4
              </span>
              <div>
                <strong className="font-semibold text-slate-900">Crie sua Primeira Transação:</strong> Use o endpoint <code className="text-xs bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded font-mono">POST /v1/transactions</code> para gerar sua primeira cobrança PIX instantânea com QR Code e Pix Copia e Cola.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center mt-0.5">
                5
              </span>
              <div>
                <strong className="font-semibold text-slate-900">Receba Notificações:</strong> Configure a URL de Webhook no seu portal para ser notificado em tempo real sobre as mudanças de status da cobrança ou saque.
              </div>
            </li>
          </ol>
        </section>

        {/* Section 2: Autenticação */}
        <section id="autenticacao" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Autenticação</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            A autenticação é feita via OAuth2 Client Credentials ou Token JWT. Envie sua chave no cabeçalho <code className="text-xs bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded font-mono">Authorization: Bearer &lt;accessToken&gt;</code> em todas as requisições. Requisições sem uma chave válida retornarão um erro <code className="text-xs bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-mono">401 Unauthorized</code>.
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Exemplo de Requisição Autenticada (cURL)
              </h3>
              <button
                onClick={() =>
                  copyToClipboard(
                    `curl --location 'https://swift-pay.top/v1/auth/token' \\\n  --header 'Content-Type: application/json' \\\n  --data '{\n    "grant_type": "client_credentials",\n    "publicKey": "teste-akkadpag",\n    "secretKey": "teste-akkadpag-secret"\n  }'`,
                    'auth-curl'
                  )
                }
                className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md transition-colors"
              >
                {copiedSection === 'auth-curl' ? (
                  <>
                    <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-medium">Copiado!</span>
                  </>
                ) : (
                  <>
                    <CopyIcon className="w-3.5 h-3.5" />
                    <span>Copiar cURL</span>
                  </>
                )}
              </button>
            </div>

            <pre className="bg-slate-950 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
{`# 1. Gerar Token Bearer (Client Credentials)
curl --location 'https://swift-pay.top/v1/auth/token' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "grant_type": "client_credentials",
    "publicKey": "sua_public_key_aqui",
    "secretKey": "sua_secret_key_aqui"
  }'

# 2. Resposta de Sucesso (Token JWT)
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1Ni...",
    "tokenType": "Bearer",
    "expiresIn": 3600
  }
}`}
            </pre>
          </div>
        </section>

        {/* Section 3: Transações */}
        <section id="transacoes" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-emerald-100 text-emerald-700 font-mono text-xs font-bold px-2 py-0.5 rounded">
                POST
              </span>
              <span className="font-mono text-xs text-slate-600">/v1/transactions</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Criar Cobrança PIX (AkkadPag)
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Gera uma cobrança PIX instantânea com QR Code e Pix Copia e Cola processada via adquirente AkkadPag.
            </p>
          </div>

          {/* Parameters Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Parâmetros de Requisição</h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="p-3">Campo</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Obrigatório</th>
                    <th className="p-3">Descrição</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="p-3 font-mono text-pink-600">method</td>
                    <td className="p-3 font-mono">string</td>
                    <td className="p-3 text-emerald-600 font-semibold">Sim</td>
                    <td className="p-3">Método de pagamento (usar "PIX")</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-pink-600">amount</td>
                    <td className="p-3 font-mono">integer</td>
                    <td className="p-3 text-emerald-600 font-semibold">Sim</td>
                    <td className="p-3">Valor da cobrança em centavos (ex: 1000 = R$ 10,00)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-pink-600">currency</td>
                    <td className="p-3 font-mono">string</td>
                    <td className="p-3 text-slate-400">Opcional</td>
                    <td className="p-3">Moeda (Padrão: "BRL")</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-pink-600">description</td>
                    <td className="p-3 font-mono">string</td>
                    <td className="p-3 text-slate-400">Opcional</td>
                    <td className="p-3">Descrição livre da cobrança exibida ao pagador</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-pink-600">customerName</td>
                    <td className="p-3 font-mono">string</td>
                    <td className="p-3 text-emerald-600 font-semibold">Sim</td>
                    <td className="p-3">Nome completo do pagador</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-pink-600">customerDocument</td>
                    <td className="p-3 font-mono">string</td>
                    <td className="p-3 text-emerald-600 font-semibold">Sim</td>
                    <td className="p-3">CPF (11 dígitos) ou CNPJ (14 dígitos) válido do pagador</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-pink-600">customerEmail</td>
                    <td className="p-3 font-mono">string</td>
                    <td className="p-3 text-emerald-600 font-semibold">Sim</td>
                    <td className="p-3">E-mail do pagador para envio de comprovante</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Response Payload Example */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Resposta de Sucesso (201 Created)
              </h3>
              <button
                onClick={() =>
                  copyToClipboard(
                    `{\n  "data": {\n    "id": "019fc9e7-6ef3-7a91-98ec-baef52f1fc0c",\n    "method": "Pix",\n    "amount": 1000,\n    "fee": 15,\n    "netAmount": 985,\n    "status": "Pending",\n    "pix": {\n      "txId": "VW1F884R8DTQDTCV7DE4PSUF58",\n      "qrCode": "00020101021226830014br.gov.bcb.pix2561qrcode...",\n      "copyAndPaste": "00020101021226830014br.gov.bcb.pix2561qrcode..."\n    }\n  }\n}`,
                    'tx-res'
                  )
                }
                className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md transition-colors"
              >
                {copiedSection === 'tx-res' ? (
                  <>
                    <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-medium">Copiado!</span>
                  </>
                ) : (
                  <>
                    <CopyIcon className="w-3.5 h-3.5" />
                    <span>Copiar JSON</span>
                  </>
                )}
              </button>
            </div>

            <pre className="bg-slate-950 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
{`{
  "data": {
    "id": "019fc9e7-6ef3-7a91-98ec-baef52f1fc0c",
    "externalId": null,
    "method": "Pix",
    "amount": 1000,
    "fee": 15,
    "netAmount": 985,
    "currency": "BRL",
    "status": "Pending",
    "description": "Teste AkkadPag SwiftPay",
    "createdAt": "2026-08-03T23:13:37Z",
    "expiresAt": "2026-08-03T23:43:37Z",
    "pix": {
      "txId": "VW1F884R8DTQDTCV7DE4PSUF58",
      "qrCode": "00020101021226830014br.gov.bcb.pix2561qrcode.owem.com.br/v2/qr/cob/b7914b63b2e3...",
      "copyAndPaste": "00020101021226830014br.gov.bcb.pix2561qrcode.owem.com.br/v2/qr/cob/b7914b63b2e3...",
      "expiresAt": "2026-08-03T23:43:37Z"
    }
  },
  "message": null,
  "error": null
}`}
            </pre>
          </div>
        </section>

        {/* Section 4: Consultas */}
        <section id="consultas" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-blue-100 text-blue-700 font-mono text-xs font-bold px-2 py-0.5 rounded">
              GET
            </span>
            <span className="font-mono text-xs text-slate-600">/v1/transactions/&#123;id&#125;</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Consultar Status da Transação</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Retorna os detalhes atualizados de uma cobrança PIX pelo ID da transação na SwiftPay.
          </p>

          <pre className="bg-slate-950 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
{`curl --location 'https://swift-pay.top/v1/transactions/019fc9e7-6ef3-7a91-98ec-baef52f1fc0c' \\
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1Ni...'`}
          </pre>
        </section>

        {/* Section 5: Saques (AkkadPag) */}
        <section id="saques" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-100 text-emerald-700 font-mono text-xs font-bold px-2 py-0.5 rounded">
              POST
            </span>
            <span className="font-mono text-xs text-slate-600">/v1/cashouts</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Solicitar Saque PIX (AkkadPag)</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Realiza uma transferência de saída (payout/cashout) via PIX processada pela adquirente AkkadPag para a chave informada.
          </p>

          <pre className="bg-slate-950 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
{`curl --location 'https://swift-pay.top/v1/cashouts' \\
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1Ni...' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "amount": 5000,
    "pixKey": "52998224725",
    "pixKeyType": "CPF"
  }'`}
          </pre>
        </section>

        {/* Section 6: Webhooks */}
        <section id="webhooks" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Webhooks & Eventos</h2>
            <p className="text-sm text-slate-600 mt-1">
              URLs oficiais para cadastro na adquirente AkkadPag ou na sua plataforma para recebimento de notificações em tempo real.
            </p>
          </div>

          {/* Webhook URLs Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-bold text-slate-900 block">URL de Webhook (Transações PIX):</span>
                <code className="text-pink-600 font-mono bg-white px-2 py-1 rounded border border-slate-200 block mt-1">
                  https://swift-pay.top/v1/internal/akkadpag/webhooks/transactions
                </code>
              </div>
            </div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-bold text-slate-900 block">URL de Webhook (Saques / Payouts):</span>
                <code className="text-pink-600 font-mono bg-white px-2 py-1 rounded border border-slate-200 block mt-1">
                  https://swift-pay.top/v1/internal/akkadpag/webhooks/withdrawals
                </code>
              </div>
            </div>
          </div>

          {/* Event Status Badges */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Eventos de Transação e Saque</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></span>
                <div>
                  <strong className="font-semibold text-slate-900 block">Aguardando Pagamento</strong>
                  <span className="text-slate-500 text-[11px]">Transação criada, aguardando liquidação no banco.</span>
                </div>
              </div>

              <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
                <div>
                  <strong className="font-semibold text-slate-900 block">Transação Paga</strong>
                  <span className="text-slate-500 text-[11px]">PIX confirmado com sucesso na conta da empresa.</span>
                </div>
              </div>

              <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 flex-shrink-0"></span>
                <div>
                  <strong className="font-semibold text-slate-900 block">Transação Reembolsada</strong>
                  <span className="text-slate-500 text-[11px]">Valor devolvido ou estornado ao pagador original.</span>
                </div>
              </div>

              <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                <div>
                  <strong className="font-semibold text-slate-900 block">Saque Processando</strong>
                  <span className="text-slate-500 text-[11px]">Transferência PIX de saída em envio bancário.</span>
                </div>
              </div>

              <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
                <div>
                  <strong className="font-semibold text-slate-900 block">Saque Concluído</strong>
                  <span className="text-slate-500 text-[11px]">Transferência enviada e creditada na chave de destino.</span>
                </div>
              </div>

              <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-slate-400 mt-1.5 flex-shrink-0"></span>
                <div>
                  <strong className="font-semibold text-slate-900 block">Disputa MED (Infração PIX)</strong>
                  <span className="text-slate-500 text-[11px]">Notificação de contestação ou bloqueio cautelar.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 7: Erros */}
        <section id="erros" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Tabela de Erros HTTP</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Respostas de erro padrão da API com códigos HTTP e mensagens detalhadas.
          </p>

          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="p-3">Código HTTP</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Descrição & Solução</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="p-3 font-mono font-bold text-emerald-600">200 / 201</td>
                  <td className="p-3 font-semibold">OK / Created</td>
                  <td className="p-3">Requisição executada com sucesso.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-bold text-amber-600">400</td>
                  <td className="p-3 font-semibold">Bad Request</td>
                  <td className="p-3">Parâmetros inválidos (ex: CPF incorreto, valor nulo).</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-bold text-rose-600">401</td>
                  <td className="p-3 font-semibold">Unauthorized</td>
                  <td className="p-3">Token Ausente, inválido ou expirado. Reเกre novo token.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-bold text-slate-600">404</td>
                  <td className="p-3 font-semibold">Not Found</td>
                  <td className="p-3">Transação ou recurso solicitado não existe.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-bold text-purple-600">500</td>
                  <td className="p-3 font-semibold">Internal Server Error</td>
                  <td className="p-3">Instabilidade temporária no servidor ou adquirente.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 8: Integrar via IA */}
        <section id="integrar-ia" className="bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-pink-200" />
            <h2 className="text-xl font-bold tracking-tight">Integrar via IA (Copilot, Cursor, ChatGPT)</h2>
          </div>
          <p className="text-sm text-pink-100 leading-relaxed">
            Cole o prompt de especificação técnica diretamente no seu assistente de código IA para gerar SDKs, controladores e integrações prontas em TypeScript, Python, C#, PHP ou Go!
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() =>
                copyToClipboard(
                  `Você é um desenvolvedor sênior especialista na API REST da SwiftPay.\nImplemente uma integração completa com a API SwiftPay no domínio https://swift-pay.top.\nEndpoints:\n1. POST /v1/auth/token para obter token Bearer OAuth2 client_credentials com publicKey e secretKey.\n2. POST /v1/transactions para criar cobrança PIX com amount em centavos, customerName, customerDocument, customerEmail.\n3. Receba webhooks em /v1/internal/akkadpag/webhooks/transactions.`,
                  'ai-prompt'
                )
              }
              className="inline-flex items-center gap-2 text-xs font-semibold bg-white text-pink-700 hover:bg-pink-50 px-4 py-2.5 rounded-xl shadow-sm transition-colors"
            >
              {copiedSection === 'ai-prompt' ? (
                <>
                  <CheckIcon className="w-4 h-4 text-emerald-600" />
                  <span>Prompt Copiado!</span>
                </>
              ) : (
                <>
                  <CopyIcon className="w-4 h-4" />
                  <span>Copiar Prompt para IA</span>
                </>
              )}
            </button>

            <a
              href="https://swift-pay.top/openapi/v1.json"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold bg-pink-700/50 hover:bg-pink-700 text-white px-4 py-2.5 rounded-xl transition-colors border border-pink-400/30"
            >
              <DownloadIcon className="w-4 h-4" />
              <span>Baixar OpenAPI Spec (JSON)</span>
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

// Inline Helper Icons
function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function CardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function RefundIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  );
}

function BankIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}
