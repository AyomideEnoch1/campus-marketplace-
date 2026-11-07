import { Truck, ShieldCheck, RefreshCw, MessageSquare } from "lucide-react";

export function TrustBar() {
  const guarantees = [
    {
      icon: Truck,
      title: "Free Campus Pickup",
      desc: "Meet at designated faculty & hall pickup spots",
    },
    {
      icon: ShieldCheck,
      title: "100% Student Verified",
      desc: "All vendors authenticated with valid student IDs",
    },
    {
      icon: RefreshCw,
      title: "Safe Handshake Policy",
      desc: "Inspect items in person before finalizing",
    },
    {
      icon: MessageSquare,
      title: "Direct WhatsApp Chat",
      desc: "Instant contact with student sellers",
    },
  ];

  return (
    <section className="border-y border-neutral-100 bg-neutral-50/70 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {guarantees.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-white border border-neutral-200/60 shadow-xs flex items-center justify-center text-emerald-600 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-neutral-900 leading-tight">
                    {item.title}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-neutral-500 mt-0.5 leading-snug">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
