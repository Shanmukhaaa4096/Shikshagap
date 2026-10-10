'use client';

import React from 'react';
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
  return (
    <div className={`flex items-center gap-1.5 overflow-x-auto py-1 ${className}`}>
      {SUPPORTED_CLASSES.map((conf: ClassConfig) => {
        const isSelected = conf.id === selectedClassId;
        const isEnabled = conf.enabled;

        if (compact) {
          return (
            <button
              key={conf.id}
              type="button"
              disabled={!isEnabled}
              onClick={() => isEnabled && onSelectClass(conf.id)}
              className={`min-h-[36px] px-2.5 py-1 text-xs font-mono font-bold rounded-[2px] border transition-none shrink-0 ${
                !isEnabled
                  ? 'border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)] opacity-50 cursor-not-allowed'
                  : isSelected
                  ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]'
                  : 'border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)]'
              }`}
              title={isEnabled ? conf.label : `${conf.label} (Coming soon)`}
            >
              {conf.shortLabel}
              {!isEnabled && <span className="ml-1 text-[9px] font-normal tracking-tight">(Soon)</span>}
            </button>
          );
        }

        return (
          <button
            key={conf.id}
            type="button"
            disabled={!isEnabled}
            onClick={() => isEnabled && onSelectClass(conf.id)}
            className={`min-h-[44px] px-3.5 py-2 text-xs font-mono font-bold rounded-[2px] border transition-none shrink-0 flex items-center gap-1.5 ${
              !isEnabled
                ? 'border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)] opacity-50 cursor-not-allowed'
                : isSelected
                ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]'
                : 'border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)]'
            }`}
            aria-pressed={isSelected}
            aria-disabled={!isEnabled}
          >
            <span>{conf.label}</span>
            {!isEnabled ? (
              <span className="text-[10px] font-normal uppercase px-1 py-0.2 bg-[var(--background)] border border-[var(--border)] rounded-[2px]">
                Soon
              </span>
            ) : (
              <span className="text-[10px] font-bold opacity-75">
                ({conf.topics.length} topics)
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
