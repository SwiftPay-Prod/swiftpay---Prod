using swiftpay_api_core.Models.Database;

namespace swiftpay_api_core.Models.Acquirer;

public static class AcquirerRequiredFieldsDefaults
{
    public static AcquirerRequiredFieldsConfig GetDefaultConfig(AcquirerType type) => type switch
    {
        AcquirerType.Bankizi => GetBankiziConfig(),
        AcquirerType.IHubBanking => GetIHubBankingConfig(),
        AcquirerType.ActivePayments => GetActivePaymentsConfig(),
        AcquirerType.Rapdyn => GetRapdynConfig(),
        AcquirerType.Coldfy => GetColdfyConfig(),
        AcquirerType.Pluggou => GetPluggouConfig(),
        AcquirerType.HunterPay => GetHunterPayConfig(),
        AcquirerType.HeartPay => GetHeartPayConfig(),
        AcquirerType.Accithus => GetAccithusConfig(),
        _ => new()
    };

    private static AcquirerRequiredFieldsConfig GetBankiziConfig() => new()
    {
        Auth = new AcquirerAuthConfig
        {
            Method = "OAuth2",
            Description = "Autenticação via OAuth2 com client_credentials. O token expira em 1 hora e é renovado automaticamente.",
            Fields =
            [
                new() { Name = "clientId", Label = "Client ID", Type = "string", Required = true, Description = "Identificador da aplicação fornecido pela Bankizi", Source = "config" },
                new() { Name = "clientSecret", Label = "Client Secret", Type = "string", Required = true, Description = "Chave secreta da aplicação fornecida pela Bankizi", Source = "config" }
            ]
        },
        Pix = new AcquirerOperationConfig
        {
            Supported = true,
            Description = "Gera QR Code Dinâmico PIX com informações do pagador e tempo de expiração.",
            Endpoint = "POST /pix/qrcode/dynamic",
            AmountFormat = "centavos",
            Fields =
            [
                new() { Name = "amount", Label = "Valor", Type = "number", Required = true, Description = "Valor da cobrança em centavos", Source = "payment", Example = "10000 (R$ 100,00)" },
                new() { Name = "expiration", Label = "Expiração", Type = "number", Required = true, Description = "Tempo de validade do QR Code em segundos", Source = "system", Example = "3600 (1 hora)" },
                new() { Name = "txId", Label = "ID da Transação", Type = "string", Required = true, Description = "Identificador único da transação gerado pelo sistema", Source = "system", Example = "BDOUG086DGSH4534RWRGE66D212" },
                new() { Name = "payerInfo.name", Label = "Nome do Pagador", Type = "string", Required = false, Description = "Nome do pagador associado à cobrança", Source = "customer", Example = "João da Silva" },
                new() { Name = "payerInfo.document", Label = "Documento do Pagador", Type = "string", Required = false, Description = "CPF ou CNPJ do pagador", Source = "customer", Example = "12345678901" }
            ]
        },
        Boleto = null,
        CreditCard = null,
        Withdrawal = new AcquirerOperationConfig
        {
            Supported = true,
            Description = "Saque por chave PIX. O valor é enviado diretamente para a chave PIX informada.",
            Endpoint = "POST /pix/withdraw/direct",
            AmountFormat = "centavos",
            Fields =
            [
                new() { Name = "amount", Label = "Valor", Type = "number", Required = true, Description = "Valor do saque em centavos", Source = "payment", Example = "10000 (R$ 100,00)" },
                new() { Name = "txId", Label = "ID da Transação", Type = "string", Required = true, Description = "Identificador único da transação gerado pelo sistema", Source = "system", Example = "ADOUG086DGSH4534RWRGE66D304" },
                new() { Name = "pixKey", Label = "Chave PIX", Type = "string", Required = true, Description = "Chave PIX do destinatário (CPF, CNPJ, telefone ou EVP)", Source = "merchant", Example = "12345678901" },
                new() { Name = "document", Label = "Documento do Destinatário", Type = "string", Required = false, Description = "CPF/CNPJ do titular da conta destinatária", Source = "merchant" }
            ]
        }
    };

    private static AcquirerRequiredFieldsConfig GetIHubBankingConfig() => new()
    {
        Auth = new AcquirerAuthConfig
        {
            Method = "BasicAuth",
            Description = "Autenticação via Basic Auth com a secret key codificada em Base64.",
            Fields =
            [
                new() { Name = "apiSecret", Label = "Secret Key", Type = "string", Required = true, Description = "Chave secreta para autenticação Basic (secret:{SECRET_KEY} em Base64)", Source = "config" }
            ]
        },
        Pix = new AcquirerOperationConfig
        {
            Supported = true,
            Description = "Cria uma transação PIX com dados completos do cliente. Suporta PIX e Cartão de Crédito no mesmo endpoint.",
            Endpoint = "POST /transactions/v2/purchase",
            AmountFormat = "centavos",
            Fields =
            [
                new() { Name = "name", Label = "Nome do Cliente", Type = "string", Required = true, Description = "Nome completo do cliente", Source = "customer", Example = "João da Silva" },
                new() { Name = "email", Label = "E-mail", Type = "string", Required = true, Description = "E-mail do cliente para notificações", Source = "customer", Example = "joao@email.com" },
                new() { Name = "cpf", Label = "CPF", Type = "string", Required = true, Description = "CPF do cliente (apenas números, 11 dígitos)", Source = "customer", Example = "12345678901" },
                new() { Name = "phone", Label = "Telefone", Type = "string", Required = true, Description = "Telefone do cliente", Source = "customer", Example = "11999998888" },
                new() { Name = "amount", Label = "Valor", Type = "number", Required = true, Description = "Valor da cobrança em centavos", Source = "payment", Example = "10000 (R$ 100,00)" },
                new() { Name = "description", Label = "Descrição", Type = "string", Required = true, Description = "Descrição do pagamento", Source = "payment", Example = "Pagamento do pedido #123" },
                new() { Name = "responsibleDocument", Label = "Doc. do Responsável", Type = "string", Required = true, Description = "CPF/CNPJ do responsável pela transação", Source = "system" },
                new() { Name = "responsibleExternalId", Label = "ID Externo do Responsável", Type = "string", Required = true, Description = "Identificador externo do responsável", Source = "system" },
                new() { Name = "paymentMethod", Label = "Método de Pagamento", Type = "string", Required = true, Description = "Método: PIX ou CREDIT_CARD", Source = "system", Example = "PIX" },
                new() { Name = "currency", Label = "Moeda", Type = "string", Required = false, Description = "Moeda da transação", Source = "system", Example = "BRL" },
                new() { Name = "externalId", Label = "ID Externo", Type = "string", Required = false, Description = "Identificador da transação no sistema externo", Source = "system" },
                new() { Name = "postbackUrl", Label = "URL de Webhook", Type = "string", Required = false, Description = "URL para receber notificações de atualização", Source = "system" }
            ]
        },
        Boleto = null,
        CreditCard = null,
        Withdrawal = new AcquirerOperationConfig
        {
            Supported = true,
            Description = "Saque por chave PIX. O tipo da chave é detectado automaticamente pelo formato.",
            Endpoint = "POST /withdraws/cash-out",
            AmountFormat = "centavos",
            Fields =
            [
                new() { Name = "amount", Label = "Valor", Type = "number", Required = true, Description = "Valor do saque em centavos", Source = "payment", Example = "10000 (R$ 100,00)" },
                new() { Name = "pixKey", Label = "Chave PIX", Type = "string", Required = true, Description = "Chave PIX do destinatário", Source = "merchant", Example = "12345678901" },
                new() { Name = "pixType", Label = "Tipo da Chave PIX", Type = "string", Required = true, Description = "Tipo da chave: CPF, CNPJ, PHONE, EMAIL ou RANDOM", Source = "system", Example = "CPF" },
                new() { Name = "document", Label = "Documento", Type = "string", Required = false, Description = "Documento do destinatário", Source = "merchant" },
                new() { Name = "externalId", Label = "ID Externo", Type = "string", Required = false, Description = "Identificador externo do saque", Source = "system" },
                new() { Name = "postbackUrl", Label = "URL de Webhook", Type = "string", Required = false, Description = "URL para receber notificações de status", Source = "system" }
            ]
        }
    };

    private static AcquirerRequiredFieldsConfig GetActivePaymentsConfig() => new()
    {
        Auth = new AcquirerAuthConfig
        {
            Method = "ApiKey",
            Description = "Autenticação via API Key no header Authorization. Formato: ApiKey PUBLIC_KEY:SECRET_KEY",
            Fields =
            [
                new() { Name = "apiKey", Label = "Public Key", Type = "string", Required = true, Description = "Chave pública da API (PUBLIC_KEY)", Source = "config" },
                new() { Name = "apiSecret", Label = "Secret Key", Type = "string", Required = true, Description = "Chave secreta da API (SECRET_KEY)", Source = "config" }
            ]
        },
        Pix = new AcquirerOperationConfig
        {
            Supported = true,
            Description = "Cria uma cobrança PIX com dados do cliente. O valor é enviado em reais (decimal).",
            Endpoint = "POST /v1/charges",
            AmountFormat = "reais",
            Fields =
            [
                new() { Name = "amount", Label = "Valor", Type = "number", Required = true, Description = "Valor da cobrança em reais (decimal)", Source = "payment", Example = "150.50" },
                new() { Name = "customerName", Label = "Nome do Cliente", Type = "string", Required = true, Description = "Nome completo do cliente (3-100 caracteres)", Source = "customer", Example = "João da Silva" },
                new() { Name = "customerCpf", Label = "CPF do Cliente", Type = "string", Required = true, Description = "CPF do cliente (apenas números, sem pontuação)", Source = "customer", Example = "12345678901" },
                new() { Name = "customerEmail", Label = "E-mail do Cliente", Type = "string", Required = false, Description = "E-mail para notificações", Source = "customer", Example = "joao@email.com" },
                new() { Name = "customerPhone", Label = "Telefone do Cliente", Type = "string", Required = false, Description = "Telefone do cliente", Source = "customer", Example = "11999998888" },
                new() { Name = "expirationMinutes", Label = "Expiração (minutos)", Type = "number", Required = false, Description = "Tempo de expiração do QR Code em minutos (5-1440, padrão: 30)", Source = "system", Example = "30" },
                new() { Name = "externalReference", Label = "Referência Externa", Type = "string", Required = false, Description = "Identificador externo para referência no seu sistema", Source = "system", Example = "ORDER-12345" },
                new() { Name = "additionalInfo", Label = "Info Adicional", Type = "string", Required = false, Description = "Informação adicional no comprovante PIX (máx. 140 caracteres)", Source = "payment" },
                new() { Name = "postbackUrl", Label = "URL de Webhook", Type = "string", Required = false, Description = "URL de callback para notificação de pagamento", Source = "system" }
            ]
        },
        Boleto = new AcquirerOperationConfig
        {
            Supported = true,
            Description = "Gera boleto bancário com dados completos do pagador incluindo endereço. O valor é enviado em reais.",
            Endpoint = "POST /v1/charges/billet",
            AmountFormat = "reais",
            Fields =
            [
                new() { Name = "amount", Label = "Valor", Type = "number", Required = true, Description = "Valor do boleto em reais (mínimo R$ 5,00)", Source = "payment", Example = "150.00" },
                new() { Name = "customerName", Label = "Nome do Pagador", Type = "string", Required = true, Description = "Nome completo do pagador", Source = "customer", Example = "João Silva" },
                new() { Name = "customerCpf", Label = "CPF/CNPJ do Pagador", Type = "string", Required = true, Description = "CPF ou CNPJ do pagador (apenas números)", Source = "customer", Example = "12345678900" },
                new() { Name = "customerEmail", Label = "E-mail do Pagador", Type = "string", Required = true, Description = "E-mail do pagador", Source = "customer", Example = "joao@email.com" },
                new() { Name = "dueDate", Label = "Data de Vencimento", Type = "date", Required = true, Description = "Data de vencimento do boleto (formato: YYYY-MM-DD)", Source = "payment", Example = "2026-01-31" },
                new() { Name = "description", Label = "Descrição", Type = "string", Required = false, Description = "Descrição do pagamento (aparece no boleto)", Source = "payment" },
                new() { Name = "street", Label = "Rua", Type = "string", Required = true, Description = "Rua do endereço do pagador", Source = "customer", Example = "Rua das Flores" },
                new() { Name = "number", Label = "Número", Type = "string", Required = true, Description = "Número do endereço", Source = "customer", Example = "123" },
                new() { Name = "complement", Label = "Complemento", Type = "string", Required = false, Description = "Complemento (apto, sala, etc.)", Source = "customer" },
                new() { Name = "district", Label = "Bairro", Type = "string", Required = true, Description = "Bairro do endereço", Source = "customer", Example = "Centro" },
                new() { Name = "city", Label = "Cidade", Type = "string", Required = true, Description = "Cidade", Source = "customer", Example = "São Paulo" },
                new() { Name = "state", Label = "Estado", Type = "string", Required = true, Description = "Estado (sigla de 2 letras)", Source = "customer", Example = "SP" },
                new() { Name = "zipCode", Label = "CEP", Type = "string", Required = true, Description = "CEP (8 dígitos, apenas números)", Source = "customer", Example = "01234567" },
                new() { Name = "externalReference", Label = "Referência Externa", Type = "string", Required = false, Description = "Identificador externo para referência", Source = "system" },
                new() { Name = "postbackUrl", Label = "URL de Webhook", Type = "string", Required = false, Description = "URL de callback para notificação de pagamento", Source = "system" }
            ]
        },
        CreditCard = null,
        Withdrawal = new AcquirerOperationConfig
        {
            Supported = true,
            Description = "Solicita saque PIX para chave informada. Requer IP whitelistado. O valor é enviado em reais.",
            Endpoint = "POST /v1/withdrawals",
            AmountFormat = "reais",
            Fields =
            [
                new() { Name = "amount", Label = "Valor", Type = "number", Required = true, Description = "Valor do saque em reais (mínimo R$ 10,00, máximo R$ 50.000)", Source = "payment", Example = "100.00" },
                new() { Name = "pixKeyType", Label = "Tipo da Chave PIX", Type = "string", Required = true, Description = "Tipo da chave: cpf, cnpj, email, phone, evp ou random", Source = "system", Example = "email" },
                new() { Name = "pixKey", Label = "Chave PIX", Type = "string", Required = true, Description = "Chave PIX do destinatário (8-100 caracteres)", Source = "merchant", Example = "destinatario@email.com" },
                new() { Name = "description", Label = "Descrição", Type = "string", Required = false, Description = "Descrição do saque (máx. 140 caracteres)", Source = "payment" },
                new() { Name = "externalReference", Label = "Referência Externa", Type = "string", Required = false, Description = "Referência externa para identificação", Source = "system" },
                new() { Name = "postbackUrl", Label = "URL de Webhook", Type = "string", Required = false, Description = "URL para notificações de status do saque", Source = "system" }
            ]
        }
    };

    private static AcquirerRequiredFieldsConfig GetRapdynConfig() => new()
    {
        Auth = new AcquirerAuthConfig
        {
            Method = "Bearer",
            Description = "Autenticacao via token Bearer no header Authorization.",
            Fields =
            [
                new() { Name = "apiSecret", Label = "Access Token", Type = "string", Required = true, Description = "Token de acesso Rapdyn", Source = "config" }
            ]
        },
        Pix = new AcquirerOperationConfig
        {
            Supported = true,
            Description = "Cria uma transacao PIX com dados do cliente e itens.",
            Endpoint = "POST /payments",
            AmountFormat = "centavos",
            Fields =
            [
                new() { Name = "amount", Label = "Valor", Type = "number", Required = true, Description = "Valor da cobranca em centavos", Source = "payment", Example = "10000 (R$ 100,00)" },
                new() { Name = "method", Label = "Metodo", Type = "string", Required = true, Description = "Metodo de pagamento (pix)", Source = "system", Example = "pix" },
                new() { Name = "external_id", Label = "ID Externo", Type = "string", Required = false, Description = "Identificador externo da transacao", Source = "system" },
                new() { Name = "customer.name", Label = "Nome do Cliente", Type = "string", Required = true, Description = "Nome completo do cliente", Source = "customer" },
                new() { Name = "customer.email", Label = "Email do Cliente", Type = "string", Required = true, Description = "Email do cliente", Source = "customer" },
                new() { Name = "customer.phone", Label = "Telefone", Type = "string", Required = true, Description = "Telefone do cliente", Source = "customer" },
                new() { Name = "customer.document.type", Label = "Tipo de Documento", Type = "string", Required = true, Description = "CPF ou CNPJ", Source = "customer" },
                new() { Name = "customer.document.value", Label = "Documento", Type = "string", Required = true, Description = "Documento do cliente", Source = "customer" },
                new() { Name = "delivery.street", Label = "Rua", Type = "string", Required = true, Description = "Rua de entrega (default configurado na adquirente)", Source = "config" },
                new() { Name = "delivery.number", Label = "Numero", Type = "string", Required = true, Description = "Numero de entrega (default configurado na adquirente)", Source = "config" },
                new() { Name = "delivery.neighborhood", Label = "Bairro", Type = "string", Required = true, Description = "Bairro de entrega (default configurado na adquirente)", Source = "config" },
                new() { Name = "delivery.city", Label = "Cidade", Type = "string", Required = true, Description = "Cidade de entrega (default configurado na adquirente)", Source = "config" },
                new() { Name = "delivery.state", Label = "Estado", Type = "string", Required = true, Description = "Estado de entrega (sigla)", Source = "config" },
                new() { Name = "delivery.zipcode", Label = "CEP", Type = "string", Required = true, Description = "CEP de entrega", Source = "config" },
                new() { Name = "products[0].name", Label = "Produto", Type = "string", Required = true, Description = "Produto principal da cobranca", Source = "system" },
                new() { Name = "products[0].price", Label = "Preco", Type = "number", Required = true, Description = "Preco do produto em centavos", Source = "system" },
                new() { Name = "products[0].quantity", Label = "Quantidade", Type = "string", Required = true, Description = "Quantidade do produto", Source = "system" },
                new() { Name = "products[0].type", Label = "Tipo", Type = "string", Required = true, Description = "Tipo do produto (digital ou physical)", Source = "system" }
            ]
        },
        Boleto = null,
        CreditCard = null,
        Withdrawal = new AcquirerOperationConfig
        {
            Supported = true,
            Description = "Solicita transferencia PIX para chave informada.",
            Endpoint = "POST /transfers/out",
            AmountFormat = "centavos",
            Fields =
            [
                new() { Name = "pix_key_type", Label = "Tipo da Chave", Type = "string", Required = true, Description = "cpf, cnpj, email, phone ou randomkey", Source = "system" },
                new() { Name = "pix_key", Label = "Chave PIX", Type = "string", Required = true, Description = "Chave PIX do destinatario", Source = "merchant" },
                new() { Name = "value", Label = "Valor", Type = "number", Required = true, Description = "Valor do saque em centavos", Source = "payment", Example = "500 (R$ 5,00)" }
            ]
        }
    };

    private static AcquirerRequiredFieldsConfig GetColdfyConfig() => new()
    {
        Auth = new AcquirerAuthConfig
        {
            Method = "BasicAuth",
            Description = "Autenticacao Basic com Secret Key (username) e Company ID (password).",
            Fields =
            [
                new() { Name = "apiKey", Label = "Secret Key", Type = "string", Required = true, Description = "Secret Key fornecida pela Coldfy", Source = "config" },
                new() { Name = "apiSecret", Label = "Company ID", Type = "string", Required = true, Description = "Company ID fornecido pela Coldfy", Source = "config" }
            ]
        },
        Pix = new AcquirerOperationConfig
        {
            Supported = true,
            Description = "Cria pagamento PIX via POST /transactions com dados completos do cliente.",
            Endpoint = "POST /transactions",
            AmountFormat = "centavos",
            Fields =
            [
                new() { Name = "customer.name", Label = "Nome do Cliente", Type = "string", Required = true, Description = "Nome completo do cliente", Source = "customer" },
                new() { Name = "customer.email", Label = "E-mail", Type = "string", Required = true, Description = "E-mail do cliente", Source = "customer" },
                new() { Name = "customer.phone", Label = "Telefone", Type = "string", Required = true, Description = "Telefone do cliente (10-11 digitos)", Source = "customer" },
                new() { Name = "customer.document.type", Label = "Tipo do Documento", Type = "string", Required = true, Description = "CPF ou CNPJ", Source = "customer" },
                new() { Name = "customer.document.number", Label = "Documento", Type = "string", Required = true, Description = "Documento do cliente", Source = "customer" },
                new() { Name = "paymentMethod", Label = "Metodo", Type = "string", Required = true, Description = "PIX", Source = "system", Example = "PIX" },
                new() { Name = "amount", Label = "Valor", Type = "number", Required = true, Description = "Valor da cobranca em centavos", Source = "payment", Example = "10000 (R$ 100,00)" },
                new() { Name = "items[0].title", Label = "Produto", Type = "string", Required = true, Description = "Descricao do item principal", Source = "system" },
                new() { Name = "items[0].unitPrice", Label = "Preco", Type = "number", Required = true, Description = "Preco do item em centavos", Source = "system" },
                new() { Name = "items[0].quantity", Label = "Quantidade", Type = "number", Required = true, Description = "Quantidade do item", Source = "system" },
                new() { Name = "pix.expiresInDays", Label = "Expiracao (dias)", Type = "number", Required = true, Description = "Validade do PIX em dias", Source = "system" },
                new() { Name = "postbackUrl", Label = "URL de Webhook", Type = "string", Required = false, Description = "URL de callback para notificacoes", Source = "system" }
            ]
        },
        Boleto = new AcquirerOperationConfig
        {
            Supported = true,
            Description = "Cria boleto via POST /transactions com dados completos do cliente.",
            Endpoint = "POST /transactions",
            AmountFormat = "centavos",
            Fields =
            [
                new() { Name = "customer.name", Label = "Nome do Cliente", Type = "string", Required = true, Description = "Nome completo do cliente", Source = "customer" },
                new() { Name = "customer.email", Label = "E-mail", Type = "string", Required = true, Description = "E-mail do cliente", Source = "customer" },
                new() { Name = "customer.phone", Label = "Telefone", Type = "string", Required = true, Description = "Telefone do cliente (10-11 digitos)", Source = "customer" },
                new() { Name = "customer.document.type", Label = "Tipo do Documento", Type = "string", Required = true, Description = "CPF ou CNPJ", Source = "customer" },
                new() { Name = "customer.document.number", Label = "Documento", Type = "string", Required = true, Description = "Documento do cliente", Source = "customer" },
                new() { Name = "paymentMethod", Label = "Metodo", Type = "string", Required = true, Description = "BOLETO", Source = "system", Example = "BOLETO" },
                new() { Name = "amount", Label = "Valor", Type = "number", Required = true, Description = "Valor do boleto em centavos", Source = "payment", Example = "10000 (R$ 100,00)" },
                new() { Name = "items[0].title", Label = "Produto", Type = "string", Required = true, Description = "Descricao do item principal", Source = "system" },
                new() { Name = "items[0].unitPrice", Label = "Preco", Type = "number", Required = true, Description = "Preco do item em centavos", Source = "system" },
                new() { Name = "items[0].quantity", Label = "Quantidade", Type = "number", Required = true, Description = "Quantidade do item", Source = "system" },
                new() { Name = "boleto.expiresInDays", Label = "Vencimento (dias)", Type = "number", Required = true, Description = "Dias para vencimento do boleto", Source = "system" },
                new() { Name = "postbackUrl", Label = "URL de Webhook", Type = "string", Required = false, Description = "URL de callback para notificacoes", Source = "system" }
            ]
        },
        CreditCard = null,
        Withdrawal = new AcquirerOperationConfig
        {
            Supported = true,
            Description = "Solicita saque PIX via POST /withdrawals/cashout.",
            Endpoint = "POST /withdrawals/cashout",
            AmountFormat = "centavos",
            Fields =
            [
                new() { Name = "pixkeytype", Label = "Tipo da Chave PIX", Type = "string", Required = true, Description = "cpf, cnpj, email, phone ou evp", Source = "system" },
                new() { Name = "pixkey", Label = "Chave PIX", Type = "string", Required = true, Description = "Chave PIX do destinatario", Source = "merchant" },
                new() { Name = "requestedamount", Label = "Valor", Type = "number", Required = true, Description = "Valor do saque em centavos", Source = "payment", Example = "10000 (R$ 100,00)" },
                new() { Name = "description", Label = "Descricao", Type = "string", Required = true, Description = "Descricao do saque", Source = "payment" },
                new() { Name = "isPix", Label = "Wallet PIX", Type = "boolean", Required = true, Description = "true para saque PIX", Source = "system" },
                new() { Name = "postbackUrl", Label = "URL de Webhook", Type = "string", Required = false, Description = "URL para notificacoes", Source = "system" },
                new() { Name = "Idempotency-Key", Label = "Idempotency Key", Type = "string", Required = true, Description = "Chave de idempotencia no header", Source = "system" }
            ]
        }
    };

    private static AcquirerRequiredFieldsConfig GetPluggouConfig() => new()
    {
        Auth = new AcquirerAuthConfig
        {
            Method = "ApiHeaders",
            Description = "Autenticacao via headers X-Public-Key e X-Secret-Key.",
            Fields =
            [
                new() { Name = "apiKey", Label = "Public Key", Type = "string", Required = true, Description = "Chave publica da Pluggou", Source = "config" },
                new() { Name = "apiSecret", Label = "Secret Key", Type = "string", Required = true, Description = "Chave secreta da Pluggou", Source = "config" }
            ]
        },
        Pix = new AcquirerOperationConfig
        {
            Supported = true,
            Description = "Cria uma cobranca PIX e retorna EMV copia e cola.",
            Endpoint = "POST /transactions",
            AmountFormat = "centavos",
            Fields =
            [
                new() { Name = "payment_method", Label = "Metodo", Type = "string", Required = true, Description = "Metodo de pagamento (pix)", Source = "system", Example = "pix" },
                new() { Name = "amount", Label = "Valor", Type = "number", Required = true, Description = "Valor da cobranca em centavos", Source = "payment", Example = "10000 (R$ 100,00)" },
                new() { Name = "buyer.buyer_name", Label = "Nome do Comprador", Type = "string", Required = true, Description = "Nome completo do comprador", Source = "customer" },
                new() { Name = "buyer.buyer_document", Label = "Documento", Type = "string", Required = true, Description = "CPF ou CNPJ do comprador", Source = "customer" },
                new() { Name = "buyer.buyer_phone", Label = "Telefone", Type = "string", Required = true, Description = "Telefone do comprador", Source = "customer" },
                new() { Name = "buyer.buyer_email", Label = "Email", Type = "string", Required = false, Description = "Email do comprador", Source = "customer" }
            ]
        },
        Boleto = null,
        CreditCard = null,
        Withdrawal = new AcquirerOperationConfig
        {
            Supported = true,
            Description = "Solicita saque via PIX para chave informada.",
            Endpoint = "POST /withdrawals",
            AmountFormat = "centavos",
            Fields =
            [
                new() { Name = "amount", Label = "Valor", Type = "number", Required = true, Description = "Valor do saque em centavos", Source = "payment", Example = "50000 (R$ 500,00)" },
                new() { Name = "key_type", Label = "Tipo da Chave", Type = "string", Required = true, Description = "cpf, cnpj, email, phone ou random", Source = "system", Example = "cpf" },
                new() { Name = "key_value", Label = "Chave PIX", Type = "string", Required = true, Description = "Chave PIX do destinatario", Source = "merchant" }
            ]
        }
    };

    private static AcquirerRequiredFieldsConfig GetHunterPayConfig() => new()
    {
        Auth = new AcquirerAuthConfig
        {
            Method = "BasicAuth",
            Description = "Autenticacao via Basic Auth usando a API Key como username e password vazio, com suporte opcional a Company ID no password quando exigido pelo endpoint de saque.",
            Fields =
            [
                new() { Name = "apiKey", Label = "API Key", Type = "string", Required = true, Description = "Chave secreta da HunterPay enviada no header Authorization em Basic Auth", Source = "config" },
                new() { Name = "companyId", Label = "Company ID", Type = "string", Required = false, Description = "Identificador da empresa usado como password no Basic Auth para saque, quando exigido", Source = "config" }
            ]
        },
        Pix = new AcquirerOperationConfig
        {
            Supported = true,
            Description = "Cria uma transacao PIX pela rota unificada de transacoes no contrato HunterSub.",
            Endpoint = "POST /transactions",
            AmountFormat = "centavos",
            Fields =
            [
                new() { Name = "paymentMethod", Label = "Metodo", Type = "string", Required = true, Description = "Metodo da transacao", Source = "system", Example = "PIX" },
                new() { Name = "amount", Label = "Valor", Type = "number", Required = true, Description = "Valor da cobranca em centavos", Source = "payment", Example = "10000 (R$ 100,00)" },
                new() { Name = "customer.name", Label = "Nome do Cliente", Type = "string", Required = true, Description = "Nome completo do cliente", Source = "customer" },
                new() { Name = "customer.email", Label = "E-mail", Type = "string", Required = true, Description = "E-mail do cliente", Source = "customer" },
                new() { Name = "customer.phone", Label = "Telefone", Type = "string", Required = true, Description = "Telefone do cliente", Source = "customer" },
                new() { Name = "customer.document.type", Label = "Tipo do Documento", Type = "string", Required = false, Description = "Tipo do documento do cliente (CPF ou CNPJ)", Source = "system", Example = "CPF" },
                new() { Name = "customer.document.number", Label = "Documento", Type = "string", Required = true, Description = "CPF ou CNPJ do cliente (apenas numeros)", Source = "customer" },
                new() { Name = "items[0].title", Label = "Descricao do Item", Type = "string", Required = true, Description = "Descricao do item principal da transacao", Source = "system" },
                new() { Name = "items[0].unitPrice", Label = "Preco Unitario", Type = "number", Required = true, Description = "Preco unitario em centavos", Source = "system", Example = "10000 (R$ 100,00)" },
                new() { Name = "items[0].quantity", Label = "Quantidade", Type = "number", Required = true, Description = "Quantidade do item", Source = "system", Example = "1" },
                new() { Name = "postbackUrl", Label = "URL de Webhook", Type = "string", Required = false, Description = "URL para receber atualizacoes de status da transacao", Source = "system" },
                new() { Name = "metadata", Label = "Metadata", Type = "string", Required = false, Description = "String JSON com dados adicionais da transacao", Source = "system" },
                new() { Name = "description", Label = "Descricao", Type = "string", Required = false, Description = "Descricao da transacao", Source = "payment" },
                new() { Name = "pix.expiresInDays", Label = "Expiracao do PIX", Type = "number", Required = true, Description = "Quantidade de dias para expiracao do PIX (1 a 7)", Source = "system", Example = "1" }
            ]
        },
        Boleto = null,
        CreditCard = null,
        Withdrawal = new AcquirerOperationConfig
        {
            Supported = true,
            Description = "Cria um saque PIX pela rota de cashout da HunterPay com notificacao opcional via postbackUrl.",
            Endpoint = "POST /withdrawals/cashout",
            AmountFormat = "centavos",
            Fields =
            [
                new() { Name = "pixkeytype", Label = "Tipo da Chave PIX", Type = "string", Required = true, Description = "Tipo da chave PIX: cpf, cnpj, email, phone ou evp", Source = "system", Example = "email" },
                new() { Name = "pixkey", Label = "Chave PIX", Type = "string", Required = true, Description = "Chave PIX de destino do saque", Source = "merchant" },
                new() { Name = "requestedamount", Label = "Valor", Type = "number", Required = true, Description = "Valor do saque em centavos", Source = "payment", Example = "50000 (R$ 500,00)" },
                new() { Name = "description", Label = "Descricao", Type = "string", Required = false, Description = "Descricao do saque enviada para a HunterPay", Source = "payment" },
                new() { Name = "isPix", Label = "Transferencia PIX", Type = "boolean", Required = true, Description = "Flag fixa para indicar saque PIX", Source = "system", Example = "true" },
                new() { Name = "postbackUrl", Label = "URL de Webhook", Type = "string", Required = false, Description = "URL para receber atualizacoes de status do saque", Source = "system" },
                new() { Name = "Idempotency-Key", Label = "Idempotency Key", Type = "string", Required = true, Description = "Header idempotente enviado com o identificador do saque na Safefy", Source = "system" }
            ]
        }
    };

    private static AcquirerRequiredFieldsConfig GetHeartPayConfig() => new()
    {
        Auth = new AcquirerAuthConfig
        {
            Method = "Bearer",
            Description = "Autenticacao via token Bearer no header Authorization.",
            Fields =
            [
                new() { Name = "apiKey", Label = "Bearer Token", Type = "string", Required = true, Description = "Token HeartPay com prefixo hpay_", Source = "config" }
            ]
        },
        Pix = new AcquirerOperationConfig
        {
            Supported = true,
            Description = "Cria cobranca PIX via endpoint de charges da HeartPay.",
            Endpoint = "POST /v1/client/charges",
            AmountFormat = "centavos",
            Fields =
            [
                new() { Name = "amount", Label = "Valor", Type = "number", Required = true, Description = "Valor da cobranca em centavos", Source = "payment", Example = "10000 (R$ 100,00)" },
                new() { Name = "name", Label = "Nome do Cliente", Type = "string", Required = true, Description = "Nome do pagador", Source = "customer" },
                new() { Name = "email", Label = "E-mail", Type = "string", Required = true, Description = "E-mail do pagador", Source = "customer" },
                new() { Name = "phone", Label = "Telefone", Type = "string", Required = true, Description = "Telefone do pagador", Source = "customer" },
                new() { Name = "document", Label = "Documento", Type = "string", Required = true, Description = "CPF ou CNPJ do pagador", Source = "customer" },
                new() { Name = "postbackUrl", Label = "URL de Webhook", Type = "string", Required = false, Description = "URL para notificacoes de status", Source = "system" }
            ]
        },
        Boleto = new AcquirerOperationConfig
        {
            Supported = true,
            Description = "Cria boleto via endpoint de boletos da HeartPay.",
            Endpoint = "POST /v1/client/boletos",
            AmountFormat = "centavos",
            Fields =
            [
                new() { Name = "amount", Label = "Valor", Type = "number", Required = true, Description = "Valor do boleto em centavos", Source = "payment", Example = "10000 (R$ 100,00)" },
                new() { Name = "name", Label = "Nome do Cliente", Type = "string", Required = true, Description = "Nome do pagador", Source = "customer" },
                new() { Name = "email", Label = "E-mail", Type = "string", Required = true, Description = "E-mail do pagador", Source = "customer" },
                new() { Name = "phone", Label = "Telefone", Type = "string", Required = true, Description = "Telefone do pagador", Source = "customer" },
                new() { Name = "document", Label = "Documento", Type = "string", Required = true, Description = "CPF ou CNPJ do pagador", Source = "customer" },
                new() { Name = "dueDate", Label = "Data de Vencimento", Type = "date", Required = true, Description = "Data de vencimento do boleto (YYYY-MM-DD)", Source = "payment", Example = "2026-01-31" },
                new() { Name = "postbackUrl", Label = "URL de Webhook", Type = "string", Required = false, Description = "URL para notificacoes de status", Source = "system" }
            ]
        },
        CreditCard = null,
        Withdrawal = new AcquirerOperationConfig
        {
            Supported = true,
            Description = "Cria saque PIX via endpoint de payouts da HeartPay.",
            Endpoint = "POST /v1/client/payouts",
            AmountFormat = "centavos",
            Fields =
            [
                new() { Name = "amount", Label = "Valor", Type = "number", Required = true, Description = "Valor do saque em centavos", Source = "payment", Example = "50000 (R$ 500,00)" },
                new() { Name = "pixKeyType", Label = "Tipo da Chave PIX", Type = "string", Required = true, Description = "cpf, cnpj, email, phone ou random", Source = "system" },
                new() { Name = "pixKey", Label = "Chave PIX", Type = "string", Required = true, Description = "Chave PIX de destino", Source = "merchant" },
                new() { Name = "name", Label = "Nome do Favorecido", Type = "string", Required = true, Description = "Nome do titular da chave", Source = "merchant" },
                new() { Name = "document", Label = "Documento do Favorecido", Type = "string", Required = true, Description = "CPF/CNPJ do titular da chave", Source = "merchant" },
                new() { Name = "postbackUrl", Label = "URL de Webhook", Type = "string", Required = false, Description = "URL para notificacoes de status", Source = "system" }
            ]
        }
    };

    private static AcquirerRequiredFieldsConfig GetAccithusConfig() => new()
    {
        Auth = new AcquirerAuthConfig
        {
            Method = "BasicAuth",
            Description = "Autenticacao via Basic Auth com publicKey:secretKey codificados em Base64.",
            Fields =
            [
                new() { Name = "publicKey", Label = "Public Key", Type = "string", Required = true, Description = "Chave publica fornecida pela Accithus", Source = "config" },
                new() { Name = "secretKey", Label = "Secret Key", Type = "string", Required = true, Description = "Chave secreta fornecida pela Accithus", Source = "config" }
            ]
        },
        Pix = new AcquirerOperationConfig
        {
            Supported = true,
            Description = "Cria uma cobranca PIX via Accithus (IP). Suporta QR Code e Pix Copia e Cola.",
            Endpoint = "POST /v1/transactions",
            AmountFormat = "centavos",
            Fields =
            [
                new() { Name = "amount", Label = "Valor", Type = "number", Required = true, Description = "Valor da cobranca em centavos", Source = "payment", Example = "10000 (R$ 100,00)" },
                new() { Name = "paymentMethod", Label = "Metodo de Pagamento", Type = "string", Required = true, Description = "Metodo: pix", Source = "system", Example = "pix" },
                new() { Name = "customer.name", Label = "Nome do Cliente", Type = "string", Required = true, Description = "Nome completo do cliente", Source = "customer", Example = "Joao da Silva" },
                new() { Name = "customer.document", Label = "Documento do Cliente", Type = "string", Required = true, Description = "CPF ou CNPJ do cliente", Source = "customer", Example = "12345678901" },
                new() { Name = "customer.email", Label = "E-mail", Type = "string", Required = false, Description = "E-mail do cliente", Source = "customer" },
                new() { Name = "pix.expiresInMinutes", Label = "Expiracao PIX", Type = "number", Required = false, Description = "Tempo de expiracao do QR Code em minutos", Source = "system", Example = "30" },
                new() { Name = "callbackUrl", Label = "URL de Webhook", Type = "string", Required = false, Description = "URL para receber notificacoes de pagamento", Source = "system" }
            ]
        },
        Boleto = new AcquirerOperationConfig
        {
            Supported = true,
            Description = "Cria uma cobranca via Boleto na Accithus (IP). Vencimento minimo D+2.",
            Endpoint = "POST /v1/transactions",
            AmountFormat = "centavos",
            Fields =
            [
                new() { Name = "amount", Label = "Valor", Type = "number", Required = true, Description = "Valor da cobranca em centavos", Source = "payment", Example = "10000 (R$ 100,00)" },
                new() { Name = "paymentMethod", Label = "Metodo de Pagamento", Type = "string", Required = true, Description = "Metodo: boleto", Source = "system", Example = "boleto" },
                new() { Name = "customer.name", Label = "Nome do Cliente", Type = "string", Required = true, Description = "Nome completo do cliente", Source = "customer" },
                new() { Name = "customer.document", Label = "Documento do Cliente", Type = "string", Required = true, Description = "CPF ou CNPJ do cliente", Source = "customer" },
                new() { Name = "boleto.dueDate", Label = "Data de Vencimento", Type = "string", Required = true, Description = "Data de vencimento do boleto (YYYY-MM-DD, minimo D+2)", Source = "payment", Example = "2025-02-01" },
                new() { Name = "callbackUrl", Label = "URL de Webhook", Type = "string", Required = false, Description = "URL para receber notificacoes", Source = "system" }
            ]
        },
        CreditCard = new AcquirerOperationConfig
        {
            Supported = true,
            Description = "Cria uma cobranca via Cartao de Credito na Accithus (IP). Suporta parcelas.",
            Endpoint = "POST /v1/transactions",
            AmountFormat = "centavos",
            Fields =
            [
                new() { Name = "amount", Label = "Valor", Type = "number", Required = true, Description = "Valor da cobranca em centavos", Source = "payment", Example = "10000 (R$ 100,00)" },
                new() { Name = "paymentMethod", Label = "Metodo de Pagamento", Type = "string", Required = true, Description = "Metodo: credit_card", Source = "system", Example = "credit_card" },
                new() { Name = "customer.name", Label = "Nome do Cliente", Type = "string", Required = true, Description = "Nome completo do titular do cartao", Source = "customer" },
                new() { Name = "customer.document", Label = "Documento do Cliente", Type = "string", Required = true, Description = "CPF ou CNPJ do titular", Source = "customer" },
                new() { Name = "creditCard.number", Label = "Numero do Cartao", Type = "string", Required = true, Description = "Numero do cartao de credito", Source = "payment" },
                new() { Name = "creditCard.holderName", Label = "Nome no Cartao", Type = "string", Required = true, Description = "Nome impresso no cartao", Source = "payment" },
                new() { Name = "creditCard.expirationMonth", Label = "Mes de Validade", Type = "number", Required = true, Description = "Mes de validade (1-12)", Source = "payment" },
                new() { Name = "creditCard.expirationYear", Label = "Ano de Validade", Type = "number", Required = true, Description = "Ano de validade (4 digitos)", Source = "payment" },
                new() { Name = "creditCard.cvv", Label = "CVV", Type = "string", Required = true, Description = "Codigo de seguranca do cartao", Source = "payment" },
                new() { Name = "creditCard.installments", Label = "Parcelas", Type = "number", Required = false, Description = "Numero de parcelas (1-12)", Source = "payment", Example = "1" },
                new() { Name = "callbackUrl", Label = "URL de Webhook", Type = "string", Required = false, Description = "URL para receber notificacoes", Source = "system" }
            ]
        },
        Withdrawal = new AcquirerOperationConfig
        {
            Supported = true,
            Description = "Saque (PIX Out) via Accithus. Envia o valor para a chave PIX informada.",
            Endpoint = "POST /v1/withdrawals",
            AmountFormat = "centavos",
            Fields =
            [
                new() { Name = "amount", Label = "Valor", Type = "number", Required = true, Description = "Valor do saque em centavos", Source = "payment", Example = "10000 (R$ 100,00)" },
                new() { Name = "pixKey", Label = "Chave PIX", Type = "string", Required = true, Description = "Chave PIX do destinatario", Source = "merchant" },
                new() { Name = "pixKeyType", Label = "Tipo de Chave PIX", Type = "string", Required = true, Description = "Tipo: cpf, cnpj, email, phone, evp", Source = "merchant" },
                new() { Name = "description", Label = "Descricao", Type = "string", Required = false, Description = "Descricao do saque", Source = "payment" },
                new() { Name = "callbackUrl", Label = "URL de Webhook", Type = "string", Required = false, Description = "URL para receber notificacoes de status", Source = "system" }
            ]
        }
    };
}
