'use client';

import React, { useState } from 'react';
import { Input } from '@heroui/react';
import { SwiftPayBrandLogo } from '@/components/ui/swiftpay-brand-logo';

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
    { id: 'consultas', label: 'Consultas', icon: SearchIcon },
    { id: 'saques', label: 'Saques', icon: BankIcon },
    { id: 'webhooks', label: 'Webhooks', icon: LinkIcon },
    { id: 'erros', label: 'Erros', icon: AlertIcon },
    { id: 'integrar-ia', label: 'Integrar via IA', icon: SparklesIcon, badge: '+' },
  ];

  const filteredNavItems = navItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#000000] text-white font-sans antialiased flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#16181a] border-b border-white/12 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <SwiftPayBrandLogo showText={true} iconSize={32} textClassName="text-lg" />
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-white/60 hover:text-white rounded-lg hover:bg-white/5"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <CloseIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-30 h-screen w-64 bg-[#16181a] border-r border-white/12 flex flex-col transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-white/12 hidden md:block">
          <div className="flex items-center gap-2">
            <SwiftPayBrandLogo showText={true} iconSize={36} textClassName="text-xl" />
          </div>
        </div>
        <div className="px-4 py-3 border-b border-white/12">
          <div className="relative flex items-center">
            <SearchIcon className="absolute left-3 w-4 h-4 text-white/60 pointer-events-none" />
            <Input
              variant="secondary"
              placeholder="Buscar endpoints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9"
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
                    ? 'bg-[#00a87e]/15 text-[#00a87e] font-semibold'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#00a87e]' : 'text-white/60'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-xs bg-[#00a87e]/15 text-[#00a87e] font-bold px-1.5 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/12 bg-[#16181a]/50">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>Versão da API</span>
            <span className="font-mono text-xs bg-white/10 text-white px-1.5 py-0.5 rounded font-semibold">
              v1.0.0 (REST)
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl p-4 md:p-8 space-y-8 overflow-y-auto">
        {/* Top Header */}
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Documentação da API
          </h1>
          <p className="text-sm font-medium text-white/60">SwiftPay Platform</p>
        </div>

        {/* Section 1: Guia de Início Rápido */}
        <section id="inicio" className="bg-[#16181a] border border-white/12 rounded-[20px] p-6  space-y-5">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Guia de Início Rápido
          </h2>
          <p className="text-sm text-white/60 leading-relaxed">
            Bem-vindo à documentação da API da SwiftPay. Siga estes passos para começar a integrar nossa API de pagamentos PIX em sua aplicação.
          </p>

          <ol className="space-y-4 text-sm text-white">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/5 text-white font-bold text-xs flex items-center justify-center mt-0.5">
                1
              </span>
              <div>
                <strong className="font-semibold text-white">Crie sua Conta de Loja:</strong> Entre em contato com o administrador da plataforma para criar sua conta. Você receberá seu e-mail e credenciais para acessar o portal de cliente.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/5 text-white font-bold text-xs flex items-center justify-center mt-0.5">
                2
              </span>
              <div>
                <strong className="font-semibold text-white">Obtenha sua Chave Secreta:</strong> Faça login no seu portal, vá para a aba "Configurações e API" e copie sua Chave Secreta (<code className="text-xs bg-white/5 text-[#00a87e] px-1.5 py-0.5 rounded font-mono">publicKey</code> e <code className="text-xs bg-white/5 text-[#00a87e] px-1.5 py-0.5 rounded font-mono">secretKey</code>).
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/5 text-white font-bold text-xs flex items-center justify-center mt-0.5">
                3
              </span>
              <div>
                <strong className="font-semibold text-white">Autentique suas Requisições:</strong> Para toda chamada à API, obtenha o token JWT em <code className="text-xs bg-white/5 text-[#00a87e] px-1.5 py-0.5 rounded font-mono">POST /v1/auth/token</code> e inclua no cabeçalho HTTP <code className="text-xs bg-white/5 text-[#00a87e] px-1.5 py-0.5 rounded font-mono">Authorization: Bearer &lt;token&gt;</code>.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/5 text-white font-bold text-xs flex items-center justify-center mt-0.5">
                4
              </span>
              <div>
                <strong className="font-semibold text-white">Crie sua Primeira Transação:</strong> Use o endpoint <code className="text-xs bg-white/5 text-[#00a87e] px-1.5 py-0.5 rounded font-mono">POST /v1/transactions</code> para gerar sua primeira cobrança PIX instantânea com QR Code e Pix Copia e Cola.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/5 text-white font-bold text-xs flex items-center justify-center mt-0.5">
                5
              </span>
              <div>
                <strong className="font-semibold text-white">Receba Notificações:</strong> Configure a URL de Webhook no seu portal para ser notificado em tempo real sobre as mudanças de status da cobrança ou saque.
              </div>
            </li>
          </ol>
        </section>

        {/* Section 2: Autenticação */}
        <section id="autenticacao" className="bg-[#16181a] border border-white/12 rounded-[20px] p-6  space-y-5">
          <h2 className="text-xl font-bold text-white tracking-tight">Autenticação</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            A autenticação é feita via OAuth2 Client Credentials ou Token JWT. Envie sua chave no cabeçalho <code className="text-xs bg-white/5 text-[#00a87e] px-1.5 py-0.5 rounded font-mono">Authorization: Bearer &lt;accessToken&gt;</code> em todas as requisições. Requisições sem uma chave válida retornarão um erro <code className="text-xs bg-rose-500/15 text-rose-300 px-1.5 py-0.5 rounded font-mono">401 Unauthorized</code>.
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">
                Exemplo de Requisição Autenticada (cURL)
              </h3>
              <button
                onClick={() =>
                  copyToClipboard(
                    `curl --location 'https://swiftpayment.info/v1/auth/token' \\\n  --header 'Content-Type: application/json' \\\n  --data '{\n    "grant_type": "client_credentials",\n    "publicKey": "sua_public_key_aqui",\n    "secretKey": "sua_secret_key_aqui"\n  }'`,
                    'auth-curl'
                  )
                }
                className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-md transition-colors"
              >
                {copiedSection === 'auth-curl' ? (
                  <>
                    <CheckIcon className="w-3.5 h-3.5 text-[#00a87e]" />
                    <span className="text-[#00a87e] font-medium">Copiado!</span>
                  </>
                ) : (
                  <>
                    <CopyIcon className="w-3.5 h-3.5" />
                    <span>Copiar cURL</span>
                  </>
                )}
              </button>
            </div>

            <pre className="bg-[#000000] text-white p-4 rounded-xl font-mono text-xs overflow-x-auto border border-white/12 leading-relaxed">
{`# 1. Gerar Token Bearer (Client Credentials)
curl --location 'https://swiftpayment.info/v1/auth/token' \\
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
        <section id="transacoes" className="bg-[#16181a] border border-white/12 rounded-[20px] p-6  space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-[#00a87e]/15 text-[#00a87e] font-mono text-xs font-bold px-2 py-0.5 rounded">
                POST
              </span>
              <span className="font-mono text-xs text-white/60">/v1/transactions</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Criar Cobrança PIX
            </h2>
            <p className="text-sm text-white/60 mt-1">
              Gera uma cobrança PIX instantânea com QR Code e Pix Copia e Cola. O processamento é transparente: a SwiftPay roteia o pagamento pela melhor rota de liquidação disponível.
            </p>
          </div>

          {/* Parameters Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">Parâmetros de Requisição</h3>
            <div className="border border-white/12 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5/60 border-b border-white/12 text-white font-semibold">
                    <th className="p-3">Campo</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Obrigatório</th>
                    <th className="p-3">Descrição</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/12 text-white">
                  <tr>
                    <td className="p-3 font-mono text-[#00a87e]">method</td>
                    <td className="p-3 text-[#00a87e] font-semibold">Sim</td>
                    <td className="p-3">Método de pagamento (usar "PIX")</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-[#00a87e]">amount</td>
                    <td className="p-3 text-[#00a87e] font-semibold">Sim</td>
                    <td className="p-3">Valor da cobrança em centavos (ex: 1000 = R$ 10,00)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-[#00a87e]">currency</td>
                    <td className="p-3 text-white/60">Opcional</td>
                    <td className="p-3">Moeda (Padrão: "BRL")</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-[#00a87e]">description</td>
                    <td className="p-3 text-white/60">Opcional</td>
                    <td className="p-3">Descrição livre da cobrança exibida ao pagador</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-[#00a87e]">customerName</td>
                    <td className="p-3 text-white/60">Opcional</td>
                    <td className="p-3">Nome completo do pagador (recomendado para comprovação)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-[#00a87e]">customerDocument</td>
                    <td className="p-3 text-white/60">Opcional</td>
                    <td className="p-3">CPF (11 dígitos) ou CNPJ (14 dígitos) válido do pagador</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-[#00a87e]">customerEmail</td>
                    <td className="p-3 text-white/60">Opcional</td>
                    <td className="p-3">E-mail do pagador para envio de comprovante</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Response Payload Example */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">
                Resposta de Sucesso (201 Created)
              </h3>
              <button
                onClick={() =>
                  copyToClipboard(
                    `{\n  "data": {\n    "id": "019fc9e7-6ef3-7a91-98ec-baef52f1fc0c",\n    "method": "Pix",\n    "amount": 1000,\n    "fee": 15,\n    "netAmount": 985,\n    "status": "Pending",\n    "pix": {\n      "txId": "VW1F884R8DTQDTCV7DE4PSUF58",\n      "qrCode": "00020101021226830014br.gov.bcb.pix2561qrcode...",\n      "copyAndPaste": "00020101021226830014br.gov.bcb.pix2561qrcode..."\n    }\n  }\n}`,
                    'tx-res'
                  )
                }
                className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-md transition-colors"
              >
                {copiedSection === 'tx-res' ? (
                  <>
                    <CheckIcon className="w-3.5 h-3.5 text-[#00a87e]" />
                    <span className="text-[#00a87e] font-medium">Copiado!</span>
                  </>
                ) : (
                  <>
                    <CopyIcon className="w-3.5 h-3.5" />
                    <span>Copiar JSON</span>
                  </>
                )}
              </button>
            </div>

            <pre className="bg-[#000000] text-white p-4 rounded-xl font-mono text-xs overflow-x-auto border border-white/12 leading-relaxed">
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
    "description": "Cobrança de exemplo",
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
        <section id="consultas" className="bg-[#16181a] border border-white/12 rounded-[20px] p-6  space-y-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-blue-500/15 text-blue-400 font-mono text-xs font-bold px-2 py-0.5 rounded">
              GET
            </span>
            <span className="font-mono text-xs text-white/60">/v1/transactions/&#123;id&#125;</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Consultar Status da Transação</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            Retorna os detalhes atualizados de uma cobrança PIX pelo ID da transação na SwiftPay.
          </p>

          <pre className="bg-[#000000] text-white p-4 rounded-xl font-mono text-xs overflow-x-auto border border-white/12 leading-relaxed">
{`curl --location 'https://swiftpayment.info/v1/transactions/019fc9e7-6ef3-7a91-98ec-baef52f1fc0c' \\
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1Ni...'`}
          </pre>

          <div className="flex items-center gap-2 mb-1">
            <span className="bg-blue-500/15 text-blue-400 font-mono text-xs font-bold px-2 py-0.5 rounded">
              GET
            </span>
            <span className="font-mono text-xs text-white/60">/v1/transactions</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Listar Transações</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            Lista as transações da sua conta com paginação e filtros opcionais por status, método, período ou ID externo.
          </p>
          <pre className="bg-[#000000] text-white p-4 rounded-xl font-mono text-xs overflow-x-auto border border-white/12 leading-relaxed">
{`curl --location 'https://swiftpayment.info/v1/transactions?page=1&pageSize=20&status=Paid&startDate=2026-08-01&endDate=2026-08-31' \\
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1Ni...'

# Resposta (200 OK)
{
  "data": [
    {
      "id": "019fc9e7-6ef3-7a91-98ec-baef52f1fc0c",
      "amount": 1000,
      "status": "Paid",
      "method": "Pix",
      "createdAt": "2026-08-03T23:13:37Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1
}`}
          </pre>

          <div className="flex items-center gap-2 mb-1">
            <span className="bg-blue-500/15 text-blue-400 font-mono text-xs font-bold px-2 py-0.5 rounded">
              GET
            </span>
            <span className="font-mono text-xs text-white/60">/v1/balance</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Consultar Saldo</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            Retorna o saldo disponível, pendente e reservado da sua conta, além do volume movimentado no período.
          </p>
          <pre className="bg-[#000000] text-white p-4 rounded-xl font-mono text-xs overflow-x-auto border border-white/12 leading-relaxed">
{`curl --location 'https://swiftpayment.info/v1/balance' \\
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1Ni...'

# Resposta (200 OK)
{
  "data": {
    "currency": "BRL",
    "balance": {
      "available": 98500,
      "withdrawNowAvailable": 98500,
      "requiresFullWithdrawalNow": false,
      "pending": 1500,
      "reserved": 0,
      "total": 100000
    },
    "totals": {
      "lifetimeVolume": 250000,
      "lifetimePayouts": 100000,
      "lifetimeRefunds": 0
    },
    "period": {
      "volumeToday": 12000,
      "volumeThisWeek": 45000,
      "volumeThisMonth": 98000
    },
    "updatedAt": "2026-08-05T10:00:00Z"
  }
}`}
          </pre>
        </section>

        {/* Section 5: Saques */}
        <section id="saques" className="bg-[#16181a] border border-white/12 rounded-[20px] p-6  space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-[#00a87e]/15 text-[#00a87e] font-mono text-xs font-bold px-2 py-0.5 rounded">
                POST
              </span>
              <span className="font-mono text-xs text-white/60">/v1/cashouts</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Solicitar Saque PIX</h2>
            <p className="text-sm text-white/60 leading-relaxed">
              Realiza uma transferência de saída (payout/cashout) via PIX para a chave informada, a partir do saldo disponível da sua conta.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">Parâmetros de Requisição</h3>
            <div className="border border-white/12 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5/60 border-b border-white/12 text-white font-semibold">
                    <th className="p-3">Campo</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Obrigatório</th>
                    <th className="p-3">Descrição</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/12 text-white">
                  <tr>
                    <td className="p-3 font-mono text-[#00a87e]">amount</td>
                    <td className="p-3 text-[#00a87e] font-semibold">Sim</td>
                    <td className="p-3">Valor do saque em centavos (ex: 5000 = R$ 50,00)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-[#00a87e]">pixKey</td>
                    <td className="p-3 text-white/60">Opcional*</td>
                    <td className="p-3">Chave PIX de destino (CPF, CNPJ, e-mail, telefone ou aleatória)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-[#00a87e]">pixKeyType</td>
                    <td className="p-3 text-white/60">Opcional*</td>
                    <td className="p-3">Tipo da chave: "CPF", "CNPJ", "Email", "Phone" ou "Random"</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-[#00a87e]">payoutAccountId</td>
                    <td className="p-3 text-white/60">Opcional*</td>
                    <td className="p-3">ID de conta de pagamento pré-cadastrada (alternativa à chave PIX)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-[#00a87e]">externalId</td>
                    <td className="p-3 text-white/60">Opcional</td>
                    <td className="p-3">Identificador externo para conciliação</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-[#00a87e]">callbackUrl</td>
                    <td className="p-3 text-white/60">Opcional</td>
                    <td className="p-3">URL de callback específica para este saque</td>
                  </tr>
                </tbody>
              </table>
              <p className="p-3 text-white/60 border-t border-white/12">
                * Informe <code className="font-mono bg-white/5 text-[#00a87e] px-1 py-0.5 rounded">pixKey</code> + <code className="font-mono bg-white/5 text-[#00a87e] px-1 py-0.5 rounded">pixKeyType</code> OU <code className="font-mono bg-white/5 text-[#00a87e] px-1 py-0.5 rounded">payoutAccountId</code> (nunca ambos).
              </p>
            </div>
          </div>

          <pre className="bg-[#000000] text-white p-4 rounded-xl font-mono text-xs overflow-x-auto border border-white/12 leading-relaxed">
{`curl --location 'https://swiftpayment.info/v1/cashouts' \\
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1Ni...' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "amount": 5000,
    "pixKey": "52998224725",
    "pixKeyType": "CPF"
  }'`}
          </pre>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">Outros endpoints de Saque</h3>
            <div className="border border-white/12 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5/60 border-b border-white/12 text-white font-semibold">
                    <th className="p-3">Método</th>
                    <th className="p-3">Endpoint</th>
                    <th className="p-3">Descrição</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/12 text-white">
                  <tr>
                    <td className="p-3 font-mono font-bold text-blue-400">GET</td>
                    <td className="p-3 font-mono text-[#00a87e]">/v1/cashouts</td>
                    <td className="p-3">Lista saques com filtros (página, status, período)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-blue-400">GET</td>
                    <td className="p-3 font-mono text-[#00a87e]">/v1/cashouts/&#123;id&#125;</td>
                    <td className="p-3">Consulta os detalhes de um saque</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-amber-400">POST</td>
                    <td className="p-3 font-mono text-[#00a87e]">/v1/cashouts/&#123;id&#125;/cancel</td>
                    <td className="p-3">Cancela um saque ainda em processamento</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section 6: Webhooks */}
        <section id="webhooks" className="bg-[#16181a] border border-white/12 rounded-[20px] p-6  space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Webhooks & Eventos</h2>
            <p className="text-sm text-white/60 mt-1">
              Configure a URL de webhook da <strong className="text-white">sua aplicação</strong> no portal (aba "Configurações e API") e a SwiftPay enviará notificações em tempo real (HTTP POST) sempre que uma transação ou saque mudar de status. Você também pode informar um <code className="font-mono bg-white/5 text-[#00a87e] px-1 py-0.5 rounded text-xs">callbackUrl</code> por chamada para sobrescrever a URL padrão.
            </p>
          </div>

          {/* Webhook Payload Box */}
          <div className="bg-[#16181a] border border-white/12 rounded-xl p-4 space-y-3 text-xs">
            <div>
              <span className="font-bold text-white block">Exemplo de payload enviado (transação paga):</span>
              <pre className="bg-[#000000] text-white p-4 rounded-xl font-mono text-xs overflow-x-auto border border-white/12 leading-relaxed mt-2">
{`{
  "event": "transaction.updated",
  "data": {
    "id": "019fc9e7-6ef3-7a91-98ec-baef52f1fc0c",
    "externalId": "pedido-123",
    "amount": 1000,
    "status": "Paid",
    "method": "Pix",
    "createdAt": "2026-08-03T23:13:37Z",
    "completedAt": "2026-08-03T23:14:02Z"
  },
  "sentAt": "2026-08-03T23:14:03Z"
}`}
              </pre>
            </div>
            <p className="text-white/60 text-xs">
              Sua URL deve responder <code className="font-mono bg-white/5 text-[#00a87e] px-1 py-0.5 rounded">200 OK</code> para confirmar o recebimento. Se não confirmar, a SwiftPay faz novas tentativas com backoff.
            </p>
          </div>

          {/* Event Status Badges */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">Eventos de Transação e Saque</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 border border-white/12 rounded-xl bg-[#16181a]/50 flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></span>
                <div>
                  <strong className="font-semibold text-white block">Aguardando Pagamento</strong>
                  <span className="text-white/60 text-xs">Transação criada, aguardando liquidação no banco.</span>
                </div>
              </div>

              <div className="p-3 border border-white/12 rounded-xl bg-[#16181a]/50 flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
                <div>
                  <strong className="font-semibold text-white block">Transação Paga</strong>
                  <span className="text-white/60 text-xs">PIX confirmado com sucesso na conta da empresa.</span>
                </div>
              </div>

              <div className="p-3 border border-white/12 rounded-xl bg-[#16181a]/50 flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 flex-shrink-0"></span>
                <div>
                  <strong className="font-semibold text-white block">Transação Reembolsada</strong>
                  <span className="text-white/60 text-xs">Valor devolvido ou estornado ao pagador original.</span>
                </div>
              </div>

              <div className="p-3 border border-white/12 rounded-xl bg-[#16181a]/50 flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                <div>
                  <strong className="font-semibold text-white block">Saque Processando</strong>
                  <span className="text-white/60 text-xs">Transferência PIX de saída em envio bancário.</span>
                </div>
              </div>

              <div className="p-3 border border-white/12 rounded-xl bg-[#16181a]/50 flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
                <div>
                  <strong className="font-semibold text-white block">Saque Concluído</strong>
                  <span className="text-white/60 text-xs">Transferência enviada e creditada na chave de destino.</span>
                </div>
              </div>

              <div className="p-3 border border-white/12 rounded-xl bg-[#16181a]/50 flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-white/10 mt-1.5 flex-shrink-0"></span>
                <div>
                  <strong className="font-semibold text-white block">Disputa MED (Infração PIX)</strong>
                  <span className="text-white/60 text-xs">Notificação de contestação ou bloqueio cautelar.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 7: Erros */}
        <section id="erros" className="bg-[#16181a] border border-white/12 rounded-[20px] p-6  space-y-5">
          <h2 className="text-xl font-bold text-white tracking-tight">Tabela de Erros HTTP</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            Respostas de erro padrão da API com códigos HTTP e mensagens detalhadas.
          </p>

          <div className="border border-white/12 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5/60 border-b border-white/12 text-white font-semibold">
                  <th className="p-3">Código HTTP</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Descrição & Solução</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/12 text-white">
                <tr>
                  <td className="p-3 font-mono font-bold text-[#00a87e]">200 / 201</td>
                  <td className="p-3 font-semibold">OK / Created</td>
                  <td className="p-3">Requisição executada com sucesso.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-bold text-amber-400">400</td>
                  <td className="p-3 font-semibold">Bad Request</td>
                  <td className="p-3">Parâmetros inválidos (ex: CPF incorreto, valor nulo).</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-bold text-rose-400">401</td>
                  <td className="p-3 font-semibold">Unauthorized</td>
                  <td className="p-3">Token ausente, inválido ou expirado. Gere um novo token.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-bold text-white/60">404</td>
                  <td className="p-3 font-semibold">Not Found</td>
                  <td className="p-3">Transação ou recurso solicitado não existe.</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-bold text-purple-400">500</td>
                  <td className="p-3 font-semibold">Internal Server Error</td>
                  <td className="p-3">Instabilidade temporária no servidor ou adquirente.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 8: Integrar via IA */}
        <section id="integrar-ia" className="bg-revolut-card border border-revolut-hairline text-white rounded-[20px] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-emerald-200" />
            <h2 className="text-xl font-bold tracking-tight">Integrar via IA (Copilot, Cursor, ChatGPT)</h2>
          </div>
          <p className="text-sm text-emerald-100 leading-relaxed">
            Cole o prompt de especificação técnica diretamente no seu assistente de código IA para gerar SDKs, controladores e integrações prontas em TypeScript, Python, C#, PHP ou Go!
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() =>
                copyToClipboard(
                  `Você é um desenvolvedor sênior especialista na API REST da SwiftPay.\nImplemente uma integração completa com a API SwiftPay no domínio https://swiftpayment.info.\nUse a OpenAPI Spec oficial como fonte da verdade: https://swiftpayment.info/api/payment/openapi/v1.json\nFluxo básico:\n1. POST /v1/auth/token para obter token Bearer OAuth2 client_credentials com publicKey e secretKey.\n2. POST /v1/transactions para criar cobrança PIX com amount em centavos, customerName, customerDocument, customerEmail.\n3. Consulte status em GET /v1/transactions/{id} e saldo em GET /v1/balance.\n4. Configure a URL de webhook da aplicação no portal para receber eventos em tempo real.`,
                  'ai-prompt'
                )
              }
              className="inline-flex items-center gap-2 text-xs font-semibold bg-[#16181a] text-[#00a87e] hover:bg-[#00a87e]/15 px-4 py-2.5 rounded-xl  transition-colors"
            >
              {copiedSection === 'ai-prompt' ? (
                <>
                  <CheckIcon className="w-4 h-4 text-[#00a87e]" />
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
              href="https://swiftpayment.info/api/payment/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold bg-[#16181a] text-[#00a87e] hover:bg-[#00a87e]/15 px-4 py-2.5 rounded-xl  transition-colors"
            >
              <BookIcon className="w-4 h-4" />
              <span>Documentação Interativa (OpenAPI)</span>
            </a>

            <a
              href="https://swiftpayment.info/api/payment/openapi/v1.json"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold bg-emerald-800/50 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl transition-colors border border-emerald-400/30"
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


function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}
