'use client';

import React from 'react';

interface LuminousTypeProps {
  text: string;
  className?: string;
  italicIndices?: number[];
  italicClass?: string;
  delay?: number;
}

export function LuminousType({
  text,
  className = '',
  italicIndices = [],
  italicClass = 'italic font-normal font-serif',
}: LuminousTypeProps) {
  const words = text.split(' ');

  return (
    <span className={className} style={{ display: 'inline' }}>
      {words.map((word, i) => {
        const isItalic = italicIndices.includes(i);
        return (
          <React.Fragment key={i}>
            <span className={`inline-block ${isItalic ? italicClass : ''}`}>
              {word}
            </span>
            {i < words.length - 1 ? ' ' : ''}
          </React.Fragment>
        );
      })}
    </span>
  );
}
