import { Truck, ShieldCheck, Zap, Headphones } from "lucide-react";

export function TrustBar() {
  const guarantees = [
    {
      icon: ShieldCheck,
      color: "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20",
      title: "100% Student Verified",
      desc: "All vendors are verified students",
    },
    {
      icon: Zap,
      color: "bg-amber-400 text-neutral-950 shadow-sm shadow-amber-400/20",
      title: "Safe & Secure Payments",
      desc: "Shop with confidence",
    },
    {
      icon: Truck,
      color: "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20",
      title: "Fast Campus Delivery",
      desc: "Get your items quickly",
    },
    {
      icon: Headphones,
      color: "bg-pink-500 text-white shadow-sm shadow-pink-500/20",
      title: "Dedicated Support",
      desc: "We're always here to help",
    },
  ];

  return (
    <div className="w-[92%] sm:w-[90%] max-w-[1720px] mx-auto mt-0 sm:mt-2 mb-10 sm:mb-12 relative z-20">
      <div className="bg-white rounded-2xl md:rounded-full border border-neutral-200/80 shadow-xl shadow-neutral-900/5 p-4 sm:p-5 md:py-5 md:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-neutral-100">
          {guarantees.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`flex items-center gap-3 pt-3 sm:pt-0 ${
                  idx > 0 ? "sm:pl-6" : ""
                }`}
              >
                <div
                  className={`w-10 h-10 md:w-11 md:h-11 rounded-full ${item.color} flex items-center justify-center shrink-0 shadow-xs`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-neutral-900 leading-tight truncate">
                    {item.title}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-neutral-500 mt-0.5 leading-snug truncate">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
