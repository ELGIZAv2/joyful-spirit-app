import { motion, AnimatePresence, type Variants } from "framer-motion";

type Props = {
  text: string;
  highlight: string;
  highlightColor: string;
};

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.04 } },
  exit: { transition: { staggerChildren: 0.012, staggerDirection: -1 } },
};

const letter: Variants = {
  hidden: { opacity: 0, y: 16, filter: "blur(10px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 360, damping: 26 },
  },
  exit: {
    opacity: 0,
    y: -12,
    filter: "blur(10px)",
    transition: { duration: 0.18, ease: "easeIn" },
  },
};

function Reveal({ text, color }: { text: string; color?: string }) {
  return (
    <motion.span
      variants={container}
      initial="hidden"
      animate="show"
      exit="exit"
      className="inline-flex"
      style={color ? { color } : undefined}
    >
      {Array.from(text).map((ch, i) => (
        <motion.span
          key={i}
          variants={letter}
          className="inline-block whitespace-pre will-change-transform"
        >
          {ch === " " ? "\u00A0" : ch}
        </motion.span>
      ))}
    </motion.span>
  );
}

export default function AnimatedHeadline({ text, highlight, highlightColor }: Props) {
  const key = `${text}|${highlight}`;
  return (
    <h1 className="relative text-[28px] md:text-[36px] leading-tight tracking-tight font-extrabold text-foreground">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={key} className="inline-flex flex-wrap items-baseline">
          <Reveal text={text + " "} />
          <Reveal text={highlight} color={highlightColor} />
        </motion.span>
      </AnimatePresence>
    </h1>
  );
}
