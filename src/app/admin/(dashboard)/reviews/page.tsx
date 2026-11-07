import { prisma } from "@/lib/prisma";
import { AdminReviewQueue } from "./AdminReviewQueue";
import { Star, ShieldAlert, CheckCircle, EyeOff } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const [reviews, totalCount, reportedCount, flaggedCount, hiddenCount] =
    await Promise.all([
      prisma.productReview.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          product: { select: { id: true, title: true, slug: true } },
          buyer: { select: { fullName: true, email: true } },
          seller: { select: { storeName: true } },
          reports: {
            include: {
              reporter: { select: { fullName: true } },
            },
          },
        },
      }),
      prisma.productReview.count(),
      prisma.reviewReport.count({ where: { status: "PENDING" } }),
      prisma.productReview.count({ where: { status: "FLAGGED" } }),
      prisma.productReview.count({ where: { status: "HIDDEN" } }),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Review Moderation & Trust Queue
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Monitor product ratings, customer feedback, seller replies, and reported reviews.
        </p>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
              Total Reviews
            </p>
            <p className="text-xl font-black text-white mt-0.5">{totalCount}</p>
          </div>
          <Star className="w-5 h-5 text-amber-400" />
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
              Pending Reports
            </p>
            <p className="text-xl font-black text-red-400 mt-0.5">
              {reportedCount}
            </p>
          </div>
          <ShieldAlert className="w-5 h-5 text-red-400" />
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
              Flagged Items
            </p>
            <p className="text-xl font-black text-amber-400 mt-0.5">
              {flaggedCount}
            </p>
          </div>
          <EyeOff className="w-5 h-5 text-amber-400" />
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
              Hidden Reviews
            </p>
            <p className="text-xl font-black text-neutral-300 mt-0.5">
              {hiddenCount}
            </p>
          </div>
          <CheckCircle className="w-5 h-5 text-emerald-400" />
        </div>
      </div>

      <AdminReviewQueue initialReviews={reviews as any} />
    </div>
  );
}
