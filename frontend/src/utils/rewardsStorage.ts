import type { UserRewards, Achievement, WeeklyChallenge, RewardItem } from '../types/rewards';

const STORAGE_KEY = 'ecosort_eco_rewards_v1';

export const LEVEL_THRESHOLDS = [
  { level: 1, title: 'Seedling Recycler', minPoints: 0 },
  { level: 2, title: 'Eco Scout', minPoints: 100 },
  { level: 3, title: 'Waste Warrior', minPoints: 300 },
  { level: 4, title: 'Planet Guardian', minPoints: 700 },
  { level: 5, title: 'Zero-Waste Champion', minPoints: 1500 },
];

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_scan',
    title: 'First AI Detection',
    description: 'Classify your first piece of waste using YOLOv8.',
    iconName: 'Sparkles',
    points: 25,
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    category: 'detection',
  },
  {
    id: 'plastic_diverter',
    title: 'Plastic Diverter',
    description: 'Identify 5 plastic bottles or packaging items.',
    iconName: 'Package',
    points: 50,
    unlocked: false,
    progress: 0,
    maxProgress: 5,
    category: 'detection',
  },
  {
    id: 'camera_pro',
    title: 'Live Scanner Master',
    description: 'Use the real-time camera scanner to inspect waste.',
    iconName: 'Camera',
    points: 40,
    unlocked: false,
    progress: 0,
    maxProgress: 3,
    category: 'detection',
  },
  {
    id: 'human_reviewer',
    title: 'Quality Contributor',
    description: 'Submit verified human feedback for model improvement.',
    iconName: 'CheckCircle2',
    points: 75,
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    category: 'accuracy',
  },
  {
    id: 'streak_3',
    title: 'Eco Habit',
    description: 'Maintain a 3-day active waste sorting streak.',
    iconName: 'Flame',
    points: 60,
    unlocked: false,
    progress: 1,
    maxProgress: 3,
    category: 'streak',
  },
  {
    id: 'locator_explorer',
    title: 'Local Recycler',
    description: 'Find a nearby recycling drop-off center on the map.',
    iconName: 'MapPin',
    points: 30,
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    category: 'community',
  },
];

const INITIAL_CHALLENGES: WeeklyChallenge[] = [
  {
    id: 'ch_plastic_5',
    title: 'Plastic Clean-Up Run',
    description: 'Scan and properly divert 5 recyclable plastics this week.',
    category: 'Plastic',
    rewardPoints: 100,
    current: 1,
    target: 5,
    completed: false,
    expiresInDays: 4,
  },
  {
    id: 'ch_camera_scan',
    title: 'Live Camera Explorer',
    description: 'Perform 3 real-time camera scans of recyclables.',
    category: 'Camera',
    rewardPoints: 75,
    current: 0,
    target: 3,
    completed: false,
    expiresInDays: 5,
  },
  {
    id: 'ch_paper_cardboard',
    title: 'Carton & Paper Drive',
    description: 'Classify 3 paper or cardboard containers.',
    category: 'Paper',
    rewardPoints: 60,
    current: 2,
    target: 3,
    completed: false,
    expiresInDays: 6,
  },
];

const INITIAL_REWARDS: RewardItem[] = [
  {
    id: 'rew_tree',
    title: 'Plant a Real Mangrove Tree',
    description: 'Plant a mangrove tree in Madagascar in partnership with Eden Reforestation Projects.',
    pointsCost: 200,
    category: 'eco-action',
    partner: 'Eden Reforestation',
    claimed: false,
  },
  {
    id: 'rew_voucher_15',
    title: '15% Zero-Waste Store Coupon',
    description: 'Get 15% off sustainable home goods, shampoo bars, and reusable bags.',
    pointsCost: 150,
    category: 'voucher',
    partner: 'EcoRoots & PackageFree',
    claimed: false,
  },
  {
    id: 'rew_badge_cert',
    title: 'Official EcoSort Recycler Badge',
    description: 'A verified digital certification badge for your eco portfolio and social profile.',
    pointsCost: 100,
    category: 'badge',
    partner: 'EcoSort Foundation',
    claimed: false,
  },
  {
    id: 'rew_carbon_offset',
    title: '50 kg Carbon Offset Certificate',
    description: 'Offset 50 kg of CO2 equivalent through certified wind and solar clean energy credits.',
    pointsCost: 350,
    category: 'eco-action',
    partner: 'Gold Standard Offsets',
    claimed: false,
  },
];

export function getLevelDetails(points: number): { level: number; title: string; nextLevelPoints: number; currentTierProgress: number } {
  let currentLevel = LEVEL_THRESHOLDS[0];
  let nextLevelPoints = LEVEL_THRESHOLDS[1].minPoints;

  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (points >= LEVEL_THRESHOLDS[i].minPoints) {
      currentLevel = LEVEL_THRESHOLDS[i];
      nextLevelPoints = LEVEL_THRESHOLDS[i + 1]?.minPoints || LEVEL_THRESHOLDS[i].minPoints * 1.5;
    }
  }

  const prevMin = currentLevel.minPoints;
  const progressPercent = Math.min(
    100,
    Math.round(((points - prevMin) / (nextLevelPoints - prevMin)) * 100)
  );

  return {
    level: currentLevel.level,
    title: currentLevel.title,
    nextLevelPoints,
    currentTierProgress: isNaN(progressPercent) ? 100 : progressPercent,
  };
}

export function getUserRewards(): UserRewards {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const today = new Date().toISOString().split('T')[0];
      const initial: UserRewards = {
        points: 85, // Starting welcome points
        level: 1,
        levelTitle: 'Seedling Recycler',
        streakDays: 1,
        lastActiveDate: today,
        achievements: INITIAL_ACHIEVEMENTS,
        challenges: INITIAL_CHALLENGES,
        rewards: INITIAL_REWARDS,
        history: [
          {
            id: 'init_welcome',
            timestamp: Date.now(),
            description: 'Welcome to EcoSort Rewards! Starting bonus awarded.',
            pointsAdded: 85,
          },
        ],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    const { level, title } = getLevelDetails(parsed.points);
    parsed.level = level;
    parsed.levelTitle = title;
    return parsed;
  } catch (err) {
    console.error('Error loading rewards:', err);
    return {
      points: 85,
      level: 1,
      levelTitle: 'Seedling Recycler',
      streakDays: 1,
      lastActiveDate: new Date().toISOString().split('T')[0],
      achievements: INITIAL_ACHIEVEMENTS,
      challenges: INITIAL_CHALLENGES,
      rewards: INITIAL_REWARDS,
      history: [],
    };
  }
}

export function saveUserRewards(rewards: UserRewards): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rewards));
  } catch (err) {
    console.warn('Could not save rewards to localStorage:', err);
  }
}

export function awardPoints(
  pointsToAdd: number,
  reason: string,
  meta?: {
    isCamera?: boolean;
    classScanned?: string;
    isFeedback?: boolean;
    visitedLocator?: boolean;
  }
): { userRewards: UserRewards; newlyUnlocked: Achievement[] } {
  const current = getUserRewards();
  const today = new Date().toISOString().split('T')[0];

  // Streak logic
  let streak = current.streakDays;
  if (current.lastActiveDate !== today) {
    const lastDate = new Date(current.lastActiveDate);
    const nowDate = new Date(today);
    const diffDays = Math.round((nowDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
    if (diffDays === 1) {
      streak += 1;
    } else if (diffDays > 1) {
      streak = 1;
    }
  }

  const newPoints = current.points + pointsToAdd;
  const { level, title } = getLevelDetails(newPoints);

  const newHistory = [
    {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      description: reason,
      pointsAdded: pointsToAdd,
    },
    ...current.history,
  ].slice(0, 30);

  // Check achievements
  const newlyUnlocked: Achievement[] = [];
  const updatedAchievements = current.achievements.map((ach) => {
    let newProg = ach.progress;

    if (!ach.unlocked) {
      if (ach.id === 'first_scan') {
        newProg = Math.min(ach.maxProgress, newProg + 1);
      } else if (ach.id === 'plastic_diverter' && meta?.classScanned === 'Plastic') {
        newProg = Math.min(ach.maxProgress, newProg + 1);
      } else if (ach.id === 'camera_pro' && meta?.isCamera) {
        newProg = Math.min(ach.maxProgress, newProg + 1);
      } else if (ach.id === 'human_reviewer' && meta?.isFeedback) {
        newProg = Math.min(ach.maxProgress, newProg + 1);
      } else if (ach.id === 'streak_3') {
        newProg = Math.min(ach.maxProgress, streak);
      } else if (ach.id === 'locator_explorer' && meta?.visitedLocator) {
        newProg = Math.min(ach.maxProgress, 1);
      }

      if (newProg >= ach.maxProgress) {
        newlyUnlocked.push({
          ...ach,
          unlocked: true,
          unlockedAt: Date.now(),
          progress: newProg,
        });
        return {
          ...ach,
          unlocked: true,
          unlockedAt: Date.now(),
          progress: newProg,
        };
      }
    }

    return { ...ach, progress: newProg };
  });

  // Check weekly challenges
  const updatedChallenges = current.challenges.map((ch) => {
    let curr = ch.current;
    if (!ch.completed) {
      if (ch.id === 'ch_plastic_5' && meta?.classScanned === 'Plastic') {
        curr = Math.min(ch.target, curr + 1);
      } else if (ch.id === 'ch_camera_scan' && meta?.isCamera) {
        curr = Math.min(ch.target, curr + 1);
      } else if (ch.id === 'ch_paper_cardboard' && meta?.classScanned === 'Paper_Cardboard') {
        curr = Math.min(ch.target, curr + 1);
      }
    }
    const isCompleted = curr >= ch.target;
    return { ...ch, current: curr, completed: isCompleted };
  });

  const updated: UserRewards = {
    ...current,
    points: newPoints,
    level,
    levelTitle: title,
    streakDays: streak,
    lastActiveDate: today,
    achievements: updatedAchievements,
    challenges: updatedChallenges,
    history: newHistory,
  };

  saveUserRewards(updated);
  return { userRewards: updated, newlyUnlocked };
}

export function claimReward(rewardId: string): { success: boolean; message: string; updatedRewards: UserRewards } {
  const current = getUserRewards();
  const reward = current.rewards.find((r) => r.id === rewardId);

  if (!reward) {
    return { success: false, message: 'Reward not found.', updatedRewards: current };
  }

  if (reward.claimed) {
    return { success: false, message: 'Reward already claimed.', updatedRewards: current };
  }

  if (current.points < reward.pointsCost) {
    return {
      success: false,
      message: `You need ${reward.pointsCost - current.points} more Eco-Points to claim this reward.`,
      updatedRewards: current,
    };
  }

  const generatedCode = `ECO-${Math.random().toString(36).substring(2, 7).toUpperCase()}-2026`;
  const updatedPoints = current.points - reward.pointsCost;
  const { level, title } = getLevelDetails(updatedPoints);

  const updatedRewardsList = current.rewards.map((r) =>
    r.id === rewardId ? { ...r, claimed: true, claimedAt: Date.now(), code: generatedCode } : r
  );

  const newHistory = [
    {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      description: `Redeemed: ${reward.title}`,
      pointsAdded: -reward.pointsCost,
    },
    ...current.history,
  ];

  const updated: UserRewards = {
    ...current,
    points: updatedPoints,
    level,
    levelTitle: title,
    rewards: updatedRewardsList,
    history: newHistory,
  };

  saveUserRewards(updated);
  return {
    success: true,
    message: `Congratulations! Claim code: ${generatedCode}`,
    updatedRewards: updated,
  };
}
