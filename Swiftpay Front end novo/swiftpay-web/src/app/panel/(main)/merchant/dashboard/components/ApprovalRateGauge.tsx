'use client';

import { Cell, Pie, PieChart } from 'recharts';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { approvalRateLevelParse } from '@/parse';
import { ApprovalRateLevel } from '@/types/enums';

const GAUGE_SEGMENTS = [
  { name: '0–15%', value: 15, color: '#d4d4d4' },
  { name: '15–25%', value: 10, color: '#a3a3a3' },
  { name: '25–35%', value: 10, color: '#737373' },
  { name: '35–50%', value: 15, color: '#404040' },
  { name: '50%+', value: 50, color: '#171717' },
];

const LEVEL_COLOR_MAP: Record<string, string> = {
  danger: 'text-[#ef4444]',
  warning: 'text-[#f59e0b]',
  default: 'text-[#f59e0b]',
  accent: 'text-[#8b5cf6]',
  success: 'text-[#22c55e]',
};

const RADIAN = Math.PI / 180;

interface ApprovalRateGaugeProps {
  approvalRate: number;
  approvalRateLevel?: ApprovalRateLevel | null;
  isProcessing?: boolean;
  isBalanceVisible: boolean;
}

export function ApprovalRateGauge({ approvalRate, approvalRateLevel, isProcessing, isBalanceVisible }: ApprovalRateGaugeProps) {
  const cx = 100;
  const cy = 85;
  const innerRadius = 50;
  const outerRadius = 75;

  const ang = 180 - (Math.min(Math.max(approvalRate, 0), 100) / 100) * 180;
  const length = (innerRadius + outerRadius) / 2;
  const needleX = cx + length * Math.cos(-RADIAN * ang);
  const needleY = cy + length * Math.sin(-RADIAN * ang);

  const levelKey = approvalRateLevel ?? ApprovalRateLevel.Average;
  const levelParse = approvalRateLevelParse[levelKey] ?? approvalRateLevelParse[ApprovalRateLevel.Average];

  return (
    <div className={`mockup-chart-card ${isProcessing ? 'opacity-70' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="mockup-chart-title">Taxa de Aprovação</div>
          <p className="text-xs text-muted-foreground mt-0.5">Desempenho dos pagamentos</p>
        </div>
        {isProcessing && <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#a3e635] border-t-transparent" />}
      </div>
      <div className="flex flex-col items-center pt-2">
        <PieChart width={200} height={110}>
          <Pie
            data={GAUGE_SEGMENTS}
            cx={cx}
            cy={cy}
            startAngle={180}
            endAngle={0}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            dataKey="value"
            stroke="none"
          >
            {GAUGE_SEGMENTS.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <g>
            <circle cx={cx} cy={cy} r={4} fill="currentColor" className="text-foreground" />
            <path
              d={`M ${cx} ${cy} L ${needleX} ${needleY}`}
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              className="text-foreground"
            />
          </g>
        </PieChart>
        <div className="-mt-2 flex flex-col items-center gap-0.5">
          <AnimatedNumber
            value={approvalRate}
            suffix="%"
            maximumFractionDigits={1}
            className={`mockup-kpi-value ${isBalanceVisible ? '' : 'visual-blur'}`}
          />
          <span className={`text-xs font-medium ${LEVEL_COLOR_MAP[levelParse.color]} ${isBalanceVisible ? '' : 'visual-blur'}`}>
            {levelParse.label}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[10px] text-muted-foreground">
          {GAUGE_SEGMENTS.map((seg) => (
            <div key={seg.name} className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: seg.color }} />
              <span>{seg.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
