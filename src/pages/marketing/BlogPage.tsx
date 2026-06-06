import { Link } from "react-router-dom";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import SEOHead from "@/components/common/SEOHead";
import { BLOG_POSTS } from "@/data/blogPosts";

const BlogPage = () => {
  return (
    <div data-theme="dark" className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <SEOHead
        title="Megsy AI Blog — Guides, Tutorials & AI Industry Updates"
        description="Practical guides on AI image generation, video generation, prompt engineering, and how to build a creator stack with all-in-one AI tools."
        path="/blog"
      />
      <LandingNavbar />

      <main className="px-4 pt-32 pb-24 mx-auto max-w-5xl">
        <header className="mb-14 text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">The Megsy Journal</p>
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight">
            Writing about the work,
            <br />
            <span className="text-muted-foreground">not the hype.</span>
          </h1>
          <p className="mt-6 text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Practical guides on AI image generation, video, prompt engineering, and the modern creator stack.
          </p>
        </header>

        <ul className="space-y-3">
          {BLOG_POSTS.map((post) => (
            <li key={post.slug}>
              <Link
                to={`/blog/${post.slug}`}
                className="block rounded-2xl border border-border/60 bg-background/60 p-6 md:p-8 hover:bg-foreground/[0.03] transition-colors group"
              >
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-3">
                  <span>{post.category}</span>
                  <span aria-hidden>·</span>
                  <time dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                  <span aria-hidden>·</span>
                  <span>{post.readTime}</span>
                </div>
                <h2 className="font-display text-xl md:text-2xl font-semibold tracking-tight group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                <p className="mt-3 text-muted-foreground text-[15px] leading-relaxed">{post.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </main>

      <LandingFooter />
    </div>
  );
};

export default BlogPage;
