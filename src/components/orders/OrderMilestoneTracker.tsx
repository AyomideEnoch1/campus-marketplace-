"use client";

import * as React from "react";
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  Calendar,
  Check,
  Navigation,
  Sparkles,
} from "lucide-react";

export interface TrackingMilestone {
  id: string;
  stepNumber: number;
  title: string;
  date?: string;
  time?: string;
  rawDate?: Date;
  status: "completed" | "current" | "upcoming" | "cancelled";
  iconName:
    | "order"
    | "pending"
    | "waiting"
    | "shipped"
    | "delivery"
    | "delivered";
}

interface OrderMilestoneTrackerProps {
  order: {
    orderNumber: string;
    status: string;
    createdAt: string | Date;
    updatedAt?: string | Date;
    deliveryMethod?: string;
    deliveryAddress?: string;
    meetupPoint?: {
      name: string;
      description?: string | null;
    } | null;
  };
}

function formatTrackingDateTime(dateInput: Date | string): {
  date: string;
  time: string;
} {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    return { date: "Today", time: "12:00 PM" };
  }

  const dateStr = d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const timeStr = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return { date: dateStr, time: timeStr };
}

export function buildTrackingMilestones(order: {
  status: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
}): TrackingMilestone[] {
  const baseTime = new Date(order.createdAt).getTime() || Date.now();
  const updateTime = order.updatedAt
    ? new Date(order.updatedAt).getTime()
    : baseTime;
  const isDelivered = order.status === "DELIVERED";
  const isConfirmed = order.status === "CONFIRMED";
  const isCancelled = order.status === "CANCELLED";

  const t1 = new Date(baseTime);
  const t2 = new Date(baseTime + 15 * 60 * 1000);
  const t3 = new Date(baseTime + 45 * 60 * 1000);
  const t4 = new Date(baseTime + 2 * 60 * 60 * 1000);
  const t5 = new Date(baseTime + 3.5 * 60 * 60 * 1000);
  const t6 = isDelivered
    ? new Date(updateTime)
    : new Date(baseTime + 4.5 * 60 * 60 * 1000);

  const f1 = formatTrackingDateTime(t1);
  const f2 = formatTrackingDateTime(t2);
  const f3 = formatTrackingDateTime(t3);
  const f4 = formatTrackingDateTime(t4);
  const f5 = formatTrackingDateTime(t5);
  const f6 = formatTrackingDateTime(t6);

  let s1: TrackingMilestone["status"] = "completed";
  let s2: TrackingMilestone["status"] = "current";
  let s3: TrackingMilestone["status"] = "upcoming";
  let s4: TrackingMilestone["status"] = "upcoming";
  let s5: TrackingMilestone["status"] = "upcoming";
  let s6: TrackingMilestone["status"] = "upcoming";

  if (isCancelled) {
    s1 = "completed";
    s2 = "cancelled";
    s3 = "cancelled";
    s4 = "cancelled";
    s5 = "cancelled";
    s6 = "cancelled";
  } else if (isDelivered) {
    s1 = "completed";
    s2 = "completed";
    s3 = "completed";
    s4 = "completed";
    s5 = "completed";
    s6 = "completed";
  } else if (isConfirmed) {
    s1 = "completed";
    s2 = "completed";
    s3 = "completed";
    s4 = "current";
    s5 = "upcoming";
    s6 = "upcoming";
  } else {
    // PENDING
    s1 = "completed";
    s2 = "current";
    s3 = "upcoming";
    s4 = "upcoming";
    s5 = "upcoming";
    s6 = "upcoming";
  }

  // Dates and times are only included for completed milestones
  return [
    {
      id: "step-1",
      stepNumber: 1,
      title: "Order Placed",
      date: s1 === "completed" ? f1.date : undefined,
      time: s1 === "completed" ? f1.time : undefined,
      rawDate: s1 === "completed" ? t1 : undefined,
      status: s1,
      iconName: "order",
    },
    {
      id: "step-2",
      stepNumber: 2,
      title: "Pending Confirmation",
      date: s2 === "completed" ? f2.date : undefined,
      time: s2 === "completed" ? f2.time : undefined,
      rawDate: s2 === "completed" ? t2 : undefined,
      status: s2,
      iconName: "pending",
    },
    {
      id: "step-3",
      stepNumber: 3,
      title: "Waiting to be Shipped",
      date: s3 === "completed" ? f3.date : undefined,
      time: s3 === "completed" ? f3.time : undefined,
      rawDate: s3 === "completed" ? t3 : undefined,
      status: s3,
      iconName: "waiting",
    },
    {
      id: "step-4",
      stepNumber: 4,
      title: "Shipped",
      date: s4 === "completed" ? f4.date : undefined,
      time: s4 === "completed" ? f4.time : undefined,
      rawDate: s4 === "completed" ? t4 : undefined,
      status: s4,
      iconName: "shipped",
    },
    {
      id: "step-5",
      stepNumber: 5,
      title: "Out For Delivery",
      date: s5 === "completed" ? f5.date : undefined,
      time: s5 === "completed" ? f5.time : undefined,
      rawDate: s5 === "completed" ? t5 : undefined,
      status: s5,
      iconName: "delivery",
    },
    {
      id: "step-6",
      stepNumber: 6,
      title: "Delivered",
      date: s6 === "completed" ? f6.date : undefined,
      time: s6 === "completed" ? f6.time : undefined,
      rawDate: s6 === "completed" ? t6 : undefined,
      status: s6,
      iconName: "delivered",
    },
  ];
}

function renderMilestoneIcon(
  name: TrackingMilestone["iconName"],
  status: TrackingMilestone["status"],
) {
  if (status === "completed") {
    return <Check className="w-5 h-5 text-white" />;
  }

  switch (name) {
    case "order":
      return <CheckCircle2 className="w-5 h-5" />;
    case "pending":
      return <Clock className="w-5 h-5" />;
    case "waiting":
      return <Package className="w-5 h-5" />;
    case "shipped":
      return <Truck className="w-5 h-5" />;
    case "delivery":
      return <Navigation className="w-5 h-5" />;
    case "delivered":
      return <CheckCircle2 className="w-5 h-5" />;
    default:
      return <Clock className="w-5 h-5" />;
  }
}

export function OrderMilestoneTracker({ order }: OrderMilestoneTrackerProps) {
  const milestones = React.useMemo(() => {
    return buildTrackingMilestones({
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    });
  }, [order.status, order.createdAt, order.updatedAt]);

  const completedCount = milestones.filter(
    (m) => m.status === "completed",
  ).length;
  const progressPercent = Math.round(
    (completedCount / milestones.length) * 100,
  );

  return (
    <div className="space-y-6">
      {/* Milestones Timeline */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs">
        <div className="mb-6 pb-4 border-b border-neutral-100">
          <h4 className="text-base font-black text-neutral-900 tracking-tight">
            Tracking Milestones
          </h4>
        </div>

        <div className="space-y-2">
          {milestones.map((m, idx) => {
            const isLast = idx === milestones.length - 1;

            let nodeClass =
              "bg-neutral-100 text-neutral-400 border border-neutral-200";
            let railClass = "bg-neutral-200";
            let cardClass =
              "bg-white border-neutral-200/80 hover:border-neutral-300";

            if (m.status === "completed") {
              nodeClass =
                "bg-emerald-600 text-white shadow-md shadow-emerald-600/25";
              railClass = "bg-emerald-500";
              cardClass = "bg-emerald-50/20 border-emerald-200/80";
            } else if (m.status === "current") {
              nodeClass =
                "bg-blue-600 text-white ring-4 ring-blue-100 shadow-md shadow-blue-600/25 animate-pulse";
              railClass = "bg-neutral-200";
              cardClass =
                "bg-blue-50/25 border-blue-200 ring-1 ring-blue-200/60 shadow-sm";
            } else if (m.status === "cancelled") {
              nodeClass = "bg-rose-100 text-rose-600 border border-rose-200";
              railClass = "bg-neutral-200";
              cardClass = "bg-rose-50/20 border-rose-200";
            }

            return (
              <div
                key={m.id}
                className="relative flex items-start gap-3 sm:gap-5 group"
              >
                {/* Node & Connecting Line */}
                <div className="flex flex-col items-center self-stretch">
                  <div
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${nodeClass}`}
                  >
                    {renderMilestoneIcon(m.iconName, m.status)}
                  </div>
                  {!isLast && (
                    <div
                      className={`w-0.5 my-1.5 flex-1 min-h-[44px] rounded-full transition-colors ${railClass}`}
                    />
                  )}
                </div>

                {/* Milestone Details Card */}
                <div
                  className={`flex-1 p-4 sm:p-5 rounded-2xl border transition-all mb-3 ${cardClass}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-bold text-neutral-400">
                        Step 0{m.stepNumber}
                      </span>
                      <h5 className="text-sm sm:text-base font-extrabold text-neutral-900 tracking-tight">
                        {m.title}
                      </h5>
                    </div>

                    {/* Date & Time (Only included for completed milestones) */}
                    {m.status === "completed" && m.date && m.time ? (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-neutral-800">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{m.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-bold text-neutral-800">
                          <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{m.time}</span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
