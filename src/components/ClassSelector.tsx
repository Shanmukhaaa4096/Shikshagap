'use client';

import { useState } from 'react';
import { Sparkle } from '@phosphor-icons/react';
import {
  SUPPORTED_CLASSES,
  type ClassConfig,
  getGappuClassReaction,
} from '@/lib/curriculum/classes';

interface ClassSelectorProps {
  selectedClassId: string;
  onSelectClass: (classId: string) => void;
  className?: string;
  compact?: boolean;
  showStages?: boolean;
  onGappuReact?: (speech: string) => void;
}

export function ClassSelector({
  selectedClassId,
  onSelectClass,
  className = '',
  compact = false,
  showStages = true,
  onGappuReact,
}: ClassSelectorProps) {
  const [reactionBubble, setReactionBubble] = useState<string | null>(null);
  const [activeStageFilter, setActiveStageFilter] = useState<'all' | 'primary' | 'secondary'>('all');

  const enabledClasses = SUPPORTED_CLASSES.filter((c) => c.enabled);
  const upcomingClasses = SUPPORTED_CLASSES.filter((c) => !c.enabled);
  void upcomingClasses;

  const handleSelect = (conf: ClassConfig) => {
    onSelectClass(conf.id);
    const speech = getGappuClassReaction(conf.grade);
    setReactionBubble(speech);
    onGappuReact?.(speech);
  };

  if (compact) {
    return (
      <div className={`flex flex-col gap-1.5 ${className}`}>
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          {enabledClasses.map((conf: ClassConfig) => {
            const isSelected = conf.id === selectedClassId;
            return (
              <button
                key={conf.id}
                type="button"
                onClick={() => handleSelect(conf)}
                className={`min-h-[44px] min-w-[44px] px-3 py-1.5 text-xs sm:text-sm font-bold rounded-full border shrink-0 transition-transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground shadow-warm-sm'
                    : 'border-border bg-card text-foreground hover:bg-muted'
                }`}
                title={conf.label}
                aria-pressed={isSelected}
              >
                {isSelected && (
                  <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M8 0C6 4 4 6 0 8c4 2 6 4 8 8 2-4 4-6 8-8-4-2-6-4-8-8z" />
                  </svg>
                )}
                <span>{conf.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const primaryClasses = enabledClasses.filter((c) => c.grade <= 5);
  const secondaryClasses = enabledClasses.filter((c) => c.grade > 5);

  const displayedClasses =
    activeStageFilter === 'primary'
      ? primaryClasses
      : activeStageFilter === 'secondary'
      ? secondaryClasses
      : enabledClasses;

  return (
    <div className={`flex flex-col gap-2.5 ${className}`}>
      {/* Light Stage Toggle & Active Reaction */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        {showStages && (
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-full border border-border">
            <button
              type="button"
              onClick={() => setActiveStageFilter('all')}
              className={`min-h-[36px] px-3 text-xs font-bold rounded-full transition-colors cursor-pointer ${
                activeStageFilter === 'all'
                  ? 'bg-card text-foreground shadow-warm-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All (1–10)
            </button>
            <button
              type="button"
              onClick={() => setActiveStageFilter('primary')}
              className={`min-h-[36px] px-3 text-xs font-bold rounded-full transition-colors cursor-pointer ${
                activeStageFilter === 'primary'
                  ? 'bg-card text-foreground shadow-warm-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Primary (Classes 1 to 5)
            </button>
            <button
              type="button"
              onClick={() => setActiveStageFilter('secondary')}
              className={`min-h-[36px] px-3 text-xs font-bold rounded-full transition-colors cursor-pointer ${
                activeStageFilter === 'secondary'
                  ? 'bg-card text-foreground shadow-warm-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Middle &amp; Secondary (Classes 6 to 10)
            </button>
          </div>
        )}

        {reactionBubble && (
          <div
            role="status"
            className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full animate-in fade-in slide-in-from-bottom-1 duration-200"
          >
            <Sparkle size={13} weight="fill" className="text-secondary shrink-0" />
            <span>{reactionBubble}</span>
          </div>
        )}
      </div>

      {/* Class Buttons Grid / Horizontal Scroll */}
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 sm:gap-2">
        {displayedClasses.map((conf: ClassConfig) => {
          const isSelected = conf.id === selectedClassId;
          return (
            <button
              key={conf.id}
              type="button"
              onClick={() => handleSelect(conf)}
              className={`min-h-[46px] px-2 py-2 text-xs sm:text-sm font-bold rounded-[14px] border flex flex-col items-center justify-center gap-0.5 transition-all hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground shadow-warm-sm ring-1 ring-primary'
                  : 'border-border bg-card text-foreground hover:bg-muted'
              }`}
              aria-pressed={isSelected}
              title={`${conf.label} (${conf.stageLabel})`}
            >
              <div className="flex items-center gap-1">
                {isSelected && (
                  <svg className="w-3 h-3 fill-current shrink-0" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M8 0C6 4 4 6 0 8c4 2 6 4 8 8 2-4 4-6 8-8-4-2-6-4-8-8z" />
                  </svg>
                )}
                <span>{conf.shortLabel}</span>
              </div>
              <span className="text-[12px] font-normal opacity-85 leading-none">
                {conf.grade <= 5 ? 'Pri' : conf.grade <= 8 ? 'Mid' : 'Sec'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
