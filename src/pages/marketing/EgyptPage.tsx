import { motion } from "framer-motion";
import { useEffect } from "react";
import Lenis from "lenis";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import SEOHead from "@/components/common/SEOHead";

const megaProjects = [
  {
    title: "The New Administrative Capital",
    description:
      "A $58 billion smart city spanning 700 square kilometers east of Cairo. Featuring Africa's tallest skyscraper, the Iconic Tower at 385 meters, a massive government district, international financial hub, and a green river park twice the size of New York's Central Park. The capital is designed to accommodate 6.5 million residents and serve as the new center of Egyptian governance and business.",
    image: "/egypt/new-capital.webp",
    stats: ["700 km² total area", "$58B investment", "6.5M residents capacity"],
  },
  {
    title: "The New Suez Canal",
    description:
      "Completed in a record-breaking one year, the New Suez Canal expansion doubled the waterway's capacity, allowing two-way traffic for the first time in history. The project increased daily transit capacity from 49 to 97 ships and boosted annual revenues significantly. The Suez Canal Economic Zone (SCZone) surrounding it is attracting billions in foreign investment across manufacturing, logistics, and technology sectors.",
    image: "/egypt/suez-canal.webp",
    stats: ["72 km new channel", "97 ships daily", "$8B+ annual revenue"],
  },
  {
    title: "National Roads Network",
    description:
      "Egypt has built over 7,000 kilometers of new roads and 1,000+ bridges and tunnels, fundamentally transforming the country's infrastructure. The Rod El Farag Axis bridge holds the Guinness World Record as the widest cable-stayed bridge globally. These projects have reduced travel times dramatically, connected remote communities, and created a modern logistics backbone for economic growth.",
    image: "/egypt/infrastructure.webp",
    stats: ["7,000+ km new roads", "1,000+ bridges", "Guinness World Record bridge"],
  },
  {
    title: "Benban Solar Park",
    description:
      "One of the world's largest solar installations, Benban Solar Park in Aswan spans 37 square kilometers and generates 1.8 GW of clean energy. Egypt aims to produce 42% of its electricity from renewable sources by 2035. The country is also developing massive wind farms along the Red Sea coast and Gulf of Suez, positioning itself as Africa's renewable energy leader.",
    image: "/egypt/renewable-energy.webp",
    stats: ["37 km² solar park", "1.8 GW capacity", "42% renewable target by 2035"],
  },
];

const investmentSectors = [
  {
    title: "Real Estate & Construction",
    text: "With over 20 new cities under development including the New Administrative Capital, New Alamein, and New Galala, Egypt's real estate sector presents massive opportunities. The government's urban expansion plan aims to increase inhabited land from 7% to 14% of total territory.",
  },
  {
    title: "Technology & Digital Economy",
    text: "Egypt's tech sector is booming with over 500 startups, multiple unicorns, and a young population with 60% under 30. The government has established technology parks, coding academies, and digital free zones. Egypt is becoming the tech hub of the MENA region.",
  },
  {
    title: "Tourism & Hospitality",
    text: "Home to 7 UNESCO World Heritage Sites, the Pyramids of Giza, Luxor's Valley of the Kings, and stunning Red Sea resorts. The Grand Egyptian Museum — the world's largest archaeological museum — is a game-changer. Egypt targets 30 million tourists annually.",
  },
  {
    title: "Energy & Renewables",
    text: "Egypt has become a net energy exporter with the Zohr gas field discovery and massive renewable investments. The country is positioning itself as a regional energy hub, with plans for green hydrogen production and nuclear power through the El Dabaa plant.",
  },
  {
    title: "Manufacturing & Industry",
    text: "The Suez Canal Economic Zone, Ain Sokhna industrial area, and multiple free zones offer world-class infrastructure for manufacturing. Egypt's strategic location connects three continents, making it ideal for export-oriented production.",
  },
  {
    title: "Agriculture & Food Security",
    text: "The mega project to reclaim 1.5 million feddans of desert land, the development of 100,000 greenhouses, and Egypt's ambitious food security strategy make agriculture a key investment frontier. The country is leveraging technology to maximize yields in arid conditions.",
  },
];

const stats = [
  { value: "7,000+", label: "Years of Civilization" },
  { value: "110M+", label: "Population" },
  { value: "1M km²", label: "Total Area" },
  { value: "$400B+", label: "GDP" },
  { value: "30+", label: "National Mega Projects" },
  { value: "20+", label: "New Cities Under Construction" },
  { value: "$58B", label: "New Capital Investment" },
  { value: "14.5M", label: "Tourists in 2023" },
];

const whyInvestReasons = [
  "Strategic location at the crossroads of Africa, Asia, and Europe",
  "Access to 1.8 billion consumers through free trade agreements",
  "Young and dynamic workforce — 60% of population under 30",
  "Competitive labor costs with high skill availability",
  "Modern infrastructure with new roads, ports, and airports",
  "Government incentives including tax holidays and free zones",
  "Political stability and strong leadership commitment to reform",
  "Growing domestic market of 110+ million consumers",
  "Suez Canal — the world's most important maritime trade route",
  "Abundant natural resources and renewable energy potential",
];

const EgyptPage = () => {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.8, smoothWheel: true });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  return (
    <div data-theme="dark" className="min-h-screen overflow-x-hidden bg-black text-foreground">
      <SEOHead
        title="Built in Egypt — The Story Behind Megsy AI"
        description="Megsy AI is built in Egypt. Discover the country's mega projects, talent and ambition that fuel our all-in-one AI platform."
        path="/egypt"
      />
      <LandingNavbar />



      {/* ===== HERO ===== */}
      <section className="relative min-h-[110vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="/egypt/pyramids-night.webp" alt="The Great Pyramids of Giza at night" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
        </div>
        <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-sm md:text-base uppercase tracking-[0.3em] text-yellow-500/80 mb-8 font-medium"
          >
            The Cradle of Civilization
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="font-display text-6xl md:text-[10rem] font-black tracking-tighter leading-[0.85] mb-8"
          >
            <span className="text-white">EGYPT</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-lg md:text-2xl text-white/50 max-w-3xl mx-auto leading-relaxed"
          >
            Seven thousand years of history. A nation rising with vision, strength, and
            determination. We are proud of our country and the leadership guiding it
            toward an extraordinary future.
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <div className="w-px h-16 bg-gradient-to-b from-yellow-500/60 to-transparent" />
        </motion.div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section className="py-24 border-y border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-12">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.07 }}
                className="text-center"
              >
                <div className="font-display text-3xl md:text-5xl font-black text-yellow-500 mb-2">
                  {stat.value}
                </div>
                <div className="text-white/30 text-xs md:text-sm uppercase tracking-widest">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ABOUT SECTION ===== */}
      <section className="py-32 md:py-44">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-start">
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9 }}
            >
              <p className="text-xs uppercase tracking-[0.3em] text-yellow-500/70 mb-6 font-medium">About Egypt</p>
              <h2 className="font-display text-4xl md:text-6xl font-black text-white leading-[1.05] mb-8">
                Where Ancient
                <br />
                Glory Meets
                <br />
                <span className="text-yellow-500">Modern Ambition</span>
              </h2>
              <p className="text-white/40 text-base md:text-lg leading-relaxed mb-6">
                Egypt is not just a country — it is the birthplace of human civilization itself. From the
                banks of the Nile to the vast Sahara, from the Mediterranean shores to the Red Sea reefs,
                Egypt has always been a land of wonder, innovation, and resilience.
              </p>
              <p className="text-white/40 text-base md:text-lg leading-relaxed mb-6">
                Today, Egypt stands at the forefront of a massive transformation. With unprecedented
                infrastructure development, a booming digital economy, and strategic reforms that have
                attracted billions in foreign investment, the nation is writing a new chapter in its
                legendary story.
              </p>
              <p className="text-white/40 text-base md:text-lg leading-relaxed">
                Under visionary leadership, Egypt has launched the most ambitious development program
                in its modern history — building new cities, expanding the Suez Canal, revolutionizing
                transportation, and investing heavily in education, healthcare, and technology.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9 }}
            >
              <div className="relative rounded-2xl overflow-hidden aspect-[4/5]">
                <img src="/egypt/luxor.webp" alt="Luxor Temple at night" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <p className="text-xs uppercase tracking-[0.2em] text-yellow-500/80 mb-2">Luxor Temple</p>
                  <p className="text-sm text-white/50">One of Egypt's most spectacular ancient monuments, attracting millions of visitors from around the world every year.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== PRESIDENT SECTION ===== */}
      <section className="py-32 md:py-44 bg-white/[0.015]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9 }}
              className="order-2 md:order-1"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-yellow-500/70 mb-6 font-medium">
                Presidential Leadership
              </p>
              <h2 className="font-display text-4xl md:text-6xl font-black text-white leading-[1.05] mb-8">
                President
                <br />
                Abdel Fattah
                <br />
                <span className="text-yellow-500">El-Sisi</span>
              </h2>
              <p className="text-white/40 text-base md:text-lg leading-relaxed mb-6">
                President Abdel Fattah El-Sisi has led Egypt through its most ambitious era of modern
                development. Since taking office, he has championed massive national projects that have
                fundamentally transformed Egypt's infrastructure, economy, and global standing.
              </p>
              <p className="text-white/40 text-base md:text-lg leading-relaxed mb-6">
                Under his leadership, Egypt has restored security and stability, launched unprecedented
                mega-projects, attracted record foreign investment, and positioned the nation as a key
                player in regional and international affairs. His vision for a "New Republic" has
                mobilized the entire nation toward building a prosperous and modern Egypt.
              </p>
              <p className="text-white/40 text-base md:text-lg leading-relaxed mb-6">
                From the New Administrative Capital to the expansion of the Suez Canal, from social
                housing programs that have provided millions with dignified homes to healthcare
                initiatives like "100 Million Healthy Lives," President El-Sisi's leadership has
                touched every aspect of Egyptian life.
              </p>
              <p className="text-white/40 text-base md:text-lg leading-relaxed">
                We are deeply proud of our president and his tireless dedication to the people of Egypt.
                His commitment to progress, reform, and national dignity continues to inspire millions
                of Egyptians and earn respect on the world stage.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9 }}
              className="order-1 md:order-2"
            >
              <div className="relative rounded-2xl overflow-hidden aspect-square max-w-lg mx-auto">
                <img
                  src="/egypt/sisi.webp"
                  alt="President Abdel Fattah El-Sisi"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <p className="text-xs uppercase tracking-[0.2em] text-yellow-500/80 mb-2">
                    President of the Arab Republic of Egypt
                  </p>
                  <p className="text-2xl font-display font-bold text-white">
                    Abdel Fattah El-Sisi
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== GIANT TEXT DIVIDER ===== */}
      <section className="py-16 overflow-hidden">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2 }}
          className="font-display text-[15vw] font-black uppercase leading-[0.85] tracking-tighter text-yellow-500/[0.07] text-center whitespace-nowrap"
        >
          BUILDING THE FUTURE
        </motion.h2>
      </section>

      {/* ===== MEGA PROJECTS ===== */}
      <section className="py-32 md:py-44">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20 max-w-3xl"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-yellow-500/70 mb-6 font-medium">National Mega Projects</p>
            <h2 className="font-display text-4xl md:text-7xl font-black text-white leading-[1.05] mb-6">
              Transforming a Nation
            </h2>
            <p className="text-white/40 text-lg leading-relaxed">
              Egypt has embarked on the largest infrastructure development program in its history,
              with over 30 national mega-projects reshaping the country's landscape, economy, and
              future prospects.
            </p>
          </motion.div>

          <div className="space-y-32">
            {megaProjects.map((project, i) => (
              <motion.div
                key={project.title}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className={`grid md:grid-cols-2 gap-12 md:gap-20 items-center ${
                  i % 2 === 1 ? "md:[direction:rtl]" : ""
                }`}
              >
                <div className={i % 2 === 1 ? "md:[direction:ltr]" : ""}>
                  <div className="relative rounded-2xl overflow-hidden aspect-[16/10]">
                    <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  </div>
                </div>
                <div className={i % 2 === 1 ? "md:[direction:ltr]" : ""}>
                  <span className="text-yellow-500/40 font-display text-5xl md:text-8xl font-black leading-none">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-2xl md:text-4xl font-black text-white mt-4 mb-6">
                    {project.title}
                  </h3>
                  <p className="text-white/40 text-base leading-relaxed mb-8">{project.description}</p>
                  <div className="flex flex-wrap gap-3">
                    {project.stats.map((stat) => (
                      <span
                        key={stat}
                        className="px-4 py-2 rounded-full border border-yellow-500/20 text-yellow-500/70 text-xs font-medium"
                      >
                        {stat}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== GIANT TEXT DIVIDER 2 ===== */}
      <section className="py-16 overflow-hidden">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2 }}
          className="font-display text-[15vw] font-black uppercase leading-[0.85] tracking-tighter text-yellow-500/[0.07] text-center whitespace-nowrap"
        >
          INVEST IN EGYPT
        </motion.h2>
      </section>

      {/* ===== WHY INVEST ===== */}
      <section className="py-32 md:py-44 bg-white/[0.015]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 md:gap-24">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <p className="text-xs uppercase tracking-[0.3em] text-yellow-500/70 mb-6 font-medium">
                Investment Opportunity
              </p>
              <h2 className="font-display text-4xl md:text-6xl font-black text-white leading-[1.05] mb-8">
                Why Invest
                <br />
                in <span className="text-yellow-500">Egypt</span>?
              </h2>
              <p className="text-white/40 text-base md:text-lg leading-relaxed mb-8">
                Egypt offers one of the most compelling investment propositions in the emerging world.
                With a massive domestic market, strategic geographic location, competitive costs, and a
                government deeply committed to economic reform and investor-friendly policies, Egypt is
                a destination of choice for global investors.
              </p>
              <p className="text-white/40 text-base md:text-lg leading-relaxed">
                The Egyptian government has implemented sweeping reforms including a new investment law,
                streamlined business registration, reduced bureaucracy, and established special economic
                zones with generous tax incentives. Foreign direct investment has surged, and international
                organizations consistently rank Egypt among the top reform-oriented economies in the region.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="space-y-4">
                {whyInvestReasons.map((reason, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="flex items-start gap-4 py-3 border-b border-white/[0.04]"
                  >
                    <span className="text-yellow-500/40 font-display text-sm font-bold shrink-0 mt-0.5">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="text-white/50 text-sm md:text-base">{reason}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== INVESTMENT SECTORS ===== */}
      <section className="py-32 md:py-44">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20 max-w-3xl"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-yellow-500/70 mb-6 font-medium">
              Key Sectors
            </p>
            <h2 className="font-display text-4xl md:text-7xl font-black text-white leading-[1.05] mb-6">
              Sectors Driving Growth
            </h2>
            <p className="text-white/40 text-lg leading-relaxed">
              Egypt's diversified economy offers investment opportunities across multiple
              high-growth sectors, each backed by government support and strategic national initiatives.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {investmentSectors.map((sector, i) => (
              <motion.div
                key={sector.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 hover:border-yellow-500/20 transition-all duration-500"
              >
                <span className="text-yellow-500/30 font-display text-5xl font-black leading-none">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-xl font-bold text-white mt-4 mb-4">
                  {sector.title}
                </h3>
                <p className="text-white/35 text-sm leading-relaxed">{sector.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ECONOMIC REFORMS ===== */}
      <section className="py-32 md:py-44 bg-white/[0.015]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-yellow-500/70 mb-6 font-medium">
              Economic Vision
            </p>
            <h2 className="font-display text-4xl md:text-7xl font-black text-white leading-[1.05] mb-6">
              Egypt Vision 2030
            </h2>
            <p className="text-white/40 text-lg leading-relaxed max-w-3xl mx-auto">
              Egypt's comprehensive sustainable development strategy aims to position the country
              among the world's top 30 economies by 2030.
            </p>
          </motion.div>

          <div className="space-y-12">
            {[
              {
                title: "Economic Reform Program",
                content:
                  "Since 2016, Egypt has implemented one of the most comprehensive economic reform programs in the emerging world. The floating of the Egyptian pound, subsidy rationalization, fiscal consolidation, and structural reforms have stabilized the macroeconomy, reduced the budget deficit, and restored investor confidence. International institutions including the IMF, World Bank, and major rating agencies have praised Egypt's reform trajectory.",
              },
              {
                title: "Digital Transformation",
                content:
                  "Egypt is undergoing a massive digital transformation with investments in fiber optic infrastructure, 5G rollout, digital government services, and fintech innovation. The Knowledge City in the New Administrative Capital will house Africa's largest data center. E-government services have been expanded dramatically, and digital payment adoption has surged. Egypt's digital economy is projected to contribute significantly to GDP growth.",
              },
              {
                title: "Social Development",
                content:
                  "Egypt's social programs have reached unprecedented scale. The Takaful and Karama cash transfer programs support over 5 million families. The \"100 Million Healthy Lives\" initiative has screened the entire population for Hepatitis C, virtually eliminating the disease. Massive investments in education reform, new universities, and technical education are building human capital for the future economy.",
              },
              {
                title: "Transportation Revolution",
                content:
                  "Egypt is building the largest monorail system in the Middle East, a high-speed electric rail network connecting major cities, and Africa's largest metro expansion in Cairo. New international airports, modernized ports, and logistics centers are creating a world-class transportation network that connects Egypt to global markets efficiently.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="border-l-2 border-yellow-500/20 pl-8"
              >
                <h3 className="font-display text-xl md:text-2xl font-bold text-white mb-4">
                  {item.title}
                </h3>
                <p className="text-white/40 text-base leading-relaxed">{item.content}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TOURISM ===== */}
      <section className="py-32 md:py-44">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-yellow-500/70 mb-6 font-medium">
              Tourism & Culture
            </p>
            <h2 className="font-display text-4xl md:text-7xl font-black text-white leading-[1.05] mb-6">
              A Land of Wonders
            </h2>
            <p className="text-white/40 text-lg leading-relaxed max-w-3xl mx-auto">
              From the iconic Pyramids of Giza to the stunning coral reefs of the Red Sea,
              Egypt offers experiences that are truly unmatched anywhere on Earth.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "The Pyramids of Giza",
                text: "The last surviving wonder of the ancient world. Built over 4,500 years ago, these monumental structures continue to inspire awe and wonder in millions of visitors annually.",
                image: "/egypt/pyramids-night.webp",
              },
              {
                title: "Luxor & The Valley of the Kings",
                text: "The world's greatest open-air museum. Home to the tombs of pharaohs, the magnificent Karnak Temple complex, and the stunning Luxor Temple illuminated at night.",
                image: "/egypt/luxor.webp",
              },
              {
                title: "The Grand Egyptian Museum",
                text: "The world's largest archaeological museum, housing over 100,000 artifacts including the complete Tutankhamun collection. A new landmark for global tourism.",
                image: "/egypt/hero-bg.webp",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group rounded-2xl overflow-hidden border border-white/[0.06]"
              >
                <div className="h-64 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="p-8">
                  <h3 className="font-display text-lg font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-white/35 text-sm leading-relaxed">{item.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== GIANT EGYPT TEXT ===== */}
      <section className="py-20 overflow-hidden">
        <motion.h2
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="font-display text-[22vw] font-black uppercase leading-[0.85] tracking-tighter text-red-500/[0.08] text-center"
        >
          EGYPT
        </motion.h2>
      </section>

      {/* ===== PRIDE MESSAGE ===== */}
      <section className="py-32 md:py-44 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-xs uppercase tracking-[0.3em] text-yellow-500/70 mb-8 font-medium">
              A Message from the Heart
            </p>
            <h2 className="font-display text-4xl md:text-6xl font-black text-white mb-8 leading-[1.1]">
              We Love Egypt.
              <br />
              <span className="text-yellow-500">We Are Proud.</span>
            </h2>
            <p className="text-white/40 text-lg leading-relaxed max-w-2xl mx-auto mb-6">
              From the depths of our hearts, we love Egypt and everything it stands for.
              This ancient land gave birth to the greatest civilization humanity has ever known,
              and it continues to produce heroes who shape the future.
            </p>
            <p className="text-white/40 text-lg leading-relaxed max-w-2xl mx-auto mb-6">
              We are proud of our president, proud of our armed forces, proud of our people,
              and proud of the incredible journey of development and progress that Egypt is
              undertaking. The world watches in admiration as Egypt rises.
            </p>
            <p className="text-white/30 text-base italic mt-12">
              Long live Egypt. Long live Egypt. Long live Egypt.
            </p>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default EgyptPage;
