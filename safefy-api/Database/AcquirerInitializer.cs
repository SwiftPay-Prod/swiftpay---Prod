using safefy_api_core.Constants;
using safefy_api_core.Database;
using safefy_api_core.Models.Acquirer;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api.Database;

public static class AcquirerInitializer
{
    public static void InitializeAcquirers(PrimaryDbContext context)
    {
        if (!context.Acquirers.Any(a => a.Id == SystemAcquirerIds.Bankizi))
        {
            var metadata = AcquirerDefaultsConstants.GetMetadata(AcquirerType.Bankizi);

            var bankiziSchema = CredentialUtils.BuildSchema(
                ("clientId", "Client ID", CredentialFieldType.Text, true, "Ex: ecc9832b-a4e9-4509-8108-...", "ID do cliente OAuth2 fornecido pela Bankizi"),
                ("clientSecret", "Client Secret", CredentialFieldType.Password, true, "Ex: 285d15e0-17e7-4e47-b264-...", "Senha secreta OAuth2 fornecida pela Bankizi")
            );

            var bankizi = new Acquirer
            {
                Id = SystemAcquirerIds.Bankizi,
                Name = "Bankizi",
                Code = "bankizi",
                Description = metadata.Description,
                Type = AcquirerType.Bankizi,
                IsActive = false,
                ApiBaseUrl = metadata.ApiBaseUrlProduction,
                ApiBaseUrlProduction = metadata.ApiBaseUrlProduction,
                ApiBaseUrlSandbox = metadata.ApiBaseUrlSandbox,
                AuthType = "client_credentials",
                CredentialSchema = bankiziSchema,
                DefaultCredentials = null,
                DefaultCredentialsSandbox = null,
                SupportsPix = true,
                SupportsBoleto = false,
                SupportsCreditCard = false,
                SupportsWithdrawal = true,
                SupportsRefund = true,
                WebhookAuthMode = metadata.WebhookAuthMode,
                WebhookToken = null,
                WebhookAllowedIps = "",
                DocumentationUrl = metadata.DocumentationUrl,
                WebhookDocumentationUrl = metadata.WebhookDocumentationUrl
            };

            context.Acquirers.Add(bankizi);
        }

        if (!context.Acquirers.Any(a => a.Id == SystemAcquirerIds.IHubBanking))
        {
            var metadata = AcquirerDefaultsConstants.GetMetadata(AcquirerType.IHubBanking);

            var ihubSchema = CredentialUtils.BuildSchema(
                ("secretKey", "Secret Key", CredentialFieldType.Password, true, "Ex: 80196777-a77a-43d6-9d89-...", "Chave secreta fornecida pela IHub Banking")
            );

            var ihubBanking = new Acquirer
            {
                Id = SystemAcquirerIds.IHubBanking,
                Name = "IHub Banking",
                Code = "ihubbanking",
                Description = metadata.Description,
                Type = AcquirerType.IHubBanking,
                IsActive = false,
                ApiBaseUrl = metadata.ApiBaseUrlProduction,
                ApiBaseUrlProduction = metadata.ApiBaseUrlProduction,
                ApiBaseUrlSandbox = metadata.ApiBaseUrlSandbox,
                AuthType = "basic_auth",
                CredentialSchema = ihubSchema,
                DefaultCredentials = null,
                DefaultCredentialsSandbox = null,
                SupportsPix = true,
                SupportsBoleto = false,
                SupportsCreditCard = false,
                SupportsWithdrawal = true,
                SupportsRefund = true,
                WebhookAuthMode = metadata.WebhookAuthMode,
                WebhookToken = null,
                WebhookAllowedIps = "",
                DocumentationUrl = metadata.DocumentationUrl,
                WebhookDocumentationUrl = metadata.WebhookDocumentationUrl
            };

            context.Acquirers.Add(ihubBanking);
        }

        if (!context.Acquirers.Any(a => a.Id == SystemAcquirerIds.ActivePayments))
        {
            var metadata = AcquirerDefaultsConstants.GetMetadata(AcquirerType.ActivePayments);

            var activeSchema = CredentialUtils.BuildSchema(
                ("publicKey", "Public Key", CredentialFieldType.Text, true, "Ex: ActivePayments_pk_...", "Chave publica fornecida pela ActivePayments"),
                ("secretKey", "Secret Key", CredentialFieldType.Password, true, "Ex: ActivePayments_sk_...", "Chave secreta fornecida pela ActivePayments"),
                ("withdrawalSecret", "Withdrawal Secret", CredentialFieldType.Password, false, "Ex: wdl_sec_...", "Secret para autorizar saques via header x-withdrawal-secret (opcional, substitui necessidade de IP fixo)")
            );

            var activePayments = new Acquirer
            {
                Id = SystemAcquirerIds.ActivePayments,
                Name = "ActivePayments",
                Code = "activepayments",
                Description = metadata.Description,
                Type = AcquirerType.ActivePayments,
                OperationTypes = [AcquirerOperationType.White, AcquirerOperationType.Black],
                IsActive = false,
                ApiBaseUrl = metadata.ApiBaseUrlProduction,
                ApiBaseUrlProduction = metadata.ApiBaseUrlProduction,
                ApiBaseUrlSandbox = metadata.ApiBaseUrlSandbox,
                AuthType = "api_key",
                CredentialSchema = activeSchema,
                DefaultCredentials = null,
                DefaultCredentialsSandbox = null,
                SupportsPix = true,
                SupportsBoleto = true,
                SupportsCreditCard = false,
                SupportsWithdrawal = false,
                SupportsRefund = false,
                WebhookAuthMode = metadata.WebhookAuthMode,
                WebhookToken = null,
                WebhookAllowedIps = "",
                DocumentationUrl = metadata.DocumentationUrl,
                WebhookDocumentationUrl = metadata.WebhookDocumentationUrl
            };

            context.Acquirers.Add(activePayments);
        }

        if (!context.Acquirers.Any(a => a.Id == SystemAcquirerIds.Rapdyn))
        {
            var metadata = AcquirerDefaultsConstants.GetMetadata(AcquirerType.Rapdyn);

            var rapdynSchema = CredentialUtils.BuildSchema(
                ("token", "Token de Acesso", CredentialFieldType.Password, true, "Ex: eyJhbGciOiJIUzI1NiIs...", "Token Bearer fornecido pela Rapdyn")
            );

            var rapdyn = new Acquirer
            {
                Id = SystemAcquirerIds.Rapdyn,
                Name = "Rapdyn",
                Code = "rapdyn",
                Description = metadata.Description,
                Type = AcquirerType.Rapdyn,
                IsActive = false,
                ApiBaseUrl = metadata.ApiBaseUrlProduction,
                ApiBaseUrlProduction = metadata.ApiBaseUrlProduction,
                ApiBaseUrlSandbox = metadata.ApiBaseUrlSandbox,
                AuthType = "bearer",
                CredentialSchema = rapdynSchema,
                DefaultCredentials = null,
                DefaultCredentialsSandbox = null,
                SupportsPix = true,
                SupportsBoleto = false,
                SupportsCreditCard = false,
                SupportsWithdrawal = true,
                SupportsRefund = false,
                WebhookAuthMode = metadata.WebhookAuthMode,
                WebhookToken = null,
                WebhookAllowedIps = "",
                DocumentationUrl = metadata.DocumentationUrl,
                WebhookDocumentationUrl = metadata.WebhookDocumentationUrl
            };

            context.Acquirers.Add(rapdyn);
        }

        if (!context.Acquirers.Any(a => a.Id == SystemAcquirerIds.Coldfy))
        {
            var metadata = AcquirerDefaultsConstants.GetMetadata(AcquirerType.Coldfy);

            var coldfySchema = CredentialUtils.BuildSchema(
                ("secretKey", "Secret Key", CredentialFieldType.Password, true, "Ex: sk_live_...", "Chave secreta fornecida pela Coldfy"),
                ("companyId", "Company ID", CredentialFieldType.Text, true, "Ex: 12345", "ID da empresa na Coldfy")
            );

            var coldfy = new Acquirer
            {
                Id = SystemAcquirerIds.Coldfy,
                Name = "Coldfy",
                Code = "coldfy",
                Description = metadata.Description,
                Type = AcquirerType.Coldfy,
                IsActive = false,
                ApiBaseUrl = metadata.ApiBaseUrlProduction,
                ApiBaseUrlProduction = metadata.ApiBaseUrlProduction,
                ApiBaseUrlSandbox = metadata.ApiBaseUrlSandbox,
                AuthType = "basic_auth",
                CredentialSchema = coldfySchema,
                DefaultCredentials = null,
                DefaultCredentialsSandbox = null,
                SupportsPix = true,
                SupportsBoleto = true,
                SupportsCreditCard = false,
                SupportsWithdrawal = true,
                SupportsRefund = false,
                WebhookAuthMode = metadata.WebhookAuthMode,
                WebhookToken = null,
                WebhookAllowedIps = "",
                DocumentationUrl = metadata.DocumentationUrl,
                WebhookDocumentationUrl = metadata.WebhookDocumentationUrl
            };

            context.Acquirers.Add(coldfy);
        }

        if (!context.Acquirers.Any(a => a.Id == SystemAcquirerIds.Pluggou))
        {
            var metadata = AcquirerDefaultsConstants.GetMetadata(AcquirerType.Pluggou);

            var pluggouSchema = CredentialUtils.BuildSchema(
                ("publicKey", "Public Key", CredentialFieldType.Text, true, "Ex: pk_...", "Chave publica fornecida pela Pluggou"),
                ("secretKey", "Secret Key", CredentialFieldType.Password, true, "Ex: sk_...", "Chave secreta fornecida pela Pluggou")
            );

            var pluggou = new Acquirer
            {
                Id = SystemAcquirerIds.Pluggou,
                Name = "Pluggou",
                Code = "pluggou",
                Description = metadata.Description,
                Type = AcquirerType.Pluggou,
                IsActive = false,
                ApiBaseUrl = metadata.ApiBaseUrlProduction,
                ApiBaseUrlProduction = metadata.ApiBaseUrlProduction,
                ApiBaseUrlSandbox = metadata.ApiBaseUrlSandbox,
                AuthType = "api_headers",
                CredentialSchema = pluggouSchema,
                DefaultCredentials = null,
                DefaultCredentialsSandbox = null,
                SupportsPix = true,
                SupportsBoleto = false,
                SupportsCreditCard = false,
                SupportsWithdrawal = true,
                SupportsRefund = false,
                WebhookAuthMode = metadata.WebhookAuthMode,
                WebhookToken = null,
                WebhookAllowedIps = "",
                DocumentationUrl = metadata.DocumentationUrl,
                WebhookDocumentationUrl = metadata.WebhookDocumentationUrl
            };

            context.Acquirers.Add(pluggou);
        }

        if (!context.Acquirers.Any(a => a.Id == SystemAcquirerIds.HunterPay))
        {
            var metadata = AcquirerDefaultsConstants.GetMetadata(AcquirerType.HunterPay);

            var hunterPaySchema = CredentialUtils.BuildSchema(
                ("apiKey", "API Key", CredentialFieldType.Password, true, "Ex: hp_live_...", "API Key fornecida pela HunterPay"),
                ("companyId", "Company ID", CredentialFieldType.Text, false, "Ex: 12345", "Company ID da HunterPay usado como password no Basic Auth para saque, quando exigido")
            );

            var hunterPay = new Acquirer
            {
                Id = SystemAcquirerIds.HunterPay,
                Name = "HunterPay",
                Code = "hunterpay",
                Description = metadata.Description,
                Type = AcquirerType.HunterPay,
                IsActive = false,
                ApiBaseUrl = metadata.ApiBaseUrlProduction,
                ApiBaseUrlProduction = metadata.ApiBaseUrlProduction,
                ApiBaseUrlSandbox = metadata.ApiBaseUrlSandbox,
                AuthType = "basic_auth",
                CredentialSchema = hunterPaySchema,
                DefaultCredentials = null,
                DefaultCredentialsSandbox = null,
                SupportsPix = true,
                SupportsBoleto = false,
                SupportsCreditCard = false,
                SupportsWithdrawal = true,
                SupportsRefund = true,
                WebhookAuthMode = metadata.WebhookAuthMode,
                WebhookToken = null,
                WebhookAllowedIps = "",
                DocumentationUrl = metadata.DocumentationUrl,
                WebhookDocumentationUrl = metadata.WebhookDocumentationUrl
            };

            context.Acquirers.Add(hunterPay);
        }

        if (!context.Acquirers.Any(a => a.Id == SystemAcquirerIds.HeartPay))
        {
            var metadata = AcquirerDefaultsConstants.GetMetadata(AcquirerType.HeartPay);

            var heartPaySchema = CredentialUtils.BuildSchema(
                ("apiKey", "Bearer Token", CredentialFieldType.Password, true, "Ex: hpay_live_...", "Token Bearer fornecido pela HeartPay")
            );

            var heartPay = new Acquirer
            {
                Id = SystemAcquirerIds.HeartPay,
                Name = "HeartPay",
                Code = "heartpay",
                Description = metadata.Description,
                Type = AcquirerType.HeartPay,
                OperationTypes = [AcquirerOperationType.White, AcquirerOperationType.Black],
                IsActive = false,
                ApiBaseUrl = metadata.ApiBaseUrlProduction,
                ApiBaseUrlProduction = metadata.ApiBaseUrlProduction,
                ApiBaseUrlSandbox = metadata.ApiBaseUrlSandbox,
                AuthType = "bearer",
                CredentialSchema = heartPaySchema,
                DefaultCredentials = null,
                DefaultCredentialsSandbox = null,
                SupportsPix = true,
                SupportsBoleto = true,
                SupportsCreditCard = false,
                SupportsWithdrawal = true,
                SupportsRefund = false,
                WebhookAuthMode = metadata.WebhookAuthMode,
                WebhookToken = null,
                WebhookAllowedIps = "",
                DocumentationUrl = metadata.DocumentationUrl,
                WebhookDocumentationUrl = metadata.WebhookDocumentationUrl
            };

            context.Acquirers.Add(heartPay);
        }

        if (!context.Acquirers.Any(a => a.Id == SystemAcquirerIds.Accithus))
        {
            var metadata = AcquirerDefaultsConstants.GetMetadata(AcquirerType.Accithus);

            var accithusSchema = CredentialUtils.BuildSchema(
                ("publicKey", "Public Key", CredentialFieldType.Text, true, "Ex: pk_live_...", "Chave publica fornecida pela Accithus"),
                ("secretKey", "Secret Key", CredentialFieldType.Password, true, "Ex: sk_live_...", "Chave secreta fornecida pela Accithus")
            );

            var accithus = new Acquirer
            {
                Id = SystemAcquirerIds.Accithus,
                Name = "Accithus",
                Code = "accithus",
                Description = metadata.Description,
                Type = AcquirerType.Accithus,
                ProviderCategory = ProviderCategory.PaymentInstitution,
                OperationTypes = [AcquirerOperationType.White],
                IsActive = false,
                ApiBaseUrl = metadata.ApiBaseUrlProduction,
                ApiBaseUrlProduction = metadata.ApiBaseUrlProduction,
                ApiBaseUrlSandbox = metadata.ApiBaseUrlSandbox,
                AuthType = "basic_auth",
                CredentialSchema = accithusSchema,
                DefaultCredentials = null,
                DefaultCredentialsSandbox = null,
                SupportsPix = true,
                SupportsBoleto = true,
                SupportsCreditCard = true,
                SupportsWithdrawal = true,
                SupportsRefund = true,
                WebhookAuthMode = metadata.WebhookAuthMode,
                WebhookToken = null,
                WebhookAllowedIps = "",
                DocumentationUrl = metadata.DocumentationUrl,
                WebhookDocumentationUrl = metadata.WebhookDocumentationUrl
            };

            context.Acquirers.Add(accithus);
        }
    }

    public static void UpdateAcquirerCredentialSchemas(PrimaryDbContext context)
    {
        var acquirers = context.Acquirers
            .Where(a => a.CredentialSchema == null || a.CredentialSchema == "[]" || a.CredentialSchema == "")
            .ToList();

        foreach (var acquirer in acquirers)
        {
            var schema = acquirer.Type switch
            {
                AcquirerType.Bankizi => CredentialUtils.BuildSchema(
                    ("clientId", "Client ID", CredentialFieldType.Text, true, "Ex: cli_...", "Client ID fornecido pela Bankizi"),
                    ("clientSecret", "Client Secret", CredentialFieldType.Password, true, "Ex: sec_...", "Client Secret fornecido pela Bankizi")
                ),
                AcquirerType.IHubBanking => CredentialUtils.BuildSchema(
                    ("secretKey", "Secret Key", CredentialFieldType.Password, true, "Ex: sk_...", "Secret Key fornecida pelo IHub Banking")
                ),
                AcquirerType.ActivePayments => CredentialUtils.BuildSchema(
                    ("publicKey", "Public Key", CredentialFieldType.Text, true, "Ex: pk_...", "Chave publica fornecida pela ActivePayments"),
                    ("secretKey", "Secret Key", CredentialFieldType.Password, true, "Ex: sk_...", "Chave secreta fornecida pela ActivePayments"),
                    ("withdrawalSecret", "Withdrawal Secret", CredentialFieldType.Password, false, "Ex: wdl_sec_...", "Secret para autorizar saques via header x-withdrawal-secret (opcional, substitui necessidade de IP fixo)")
                ),
                AcquirerType.Rapdyn => CredentialUtils.BuildSchema(
                    ("token", "Token", CredentialFieldType.Password, true, "Ex: tok_...", "Token de autenticacao fornecido pela Rapdyn")
                ),
                AcquirerType.Coldfy => CredentialUtils.BuildSchema(
                    ("secretKey", "Secret Key", CredentialFieldType.Password, true, "Ex: sk_...", "Secret Key fornecida pela Coldfy"),
                    ("companyId", "Company ID", CredentialFieldType.Text, true, "Ex: 12345", "ID da empresa na Coldfy")
                ),
                AcquirerType.Pluggou => CredentialUtils.BuildSchema(
                    ("publicKey", "Public Key", CredentialFieldType.Text, true, "Ex: pk_...", "Chave publica fornecida pela Pluggou"),
                    ("secretKey", "Secret Key", CredentialFieldType.Password, true, "Ex: sk_...", "Chave secreta fornecida pela Pluggou")
                ),
                AcquirerType.HunterPay => CredentialUtils.BuildSchema(
                    ("apiKey", "API Key", CredentialFieldType.Password, true, "Ex: hp_live_...", "API Key fornecida pela HunterPay"),
                    ("companyId", "Company ID", CredentialFieldType.Text, false, "Ex: 12345", "Company ID da HunterPay usado como password no Basic Auth para saque, quando exigido")
                ),
                AcquirerType.HeartPay => CredentialUtils.BuildSchema(
                    ("apiKey", "Bearer Token", CredentialFieldType.Password, true, "Ex: hpay_live_...", "Token Bearer fornecido pela HeartPay")
                ),
                AcquirerType.Accithus => CredentialUtils.BuildSchema(
                    ("publicKey", "Public Key", CredentialFieldType.Text, true, "Ex: pk_live_...", "Chave publica fornecida pela Accithus"),
                    ("secretKey", "Secret Key", CredentialFieldType.Password, true, "Ex: sk_live_...", "Chave secreta fornecida pela Accithus")
                ),
                _ => null
            };

            if (schema != null)
            {
                acquirer.CredentialSchema = schema;
            }
        }
    }

    public static void UpdateHunterPayConfiguration(PrimaryDbContext context)
    {
        var acquirer = context.Acquirers.FirstOrDefault(a => a.Id == SystemAcquirerIds.HunterPay);
        if (acquirer == null)
            return;

        var metadata = AcquirerDefaultsConstants.GetMetadata(AcquirerType.HunterPay);

        acquirer.ApiBaseUrl = metadata.ApiBaseUrlProduction;
        acquirer.ApiBaseUrlProduction = metadata.ApiBaseUrlProduction;
        acquirer.ApiBaseUrlSandbox = metadata.ApiBaseUrlSandbox;
        acquirer.SupportsWithdrawal = true;
        acquirer.DocumentationUrl = metadata.DocumentationUrl;
        acquirer.WebhookDocumentationUrl = metadata.WebhookDocumentationUrl;
        acquirer.Description = metadata.Description;
    }

    public static void UpdateHeartPayConfiguration(PrimaryDbContext context)
    {
        var acquirer = context.Acquirers.FirstOrDefault(a => a.Id == SystemAcquirerIds.HeartPay);
        if (acquirer == null)
            return;

        var metadata = AcquirerDefaultsConstants.GetMetadata(AcquirerType.HeartPay);

        acquirer.ApiBaseUrl = metadata.ApiBaseUrlProduction;
        acquirer.ApiBaseUrlProduction = metadata.ApiBaseUrlProduction;
        acquirer.ApiBaseUrlSandbox = metadata.ApiBaseUrlSandbox;
        acquirer.DocumentationUrl = metadata.DocumentationUrl;
        acquirer.WebhookDocumentationUrl = metadata.WebhookDocumentationUrl;
        acquirer.Description = metadata.Description;
    }

    public static void UpdateActivePaymentsWithdrawalSecretSchema(PrimaryDbContext context)
    {
        var acquirer = context.Acquirers.FirstOrDefault(a => a.Id == SystemAcquirerIds.ActivePayments);
        if (acquirer == null)
            return;

        var newSchema = CredentialUtils.BuildSchema(
            ("publicKey", "Public Key", CredentialFieldType.Text, true, "Ex: ActivePayments_pk_...", "Chave publica fornecida pela ActivePayments"),
            ("secretKey", "Secret Key", CredentialFieldType.Password, true, "Ex: ActivePayments_sk_...", "Chave secreta fornecida pela ActivePayments"),
            ("withdrawalSecret", "Withdrawal Secret", CredentialFieldType.Password, false, "Ex: wdl_sec_...", "Secret para autorizar saques via header x-withdrawal-secret (opcional, substitui necessidade de IP fixo)")
        );

        acquirer.CredentialSchema = newSchema;
    }

    public static void UpdateAccithusProviderCategory(PrimaryDbContext context)
    {
        var acquirer = context.Acquirers.FirstOrDefault(a => a.Id == SystemAcquirerIds.Accithus);
        if (acquirer == null)
            return;

        acquirer.ProviderCategory = ProviderCategory.PaymentInstitution;
    }
}
