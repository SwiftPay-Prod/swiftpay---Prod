'use client';

import { BeachEscapeBackground } from './beach-escape-background';
import { CelestialInkBackground } from './celestial-ink-background';
import { CosmicPulseBackground } from './cosmic-pulse-background';
import { CyberGridBackground } from './cyber-grid-background';
import { FirefliesBackground } from './fireflies-background';
import { EtheralShadowBackground } from './etheral-shadow-background';
import { FirestormBackground } from './firestorm-background';
import { GoldDynastyBackground } from './gold-dynasty-background';
import { SpookySmokeBackground } from './spooky-smoke-background';
import { GradientBackground } from './gradient-background';
import { LampGlowBackground } from './lamp-glow-background';
import { NeuralFlowBackground } from './neural-flow-background';
import { RossoVelocityBackground } from './rosso-velocity-background';
import { StarfieldBurstBackground } from './starfield-burst-background';
import type { LiveBalanceBackgroundId, LiveBalanceBackgroundProps } from './types';

export * from './types';

interface LiveBalanceBackgroundRendererProps extends LiveBalanceBackgroundProps {
  backgroundId: LiveBalanceBackgroundId;
}

export function LiveBalanceBackgroundRenderer({ backgroundId, className }: LiveBalanceBackgroundRendererProps) {
  switch (backgroundId) {
    case 'gradient':
      return <GradientBackground className={className} />;
    case 'fireflies':
      return <FirefliesBackground className={className} />;
    case 'neural-flow':
      return <NeuralFlowBackground className={className} />;
    case 'cyber-grid':
      return <CyberGridBackground className={className} />;
    case 'celestial-ink':
      return <CelestialInkBackground className={className} />;
    case 'cosmic-pulse':
      return <CosmicPulseBackground className={className} />;
    case 'starfield-burst':
      return <StarfieldBurstBackground className={className} />;
    case 'lamp-glow':
      return <LampGlowBackground className={className} />;
    case 'firestorm':
      return <FirestormBackground className={className} />;
    case 'etheral-shadow':
      return <EtheralShadowBackground className={className} />;
    case 'spooky-smoke':
      return <SpookySmokeBackground className={className} />;
    case 'gold-dynasty':
      return <GoldDynastyBackground className={className} />;
    case 'rosso-velocity':
      return <RossoVelocityBackground className={className} />;
    case 'beach-escape':
      return <BeachEscapeBackground className={className} />;
    default:
      return <GradientBackground className={className} />;
  }
}
