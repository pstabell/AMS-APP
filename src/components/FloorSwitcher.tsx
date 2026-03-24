"use client";

import { useState } from 'react';
import { FLOOR_LABELS, type Floor } from '@/lib/roles';

interface FloorSwitcherProps {
  currentFloor: Floor;
  onFloorChange: (floor: Floor) => void;
  compact?: boolean;
}

export default function FloorSwitcher({ currentFloor, onFloorChange, compact = false }: FloorSwitcherProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    const newFloor = currentFloor === 1 ? 2 : 1;
    
    setTimeout(() => {
      onFloorChange(newFloor);
      setIsAnimating(false);
    }, 150);
  };

  const currentLabel = FLOOR_LABELS[currentFloor];
  
  // Floor-specific styling
  const floorStyles = {
    1: {
      gradient: 'from-teal-600 to-teal-500',
      shadow: 'shadow-[0_4px_20px_rgba(20,184,166,0.3)]',
      shadowHover: 'hover:shadow-[0_6px_24px_rgba(20,184,166,0.4)]',
      bgMuted: 'bg-[var(--floor1-primary-muted)]',
      textColor: 'text-teal-400',
      borderColor: 'border-teal-500/30',
    },
    2: {
      gradient: 'from-violet-600 to-violet-500',
      shadow: 'shadow-[0_4px_20px_rgba(139,92,246,0.3)]',
      shadowHover: 'hover:shadow-[0_6px_24px_rgba(139,92,246,0.4)]',
      bgMuted: 'bg-[var(--floor2-primary-muted)]',
      textColor: 'text-violet-400',
      borderColor: 'border-violet-500/30',
    }
  };
  
  const styles = floorStyles[currentFloor];

  if (compact) {
    return (
      <button
        onClick={handleToggle}
        disabled={isAnimating}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-xl
          bg-gradient-to-r ${styles.gradient}
          ${styles.shadow} ${styles.shadowHover}
          text-white font-medium text-sm
          transition-all duration-300 
          hover:scale-105 active:scale-95
          disabled:opacity-70 disabled:cursor-not-allowed
        `}
      >
        <span>{currentFloor === 1 ? '👤' : '🏢'}</span>
        <span>Floor {currentFloor}</span>
        <span className="text-xs opacity-75">▸ {currentFloor === 1 ? '🏢' : '👤'}</span>
      </button>
    );
  }

  return (
    <div className="w-full">
      {/* Floor Info Display */}
      <div className="mb-3 text-center">
        <div className="text-xs font-medium text-[var(--foreground-subtle)] uppercase tracking-wider mb-2">
          Current View
        </div>
        <div className="flex items-center justify-center gap-3">
          <div className={`p-2 rounded-lg ${styles.bgMuted} ${styles.borderColor} border`}>
            <span className="text-2xl">{currentLabel.icon}</span>
          </div>
          <div className="text-left">
            <div className={`font-semibold text-[var(--foreground)] text-lg`}>
              {currentLabel.name}
            </div>
            <div className="text-xs text-[var(--foreground-muted)]">
              {currentLabel.description}
            </div>
          </div>
        </div>
      </div>

      {/* Toggle Switch */}
      <button 
        onClick={handleToggle}
        disabled={isAnimating}
        className={`
          relative w-full h-14 rounded-xl cursor-pointer
          transition-all duration-300 ease-out
          bg-gradient-to-r ${styles.gradient}
          ${styles.shadow} ${styles.shadowHover}
          hover:scale-[1.02] active:scale-[0.98]
          disabled:opacity-70 disabled:cursor-not-allowed
          overflow-hidden
        `}
      >
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_25%,rgba(255,255,255,0.1)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.1)_75%)] bg-[length:20px_20px]" />
        </div>
        
        {/* Switch Indicator */}
        <div 
          className={`
            absolute top-1.5 w-11 h-11 
            bg-white rounded-lg
            flex items-center justify-center text-xl
            transition-all duration-300 ease-out
            shadow-lg
            ${currentFloor === 1 ? 'left-1.5' : 'right-1.5'}
            ${isAnimating ? 'scale-90' : ''}
          `}
        >
          {currentFloor === 1 ? '👤' : '🏢'}
        </div>

        {/* Background Labels */}
        <div className="absolute inset-0 flex items-center justify-between px-16 text-white font-medium text-sm">
          <span className={`transition-all duration-200 flex items-center gap-1.5 ${currentFloor === 1 ? 'opacity-100 scale-100' : 'opacity-50 scale-95'}`}>
            <span className="w-5 text-center">👤</span>
            <span>Agent</span>
          </span>
          <span className={`transition-all duration-200 flex items-center gap-1.5 ${currentFloor === 2 ? 'opacity-100 scale-100' : 'opacity-50 scale-95'}`}>
            <span>Agency</span>
            <span className="w-5 text-center">🏢</span>
          </span>
        </div>
      </button>

      {/* Quick Info */}
      <div className="mt-3 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--background-tertiary)] border border-[var(--border-color)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-pulse" />
          <span className="text-xs text-[var(--foreground-muted)]">
            {currentFloor === 1 ? 'Viewing your personal data' : 'Viewing all agency data'}
          </span>
        </div>
      </div>
    </div>
  );
}
