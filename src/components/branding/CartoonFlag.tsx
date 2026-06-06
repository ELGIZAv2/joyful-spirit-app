// Cartoon-style country flag badge — rounded squircle with the country's flag
// composition simplified to a friendly, sticker-like look. No emoji fonts.
import { memo } from "react";

type Stripe = { dir: "h" | "v"; colors: string[] };
type Special =
  | { kind: "eg" }
  | { kind: "uk" }
  | { kind: "us" }
  | { kind: "ca" }
  | { kind: "jp" }
  | { kind: "kr" }
  | { kind: "ch" }
  | { kind: "br" }
  | { kind: "cn" }
  | { kind: "in" }
  | { kind: "pk" }
  | { kind: "bd" }
  | { kind: "tr" }
  | { kind: "il" }
  | { kind: "vn" }
  | { kind: "gr" }
  | { kind: "au" }
  | { kind: "nz" }
  | { kind: "za" }
  | { kind: "sa" }
  | { kind: "il" };

const STRIPES: Record<string, Stripe> = {
  fr: { dir: "v", colors: ["#0055A4", "#FFFFFF", "#EF4135"] },
  it: { dir: "v", colors: ["#009246", "#FFFFFF", "#CE2B37"] },
  ie: { dir: "v", colors: ["#169B62", "#FFFFFF", "#FF883E"] },
  be: { dir: "v", colors: ["#000000", "#FAE042", "#ED2939"] },
  ro: { dir: "v", colors: ["#002B7F", "#FCD116", "#CE1126"] },
  de: { dir: "h", colors: ["#000000", "#DD0000", "#FFCE00"] },
  es: { dir: "h", colors: ["#AA151B", "#F1BF00", "#AA151B"] },
  nl: { dir: "h", colors: ["#AE1C28", "#FFFFFF", "#21468B"] },
  ru: { dir: "h", colors: ["#FFFFFF", "#0039A6", "#D52B1E"] },
  hu: { dir: "h", colors: ["#CE2939", "#FFFFFF", "#477050"] },
  bg: { dir: "h", colors: ["#FFFFFF", "#00966E", "#D62612"] },
  lt: { dir: "h", colors: ["#FDB913", "#006A44", "#C1272D"] },
  ee: { dir: "h", colors: ["#0072CE", "#000000", "#FFFFFF"] },
  lv: { dir: "h", colors: ["#9E3039", "#FFFFFF", "#9E3039"] },
  at: { dir: "h", colors: ["#ED2939", "#FFFFFF", "#ED2939"] },
  pe: { dir: "v", colors: ["#D91023", "#FFFFFF", "#D91023"] },
  th: { dir: "h", colors: ["#ED1C24", "#FFFFFF", "#241D4F"] },
  co: { dir: "h", colors: ["#FCD116", "#003893", "#CE1126"] },
  ve: { dir: "h", colors: ["#FCD116", "#00247D", "#CF142B"] },
  ec: { dir: "h", colors: ["#FFD100", "#0033A0", "#EF3340"] },
  ar: { dir: "h", colors: ["#74ACDF", "#FFFFFF", "#74ACDF"] }, // simplified Argentina
  cl: { dir: "h", colors: ["#FFFFFF", "#D52B1E", "#D52B1E"] },
  mx: { dir: "v", colors: ["#006847", "#FFFFFF", "#CE1126"] },
  no: { dir: "h", colors: ["#EF2B2D", "#FFFFFF", "#002868"] },
  se: { dir: "h", colors: ["#006AA7", "#FECC00", "#006AA7"] },
  fi: { dir: "h", colors: ["#FFFFFF", "#003580", "#FFFFFF"] },
  dk: { dir: "h", colors: ["#C8102E", "#FFFFFF", "#C8102E"] },
  is: { dir: "h", colors: ["#02529C", "#FFFFFF", "#02529C"] },
  pl: { dir: "h", colors: ["#FFFFFF", "#FFFFFF", "#DC143C"] },
  cz: { dir: "h", colors: ["#FFFFFF", "#11457E", "#D7141A"] },
  sk: { dir: "h", colors: ["#FFFFFF", "#0B4EA2", "#EE1C25"] },
  si: { dir: "h", colors: ["#FFFFFF", "#0000FF", "#FF0000"] },
  hr: { dir: "h", colors: ["#FF0000", "#FFFFFF", "#0093DD"] },
  rs: { dir: "h", colors: ["#C6363C", "#0C4076", "#FFFFFF"] },
  ba: { dir: "h", colors: ["#002F6C", "#FFCD00", "#FFFFFF"] },
  mk: { dir: "h", colors: ["#D20000", "#FFE600", "#D20000"] },
  al: { dir: "h", colors: ["#E41E20", "#000000", "#E41E20"] },
  pt: { dir: "v", colors: ["#006600", "#FF0000", "#FF0000"] },
  lu: { dir: "h", colors: ["#ED2939", "#FFFFFF", "#00A1DE"] },
  ua: { dir: "h", colors: ["#005BBB", "#FFD500", "#FFD500"] },
  by: { dir: "h", colors: ["#CE1720", "#007C30", "#007C30"] },
  am: { dir: "h", colors: ["#D90012", "#0033A0", "#F2A800"] },
  ge: { dir: "h", colors: ["#FFFFFF", "#FF0000", "#FFFFFF"] },
  az: { dir: "h", colors: ["#00B5E2", "#EF3340", "#509E2F"] },
  kz: { dir: "h", colors: ["#00ABC9", "#00ABC9", "#FEC50C"] },
  kg: { dir: "h", colors: ["#E8112D", "#E8112D", "#E8112D"] },
  uz: { dir: "h", colors: ["#1EB53A", "#FFFFFF", "#0099B5"] },
  af: { dir: "v", colors: ["#000000", "#D32011", "#007A36"] },
  ir: { dir: "h", colors: ["#239F40", "#FFFFFF", "#DA0000"] },
  iq: { dir: "h", colors: ["#CE1126", "#FFFFFF", "#000000"] },
  sy: { dir: "h", colors: ["#CE1126", "#FFFFFF", "#000000"] },
  jo: { dir: "h", colors: ["#000000", "#FFFFFF", "#007A3D"] },
  lb: { dir: "h", colors: ["#ED1C24", "#FFFFFF", "#ED1C24"] },
  ye: { dir: "h", colors: ["#CE1126", "#FFFFFF", "#000000"] },
  ma: { dir: "v", colors: ["#C1272D", "#C1272D", "#C1272D"] },
  dz: { dir: "v", colors: ["#006233", "#FFFFFF", "#FFFFFF"] },
  tn: { dir: "v", colors: ["#E70013", "#E70013", "#E70013"] },
  ly: { dir: "h", colors: ["#E70013", "#000000", "#239E46"] },
  sd: { dir: "h", colors: ["#D21034", "#FFFFFF", "#000000"] },
  so: { dir: "h", colors: ["#418FDE", "#418FDE", "#418FDE"] },
  et: { dir: "h", colors: ["#078930", "#FCDD09", "#DA121A"] },
  ke: { dir: "h", colors: ["#000000", "#BB0000", "#006600"] },
  ng: { dir: "v", colors: ["#008751", "#FFFFFF", "#008751"] },
  gh: { dir: "h", colors: ["#CE1126", "#FCD116", "#006B3F"] },
  ci: { dir: "v", colors: ["#FF8200", "#FFFFFF", "#009A44"] },
  sn: { dir: "v", colors: ["#00853F", "#FCD116", "#E31B23"] },
  cm: { dir: "v", colors: ["#007A5E", "#CE1126", "#FCD116"] },
  ug: { dir: "h", colors: ["#FCDC04", "#D90000", "#000000"] },
  tz: { dir: "h", colors: ["#1EB53A", "#FCD116", "#00A3DD"] },
  zw: { dir: "h", colors: ["#006400", "#FFD200", "#EF3340"] },
  my: { dir: "h", colors: ["#CC0001", "#FFFFFF", "#010066"] },
  id: { dir: "h", colors: ["#FF0000", "#FF0000", "#FFFFFF"] },
  ph: { dir: "h", colors: ["#0038A8", "#FFFFFF", "#CE1126"] },
  sg: { dir: "h", colors: ["#ED2939", "#FFFFFF", "#FFFFFF"] },
  kh: { dir: "h", colors: ["#032EA1", "#E00025", "#032EA1"] },
  la: { dir: "h", colors: ["#CE1126", "#002868", "#CE1126"] },
  mm: { dir: "h", colors: ["#FECB00", "#34B233", "#EA2839"] },
  np: { dir: "h", colors: ["#DC143C", "#003893", "#DC143C"] },
  lk: { dir: "h", colors: ["#FFB700", "#8D153A", "#005A36"] },
  mn: { dir: "v", colors: ["#C4272F", "#0066B3", "#C4272F"] },
  tw: { dir: "h", colors: ["#FE0000", "#FFFFFF", "#FE0000"] },
  hk: { dir: "h", colors: ["#DE2910", "#DE2910", "#DE2910"] },
  qa: { dir: "v", colors: ["#FFFFFF", "#8D1B3D", "#8D1B3D"] },
  ae: { dir: "h", colors: ["#00732F", "#FFFFFF", "#000000"] },
  bh: { dir: "h", colors: ["#FFFFFF", "#CE1126", "#CE1126"] },
  kw: { dir: "h", colors: ["#007A3D", "#FFFFFF", "#CE1126"] },
  om: { dir: "h", colors: ["#DB161B", "#FFFFFF", "#008000"] },
};

function Squircle({ children, size = 36 }: { children: React.ReactNode; size?: number }) {
  return (
    <span
      className="relative inline-flex items-center justify-center overflow-hidden shrink-0 select-none"
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        background: "hsl(var(--muted))",
        boxShadow: "inset 0 0 0 1px hsl(var(--border)/0.6)",
      }}
      aria-hidden
    >
      <svg viewBox="0 0 36 36" width={size} height={size}>
        <defs>
          <clipPath id="cf-clip">
            <rect x="0" y="0" width="36" height="36" rx="10" ry="10" />
          </clipPath>
        </defs>
        <g clipPath="url(#cf-clip)">{children}</g>
      </svg>
    </span>
  );
}

const Stripes = ({ s }: { s: Stripe }) => {
  if (s.dir === "h") {
    const h = 36 / s.colors.length;
    return (
      <>
        {s.colors.map((c, i) => (
          <rect key={i} x="0" y={i * h} width="36" height={h} fill={c} />
        ))}
      </>
    );
  }
  const w = 36 / s.colors.length;
  return (
    <>
      {s.colors.map((c, i) => (
        <rect key={i} x={i * w} y="0" width={w} height="36" fill={c} />
      ))}
    </>
  );
};

const SPECIAL: Record<string, () => React.ReactNode> = {
  eg: () => (
    <>
      <rect x="0" y="0" width="36" height="12" fill="#CE1126" />
      <rect x="0" y="12" width="36" height="12" fill="#FFFFFF" />
      <rect x="0" y="24" width="36" height="12" fill="#000000" />
      {/* Saladin Eagle — simplified cartoon */}
      <g transform="translate(18 18)" fill="#C09300" stroke="#8A6A00" strokeWidth="0.3" strokeLinejoin="round">
        {/* head */}
        <circle cx="0" cy="-3.2" r="1.3" />
        {/* beak */}
        <path d="M-1.2 -3 l-1.6 0.4 1.6 0.5z" />
        {/* body */}
        <path d="M-1.4 -2.2 q1.4 0.6 2.8 0 l-0.2 4.2 q-1.2 1 -2.4 0z" />
        {/* wings */}
        <path d="M-1.6 -2 q-4.5 0.4 -5.2 3.6 q3 -1.4 5 -0.6z" />
        <path d="M1.6 -2 q4.5 0.4 5.2 3.6 q-3 -1.4 -5 -0.6z" />
        {/* tail feathers */}
        <path d="M-1.6 1.8 l-0.8 3.2 0.8 -0.6 0.6 0.8 0.6 -0.8 0.6 0.8 0.6 -0.8 0.8 0.6 -0.8 -3.2z" />
        {/* shield */}
        <rect x="-0.9" y="-1.6" width="1.8" height="2.4" fill="#FFFFFF" stroke="#8A6A00" strokeWidth="0.25" />
        <rect x="-0.9" y="-1.6" width="0.6" height="2.4" fill="#CE1126" />
        <rect x="0.3" y="-1.6" width="0.6" height="2.4" fill="#000" />
      </g>
    </>
  ),
  uk: () => (
    <>
      <rect width="36" height="36" fill="#012169" />
      <path d="M0,0 36,36 M36,0 0,36" stroke="#FFF" strokeWidth="6" />
      <path d="M0,0 36,36 M36,0 0,36" stroke="#C8102E" strokeWidth="2.5" />
      <path d="M18,0 V36 M0,18 H36" stroke="#FFF" strokeWidth="6" />
      <path d="M18,0 V36 M0,18 H36" stroke="#C8102E" strokeWidth="3.5" />
    </>
  ),
  us: () => {
    const stripes = Array.from({ length: 13 }).map((_, i) => (
      <rect key={i} x="0" y={i * (36 / 13)} width="36" height={36 / 13} fill={i % 2 ? "#FFF" : "#B22234"} />
    ));
    return (
      <>
        {stripes}
        <rect x="0" y="0" width="15" height="15" fill="#3C3B6E" />
        {Array.from({ length: 9 }).map((_, i) => (
          <circle key={i} cx={1.8 + (i % 5) * 3} cy={2.5 + Math.floor(i / 5) * 6} r="0.7" fill="#FFF" />
        ))}
      </>
    );
  },
  ca: () => (
    <>
      <rect width="9" height="36" fill="#FF0000" />
      <rect x="9" width="18" height="36" fill="#FFF" />
      <rect x="27" width="9" height="36" fill="#FF0000" />
      <path d="M18 9 l1.5 4 4-1-2 3.5 3 2-3.5 1 .5 4-3.5-2-3.5 2 .5-4-3.5-1 3-2-2-3.5 4 1z" fill="#FF0000" />
    </>
  ),
  jp: () => (
    <>
      <rect width="36" height="36" fill="#FFF" />
      <circle cx="18" cy="18" r="9" fill="#BC002D" />
    </>
  ),
  kr: () => (
    <>
      <rect width="36" height="36" fill="#FFF" />
      <circle cx="18" cy="18" r="7" fill="#003478" />
      <path d="M11 18 a7 7 0 0 1 14 0 a3.5 3.5 0 0 1 -7 0 a3.5 3.5 0 0 0 -7 0z" fill="#C60C30" />
    </>
  ),
  ch: () => (
    <>
      <rect width="36" height="36" fill="#D52B1E" />
      <rect x="15" y="8" width="6" height="20" fill="#FFF" />
      <rect x="8" y="15" width="20" height="6" fill="#FFF" />
    </>
  ),
  br: () => (
    <>
      <rect width="36" height="36" fill="#009C3B" />
      <polygon points="18,5 32,18 18,31 4,18" fill="#FFDF00" />
      <circle cx="18" cy="18" r="6" fill="#002776" />
    </>
  ),
  cn: () => (
    <>
      <rect width="36" height="36" fill="#DE2910" />
      <polygon points="9,6 11,11 16,11 12,14 13,19 9,16 5,19 6,14 2,11 7,11" fill="#FFDE00" />
      <circle cx="18" cy="5" r="1.2" fill="#FFDE00" />
      <circle cx="21" cy="8" r="1.2" fill="#FFDE00" />
      <circle cx="21" cy="12" r="1.2" fill="#FFDE00" />
      <circle cx="18" cy="15" r="1.2" fill="#FFDE00" />
    </>
  ),
  in: () => (
    <>
      <rect width="36" height="12" fill="#FF9933" />
      <rect y="12" width="36" height="12" fill="#FFF" />
      <rect y="24" width="36" height="12" fill="#138808" />
      <circle cx="18" cy="18" r="3" fill="none" stroke="#000080" strokeWidth="0.8" />
    </>
  ),
  pk: () => (
    <>
      <rect width="9" height="36" fill="#FFF" />
      <rect x="9" width="27" height="36" fill="#01411C" />
      <circle cx="22" cy="18" r="6" fill="#FFF" />
      <circle cx="24" cy="17" r="5" fill="#01411C" />
    </>
  ),
  bd: () => (
    <>
      <rect width="36" height="36" fill="#006A4E" />
      <circle cx="16" cy="18" r="9" fill="#F42A41" />
    </>
  ),
  tr: () => (
    <>
      <rect width="36" height="36" fill="#E30A17" />
      <circle cx="14" cy="18" r="7" fill="#FFF" />
      <circle cx="16" cy="18" r="5.5" fill="#E30A17" />
      <polygon points="22,18 25,17 23,19.5 25,22 22,21 21,24 20,21 17,22 19,19.5 17,17 20,18 21,15" fill="#FFF" />
    </>
  ),
  il: () => (
    <>
      <rect width="36" height="36" fill="#FFF" />
      <rect y="6" width="36" height="4" fill="#0038B8" />
      <rect y="26" width="36" height="4" fill="#0038B8" />
      <polygon
        points="18,12 21,17 27,17 22,20 24,26 18,22 12,26 14,20 9,17 15,17"
        fill="none"
        stroke="#0038B8"
        strokeWidth="1"
      />
    </>
  ),
  vn: () => (
    <>
      <rect width="36" height="36" fill="#DA251D" />
      <polygon points="18,8 21,16 30,16 23,21 26,29 18,24 10,29 13,21 6,16 15,16" fill="#FFFF00" />
    </>
  ),
  gr: () => {
    const stripes = Array.from({ length: 9 }).map((_, i) => (
      <rect key={i} y={i * 4} width="36" height="4" fill={i % 2 ? "#FFF" : "#0D5EAF"} />
    ));
    return (
      <>
        {stripes}
        <rect width="14" height="20" fill="#0D5EAF" />
        <rect x="6" y="0" width="2" height="20" fill="#FFF" />
        <rect x="0" y="9" width="14" height="2" fill="#FFF" />
      </>
    );
  },
  au: () => (
    <>
      <rect width="36" height="36" fill="#012169" />
      <g transform="translate(0 0) scale(0.5)">
        <path d="M0,0 36,36 M36,0 0,36" stroke="#FFF" strokeWidth="6" />
        <path d="M18,0 V36 M0,18 H36" stroke="#FFF" strokeWidth="6" />
        <path d="M18,0 V36 M0,18 H36" stroke="#C8102E" strokeWidth="3" />
      </g>
      <circle cx="27" cy="20" r="1" fill="#FFF" />
      <circle cx="30" cy="14" r="0.8" fill="#FFF" />
      <circle cx="24" cy="26" r="0.8" fill="#FFF" />
    </>
  ),
  nz: () => (
    <>
      <rect width="36" height="36" fill="#012169" />
      <g transform="scale(0.5)">
        <path d="M0,0 36,36 M36,0 0,36" stroke="#FFF" strokeWidth="6" />
        <path d="M18,0 V36 M0,18 H36" stroke="#FFF" strokeWidth="6" />
        <path d="M18,0 V36 M0,18 H36" stroke="#C8102E" strokeWidth="3" />
      </g>
      <circle cx="26" cy="14" r="1.2" fill="#C8102E" />
      <circle cx="30" cy="20" r="1.2" fill="#C8102E" />
      <circle cx="26" cy="26" r="1.2" fill="#C8102E" />
      <circle cx="22" cy="20" r="1.2" fill="#C8102E" />
    </>
  ),
  za: () => (
    <>
      <rect width="36" height="36" fill="#FFF" />
      <polygon points="0,0 12,18 0,36" fill="#007A4D" />
      <polygon points="0,0 14,16 36,16 36,0" fill="#DE3831" />
      <polygon points="0,36 14,20 36,20 36,36" fill="#002395" />
      <polygon points="0,0 10,18 0,36 14,18" fill="#000" />
      <polygon points="14,18 36,12 36,24" fill="#FFB612" />
    </>
  ),
  sa: () => (
    <>
      <rect width="36" height="36" fill="#006C35" />
      <rect x="6" y="14" width="24" height="2" fill="#FFF" />
      <rect x="6" y="22" width="24" height="2" fill="#FFF" />
    </>
  ),
};

const ALIAS: Record<string, string> = {
  uk: "uk",
  gb: "uk",
};

const CartoonFlag = memo(({ country, size = 36 }: { country: string; size?: number }) => {
  const code = (ALIAS[country.toLowerCase()] || country.toLowerCase());
  const special = SPECIAL[code];
  const stripe = STRIPES[code];
  return (
    <Squircle size={size}>
      {special ? special() : stripe ? <Stripes s={stripe} /> : <rect width="36" height="36" fill="#E5E7EB" />}
    </Squircle>
  );
});

export default CartoonFlag;
