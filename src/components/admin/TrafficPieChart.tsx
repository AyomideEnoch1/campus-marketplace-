"use client";

import { useState } from "react";
import { BarChart3, Eye, Users } from "lucide-react";

export interface PageTrafficItem {
  path: string;
  views: number;
}

interface TrafficPieChartProps {
  totalViews: number;
  uniqueVisitors: number;
  topPages: PageTrafficItem[];
  windowDays?: number;
}

const SLICE_COLORS = [
  "#10b981", // emerald-500
  "#3b82f6", // blue-500
  "#a855f7", // purple-500
  "#f59e0b", // amber-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
  "#64748b", // slate-500
];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArcSlice(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number
) {
  // Clamp full circle slightly so SVG arc renders cleanly
  const sweep = Math.min(endAngle - startAngle, 359.99);
  const adjustedEnd = startAngle + sweep;
  const largeArc = sweep > 180 ? 1 : 0;

  const p1 = polarToCartesian(cx, cy, outerR, startAngle);
  const p2 = polarToCartesian(cx, cy, outerR, adjustedEnd);
  const p3 = polarToCartesian(cx, cy, innerR, adjustedEnd);
  const p4 = polarToCartesian(cx, cy, innerR, startAngle);

  return [
    `M ${p1.x} ${p1.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${p4.x} ${p4.y}`,
    "Z",
  ].join(" ");
}

export function TrafficPieChart({
  totalViews,
  uniqueVisitors,
  topPages,
  windowDays = 30,
}: TrafficPieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const displayedTotal = topPages.reduce((sum, item) => sum + item.views, 0);
  const activeSlice = activeIndex !== null ? topPages[activeIndex] : null;

  let currentAngle = 0;
  const slices = topPages.map((item, idx) => {
    const pct = displayedTotal > 0 ? (item.views / displayedTotal) * 100 : 0;
    const angle = (pct / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    return {
      ...item,
      pct,
      color: SLICE_COLORS[idx % SLICE_COLORS.length],
      pathD: describeArcSlice(110, 110, 96, 58, startAngle, endAngle),
    };
  });

  return (
    <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5 sm:p-6">
      {/* Header & Summary Counters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Site Traffic &amp; Most Visited Pages
            </h2>
            <p className="text-xs text-neutral-400">
              Last {windowDays} days across public marketplace pages
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center gap-2.5">
            <Eye className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">
                Page Views
              </p>
              <p className="text-base font-extrabold text-white">
                {totalViews.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center gap-2.5">
            <Users className="w-4 h-4 text-blue-400 shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">
                Unique Visitors
              </p>
              <p className="text-base font-extrabold text-white">
                {uniqueVisitors.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pie Chart + Legend */}
      {slices.length === 0 ? (
        <div className="py-12 text-center text-sm text-neutral-400">
          No page visits recorded yet. Visits will appear here automatically as users browse the site.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-6">
          {/* SVG Donut / Pie Chart */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-56 h-56">
              <svg viewBox="0 0 220 220" className="w-full h-full">
                {slices.map((slice, idx) => {
                  const isActive = activeIndex === idx;
                  return (
                    <path
                      key={slice.path}
                      d={slice.pathD}
                      fill={slice.color}
                      stroke="#171717"
                      strokeWidth="2"
                      className="transition-all duration-150 cursor-pointer"
                      style={{
                        opacity: activeIndex === null || isActive ? 1 : 0.45,
                        transform: isActive ? "scale(1.03)" : "scale(1)",
                        transformOrigin: "110px 110px",
                      }}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onMouseLeave={() => setActiveIndex(null)}
                      onClick={() => setActiveIndex(isActive ? null : idx)}
                    />
                  );
                })}
              </svg>

              {/* Center Readout */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-8 text-center">
                {activeSlice ? (
                  <>
                    <span className="text-xl font-extrabold text-white">
                      {((activeSlice.views / Math.max(displayedTotal, 1)) * 100).toFixed(1)}%
                    </span>
                    <span className="text-[11px] font-medium text-neutral-300 truncate max-w-[100px]">
                      {activeSlice.path}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {activeSlice.views.toLocaleString()} views
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl font-extrabold text-white">
                      {totalViews.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-neutral-400 font-medium">
                      Total Visits
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Ranked Page Breakdown */}
          <div className="lg:col-span-7 space-y-2.5">
            {slices.map((slice, idx) => {
              const isActive = activeIndex === idx;
              return (
                <div
                  key={slice.path}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                    isActive
                      ? "bg-neutral-800/80 border-neutral-700"
                      : "bg-neutral-950/60 border-neutral-800/70 hover:border-neutral-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: slice.color }}
                      />
                      <span className="font-mono text-neutral-200 truncate">
                        {slice.path}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-bold text-white">
                        {slice.views.toLocaleString()}
                      </span>
                      <span className="text-neutral-400 w-12 text-right">
                        {slice.pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.max(slice.pct, 2)}%`,
                        backgroundColor: slice.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
