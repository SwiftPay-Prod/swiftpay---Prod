import type { PaymentEnvironment } from '../enums';

export interface AdminWayneProtocolSettingsData {
  environment: PaymentEnvironment;
  isEnabled: boolean;
  cycleVolume: number;
  samplingRatePercent: number;
}

export interface AdminUpdateWayneProtocolSettingsRequest {
  environment: PaymentEnvironment;
  isEnabled: boolean;
  cycleVolume: number;
  samplingRatePercent: number;
}
