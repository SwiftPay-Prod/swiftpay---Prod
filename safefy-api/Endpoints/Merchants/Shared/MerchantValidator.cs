using safefy_api_core.Models.Database;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Merchants.Shared;

public static class MerchantValidator
{
    public static bool RequiresCompanyContract(MerchantKyc? merchantKyc)
    {
        return merchantKyc?.DocumentType == MerchantKycDocumentType.CNPJ && merchantKyc.UsesCreditCard;
    }

    public static List<string> ValidateOnboardingComplete(Merchant merchant)
    {
        var errors = new List<string>();

        // Basic Info validation
        if (string.IsNullOrEmpty(merchant.Name))
            errors.Add("O nome é obrigatório.");
        if (string.IsNullOrEmpty(merchant.Email))
            errors.Add("O e-mail é obrigatório.");
        if (string.IsNullOrEmpty(merchant.WhatsApp))
            errors.Add("O WhatsApp é obrigatório.");

        // Address validation
        if (string.IsNullOrEmpty(merchant.Address))
            errors.Add("O endereço é obrigatório.");
        if (string.IsNullOrEmpty(merchant.AddressNumber))
            errors.Add("O número do endereço é obrigatório.");
        if (string.IsNullOrEmpty(merchant.Neighborhood))
            errors.Add("O bairro é obrigatório.");
        if (string.IsNullOrEmpty(merchant.City))
            errors.Add("A cidade é obrigatória.");
        if (string.IsNullOrEmpty(merchant.State))
            errors.Add("O estado é obrigatório.");
        if (string.IsNullOrEmpty(merchant.PostalCode))
            errors.Add("O CEP é obrigatório.");
        if (string.IsNullOrEmpty(merchant.Country))
            errors.Add("O país é obrigatório.");

        // KYC validation
        if (merchant.MerchantKyc == null)
        {
            errors.Add("Os dados de KYC são obrigatórios.");
        }
        else
        {
            // Legal Information
            if (string.IsNullOrEmpty(merchant.MerchantKyc.LegalName))
                errors.Add("A razão social é obrigatória.");
            if (!merchant.MerchantKyc.DocumentType.HasValue)
                errors.Add("O tipo de documento é obrigatório.");
            if (string.IsNullOrEmpty(merchant.MerchantKyc.DocumentNumber))
                errors.Add("O número do documento é obrigatório.");

            // Validate document number format
            if (!string.IsNullOrEmpty(merchant.MerchantKyc.DocumentNumber))
            {
                if (merchant.MerchantKyc.DocumentType == MerchantKycDocumentType.CPF && !DocumentUtils.IsValidCpf(merchant.MerchantKyc.DocumentNumber))
                    errors.Add("O CPF informado é inválido.");
                if (merchant.MerchantKyc.DocumentType == MerchantKycDocumentType.CNPJ && !DocumentUtils.IsValidCnpj(merchant.MerchantKyc.DocumentNumber))
                    errors.Add("O CNPJ informado é inválido.");
            }

            // Identity Document
            if (!merchant.MerchantKyc.IdentityDocumentType.HasValue)
                errors.Add("O tipo de documento de identidade é obrigatório.");
            if (string.IsNullOrEmpty(merchant.MerchantKyc.IdentityDocumentNumber))
                errors.Add("O número do documento de identidade é obrigatório.");

            // Business Information
            if (!merchant.MerchantKyc.OperationType.HasValue)
                errors.Add("O tipo de operação é obrigatório.");
            if (string.IsNullOrEmpty(merchant.MerchantKyc.BusinessDescription))
                errors.Add("A descrição do negócio é obrigatória.");
            if (string.IsNullOrEmpty(merchant.MerchantKyc.Website))
                errors.Add("O website é obrigatório.");
            if (merchant.MerchantKyc.MonthlyRevenue <= 0)
                errors.Add("A receita mensal é obrigatória.");
            if (merchant.MerchantKyc.AverageTicket <= 0)
                errors.Add("O ticket médio é obrigatório.");
            if (!merchant.MerchantKyc.UsesPix && !merchant.MerchantKyc.UsesBoleto && !merchant.MerchantKyc.UsesCreditCard)
                errors.Add("Selecione ao menos um método de pagamento.");

            // Document Files
            if (!merchant.MerchantKyc.DocumentFrontFileId.HasValue)
                errors.Add("A frente do documento é obrigatória.");
            if (!merchant.MerchantKyc.DocumentBackFileId.HasValue)
                errors.Add("O verso do documento é obrigatório.");
            if (!merchant.MerchantKyc.SelfieFileId.HasValue)
                errors.Add("A selfie com documento é obrigatória.");

            if (merchant.MerchantKyc.DocumentType == MerchantKycDocumentType.CPF)
            {
                if (!merchant.MerchantKyc.ProofOfAddressFileId.HasValue)
                    errors.Add("O comprovante de endereço é obrigatório para CPF.");
            }

            if (merchant.MerchantKyc.DocumentType == MerchantKycDocumentType.CNPJ)
            {
                if (!merchant.MerchantKyc.CnpjCardFileId.HasValue)
                    errors.Add("O Cartão CNPJ é obrigatório para CNPJ.");

                if (RequiresCompanyContract(merchant.MerchantKyc) && !merchant.MerchantKyc.CompanyContractFileId.HasValue)
                    errors.Add("Contrato Social ou Requerimento de Empresário é obrigatório para CNPJ com cartão de crédito.");
            }
        }

        return errors;
    }
}
