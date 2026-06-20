'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  key: string;
  label: string;
  content: React.ReactNode;
}

export function Tabs({ items, initial }: { items: TabItem[]; initial?: string }) {
  const [active, setActive] = useState(initial ?? items[0]?.key);
  const current = items.find((i) => i.key === active) ?? items[0];

  return (
    <div>
      <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200/70 bg-white p-1 shadow-soft">
        {items.map((i) => (
          <button
            key={i.key}
            onClick={() => setActive(i.key)}
            className={cn(
              'rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors',
              active === i.key
                ? 'bg-brand-gradient text-white shadow-soft'
                : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            {i.label}
          </button>
        ))}
      </div>
      <div className="mt-5">{current?.content}</div>
    </div>
  );
}
