import { Link, useParams, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import SEOHead from "@/components/common/SEOHead";
import { getBlogPost, BLOG_POSTS } from "@/data/blogPosts";

const BlogPostPage = () => {
  const { slug = "" } = useParams<{ slug: string }>();
  const post = getBlogPost(slug);

  if (!post) return <Navigate to="/blog" replace />;

  const related = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);

  // Render markdown-ish body: split on \n\n for paragraphs, ## for h2, * - prefix lists.
  const blocks = post.body.split(/\n\n+/);

  return (
    <div data-theme="dark" className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <SEOHead
        title={post.title}
        description={post.description}
        path={`/blog/${post.slug}`}
        type="article"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          author: { "@type": "Organization", name: "Megsy AI" },
          publisher: { "@type": "Organization", name: "Megsy AI", logo: { "@type": "ImageObject", url: "https://megsyai.com/pwa-512.png" } },
          mainEntityOfPage: `https://megsyai.com/blog/${post.slug}`,
          keywords: post.keywords.join(", "),
        })}</script>
      </Helmet>
      <LandingNavbar />

      <main className="px-4 pt-32 pb-20 mx-auto max-w-3xl">
        <Link to="/blog" className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">
          ← Back to all posts
        </Link>

        <header className="mt-8 mb-10">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-4">
            <span>{post.category}</span>
            <span aria-hidden>·</span>
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </time>
            <span aria-hidden>·</span>
            <span>{post.readTime}</span>
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight leading-tight">{post.title}</h1>
          <p className="mt-5 text-muted-foreground text-lg leading-relaxed">{post.description}</p>
        </header>

        <article className="space-y-5 text-foreground/90 text-[16.5px] leading-[1.75]">
          {blocks.map((block, i) => {
            if (block.startsWith("## ")) {
              return (
                <h2 key={i} className="font-display text-2xl font-semibold tracking-tight pt-6 pb-1">
                  {block.replace(/^##\s+/, "")}
                </h2>
              );
            }
            if (/^[-*]\s/m.test(block)) {
              const items = block.split("\n").filter((l) => /^[-*\d]/.test(l.trim()));
              return (
                <ul key={i} className="list-disc pl-6 space-y-2 marker:text-muted-foreground/50">
                  {items.map((it, j) => (
                    <li key={j}>{it.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "")}</li>
                  ))}
                </ul>
              );
            }
            return <p key={i}>{block}</p>;
          })}
        </article>

        {related.length > 0 && (
          <aside className="mt-20 pt-10 border-t border-border/60">
            <h3 className="font-display text-sm uppercase tracking-[0.16em] text-muted-foreground mb-5">Keep reading</h3>
            <ul className="space-y-3">
              {related.map((p) => (
                <li key={p.slug}>
                  <Link
                    to={`/blog/${p.slug}`}
                    className="block rounded-xl border border-border/60 p-5 hover:bg-foreground/[0.03] transition-colors"
                  >
                    <h4 className="font-display text-lg font-semibold tracking-tight">{p.title}</h4>
                    <p className="mt-1.5 text-sm text-muted-foreground">{p.description}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </main>

      <LandingFooter />
    </div>
  );
};

export default BlogPostPage;
