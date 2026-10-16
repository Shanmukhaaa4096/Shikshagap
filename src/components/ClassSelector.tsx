'use client';

import { useState } from 'react';
import { SUPPORTED_CLASSES, type ClassConfig } from '@/lib/curriculum/classes';

interface ClassSelectorProps {
  selectedClassId: string;
  onSelectClass: (classId: string) => void;
  className?: string;
  compact?: boolean;
}

export function ClassSelector({
  selectedClassId,
  onSelectClass,
  className = '',
  compact = false,
}: ClassSelectorProps) {
  const [showUpcoming, setShowUpcoming] = useState(false);
  const enabledClasses = SUPPORTED_CLASSES.filter((c) => c.enabled);
  const upcomingClasses = SUPPORTED_CLASSES.filter((c) => !c.enabled);

  if (compact) {
    return (
      <div className={`flex flex-col gap-1.5 ${className}`}>
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {enabledClasses.map((conf: ClassConfig) => {
            const isSelected = conf.id === selectedClassId;
            return (
              <button
                key={conf.id}
                type="button"
                onClick={() => onSelectClass(conf.id)}
                className={`min-h-[44px] min-w-[44px] px-3.5 py-1.5 text-sm font-bold rounded-full border shrink-0 transition-transform hover:-translate-y-0.5 cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground shadow-warm-sm'
                    : 'border-border bg-card text-foreground hover:bg-muted'
                }`}
                title={conf.label}
              >
                {conf.shortLabel}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setShowUpcoming(!showUpcoming)}
            className="min-h-[44px] text-sm font-bold text-muted-foreground hover:text-foreground hover:underline shrink-0 px-2.5 py-1.5 flex items-center cursor-pointer"
          >
            {showUpcoming ? 'Hide other classes' : 'More classes coming soon'}
          </button>
        </div>
        {showUpcoming && (
          <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground bg-muted/60 p-2.5 rounded-[16px] border border-border">
            <span className="font-bold">Coming soon:</span>
            {upcomingClasses.map((c) => (
              <span key={c.id} className="px-2.5 py-1 border border-border bg-card rounded-full opacity-70">
                {c.label}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  const upcomingListText = upcomingClasses.map((c) => c.shortLabel).join(', ');

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2 overflow-x-auto py-1">
        {enabledClasses.map((conf: ClassConfig) => {
          const isSelected = conf.id === selectedClassId;
          return (
            <button
              key={conf.id}
              type="button"
              onClick={() => onSelectClass(conf.id)}
              className={`min-h-[44px] px-4 py-2 text-sm font-bold rounded-full border shrink-0 flex items-center gap-1.5 transition-transform hover:-translate-y-0.5 cursor-pointer ${
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground shadow-warm-sm'
                  : 'border-border bg-card text-foreground hover:bg-muted'
              }`}
              aria-pressed={isSelected}
            >
              <span>{conf.label}</span>
              <span className="text-sm font-normal opacity-90">
                ({conf.topics.length} topics)
              </span>
            </button>
          );
        })}
      </div>

      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowUpcoming(!showUpcoming)}
          className="min-h-[44px] text-sm font-bold text-muted-foreground hover:text-foreground hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          <span>{showUpcoming ? 'Hide upcoming class roadmap' : 'See classes 1, 2, 6–10 coverage status'}</span>
        </button>
      </div>

      {showUpcoming && (
        <div className="p-3.5 bg-muted/60 border border-border rounded-[18px] text-sm space-y-1.5 leading-relaxed">
          <div className="font-bold text-foreground">Classes 1, 2, 6–10 Curriculum Status:</div>
          <p className="text-foreground/80">
            Official NCERT Math-Magic & Mathematics textbooks for {upcomingListText} are completely mapped into our acyclic prerequisite skill graph. Automated multi-choice question generators for these grades are undergoing pedagogical verification.
          </p>
        </div>
      )}
    </div>
  );
}
