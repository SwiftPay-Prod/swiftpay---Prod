namespace swiftpay_api_core.Constants;

/// <summary>
/// IDs de sistema para recursos sem owner específico (uploads da plataforma, etc).
/// </summary>
public static class SystemIds
{
    /// <summary>
    /// Owner ID para arquivos que pertencem à plataforma (ex: templates de checkout, imagens de marketing)
    /// </summary>
    public static readonly Guid PlatformOwner = Guid.Parse("00000000-0000-0000-0000-000000000000");
}

/// <summary>
/// IDs das contas do sistema.
/// Essas contas são criadas automaticamente na inicialização do banco de dados.
/// </summary>
public static class SystemAccountIds
{
    /// <summary>
    /// Saldo bloqueado da plataforma (saques em processamento)
    /// </summary>
    public static readonly Guid PlatformBlocked = Guid.Parse("00000000-0000-0000-0000-000000000002");
    
    /// <summary>
    /// Histórico de saques concluídos da plataforma
    /// </summary>
    public static readonly Guid PlatformPayoutsOut = Guid.Parse("00000000-0000-0000-0000-000000000003");
}

/// <summary>
/// IDs dos usuários do sistema.
/// </summary>
public static class SystemUserIds
{
    /// <summary>
    /// Usuário administrador do sistema
    /// </summary>
    public static readonly Guid Admin = Guid.Parse("00000000-0000-0000-0000-000000000100");
}

/// <summary>
/// IDs das adquirentes do sistema.
/// </summary>
public static class SystemAcquirerIds
{
    /// <summary>
    /// Adquirente Bankizi
    /// </summary>
    public static readonly Guid Bankizi = Guid.Parse("00000000-0000-0000-0000-000000000201");

    /// <summary>
    /// Adquirente IHub Banking
    /// </summary>
    public static readonly Guid IHubBanking = Guid.Parse("00000000-0000-0000-0000-000000000202");

    /// <summary>
    /// Adquirente ActivePayments
    /// </summary>
    public static readonly Guid ActivePayments = Guid.Parse("00000000-0000-0000-0000-000000000203");

    /// <summary>
    /// Adquirente Rapdyn
    /// </summary>
    public static readonly Guid Rapdyn = Guid.Parse("00000000-0000-0000-0000-000000000204");

    /// <summary>
    /// Adquirente Coldfy
    /// </summary>
    public static readonly Guid Coldfy = Guid.Parse("00000000-0000-0000-0000-000000000205");

    /// <summary>
    /// Adquirente Pluggou
    /// </summary>
    public static readonly Guid Pluggou = Guid.Parse("00000000-0000-0000-0000-000000000206");

    /// <summary>
    /// Adquirente HunterPay
    /// </summary>
    public static readonly Guid HunterPay = Guid.Parse("00000000-0000-0000-0000-000000000207");

    /// <summary>
    /// Adquirente HeartPay
    /// </summary>
    public static readonly Guid HeartPay = Guid.Parse("00000000-0000-0000-0000-000000000209");

    /// <summary>
    /// Instituição de Pagamento Accithus
    /// </summary>
    public static readonly Guid Accithus = Guid.Parse("00000000-0000-0000-0000-000000000208");
}
