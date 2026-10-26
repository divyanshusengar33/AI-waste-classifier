import React, { useState } from 'react';
import {
  Trophy,
  Award,
  Sparkles,
  Flame,
  CheckCircle2,
  Gift,
  Target,
  Clock,
  History,
  Lock,
  ArrowRight,
  ShieldCheck,
  Package,
  Camera,
  MapPin
} from 'lucide-react';
import type { UserRewards } from '../types/rewards';
import { claimReward, getLevelDetails } from '../utils/rewardsStorage';

interface RewardsPageProps {
  userRewards: UserRewards;
  onRewardsUpdated: () => void;
  onNavigateToDetect: () => void;
  onNavigateToLocator: () => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

export const RewardsPage: React.FC<RewardsPageProps> = ({
  userRewards,
  onRewardsUpdated,
  onNavigateToDetect,
  onNavigateToLocator,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'challenges' | 'achievements' | 'rewards' | 'history'>('challenges');
  const [isClaiming, setIsClaiming] = useState<string | null>(null);

  const levelInfo = getLevelDetails(userRewards.points);

  const handleClaimReward = (rewardId: string) => {
    setIsClaiming(rewardId);
    setTimeout(() => {
      const res = claimReward(rewardId);
      if (res.success) {
        onShowToast('success', 'Reward Claimed!', res.message);
        onRewardsUpdated();
      } else {
        onShowToast('warning', 'Cannot Claim', res.message);
      }
      setIsClaiming(null);
    }, 400);
  };

  const getAchievementIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-amber-500" />;
      case 'Package':
        return <Package className="w-5 h-5 text-emerald-600" />;
      case 'Camera':
        return <Camera className="w-5 h-5 text-blue-500" />;
      case 'CheckCircle2':
        return <CheckCircle2 className="w-5 h-5 text-teal-600" />;
      case 'Flame':
        return <Flame className="w-5 h-5 text-orange-500" />;
      case 'MapPin':
        return <MapPin className="w-5 h-5 text-emerald-700" />;
      default:
        return <Award className="w-5 h-5 text-emerald-600" />;
    }
  };

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-950 text-white p-8 sm:p-10 shadow-xl border border-emerald-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/60 border border-emerald-600/50 text-emerald-300 text-xs font-semibold">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Smart Eco-Points & Gamified Recycling</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Recycle, Earn Points &{' '}
              <span className="text-emerald-400">Unlock Rewards</span>
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
              Earn Eco-Points for every scan, camera classification, and verified review.
              Level up your eco status, complete weekly challenges, and plant real trees.
            </p>
          </div>

          {/* Points & Level Card */}
          <div className="shrink-0 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 min-w-[260px] text-center space-y-3">
            <div className="text-[11px] uppercase tracking-wider text-emerald-200 font-semibold">
              Your Eco-Points Balance
            </div>
            <div className="text-4xl sm:text-5xl font-black text-amber-300 tracking-tight flex items-center justify-center gap-2">
              <Sparkles className="w-7 h-7 text-amber-400" />
              <span>{userRewards.points}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-700/80 text-white text-xs font-bold border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>
                Level {levelInfo.level}: {levelInfo.title}
              </span>
            </div>
          </div>
        </div>

        {/* Level Progression Bar */}
        <div className="mt-8 pt-6 border-t border-emerald-800/60 space-y-2">
          <div className="flex items-center justify-between text-xs text-emerald-200">
            <span className="font-semibold">Tier Progress to Level {levelInfo.level + 1}</span>
            <span className="font-mono">
              {userRewards.points} / {levelInfo.nextLevelPoints} pts ({levelInfo.currentTierProgress}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-emerald-950/80 rounded-full overflow-hidden border border-emerald-700/40">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${levelInfo.currentTierProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Streak & Quick Metric Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Streak */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Sorting Streak</p>
            <p className="text-lg font-bold text-slate-900">{userRewards.streakDays} Day{userRewards.streakDays === 1 ? '' : 's'}</p>
            <p className="text-[11px] text-slate-400">+10 bonus points tomorrow</p>
          </div>
        </div>

        {/* Achievements Count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Unlocked Badges</p>
            <p className="text-lg font-bold text-slate-900">
              {userRewards.achievements.filter((a) => a.unlocked).length} of {userRewards.achievements.length}
            </p>
            <p className="text-[11px] text-slate-400">Lifetime milestones</p>
          </div>
        </div>

        {/* Weekly Challenges Completed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Challenges</p>
            <p className="text-lg font-bold text-slate-900">
              {userRewards.challenges.filter((c) => c.completed).length} / {userRewards.challenges.length} Done
            </p>
            <p className="text-[11px] text-slate-400">Weekly community reset</p>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('challenges')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'challenges'
              ? 'border-emerald-800 text-emerald-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Weekly Challenges</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
            {userRewards.challenges.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'achievements'
              ? 'border-emerald-800 text-emerald-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Achievements & Badges</span>
        </button>

        <button
          onClick={() => setActiveTab('rewards')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'rewards'
              ? 'border-emerald-800 text-emerald-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Redeem Rewards</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'history'
              ? 'border-emerald-800 text-emerald-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Activity Log</span>
        </button>
      </div>

      {/* Tab 1: Weekly Challenges */}
      {activeTab === 'challenges' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Community Weekly Challenges</h3>
              <p className="text-xs text-slate-500">
                Complete sorting tasks with your community to earn high-tier point rewards.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={onNavigateToLocator}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                <span>Find Drop-off Sites</span>
              </button>
              <button
                onClick={onNavigateToDetect}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold transition-colors"
              >
                <span>Scan Waste Item</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {userRewards.challenges.map((ch) => (
              <div
                key={ch.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  ch.completed
                    ? 'border-emerald-300 bg-emerald-50/60 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {ch.category}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      +{ch.rewardPoints} pts
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900">{ch.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{ch.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-500">Progress</span>
                    <span className="font-mono font-bold text-slate-800">
                      {ch.current} / {ch.target}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        ch.completed ? 'bg-emerald-600' : 'bg-emerald-800'
                      }`}
                      style={{ width: `${Math.min(100, (ch.current / ch.target) * 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Expires in {ch.expiresInDays} days
                    </span>
                    {ch.completed && (
                      <span className="flex items-center gap-1 text-emerald-700 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Achievements */}
      {activeTab === 'achievements' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Milestone Badges</h3>
            <p className="text-xs text-slate-500">
              Unlock badges as you classify materials, maintain streaks, and help verify labels.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {userRewards.achievements.map((ach) => (
              <div
                key={ach.id}
                className={`p-5 rounded-2xl border transition-all ${
                  ach.unlocked
                    ? 'border-emerald-300 bg-emerald-50/50 shadow-xs'
                    : 'border-slate-200 bg-white opacity-80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        ach.unlocked ? 'bg-emerald-100' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {ach.unlocked ? getAchievementIcon(ach.iconName) : <Lock className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{ach.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{ach.description}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-700 shrink-0 font-mono">
                    +{ach.points} pts
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>{ach.unlocked ? 'Unlocked' : 'In Progress'}</span>
                    <span className="font-mono">
                      {ach.progress} / {ach.maxProgress}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${Math.min(100, (ach.progress / ach.maxProgress) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Redeem Rewards */}
      {activeTab === 'rewards' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Exchange Points for Real Impact</h3>
            <p className="text-xs text-slate-500">
              Redeem your accumulated Eco-Points for environmental actions and eco-friendly partner perks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {userRewards.rewards.map((rew) => {
              const canAfford = userRewards.points >= rew.pointsCost;
              return (
                <div
                  key={rew.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {rew.partner}
                      </span>
                      <span className="font-bold text-sm text-amber-700 font-mono flex items-center gap-1">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        {rew.pointsCost} Points
                      </span>
                    </div>

                    <h4 className="font-bold text-base text-slate-900">{rew.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{rew.description}</p>
                  </div>

                  {rew.claimed ? (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Reward Claimed</span>
                      </div>
                      <div className="font-mono text-[11px] text-emerald-800 font-semibold">
                        Voucher / Code: {rew.code || 'ECO-ACTIVE'}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleClaimReward(rew.id)}
                      disabled={!canAfford || isClaiming === rew.id}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all ${
                        canAfford
                          ? 'bg-emerald-800 hover:bg-emerald-900 text-white active:scale-98'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {isClaiming === rew.id
                        ? 'Claiming...'
                        : canAfford
                        ? `Claim for ${rew.pointsCost} Points`
                        : `Need ${rew.pointsCost - userRewards.points} more points`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Activity Log */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">Point Earnings & Redemption Log</h3>

          {userRewards.history.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No points history logged yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {userRewards.history.map((log) => (
                <div key={log.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-900">{log.description}</p>
                    <p className="text-[11px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded ${
                      log.pointsAdded >= 0
                        ? 'text-emerald-700 bg-emerald-50'
                        : 'text-red-700 bg-red-50'
                    }`}
                  >
                    {log.pointsAdded >= 0 ? `+${log.pointsAdded}` : log.pointsAdded} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
