"use client";

import { useEffect, useRef } from "react";
import ArchitecturePipeline from "./landing/ArchitecturePipeline";
import Close from "./landing/Close";
import Hero from "./landing/Hero";
import Nav from "./landing/Nav";
import SocialProof from "./landing/SocialProof";
import StudyStudio from "./landing/StudyStudio";
import SyllabusMatrix from "./landing/SyllabusMatrix";

/**
 * Landing. Light paper, navy ink, teal only on the primary action (.impeccable.md).
 * The app's <body> does not scroll, so this container does. Motion is two things:
 * the hero reply plays in the order the tutor works (question, steps, answer), and
 * sections fade up once as they enter. Reduced motion shows everything at rest.
 *
 * Site-of-the-day caliber landing experience:
 * - Lenis smooth scrolling for high-end inertia feel
 * - Staggered GSAP reveals & interactive mockups
 * - StudyStudio with continuous 3D formula tickers & live interactive practice
 * - SyllabusMatrix with interactive filter across 1,016 topics across Physics, Chemistry, and Mathematics
 * - ArchitecturePipeline with clean engineering vector schematics
 */
export default function LandingPage() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;

    const nav = scroller.querySelector<HTMLElement>("[data-nav]");
    const onScroll = () => {
      if (nav) nav.dataset.scrolled = scroller.scrollTop > 8 ? "true" : "false";
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return () => scroller.removeEventListener("scroll", onScroll);
    }

    let revert: (() => void) | undefined;
    let lenisDestroy: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const [{ default: gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
        import("lenis"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      /* ── Lenis smooth scroll ─────────────────────────────────── */
      const lenis = new Lenis({
        wrapper: scroller,
        content: scroller,
        lerp: 0.09,
        duration: 1.4,
        smoothWheel: true,
      });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time: number) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
      lenisDestroy = () => lenis.destroy();

      /* ── Animations ──────────────────────────────────────────── */
      const ctx = gsap.context(() => {
        const ease = "power2.out";

        /* Hero entrance — staggered children */
        gsap
          .timeline({ defaults: { ease, duration: 0.6 } })
          .from("[data-hero] > *", { opacity: 0, y: 16, stagger: 0.08 })
          .from("[data-hero-mock]", { opacity: 0, y: 20, duration: 0.7 }, 0.15)
          .from("[data-chat='ask']", { opacity: 0, y: 10 }, 0.55)
          .from("[data-chat='steps'] li", { opacity: 0, x: -8, stagger: 0.35 }, 0.95)
          .from("[data-chat='reply'] > *", { opacity: 0, y: 10, stagger: 0.15 }, 1.75);

        /* Scroll-triggered reveals with more character */
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          gsap.from(el, {
            opacity: 0,
            y: 28,
            duration: 0.8,
            ease,
            scrollTrigger: {
              trigger: el,
              scroller,
              start: "top 88%",
              once: true,
            },
          });
        });

        /* Mockup float-up with scale */
        gsap.utils.toArray<HTMLElement>(".landing-mockup-wrapper").forEach((el) => {
          gsap.from(el, {
            opacity: 0,
            y: 40,
            scale: 0.97,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              scroller,
              start: "top 90%",
              once: true,
            },
          });
        });
      }, scroller);

      revert = () => ctx.revert();
    })();

    return () => {
      cancelled = true;
      scroller.removeEventListener("scroll", onScroll);
      revert?.();
      lenisDestroy?.();
    };
  }, []);

  return (
    <div ref={scrollRef} className="relative h-dvh overflow-y-auto overflow-x-hidden scroll-smooth bg-surface text-ink motion-reduce:scroll-auto">
      <Nav />
      <main>
        <Hero />
        <SocialProof />
        <StudyStudio />
        <SyllabusMatrix />
        <ArchitecturePipeline />
      </main>
      <Close />
    </div>
  );
}
