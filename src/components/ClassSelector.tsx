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
                className={`min-h-[44px] min-w-[44px] px-3 py-1.5 text-sm font-mono font-bold rounded-[2px] border transition-none shrink-0 ${
                  isSelected
                    ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]'
                    : 'border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)]'
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
            className="min-h-[44px] text-sm font-mono text-[var(--muted-foreground)] hover:underline shrink-0 px-2.5 py-1.5 flex items-center"
          >
            {showUpcoming ? 'Hide other classes' : 'More classes coming soon'}
          </button>
        </div>
        {showUpcoming && (
          <div className="flex flex-wrap items-center gap-1.5 text-sm font-mono text-[var(--muted-foreground)] bg-[var(--muted)]/50 p-2 rounded-[2px]">
            <span>Coming soon:</span>
            {upcomingClasses.map((c) => (
              <span key={c.id} className="px-2 py-1 border border-[var(--border)] bg-[var(--card)] opacity-60">
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
              className={`min-h-[44px] px-3.5 py-2 text-sm font-mono font-bold rounded-[2px] border transition-none shrink-0 flex items-center gap-1.5 ${
                isSelected
                  ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]'
                  : 'border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)]'
              }`}
              aria-pressed={isSelected}
            >
              <span>{conf.label}</span>
              <span className="text-sm font-bold opacity-75">
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
          className="min-h-[44px] text-sm font-mono text-muted-foreground dark:text-muted-foreground hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          <span>{showUpcoming ? 'Hide upcoming classes' : `More classes coming soon (Classes ${upcomingListText})`}</span>
        </button>

        {showUpcoming && (
          <div className="mt-2 flex flex-wrap gap-1.5 p-2 bg-card border border-border rounded-[2px]">
            {upcomingClasses.map((conf: ClassConfig) => (
              <span
                key={conf.id}
                className="text-sm font-mono px-2 py-1 bg-muted dark:bg-card border border-border text-muted-foreground dark:text-muted-foreground"
              >
                {conf.label} (Coming soon)
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
