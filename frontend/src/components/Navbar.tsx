import React, { useState } from 'react';
import {
  Recycle,
  Sparkles,
  BookOpen,
  History,
  Menu,
  X,
  Edit3,
  Trophy,
  MapPin,
  TrendingUp,
  Mic
} from 'lucide-react';
import type { AppLanguage } from '../constants/translations';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isBackendHealthy?: boolean | null;
  historyCount: number;
  ecoPoints?: number;
  currentLanguage?: AppLanguage;
  onLanguageChange?: (lang: AppLanguage) => void;
  onOpenVoiceAssistant?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  historyCount,
  ecoPoints = 0,
  currentLanguage = 'en',
  onOpenVoiceAssistant,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Recycle },
    { id: 'detect', label: 'AI Detection & Camera', icon: Sparkles },
    { id: 'rewards', label: 'Eco-Rewards', icon: Trophy, badgeText: `${ecoPoints} pts` },
    { id: 'locator', label: 'Drop-off Locator', icon: MapPin },
    { id: 'impact', label: 'Carbon Impact', icon: TrendingUp },
    { id: 'guidance', label: 'Disposal Guide', icon: BookOpen },
    { id: 'feedback', label: 'Review & Feedback', icon: Edit3 },
    { id: 'history', label: 'History', icon: History, count: historyCount },
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-800 to-green-900 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <Recycle className="w-6 h-6 text-emerald-300 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-emerald-950">
                  Eco<span className="text-emerald-700">Sort</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-800 border border-emerald-200">
                  AI ML
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Intelligent Waste Classification
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors relative ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-900 font-semibold border border-emerald-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                  {typeof item.count === 'number' && item.count > 0 && (
                    <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-semibold">
                      {item.count}
                    </span>
                  )}
                  {item.badgeText && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold font-mono">
                      {item.badgeText}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenVoiceAssistant}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors shadow-2xs"
              title="Open Multilingual Voice Assistant"
            >
              <Mic className="w-3.5 h-3.5 text-emerald-700 animate-pulse" />
              <span className="hidden sm:inline">Voice Assistant</span>
              <span className="text-[10px] uppercase font-bold text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                {currentLanguage === 'hi' ? 'हिन्दी' : 'EN'}
              </span>
            </button>

            {/* Mobile menu button */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-900 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {typeof item.count === 'number' && item.count > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {item.count}
                  </span>
                )}
                {item.badgeText && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
                    {item.badgeText}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
