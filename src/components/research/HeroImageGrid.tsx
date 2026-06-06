import { motion } from "framer-motion";

interface Props {
  images: string[];
}

// Mirrors HeroSection's tilted gallery: 5 tiles with rotation + offset Y.
const TILES = [
  { rot: -6, y: 40, w: "w-[15%]", edge: true },
  { rot: -3, y: 15, w: "w-[30%] md:w-[18%]", edge: false },
  { rot: 0, y: 0,  w: "w-[34%] md:w-[20%]", edge: false, center: true },
  { rot: 3, y: 15, w: "w-[30%] md:w-[18%]", edge: false },
  { rot: 6, y: 40, w: "w-[15%]", edge: true },
];

const HeroImageGrid = ({ images }: Props) => {
  if (!images.length) return null;
  // Pick distinct images when possible; fall back by repeating.
  const tiles = TILES.map((_, i) => images[i] || images[i % images.length]);

  return (
    <div className="relative z-0 mt-8 flex w-full items-end justify-center gap-2 px-4 md:mt-10 md:gap-5">
      {TILES.map((tile, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 100, rotate: tile.rot }}
          animate={{ opacity: 1, y: tile.y, rotate: tile.rot }}
          transition={{ duration: 0.7, delay: 0.2 + i * 0.1, ease: "easeOut" }}
          className={`relative overflow-hidden rounded-xl border border-foreground/10 bg-foreground/5 shadow-2xl md:rounded-2xl ${tile.w} ${tile.edge ? "hidden md:block" : ""} ${tile.center ? "z-[3]" : Math.abs(tile.rot) <= 3 ? "z-[2]" : "z-[1]"}`}
          style={{ aspectRatio: "3/4" }}
        >
          <img
            src={tiles[i]}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading={i < 2 ? "eager" : "lazy"}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default HeroImageGrid;
