'use client';

import { Gappu, GappuProps } from './Gappu';

export type MascotHeroProps = GappuProps;

/**
 * MascotHero: Backwards-compatible wrapper rendering the upgraded, interactive Gappu the Owl
 * in the Sealed Stories warm whimsical palette.
 */
export function MascotHero(props: MascotHeroProps) {
  return <Gappu {...props} />;
}
