import { useParams, Navigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Check, X, Minus } from "lucide-react";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import SEOHead from "@/components/common/SEOHead";
import { getComparison, COMPARISONS } from "@/data/comparisons";

const winnerBadge = (winner: "megsy" | "competitor" | "tie") => {
  if (winner === "megsy") return <Check className="w-4 h-4 text-emerald-400" aria-label="Megsy" />;
  if (winner === "competitor") return <X className="w-4 h-4 text-rose-400" aria-label="Competitor" />;
  return <Minus className="w-4 h-4 text-muted-foreground" aria-label="Tie" />;
};

const ComparisonPage = () => {
  const { slug = "" } = useParams<{ slug: string }>();
  const data = getComparison(slug);
  if (!data) return <Navigate to="/" replace />;

  return (
    <div data-theme="dark" className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <SEOHead title={data.title} description={data.description} path={`/vs/${data.slug}`} />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: data.title,
          description: data.description,
          author: { "@type": "Organization", name: "Megsy AI" },
          publisher: { "@type": "Organization", name: "Megsy AI" },
          mainEntityOfPage: `https://megsyai.com/vs/${data.slug}`,
        })}</script>
      </Helmet>
      <LandingNavbar />

      <main className="px-4 pt-32 pb-20 mx-auto max-w-5xl">
        <header className="text-center mb-14">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-4">Comparison</p>
          <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight leading-tight">
            Megsy AI <span className="text-muted-foreground">vs</span> {data.competitorName}
          </h1>
          <p className="mt-5 text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">{data.intro}</p>
          <p className="mt-4 text-[12px] text-muted-foreground/70 italic max-w-xl mx-auto">{data.honestNote}</p>
        </header>

        {/* Best for cards */}
        <section className="grid md:grid-cols-2 gap-4 mb-14">
          <div className="rounded-2xl border border-border/60 bg-background/60 p-6">
            <h2 className="font-display text-xl font-semibold mb-4">Megsy is best for</h2>
            <ul className="space-y-2.5">
              {data.bestFor.megsy.map((b) => (
                <li key={b} className="flex gap-2.5 text-[14.5px] text-foreground/85">
                  <Check className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/60 p-6">
            <h2 className="font-display text-xl font-semibold mb-4">{data.competitorName} is best for</h2>
            <ul className="space-y-2.5">
              {data.bestFor.competitor.map((b) => (
                <li key={b} className="flex gap-2.5 text-[14.5px] text-foreground/85">
                  <Check className="w-4 h-4 text-amber-400 mt-1 shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Comparison table */}
        <section className="mb-14">
          <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-6">Feature comparison</h2>
          <div className="overflow-x-auto rounded-2xl border border-border/60">
            <table className="w-full text-[14px]">
              <thead className="bg-foreground/[0.03] text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Feature</th>
                  <th className="text-left px-4 py-3 font-semibold">Megsy AI</th>
                  <th className="text-left px-4 py-3 font-semibold">{data.competitorName}</th>
                  <th className="text-center px-4 py-3 font-semibold w-16">Edge</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.feature} className="border-t border-border/40">
                    <td className="px-4 py-3.5 font-medium text-foreground/95">{row.feature}</td>
                    <td className="px-4 py-3.5 text-foreground/80">{row.megsy}</td>
                    <td className="px-4 py-3.5 text-foreground/80">{row.competitor}</td>
                    <td className="px-4 py-3.5 text-center">{winnerBadge(row.winner)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Verdict */}
        <section className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-7 md:p-9 mb-14">
          <h2 className="font-display text-xl md:text-2xl font-bold tracking-tight mb-3">The honest verdict</h2>
          <p className="text-foreground/85 text-[15.5px] leading-relaxed">{data.verdict}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/auth" className="px-5 h-11 inline-flex items-center rounded-full bg-foreground text-background font-semibold text-sm">
              Try Megsy free
            </Link>
            <Link to="/pricing" className="px-5 h-11 inline-flex items-center rounded-full border border-border/60 text-sm font-semibold">
              See pricing
            </Link>
          </div>
        </section>

        {/* Other comparisons */}
        <section>
          <h3 className="font-display text-sm uppercase tracking-[0.16em] text-muted-foreground mb-4">Compare with other tools</h3>
          <ul className="flex flex-wrap gap-2">
            {COMPARISONS.filter((c) => c.slug !== data.slug).map((c) => (
              <li key={c.slug}>
                <Link
                  to={`/vs/${c.slug}`}
                  className="px-4 h-9 inline-flex items-center rounded-full border border-border/60 text-[13px] hover:bg-foreground/[0.04] transition-colors"
                >
                  vs {c.competitorName}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
};

export default ComparisonPage;
