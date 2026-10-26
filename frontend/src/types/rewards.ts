export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  points: number;
  unlocked: boolean;
  unlockedAt?: number;
  progress: number;
  maxProgress: number;
  category: 'detection' | 'streak' | 'accuracy' | 'community';
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  category: string;
  rewardPoints: number;
  current: number;
  target: number;
  completed: boolean;
  expiresInDays: number;
}

export interface RewardItem {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  category: 'eco-action' | 'voucher' | 'badge';
  partner: string;
  claimed: boolean;
  claimedAt?: number;
  code?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: number;
  description: string;
  pointsAdded: number;
}

export interface UserRewards {
  points: number;
  level: number;
  levelTitle: string;
  streakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
  achievements: Achievement[];
  challenges: WeeklyChallenge[];
  rewards: RewardItem[];
  history: ActivityLog[];
}
