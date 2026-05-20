export type MerchantLevel =
  | 'Iron'
  | 'Bronze'
  | 'Silver'
  | 'GoldStart'
  | 'GoldPro'
  | 'Diamond'
  | 'PlatinumStart'
  | 'PlatinumPro'
  | 'Titanium'
  | 'Black'
  | 'Legend';

export type AchievementType = 'VolumeThreshold' | 'FirstSell' | 'FirstCheckout';

export interface MerchantLevelData {
  current: MerchantLevel;
  currentDisplayName: string;
  nextLevel: MerchantLevel | null;
  nextLevelDisplayName: string | null;
  totalVolume: number;
  minThreshold: number;
  maxThreshold: number | null;
  progress: number;
  borderImageUrl: string | null;
}

export interface MerchantAchievementItem {
  id: string;
  key: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  type: AchievementType;
  thresholdAmount: number | null;
  sortOrder: number;
  isEarned: boolean;
  earnedAt: string | null;
}

export interface LevelBorderItem {
  level: MerchantLevel;
  displayName: string;
  borderImageUrl: string | null;
}

export interface MerchantAchievementsData {
  levelInfo: MerchantLevelData;
  achievements: MerchantAchievementItem[];
  levelBorders: LevelBorderItem[];
  selectedEmblemIds: string[];
  selectedBorderLevel: MerchantLevel | null;
  selectedBorderImageUrl: string | null;
}
