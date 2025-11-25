"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check for existing session
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>(".landing-reveal");

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("landing-reveal-visible");
          }
        });
      },
      { threshold: 0.18 }
    );

    sections.forEach(sec => observer.observe(sec));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-root">
      {/* Top nav */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <Link href="/" className="landing-nav-logo">
            <span className="landing-logo-pill">StashMate</span>
          </Link>

          <nav className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#workflow">How it works</a>
            <a href="#metrics">Why StashMate</a>
          </nav>

          <div className="landing-nav-cta">
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className="landing-btn ghost">
                  Dashboard
                </Link>
                <Link href="/profile" className="landing-btn primary">
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth" className="landing-btn ghost">
                  Sign in
                </Link>
                <Link href="/auth" className="landing-btn primary">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="landing-main">
        {/* HERO */}
        <section id="hero" className="landing-section landing-hero landing-reveal">
          <div className="landing-hero-grid">
            <div className="landing-hero-copy">
              <h1>
                Tame your stash.
                <br />
                <span>See every card, figure, and sale in one place.</span>
              </h1>
              <p>
                StashMate is a smart inventory and revenue dashboard for
                collectors and vendors. Track what you own, what it&apos;s
                worth, and how fast it&apos;s selling—without fighting with
                spreadsheets.
              </p>

              <div className="landing-hero-actions">
                <Link href="/auth" className="landing-btn primary large">
                  Sign in / Sign up
                </Link>
                <a href="#features" className="landing-btn ghost large">
                  View features
                </a>
              </div>

              <div className="landing-hero-meta">
                <span>Built for card shows & online sellers</span>
                <span>Real-time profit & revenue insights</span>
              </div>
            </div>

            <div className="landing-hero-preview">
              <div className="landing-preview-card">
                <div className="landing-preview-header">
                  <span>Today&apos;s overview</span>
                  <span className="landing-pill">+18.4% vs last week</span>
                </div>
                <div className="landing-preview-body">
                  <div className="landing-preview-stat">
                    <span className="label">Total inventory value</span>
                    <span className="value">$12,480</span>
                  </div>
                  <div className="landing-preview-stat">
                    <span className="label">Items listed</span>
                    <span className="value">326</span>
                  </div>

                  {/* Simple placeholder instead of fancy mini-chart */}
                  <div className="landing-preview-placeholder">
                    Revenue chart preview coming from your actual dashboard.
                  </div>

                  <p className="landing-preview-footer">
                    One view for every collection across platforms.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section
          id="features"
          className="landing-section landing-reveal landing-features"
        >
          <div className="landing-section-header">
            <h2>Designed for collectors who outgrew spreadsheets</h2>
            <p>
              StashMate keeps your inventory, pricing, and performance in sync
              so you can focus on finding the next grail.
            </p>
          </div>

          <div className="landing-feature-grid">
            <article className="landing-feature-card">
              <h3>Unified collections</h3>
              <p>
                Group cards, figures, comics, or anything else into collections.
                Track quantity, condition, purchase cost, and estimated value.
              </p>
              <ul>
                <li>Custom categories and tags</li>
                <li>Fast search and filters</li>
                <li>CSV import/export for bulk edits</li>
              </ul>
            </article>

            <article className="landing-feature-card">
              <h3>Real-time profit tracking</h3>
              <p>
                See which collections are actually making money. Visualize
                revenue, profit, and trends over time.
              </p>
              <ul>
                <li>Per-collection revenue graphs</li>
                <li>Cost vs sale price insights</li>
                <li>Spot slow movers instantly</li>
              </ul>
            </article>

            <article className="landing-feature-card">
              <h3>Show-ready in seconds</h3>
              <p>
                Heading to a card show? Export up-to-date lists and pricing in a
                couple of clicks, no copy-paste chaos.
              </p>
              <ul>
                <li>CSV exports for every collection</li>
                <li>Simple import for updates</li>
                <li>Works on laptop or tablet</li>
              </ul>
            </article>
          </div>
        </section>

        {/* WORKFLOW / HOW IT WORKS */}
        <section
          id="workflow"
          className="landing-section landing-reveal landing-workflow"
        >
          <div className="landing-section-header">
            <h2>From messy stash to clean dashboard in three steps</h2>
            <p>
              StashMate fits into your existing workflow, whether you&apos;re
              selling at shows, on eBay, or just organizing personal grails.
            </p>
          </div>

          <ol className="landing-steps">
            <li>
              <div className="step-index">1</div>
              <div className="step-body">
                <h3>Create collections</h3>
                <p>
                  Set up collections like &ldquo;Pokémon Base Set,&rdquo;
                  &ldquo;Slabs,&rdquo; or &ldquo;Convention stock.&rdquo; Add
                  basic info like category and description.
                </p>
              </div>
            </li>
            <li>
              <div className="step-index">2</div>
              <div className="step-body">
                <h3>Import or add items</h3>
                <p>
                  Add items manually or import from CSV. Track condition, cost,
                  list price, and where the item came from.
                </p>
              </div>
            </li>
            <li>
              <div className="step-index">3</div>
              <div className="step-body">
                <h3>Watch your numbers update</h3>
                <p>
                  As you adjust inventory, the dashboard updates totals,
                  revenue, and profit so you always know how your stash is
                  performing.
                </p>
              </div>
            </li>
          </ol>
        </section>

        {/* METRICS / SOCIAL PROOF */}
        <section
          id="metrics"
          className="landing-section landing-reveal landing-metrics"
        >
          <div className="landing-metrics-grid">
            <div>
              <h2>Built for small teams, serious collectors, and side hustles</h2>
              <p>
                Whether you&apos;re running a booth every weekend or slowly
                curating a dream collection, StashMate scales with you.
              </p>
            </div>

            <div className="landing-metric-cards">
              <div className="landing-metric-card">
                <span className="metric-value">5x</span>
                <span className="metric-label">
                  Faster to prep show inventory
                </span>
              </div>
              <div className="landing-metric-card">
                <span className="metric-value">10k+</span>
                <span className="metric-label">Items tracked in a single stash</span>
              </div>
              <div className="landing-metric-card">
                <span className="metric-value">0</span>
                <span className="metric-label">
                  Spreadsheets open while you&apos;re selling
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="landing-section landing-reveal landing-cta">
          <div className="landing-cta-card">
            <h2>Ready to clean up your collections?</h2>
            <p>
              Log in to StashMate and start tracking your inventory and revenue
              like a pro—no extra tools required.
            </p>
            <div className="landing-hero-actions">
              <Link href="/auth" className="landing-btn primary large">
                Sign in / Sign up
              </Link>
              <a href="#features" className="landing-btn ghost large">
                View features
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
