'use client';

import { DASHBOARD_LAYOUT_OPTIONS, type DashboardLayoutId } from '@/hooks/use-dashboard-layout';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

function LayoutPreview({ id, active }: { id: DashboardLayoutId; active: boolean }) {
  const blk = `rounded-[1px] ${active ? 'bg-[#8b5cf6]/80' : 'bg-[#f4f4f5]/25'}`;

  if (id === 'standard') {
    return (
      <div className="flex w-9 flex-col gap-0.5">
        <div className={`h-1.25 w-full ${blk}`} />
        <div className="flex gap-0.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`h-1 flex-1 ${blk}`} />
          ))}
        </div>
        <div className="flex gap-0.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`h-1 flex-1 ${blk}`} />
          ))}
        </div>
        <div className="flex gap-0.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-0.5 flex-1 ${blk}`} />
          ))}
        </div>
        <div className="flex gap-0.5">
          <div className={`h-1 flex-1 ${blk}`} />
          <div className={`h-1 flex-1 ${blk}`} />
        </div>
      </div>
    );
  }

  if (id === 'focus-charts') {
    return (
      <div className="flex w-9 flex-col gap-0.5">
        <div className="flex gap-0.5">
          <div className={`h-1.25 flex-1 ${blk}`} />
          <div className={`h-1.25 flex-1 ${blk}`} />
        </div>
        <div className="flex gap-0.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`h-1 flex-1 ${blk}`} />
          ))}
        </div>
        <div className="flex gap-0.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`h-1 flex-1 ${blk}`} />
          ))}
        </div>
        <div className="flex gap-0.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-0.5 flex-1 ${blk}`} />
          ))}
        </div>
        <div className={`h-1 w-full ${blk}`} />
      </div>
    );
  }

  if (id === 'focus-kpis') {
    return (
      <div className="flex w-9 flex-col gap-0.5">
        <div className="flex gap-0.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`h-1.25 flex-1 ${blk}`} />
          ))}
        </div>
        <div className="flex gap-0.5">
          {[0, 1, 2, 3].map((i) => (
            <div className={`h-1.25 flex-1 ${blk}`} />
          ))}
        </div>
        <div className="flex gap-0.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-0.5 flex-1 ${blk}`} />
          ))}
        </div>
        <div className={`h-1 w-full ${blk}`} />
        <div className="flex gap-0.5">
          <div className={`h-1 flex-1 ${blk}`} />
          <div className={`h-1 flex-1 ${blk}`} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-9 flex-col gap-0.5">
      <div className="flex gap-0.5">
        <div className={`h-1.25 flex-2 ${blk}`} />
        <div className={`h-1.25 flex-1 ${blk}`} />
      </div>
      <div className="flex gap-0.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-0.75 flex-1 ${blk}`} />
        ))}
      </div>
      <div className="flex gap-0.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-0.75 flex-1 ${blk}`} />
        ))}
      </div>
      <div className="flex gap-0.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-0.5 flex-1 ${blk}`} />
        ))}
      </div>
      <div className={`h-0.75 w-full ${blk}`} />
    </div>
  );
}

interface DashboardLayoutPickerProps {
  layout: DashboardLayoutId;
  onLayoutChange: (layout: DashboardLayoutId) => void;
}

export function DashboardLayoutPicker({ layout, onLayoutChange }: DashboardLayoutPickerProps) {
  return (
    <div className="mockup-layout-picker">
      {DASHBOARD_LAYOUT_OPTIONS.map((opt) => (
        <TooltipProvider key={opt.id}>
          <Tooltip>
            <TooltipTrigger
              onClick={() => onLayoutChange(opt.id)}
              className={`mockup-layout-opt ${layout === opt.id ? 'active' : ''}`}
              aria-label={opt.label}
            >
                <LayoutPreview id={opt.id} active={layout === opt.id} />
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p className="font-medium">{opt.label}</p>
              <p className="text-muted-foreground">{opt.description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
}
