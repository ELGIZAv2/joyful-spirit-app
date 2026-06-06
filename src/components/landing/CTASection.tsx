import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import FancyButton from "@/components/branding/FancyButton";
import { useLandingContent } from "@/lib/landing/LandingContentContext";

const CTASection = () => {
  const navigate = useNavigate();
  const { content } = useLandingContent();
  const { cta } = content;

  return (
    <section className="relative overflow-hidden py-20 md:py-48">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-600/10 via-transparent to-transparent bg-pink-900" />
      <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/8 blur-[200px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="font-display text-[10vw] font-black uppercase leading-[0.85] tracking-tighter text-white md:text-[8vw]"
        >
          {cta.line1}
        </motion.h2>
        <motion.h2
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.1 }}
          className="font-display text-[10vw] font-black uppercase italic leading-[0.85] tracking-tighter md:text-[8vw]"
        >
          <span className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
            {cta.line2}
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mx-auto mt-5 max-w-2xl text-base text-white/85 md:mt-8 md:text-2xl"
        >
          {cta.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12"
        >
          <FancyButton onClick={() => navigate("/auth")} className="px-8 py-4 text-base md:px-12 md:py-5 md:text-lg">
            {cta.button}
          </FancyButton>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;

