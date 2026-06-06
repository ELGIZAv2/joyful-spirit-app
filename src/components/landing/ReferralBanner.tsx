import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const stats = [
  { value: "20%", label: "FOREVER COMMISSION" },
  { value: "$0", label: "MINIMUM PAYOUT" },
  { value: "90", label: "DAY COOKIE" },
  { value: "24H", label: "PAYOUT SPEED" },
];

const ReferralBanner = () => {
  return (
    <section className="py-16 px-4 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl border border-[#FFD700]/20 bg-gradient-to-br from-[#FFD700]/5 via-background to-[#FFA500]/5 p-8 md:p-12 overflow-hidden"
        >
          {/* Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFD700]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div className="flex-1">
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
                  Affiliate Rewards from{" "}
                  <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
                    Megsy
                  </span>
                </h2>
                <p className="text-muted-foreground text-sm md:text-base max-w-lg">
                  Share Megsy AI with your audience and receive a 20% affiliate reward on every qualifying subscription. Rewards are not guaranteed and depend on referred conversions — see our <a href="/legal/affiliate" className="underline hover:text-foreground">Affiliate Terms</a>.
                </p>
              </div>
              <a
                href="https://referral.megsyai.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black font-semibold text-sm hover:opacity-90 transition-opacity shrink-0"
              >
                Join the Program
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center p-4 rounded-xl bg-background/50 border border-border/50">
                  <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ReferralBanner;
