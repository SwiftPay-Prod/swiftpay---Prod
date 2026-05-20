'use client';

import { Confetti } from '@/components/ui/confetti';
import type { LiveBalanceSettings } from './settings';

interface LiveBalanceEffectsProps {
	confettiKey: number;
	profitPulseKey: number;
	wealthBurstKey: number;
	moneyRainKey: number;
	victoryOrbitKey: number;
	sellerStickerKey: number;
	cashTrailKey: number;
	jackpotFlashKey: number;
	diamondDustKey: number;
	royalCrownKey: number;
	lastIncreaseAmount: number;
	settings: LiveBalanceSettings;
}

interface EffectIntensity {
	confettiPieces: number;
	pulseRings: number;
	wealthItems: number;
	moneyRainItems: number;
	victoryOrbitItems: number;
	sellerStickerItems: number;
	cashTrailItems: number;
	jackpotRayCount: number;
	diamondDustItems: number;
	royalCrownItems: number;
	centerGlowScale: number;
	confettiSpread: number;
	confettiVelocity: number;
	confettiScalar: number;
}

function formatCompactCurrency(amount: number) {
	return new Intl.NumberFormat('pt-BR', {
		notation: 'compact',
		minimumFractionDigits: amount >= 100000 ? 0 : 1,
		maximumFractionDigits: 1,
	}).format(amount / 100);
}

function getEffectIntensity(amount: number): EffectIntensity {
	if (amount >= 100000) {
		return {
			confettiPieces: 72,
			pulseRings: 5,
			wealthItems: 28,
			moneyRainItems: 26,
			victoryOrbitItems: 14,
			sellerStickerItems: 10,
			cashTrailItems: 14,
			jackpotRayCount: 16,
			diamondDustItems: 34,
			royalCrownItems: 7,
			centerGlowScale: 1.55,
			confettiSpread: 96,
			confettiVelocity: 62,
			confettiScalar: 1.22,
		};
	}

	if (amount >= 50000) {
		return {
			confettiPieces: 58,
			pulseRings: 4,
			wealthItems: 24,
			moneyRainItems: 22,
			victoryOrbitItems: 12,
			sellerStickerItems: 8,
			cashTrailItems: 12,
			jackpotRayCount: 14,
			diamondDustItems: 28,
			royalCrownItems: 6,
			centerGlowScale: 1.45,
			confettiSpread: 88,
			confettiVelocity: 58,
			confettiScalar: 1.14,
		};
	}

	if (amount >= 10000) {
		return {
			confettiPieces: 46,
			pulseRings: 4,
			wealthItems: 20,
			moneyRainItems: 18,
			victoryOrbitItems: 10,
			sellerStickerItems: 7,
			cashTrailItems: 10,
			jackpotRayCount: 12,
			diamondDustItems: 24,
			royalCrownItems: 5,
			centerGlowScale: 1.35,
			confettiSpread: 78,
			confettiVelocity: 52,
			confettiScalar: 1.02,
		};
	}

	return {
		confettiPieces: 32,
		pulseRings: 3,
		wealthItems: 16,
		moneyRainItems: 14,
		victoryOrbitItems: 8,
		sellerStickerItems: 6,
		cashTrailItems: 8,
		jackpotRayCount: 10,
		diamondDustItems: 18,
		royalCrownItems: 4,
		centerGlowScale: 1.2,
		confettiSpread: 66,
		confettiVelocity: 46,
		confettiScalar: 0.94,
	};
}

function CashTrail({ trailKey, amount }: { trailKey: number; amount: number }) {
	if (trailKey === 0 || amount <= 0) {
		return null;
	}

	const intensity = getEffectIntensity(amount);

	return (
		<div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 120 }}>
			{Array.from({ length: intensity.cashTrailItems }).map((_, index) => {
				const left = 8 + ((index * 11) % 84);
				const delay = `${(index % 6) * 70}ms`;
				const duration = 820 + (index % 4) * 90;
				const height = 72 + (index % 5) * 18;
				const rotate = -14 + (index % 7) * 4;

				return (
					<span
						key={`cash-trail-${trailKey}-${index}`}
						className="absolute bottom-[-18%] w-1 rounded-full bg-linear-to-t from-emerald-300/0 via-emerald-300/85 to-yellow-200/95 opacity-0 blur-[1px]"
						style={{
							left: `${left}%`,
							height: `${height}px`,
							animation: `live-balance-cash-trail ${duration}ms ease-out ${delay} forwards`,
							['--cash-trail-rotate' as string]: `${rotate}deg`,
						}}
					/>
				);
			})}
		</div>
	);
}

function JackpotFlash({ flashKey, amount }: { flashKey: number; amount: number }) {
	if (flashKey === 0 || amount <= 0) {
		return null;
	}

	const intensity = getEffectIntensity(amount);

	return (
		<div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 127 }}>
			<span className="absolute inset-0 bg-radial from-yellow-200/18 via-amber-300/8 to-transparent opacity-0" style={{ animation: 'live-balance-jackpot-flash 760ms ease-out forwards' }} />
			{Array.from({ length: intensity.jackpotRayCount }).map((_, index) => {
				const angle = (360 / intensity.jackpotRayCount) * index;
				const delay = `${(index % 4) * 45}ms`;

				return (
					<span
						key={`jackpot-ray-${flashKey}-${index}`}
						className="absolute left-1/2 top-1/2 h-40 w-1.5 origin-bottom rounded-full bg-linear-to-t from-yellow-300/0 via-yellow-200/95 to-white opacity-0 blur-[1px]"
						style={{
							animation: `live-balance-jackpot-ray 900ms ease-out ${delay} forwards`,
							['--jackpot-angle' as string]: `${angle}deg`,
						}}
					/>
				);
			})}
		</div>
	);
}

function DiamondDust({ dustKey, amount }: { dustKey: number; amount: number }) {
	if (dustKey === 0 || amount <= 0) {
		return null;
	}

	const intensity = getEffectIntensity(amount);

	return (
		<div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 128 }}>
			{Array.from({ length: intensity.diamondDustItems }).map((_, index) => {
				const left = 10 + ((index * 17) % 80);
				const top = 16 + ((index * 19) % 56);
				const delay = `${(index % 8) * 55}ms`;
				const dx = -24 + (index % 7) * 8;
				const dy = 18 + (index % 6) * 7;

				return (
					<span
						key={`diamond-dust-${dustKey}-${index}`}
						className="absolute flex size-4 items-center justify-center text-[11px] text-cyan-100 opacity-0 drop-shadow-[0_0_10px_rgba(255,255,255,0.65)]"
						style={{
							left: `${left}%`,
							top: `${top}%`,
							animation: `live-balance-diamond-dust 980ms ease-out ${delay} forwards`,
							['--diamond-dx' as string]: `${dx}px`,
							['--diamond-dy' as string]: `${dy}px`,
						}}
					>
						✧
					</span>
				);
			})}
		</div>
	);
}

function RoyalCrown({ crownKey, amount }: { crownKey: number; amount: number }) {
	if (crownKey === 0 || amount <= 0) {
		return null;
	}

	const intensity = getEffectIntensity(amount);

	return (
		<div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 129 }}>
			{Array.from({ length: intensity.royalCrownItems }).map((_, index) => {
				const left = 18 + ((index * 14) % 60);
				const delay = `${index * 90}ms`;
				const rise = 48 + (index % 3) * 16;

				return (
					<span
						key={`royal-crown-${crownKey}-${index}`}
						className="absolute top-[56%] text-xl opacity-0 drop-shadow-[0_12px_24px_rgba(250,204,21,0.35)]"
						style={{
							left: `${left}%`,
							animation: `live-balance-royal-crown 1200ms cubic-bezier(0.19,1,0.22,1) ${delay} forwards`,
							['--royal-rise' as string]: `${rise}px`,
						}}
					>
						👑
					</span>
				);
			})}
		</div>
	);
}

function ConfettiBurst({ burstKey, amount }: { burstKey: number; amount: number }) {
	if (burstKey === 0 || amount <= 0) {
		return null;
	}

	const intensity = getEffectIntensity(amount);

	return (
		<Confetti
			triggerKey={burstKey}
			zIndex={125}
			bursts={[
				{
					particleCount: Math.ceil(intensity.confettiPieces * 0.42),
					angle: 62,
					spread: intensity.confettiSpread,
					startVelocity: intensity.confettiVelocity,
					scalar: intensity.confettiScalar,
					decay: 0.92,
					gravity: 1,
					ticks: 260,
					drift: 0.08,
					origin: { x: 0.12, y: 0.58 },
					colors: ['#34d399', '#10b981', '#fde047', '#f59e0b', '#ffffff'],
					shapes: ['square', 'circle'],
				},
				{
					particleCount: Math.ceil(intensity.confettiPieces * 0.42),
					angle: 118,
					spread: intensity.confettiSpread,
					startVelocity: intensity.confettiVelocity,
					scalar: intensity.confettiScalar,
					decay: 0.92,
					gravity: 1,
					ticks: 260,
					drift: -0.08,
					origin: { x: 0.88, y: 0.58 },
					colors: ['#34d399', '#10b981', '#fde047', '#f59e0b', '#ffffff'],
					shapes: ['square', 'circle'],
				},
				{
					particleCount: Math.ceil(intensity.confettiPieces * 0.3),
					angle: 90,
					spread: intensity.confettiSpread + 12,
					startVelocity: Math.max(34, intensity.confettiVelocity - 8),
					scalar: Math.max(0.9, intensity.confettiScalar - 0.08),
					decay: 0.91,
					gravity: 1.08,
					ticks: 220,
					origin: { x: 0.5, y: 0.42 },
					colors: ['#34d399', '#10b981', '#fde047', '#f59e0b', '#ffffff'],
					shapes: ['circle'],
				},
			]}
		/>
	);
}

function ProfitPulse({ pulseKey, amount }: { pulseKey: number; amount: number }) {
	if (pulseKey === 0 || amount <= 0) {
		return null;
	}

	const intensity = getEffectIntensity(amount);

	return (
		<div key={`pulse-${pulseKey}`} className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 123 }}>
			{Array.from({ length: intensity.pulseRings }).map((_, index) => (
				<span
					key={`profit-pulse-${pulseKey}-${index}`}
					className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-300/45 bg-radial from-emerald-300/18 via-emerald-300/8 to-transparent opacity-0"
					style={{
						animation: `live-balance-profit-pulse 1200ms cubic-bezier(0.22, 1, 0.36, 1) ${index * 120}ms forwards`,
					}}
				/>
			))}
			<span
				className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-radial from-yellow-300/18 via-yellow-300/6 to-transparent opacity-0"
				style={{
					animation: 'live-balance-profit-glow 900ms ease-out forwards',
					['--glow-scale' as string]: String(intensity.centerGlowScale),
				}}
			/>
		</div>
	);
}

function WealthBurst({ burstKey, amount }: { burstKey: number; amount: number }) {
	if (burstKey === 0 || amount <= 0) {
		return null;
	}

	const labels = ['R$', '$', '+lucro', `+${formatCompactCurrency(amount)}`];
	const intensity = getEffectIntensity(amount);

	return (
		<div key={`wealth-${burstKey}`} className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 124 }}>
			{Array.from({ length: intensity.wealthItems }).map((_, index) => {
				const offsetX = (index % 2 === 0 ? 1 : -1) * (30 + (index * 14) % 180);
				const offsetY = 40 + (index * 16) % 170;
				const delay = `${(index % 6) * 55}ms`;
				const label = labels[index % labels.length];
				const isCoin = index % 3 === 0;

				return (
					<span
						key={`wealth-chip-${burstKey}-${index}`}
						className={isCoin
							? 'absolute left-1/2 top-[58%] flex size-9 items-center justify-center rounded-full border border-yellow-200/55 bg-linear-to-br from-yellow-300/80 via-amber-300/85 to-yellow-500/85 text-[11px] font-black text-amber-950 opacity-0 shadow-[0_14px_30px_rgba(250,204,21,0.3)]'
							: 'absolute left-1/2 top-[58%] rounded-full border border-emerald-200/30 bg-black/30 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-50 opacity-0 shadow-[0_14px_30px_rgba(16,185,129,0.18)] backdrop-blur-md'}
						style={{
							animation: `live-balance-wealth-burst 1450ms cubic-bezier(0.19, 1, 0.22, 1) ${delay} forwards`,
							['--tx' as string]: `${offsetX}px`,
							['--ty' as string]: `${offsetY}px`,
						}}
					>
						{isCoin ? 'R$' : label}
					</span>
				);
			})}
		</div>
	);
}

function MoneyRain({ rainKey, amount }: { rainKey: number; amount: number }) {
	if (rainKey === 0 || amount <= 0) {
		return null;
	}

	const intensity = getEffectIntensity(amount);
	const labels = ['R$', '$', 'PIX', '+'];

	return (
		<div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 121 }}>
			{Array.from({ length: intensity.moneyRainItems }).map((_, index) => {
				const left = 6 + ((index * 91) % 88);
				const delay = `${(index % 7) * 90}ms`;
				const duration = 1400 + (index % 4) * 140;
				const rotation = -18 + (index % 6) * 7;
				const drift = -30 + (index % 5) * 15;
				const isBill = index % 3 !== 0;

				return (
					<span
						key={`money-rain-${rainKey}-${index}`}
						className={isBill
							? 'absolute top-[-12%] rounded-2xl border border-emerald-200/35 bg-linear-to-br from-emerald-300/85 via-emerald-400/75 to-teal-500/75 px-3 py-1.5 text-[10px] font-black tracking-[0.22em] text-emerald-950 opacity-0 shadow-[0_16px_28px_rgba(16,185,129,0.28)]'
							: 'absolute top-[-12%] flex size-10 items-center justify-center rounded-full border border-yellow-100/55 bg-linear-to-br from-yellow-300/90 via-amber-300/85 to-yellow-500/90 text-[11px] font-black text-amber-950 opacity-0 shadow-[0_16px_30px_rgba(245,158,11,0.3)]'}
						style={{
							left: `${left}%`,
							animation: `live-balance-money-rain ${duration}ms linear ${delay} forwards`,
							['--money-rotate' as string]: `${rotation}deg`,
							['--money-drift' as string]: `${drift}px`,
						}}
					>
						{labels[index % labels.length]}
					</span>
				);
			})}
		</div>
	);
}

function VictoryOrbit({ orbitKey, amount }: { orbitKey: number; amount: number }) {
	if (orbitKey === 0 || amount <= 0) {
		return null;
	}

	const intensity = getEffectIntensity(amount);

	return (
		<div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 122 }}>
			<span
				className="absolute left-1/2 top-1/2 h-88 w-88 -translate-x-1/2 -translate-y-1/2 rounded-full border border-yellow-300/30 opacity-0"
				style={{ animation: 'live-balance-victory-orbit 1600ms ease-out forwards' }}
			/>
			<span
				className="absolute left-1/2 top-1/2 h-68 w-68 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-300/30 opacity-0"
				style={{ animation: 'live-balance-victory-orbit 1300ms ease-out 80ms forwards' }}
			/>
			{Array.from({ length: intensity.victoryOrbitItems }).map((_, index) => {
				const angle = (360 / intensity.victoryOrbitItems) * index;
				const radius = 116 + (index % 3) * 18;
				return (
					<span
						key={`victory-orbit-${orbitKey}-${index}`}
						className="absolute left-1/2 top-1/2 flex size-8 items-center justify-center rounded-full bg-white/10 text-sm font-black text-yellow-200 opacity-0 backdrop-blur-sm"
						style={{
							animation: `live-balance-victory-star 1450ms cubic-bezier(0.22, 1, 0.36, 1) ${(index % 5) * 70}ms forwards`,
							['--orbit-angle' as string]: `${angle}deg`,
							['--orbit-radius' as string]: `${radius}px`,
						}}
					>
						✦
					</span>
				);
			})}
		</div>
	);
}

function SellerStickers({ stickerKey, amount }: { stickerKey: number; amount: number }) {
	if (stickerKey === 0 || amount <= 0) {
		return null;
	}

	const intensity = getEffectIntensity(amount);
	const labels = ['BOA!', 'PIX!', 'VENDA!', 'META+', 'CAIXA'];

	return (
		<div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 126 }}>
			{Array.from({ length: intensity.sellerStickerItems }).map((_, index) => {
				const left = 18 + ((index * 13) % 64);
				const top = 18 + ((index * 9) % 40);
				const rotate = -18 + (index % 6) * 7;
				const dx = -34 + (index % 5) * 18;
				const dy = 28 + (index % 4) * 12;
				const scale = 0.92 + (index % 3) * 0.08;
				const palette = index % 3;

				const className = palette === 0
					? 'absolute rounded-full border border-yellow-100/65 bg-linear-to-r from-yellow-300/95 to-amber-400/90 px-4 py-2 text-xs font-black tracking-[0.18em] text-amber-950 opacity-0 shadow-[0_18px_30px_rgba(245,158,11,0.32)]'
					: palette === 1
						? 'absolute rounded-full border border-emerald-100/45 bg-linear-to-r from-emerald-300/90 to-teal-400/88 px-4 py-2 text-xs font-black tracking-[0.18em] text-emerald-950 opacity-0 shadow-[0_18px_30px_rgba(16,185,129,0.28)]'
						: 'absolute rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-black tracking-[0.18em] text-white opacity-0 shadow-[0_18px_30px_rgba(255,255,255,0.14)] backdrop-blur-md';

				return (
					<span
						key={`seller-sticker-${stickerKey}-${index}`}
						className={className}
						style={{
							left: `${left}%`,
							top: `${top}%`,
							animation: `live-balance-seller-sticker 1200ms cubic-bezier(0.19, 1, 0.22, 1) ${(index % 4) * 80}ms forwards`,
							['--sticker-rotate' as string]: `${rotate}deg`,
							['--sticker-dx' as string]: `${dx}px`,
							['--sticker-dy' as string]: `${dy}px`,
							['--sticker-scale' as string]: String(scale),
						}}
					>
						{labels[index % labels.length]}
					</span>
				);
			})}
		</div>
	);
}

export function LiveBalanceEffects({ confettiKey, profitPulseKey, wealthBurstKey, moneyRainKey, victoryOrbitKey, sellerStickerKey, cashTrailKey, jackpotFlashKey, diamondDustKey, royalCrownKey, lastIncreaseAmount, settings }: LiveBalanceEffectsProps) {
	return (
		<>
			{settings.enableCashTrail && <CashTrail key={`cash-trail-${cashTrailKey}`} trailKey={cashTrailKey} amount={lastIncreaseAmount} />}
			{settings.enableJackpotFlash && <JackpotFlash key={`jackpot-flash-${jackpotFlashKey}`} flashKey={jackpotFlashKey} amount={lastIncreaseAmount} />}
			{settings.enableDiamondDust && <DiamondDust key={`diamond-dust-${diamondDustKey}`} dustKey={diamondDustKey} amount={lastIncreaseAmount} />}
			{settings.enableRoyalCrown && <RoyalCrown key={`royal-crown-${royalCrownKey}`} crownKey={royalCrownKey} amount={lastIncreaseAmount} />}
			{settings.enableMoneyRain && <MoneyRain key={`money-rain-${moneyRainKey}`} rainKey={moneyRainKey} amount={lastIncreaseAmount} />}
			{settings.enableVictoryOrbit && <VictoryOrbit key={`victory-orbit-${victoryOrbitKey}`} orbitKey={victoryOrbitKey} amount={lastIncreaseAmount} />}
			{settings.enableProfitPulse && <ProfitPulse key={`profit-pulse-${profitPulseKey}`} pulseKey={profitPulseKey} amount={lastIncreaseAmount} />}
			{settings.enableWealthBurst && <WealthBurst key={`wealth-burst-${wealthBurstKey}`} burstKey={wealthBurstKey} amount={lastIncreaseAmount} />}
			{settings.enableSellerStickers && <SellerStickers key={`seller-sticker-${sellerStickerKey}`} stickerKey={sellerStickerKey} amount={lastIncreaseAmount} />}
			{settings.enableConfetti && <ConfettiBurst key={`confetti-burst-${confettiKey}`} burstKey={confettiKey} amount={lastIncreaseAmount} />}

			<style jsx>{`
				@keyframes live-balance-cash-trail {
					0% {
						opacity: 0;
						transform: translate3d(0, 12px, 0) rotate(var(--cash-trail-rotate)) scaleY(0.5);
					}
					15% {
						opacity: 1;
					}
					100% {
						opacity: 0;
						transform: translate3d(0, -72vh, 0) rotate(var(--cash-trail-rotate)) scaleY(1.2);
					}
				}

				@keyframes live-balance-jackpot-flash {
					0% {
						opacity: 0;
					}
					20% {
						opacity: 1;
					}
					100% {
						opacity: 0;
					}
				}

				@keyframes live-balance-jackpot-ray {
					0% {
						opacity: 0;
						transform: translate(-50%, -100%) rotate(var(--jackpot-angle)) scaleY(0.3);
					}
					24% {
						opacity: 1;
					}
					100% {
						opacity: 0;
						transform: translate(-50%, -100%) rotate(var(--jackpot-angle)) scaleY(1.18);
					}
				}

				@keyframes live-balance-diamond-dust {
					0% {
						opacity: 0;
						transform: translate3d(0, 8px, 0) scale(0.45);
					}
					20% {
						opacity: 1;
					}
					100% {
						opacity: 0;
						transform: translate3d(var(--diamond-dx), calc(-1 * var(--diamond-dy)), 0) scale(1.1);
					}
				}

				@keyframes live-balance-royal-crown {
					0% {
						opacity: 0;
						transform: translate(-50%, 10px) scale(0.55) rotate(-8deg);
					}
					22% {
						opacity: 1;
					}
					100% {
						opacity: 0;
						transform: translate(-50%, calc(-1 * var(--royal-rise))) scale(1.08) rotate(4deg);
					}
				}

				@keyframes live-balance-money-rain {
					0% {
						opacity: 0;
						transform: translate3d(0, -4%, 0) rotate(var(--money-rotate)) scale(0.7);
					}
					12% {
						opacity: 1;
					}
					100% {
						opacity: 0;
						transform: translate3d(var(--money-drift), 118vh, 0) rotate(calc(var(--money-rotate) + 36deg)) scale(1.05);
					}
				}

				@keyframes live-balance-victory-orbit {
					0% {
						opacity: 0;
						transform: translate(-50%, -50%) scale(0.82);
					}
					25% {
						opacity: 0.9;
					}
					100% {
						opacity: 0;
						transform: translate(-50%, -50%) scale(1.14);
					}
				}

				@keyframes live-balance-victory-star {
					0% {
						opacity: 0;
						transform: translate(-50%, -50%) rotate(var(--orbit-angle)) translateY(calc(-1 * var(--orbit-radius))) scale(0.2);
					}
					20% {
						opacity: 1;
					}
					100% {
						opacity: 0;
						transform: translate(-50%, -50%) rotate(calc(var(--orbit-angle) + 38deg)) translateY(calc(-1 * (var(--orbit-radius) + 18px))) scale(1.08);
					}
				}

				@keyframes live-balance-profit-pulse {
					0% {
						opacity: 0;
						transform: translate(-50%, -50%) scale(0.4);
					}
					25% {
						opacity: 0.95;
					}
					100% {
						opacity: 0;
						transform: translate(-50%, -50%) scale(2.15);
					}
				}

				@keyframes live-balance-profit-glow {
					0% {
						opacity: 0;
						transform: translate(-50%, -50%) scale(0.7);
					}
					30% {
						opacity: 0.9;
					}
					100% {
						opacity: 0;
						transform: translate(-50%, -50%) scale(var(--glow-scale, 1.35));
					}
				}

				@keyframes live-balance-wealth-burst {
					0% {
						opacity: 0;
						transform: translate(-50%, 0) scale(0.6);
					}
					18% {
						opacity: 1;
					}
					100% {
						opacity: 0;
						transform: translate(calc(-50% + var(--tx)), calc(-1 * var(--ty))) scale(1.08);
					}
				}

				@keyframes live-balance-seller-sticker {
					0% {
						opacity: 0;
						transform: translate(-50%, 14px) rotate(var(--sticker-rotate)) scale(0.5);
					}
					18% {
						opacity: 1;
					}
					100% {
						opacity: 0;
						transform: translate(calc(-50% + var(--sticker-dx)), calc(-1 * var(--sticker-dy))) rotate(calc(var(--sticker-rotate) + 6deg)) scale(var(--sticker-scale));
					}
				}

			`}</style>
		</>
	);
}
