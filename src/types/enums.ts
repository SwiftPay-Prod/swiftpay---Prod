export enum UserRole {
  God = "God",
  Admin = "Admin",
  Merchant = "Merchant",
  Support = "Support",
}

export enum UserStatus {
  Active = "Active",
  Inactive = "Inactive",
  Suspended = "Suspended",
}

export enum AcquirerType {
  Bankizi = "Bankizi",
  IHubBanking = "IHubBanking",
  ActivePayments = "ActivePayments",
  Rapdyn = "Rapdyn",
  Coldfy = "Coldfy",
  Pluggou = "Pluggou",
  HunterPay = "HunterPay",
  HeartPay = "HeartPay",
  Accithus = "Accithus",
  MagicPay = "MagicPay",
  FlevoPay = "FlevoPay",
  PixHub = "PixHub",
}

export enum ProviderCategory {
  Acquirer = "Acquirer",
  PaymentInstitution = "PaymentInstitution",
}

export enum ExternalSubmerchantStatus {
  NotSubmitted = "NotSubmitted",
  Pending = "Pending",
  PendingReview = "PendingReview",
  Active = "Active",
  Rejected = "Rejected",
  Suspended = "Suspended",
  Inactive = "Inactive",
}

export enum AcquirerOperationType {
  White = "White",
  Black = "Black",
}

export enum ProductType {
  Physical = "Physical",
  Digital = "Digital",
  Service = "Service",
}

export enum ProductStatus {
  Active = "Active",
  Inactive = "Inactive",
  Archived = "Archived",
}

export enum CategoryStatus {
  Active = "Active",
  Inactive = "Inactive",
}

export enum VariantStatus {
  Active = "Active",
  Inactive = "Inactive",
  OutOfStock = "OutOfStock",
}

export enum StockMovementType {
  In = "In",
  Out = "Out",
  Adjustment = "Adjustment",
  Reserved = "Reserved",
  Released = "Released",
  Confirmed = "Confirmed",
}

export enum StockMovementReferenceType {
  Order = "Order",
  Manual = "Manual",
  Expiration = "Expiration",
}

export enum MerchantStatus {
  Draft = "Draft",
  Active = "Active",
  Inactive = "Inactive",
  Suspended = "Suspended",
  Deleted = "Deleted",
}

export enum MerchantKycStatus {
  Draft = "Draft",
  Pending = "Pending",
  UnderReview = "UnderReview",
  Approved = "Approved",
  Rejected = "Rejected",
  Complement = "Complement",
}

export enum MerchantKycEvaluationStatus {
  Approved = "Approved",
  Rejected = "Rejected",
  Complement = "Complement",
}

export enum MerchantKycDocumentType {
  CPF = "CPF",
  CNPJ = "CNPJ",
}

export enum MerchantIdentityDocumentType {
  RG = "RG",
  CNH = "CNH",
}

export enum MerchantKycOperationType {
  Black = "Black",
  White = "White",
}

export enum MerchantKycPendingItemType {
  Document = "Document",
  Information = "Information",
  Clarification = "Clarification",
  Correction = "Correction",
  Other = "Other",
}

export enum MerchantKycPendingItemStatus {
  Pending = "Pending",
  Responded = "Responded",
  Approved = "Approved",
  Rejected = "Rejected",
}

export enum MerchantKycPendingField {
  Name = "Name",
  Email = "Email",
  PhoneNumber = "PhoneNumber",
  WhatsApp = "WhatsApp",
  Address = "Address",
  AddressNumber = "AddressNumber",
  AddressComplement = "AddressComplement",
  Neighborhood = "Neighborhood",
  City = "City",
  State = "State",
  PostalCode = "PostalCode",
  Country = "Country",
  LegalName = "LegalName",
  DocumentType = "DocumentType",
  DocumentNumber = "DocumentNumber",
  IdentityDocumentType = "IdentityDocumentType",
  IdentityDocumentNumber = "IdentityDocumentNumber",
  OperationType = "OperationType",
  BusinessDescription = "BusinessDescription",
  Website = "Website",
  MonthlyRevenue = "MonthlyRevenue",
  AverageTicket = "AverageTicket",
  UsesPix = "UsesPix",
  ProofOfAddressFileId = "ProofOfAddressFileId",
  DocumentFrontFileId = "DocumentFrontFileId",
  DocumentBackFileId = "DocumentBackFileId",
  SelfieFileId = "SelfieFileId",
  CnpjCardFileId = "CnpjCardFileId",
  CompanyContractFileId = "CompanyContractFileId",
}

export enum MerchantOnboardingStep {
  BasicInfo = "BasicInfo",
  Address = "Address",
  Documents = "Documents",
  Billing = "Billing",
  Review = "Review",
  Completed = "Completed",
}

export enum MerchantApiCredentialEnvironment {
  Sandbox = "Sandbox",
  Production = "Production",
}

export enum MerchantApiCredentialStatus {
  Active = "Active",
  Inactive = "Inactive",
  Revoked = "Revoked",
}

export enum CustomerDocumentType {
  CPF = "CPF",
  CNPJ = "CNPJ",
}

export enum CustomerStatus {
  Active = "Active",
  Inactive = "Inactive",
}

export enum PaymentEnvironment {
  Sandbox = "Sandbox",
  Production = "Production",
}

export enum PaymentMethod {
  Pix = "Pix",
}

/** @deprecated R11 — manter somente para leitura legada, nunca usar em create/update */
export type LegacyPaymentMethod = "Pix" | "CreditCard" | "Boleto";

export enum PaymentRequestSource {
  Api = "Api",
  Checkout = "Checkout",
  PaymentLink = "PaymentLink",
}

export enum PaymentStatus {
  Pending = "Pending",
  Processing = "Processing",
  Confirming = "Confirming",
  Completed = "Completed",
  Failed = "Failed",
  Refunded = "Refunded",
  PartiallyRefunded = "PartiallyRefunded",
  Disputed = "Disputed",
  Expired = "Expired",
  Cancelled = "Cancelled",
}

export enum PaymentLinkLifetimeStatus {
  NeverExpires = "NeverExpires",
  Active = "Active",
  Expired = "Expired",
}

export enum PayoutStatus {
  Pending = "Pending",
  Processing = "Processing",
  Confirming = "Confirming",
  Completed = "Completed",
  Failed = "Failed",
  Rejected = "Rejected",
  Cancelled = "Cancelled",
}

export enum OrderStatus {
  Reserved = "Reserved",
  Pending = "Pending",
  Confirmed = "Confirmed",
  Processing = "Processing",
  Completed = "Completed",
  Cancelled = "Cancelled",
  Refunded = "Refunded",
  Expired = "Expired",
}

export enum OrderFulfillmentStatus {
  Unfulfilled = "Unfulfilled",
  PartiallyFulfilled = "PartiallyFulfilled",
  Fulfilled = "Fulfilled",
  Shipped = "Shipped",
  Delivered = "Delivered",
}

export enum PayoutAccountStatus {
  Pending = "Pending",
  Active = "Active",
  Inactive = "Inactive",
  Rejected = "Rejected",
}

export enum PayoutReviewAction {
  Approve = "Approve",
  Reject = "Reject",
}

export enum PayoutAccountActionType {
  Activate = "Activate",
  SetDefault = "SetDefault",
  Delete = "Delete",
  View = "View"
}

export enum PixKeyType {
  Cpf = "Cpf",
  Cnpj = "Cnpj",
  Email = "Email",
  Phone = "Phone",
  Random = "Random",
}

export enum ReferralCommissionWithdrawalRequestStatus {
  Requested = "Requested",
  Reviewed = "Reviewed",
  Cancelled = "Cancelled",
}

export enum ReferralWithdrawalIntervalUnit {
  Days = "Days",
  Months = "Months",
}

export enum ReferralCommissionMovementSourceType {
  Payment = "Payment",
  Payout = "Payout",
}

export enum FeeChargeMode {
  FixedOnly = "FixedOnly",
  PercentageOnly = "PercentageOnly",
  FixedAndPercentage = "FixedAndPercentage",
}

export enum WebhookAuthMode {
  None = "None",
  Token = "Token",
  Ip = "Ip",
  TokenAndIp = "TokenAndIp",
  HmacSha256 = "HmacSha256",
}

export enum WithdrawalApprovalMode {
  Automatic = "Automatic",
  Manual = "Manual",
}

export enum PayoutFeeHandling {
  FeeDeductedFromTransfer = "FeeDeductedFromTransfer",
  FeeAddedToDebit = "FeeAddedToDebit",
}

export enum PaymentFeeSplitHandling {
  None = "None",
  AutoSplitToBank = "AutoSplitToBank",
}

export enum UploadFolder {
  Merchants = "Merchants",
  Kyc = "Kyc",
  Products = "Products",
  Checkouts = "Checkouts",
  Avatars = "Avatars",
  Templates = "Templates",
  Acquirers = "Acquirers",
  ReferralCommissions = "ReferralCommissions",
  PaymentLinks = "PaymentLinks",
}

export enum NotificationScope {
  Merchant = "Merchant",
  User = "User",
}

export enum NotificationType {
  Info = "Info",
  Success = "Success",
  Warning = "Warning",
  Error = "Error",
  Security = "Security",
  Payment = "Payment",
  Payout = "Payout",
  Chargeback = "Chargeback",
  System = "System",
}

export enum NotificationStatusType {
  PaymentPending = "PaymentPending",
  PaymentCompleted = "PaymentCompleted",
  PaymentExpired = "PaymentExpired",
  PaymentFailed = "PaymentFailed",
  PaymentRefunded = "PaymentRefunded",
  PayoutPending = "PayoutPending",
  PayoutProcessing = "PayoutProcessing",
  PayoutCompleted = "PayoutCompleted",
  PayoutFailed = "PayoutFailed",
  PayoutRejected = "PayoutRejected",
  PayoutCancelled = "PayoutCancelled",
}

export enum NotificationPriority {
  Low = "Low",
  Normal = "Normal",
  High = "High",
  Urgent = "Urgent",
}

export enum CallbackStatus {
  NotConfigured = "NotConfigured",
  Pending = "Pending",
  Sent = "Sent",
  Failed = "Failed",
}


export enum CouponStatus {
  Active = "Active",
  Inactive = "Inactive",
  Expired = "Expired",
}

export enum CouponDiscountType {
  Percentage = "Percentage",
  FixedAmount = "FixedAmount",
}

export enum CashoutEvaluateAction {
  Approve = "Approve",
  Reject = "Reject",
}

export enum LedgerTransactionType {
  PaymentReceived = "PaymentReceived",
  PaymentRefunded = "PaymentRefunded",
  FeeCharged = "FeeCharged",
  WithdrawalRequested = "WithdrawalRequested",
  WithdrawalCompleted = "WithdrawalCompleted",
  WithdrawalFailed = "WithdrawalFailed",
  Adjustment = "Adjustment",
}

export enum LedgerEntryType {
  Credit = "Credit",
  Debit = "Debit",
}

export enum AccountType {
  MerchantAvailable = "MerchantAvailable",
  MerchantPending = "MerchantPending",
  MerchantBlocked = "MerchantBlocked",
  MerchantPayoutsOut = "MerchantPayoutsOut",
  MerchantFeesPaid = "MerchantFeesPaid",
  PlatformFee = "PlatformFee",
  PlatformBlocked = "PlatformBlocked",
  PlatformPayoutsOut = "PlatformPayoutsOut",
  AcquirerSettlement = "AcquirerSettlement",
  AcquirerPayoutsOut = "AcquirerPayoutsOut",
  AcquirerFeesPaid = "AcquirerFeesPaid",
}

export enum CheckoutStatus {
  Draft = "Draft",
  Active = "Active",
  Paused = "Paused",
  Archived = "Archived",
  Expired = "Expired",
}

export enum CheckoutTemplateType {
  SingleOrder = "SingleOrder",
  Catalog = "Catalog",
  Transparent = "Transparent",
}

export enum CheckoutColorMode {
  Single = "Single",
  Gradient = "Gradient",
}

export enum SocialProofPosition {
  TopLeft = "TopLeft",
  TopRight = "TopRight",
  BottomLeft = "BottomLeft",
  BottomRight = "BottomRight",
}

export enum BankReconciliationStatus {
  Pending = "Pending",
  Processing = "Processing",
  Completed = "Completed",
  CompletedWithDiscrepancies = "CompletedWithDiscrepancies",
  CorrectionsApplied = "CorrectionsApplied",
  Failed = "Failed",
}

export enum ReconciliationDiscrepancyType {
  PaymentNotInLedger = "PaymentNotInLedger",
  PayoutNotInLedger = "PayoutNotInLedger",
  RefundNotInLedger = "RefundNotInLedger",
  MissingReversal = "MissingReversal",
  OrphanLedgerEntry = "OrphanLedgerEntry",
  AmountMismatch = "AmountMismatch",
  FeeMismatch = "FeeMismatch",
  DuplicateLedgerEntry = "DuplicateLedgerEntry",
  BalanceMismatch = "BalanceMismatch",
  PayoutsOutMismatch = "PayoutsOutMismatch",
  PendingMismatch = "PendingMismatch",
  BlockedMismatch = "BlockedMismatch",
  NegativeAvailableBalance = "NegativeAvailableBalance",
  WithdrawalExceedsInflow = "WithdrawalExceedsInflow",
}

export enum ReconciliationDiscrepancySeverity {
  Info = "Info",
  Warning = "Warning",
  Error = "Error",
  Critical = "Critical",
}

export enum DigitalItemType {
  Key = "Key",
  DownloadLink = "DownloadLink",
  AccessCode = "AccessCode",
  Text = "Text",
  ExternalLink = "ExternalLink",
}

export enum DigitalItemStatus {
  Available = "Available",
  Reserved = "Reserved",
  Delivered = "Delivered",
  Disabled = "Disabled",
}

export enum MerchantEmailTemplateType {
  PaymentConfirmation = "PaymentConfirmation",
  DigitalDelivery = "DigitalDelivery",
  OrderShipped = "OrderShipped",
  OrderDelivered = "OrderDelivered",
  Welcome = "Welcome",
  AbandonedCart = "AbandonedCart",
}

export enum EmailTemplateLayout {
  List = "List",
  Cards = "Cards",
}

export enum ServiceLocationType {
  Online = "Online",
  InPerson = "InPerson",
  Both = "Both",
}

export enum EmailBlockType {
  Header = "Header",
  Text = "Text",
  Button = "Button",
  Image = "Image",
  Banner = "Banner",
  ProductList = "ProductList",
  DigitalItemsList = "DigitalItemsList",
  TrackingInfo = "TrackingInfo",
  Divider = "Divider",
  Spacer = "Spacer",
  Footer = "Footer",
  Columns = "Columns",
  OrderSummary = "OrderSummary",
}

export enum EmailTextAlignment {
  Left = "Left",
  Center = "Center",
  Right = "Right",
}

export enum MerchantAcquirerChangeAction {
  InitialAssignment = "InitialAssignment",
  DefaultChanged = "DefaultChanged",
  AcquirerAdded = "AcquirerAdded",
  AcquirerDeactivated = "AcquirerDeactivated",
  AcquirerReactivated = "AcquirerReactivated",
  AcquirerRemoved = "AcquirerRemoved",
  LegacyMigration = "LegacyMigration",
}

export enum MerchantSettingsChangeCategory {
  PixFees = "PixFees",
  WithdrawalFees = "WithdrawalFees",
  PixLimits = "PixLimits",
  WithdrawalLimits = "WithdrawalLimits",
  WithdrawalApprovalMode = "WithdrawalApprovalMode",
  RateLimits = "RateLimits",
  AutomaticCashout = "AutomaticCashout",
  General = "General",
  InitialSetup = "InitialSetup",
  LegacyMigration = "LegacyMigration",
}

export type PlatformPayoutStatus = "Processing" | "Completed" | "PartiallyCompleted" | "Failed" | "Cancelled";

export type PlatformPayoutItemStatus = "Processing" | "Completed" | "Failed" | "Cancelled";

export enum ApprovalRateLevel {
  Critical = "Critical",
  BelowAverage = "BelowAverage",
  Average = "Average",
  Good = "Good",
  Excellent = "Excellent",
}

export enum AutomaticCashoutFrequency {
  Minutely = "Minutely",
  Hourly = "Hourly",
  Daily = "Daily",
  Weekly = "Weekly",
}

export enum AutomaticCashoutStatus {
  Success = "Success",
  Failed = "Failed",
  Skipped = "Skipped",
  Simulated = "Simulated",
}

export function isAdminRole(role: UserRole): boolean {
  return role === UserRole.God || role === UserRole.Admin;
}

