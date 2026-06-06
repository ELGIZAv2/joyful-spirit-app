import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import bg from "@/assets/final-cta-bg.webp";

const FinalHeroCTA = () => {
  const navigate = useNavigate();

  return (
    <section className="relative px-4 pb-16 pt-8 md:pb-24">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl">
        <img
          src={bg}
          alt=""
          loading="lazy"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/70" />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="relative z-10 flex flex-col items-center justify-center px-6 py-20 text-center md:py-32"
        >
          <h2 className="font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-white drop-shadow-2xl md:text-7xl lg:text-8xl">
            AI Photography For Creators
            <br />
            Who Value Realism
          </h2>
          <p className="mt-6 max-w-2xl text-base text-white/85 md:text-lg drop-shadow-lg">
            Produce realistic AI images with control, clarity, and confidence.
          </p>
          <button
            onClick={() => navigate("/auth?mode=signup")}
            className="mt-10 rounded-full px-10 py-4 text-base font-semibold transition-all hover:scale-105 text-slate-50 bg-amber-600"
          >
            Start creating
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalHeroCTA;
