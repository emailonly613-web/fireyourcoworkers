"use client";

import { useRef, useState, type PointerEvent } from "react";
import {
  BrokenCopyMachine,
  MicroManagingCeo,
  SleepingIntern,
} from "@/components/characters/CharacterArt";
import { HERO_SENTENCE, HERO_STEPS } from "@/components/hero-content";
import { trackAnalyticsEvent } from "@/lib/analytics";

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

export function LivingHero() {
  const heroRef = useRef<HTMLElement>(null);
  const playTrackedRef = useRef(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [chaosStarted, setChaosStarted] = useState(false);
  const [hrScore, setHrScore] = useState(18);
  const [notice, setNotice] = useState("Orientation has begun. Nobody read the handbook.");

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const hero = heroRef.current;
    if (!hero) return;

    const bounds = hero.getBoundingClientRect();
    const horizontal = clamp((event.clientX - (bounds.left + bounds.width / 2)) / (bounds.width / 2), -1, 1);
    const vertical = clamp((event.clientY - (bounds.top + bounds.height / 2)) / (bounds.height / 2), -1, 1);
    hero.style.setProperty("--look-x", `${horizontal * 4}px`);
    hero.style.setProperty("--look-y", `${vertical * 3}px`);
    hero.style.setProperty("--parallax-x", `${horizontal * -10}px`);
  };

  const resetPointer = () => {
    const hero = heroRef.current;
    if (!hero) return;
    hero.style.setProperty("--look-x", "0px");
    hero.style.setProperty("--look-y", "0px");
    hero.style.setProperty("--parallax-x", "0px");
  };

  const startChaos = () => {
    setChaosStarted(true);
    setHrScore(72);
    setNotice("Unsafe equipment. Improper orientation. Legal is typing.");
    if (!playTrackedRef.current) {
      playTrackedRef.current = true;
      trackAnalyticsEvent("play_started", {
        level_id: "mandatory-elevator-meeting",
        source: "hero",
      });
    }
    window.setTimeout(() => {
      document.getElementById("play")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 520);
  };

  return (
    <section
      aria-labelledby="hero-title"
      className={`living-hero${chaosStarted ? " living-hero--chaos" : ""}`}
      data-testid="living-hero"
      onPointerLeave={resetPointer}
      onPointerMove={handlePointerMove}
      ref={heroRef}
    >
      <div aria-hidden="true" className="hero-backdrop" />
      <div aria-hidden="true" className="hero-vignette" />
      <div aria-hidden="true" className="ambient-paper ambient-paper--one" />
      <div aria-hidden="true" className="ambient-paper ambient-paper--two" />
      <div aria-hidden="true" className="ambient-paper ambient-paper--three" />

      <header className="hero-header">
        <h1 className="wordmark" id="hero-title">
          <a aria-label="Fire Your Coworkers home" href="#top" id="top">
            <span className="wordmark__fire">FIRE YOUR</span>{" "}
            <span className="wordmark__coworkers">COWORKERS</span>
          </a>
        </h1>
        <button
          aria-label={soundEnabled ? "Mute sound" : "Turn on sound"}
          aria-pressed={soundEnabled}
          className="sound-toggle"
          onClick={() => setSoundEnabled((current) => !current)}
          type="button"
        >
          <span aria-hidden="true" className="sound-toggle__icon">
            {soundEnabled ? "◖))" : "◖×"}
          </span>
          <span>{soundEnabled ? "SOUND ON" : "SOUND OFF"}</span>
        </button>
      </header>

      <ol aria-label="How the chaos spreads" className="hero-steps">
        {HERO_STEPS.map((step, index) => (
          <li className={`hero-step hero-step--${index + 1}`} key={step}>
            <span>{index + 1}</span>
            {step}
          </li>
        ))}
      </ol>

      <div className="hero-elevator" data-testid="hero-elevator">
        <div aria-hidden="true" className="elevator-ceiling-light" />
        <div aria-hidden="true" className="elevator-grid" />
        <div aria-hidden="true" className="elevator-glass-sheen" />

        <div className="hr-console" data-testid="hr-console">
          <div className="hr-console__topline">
            <span className="hr-console__stamp">HR</span>
            <span className="hr-console__label">
              {hrScore < 25 ? "ACCEPTABLE" : "FORMAL WARNING"}
            </span>
            <strong>{hrScore}%</strong>
          </div>
          <div aria-label={`HR risk ${hrScore} percent`} className="hr-meter" role="meter" aria-valuemax={100} aria-valuemin={0} aria-valuenow={hrScore}>
            <span style={{ width: `${hrScore}%` }} />
          </div>
        </div>

        <figure className="hero-piece hero-piece--ceo">
          <MicroManagingCeo className="character-svg character-svg--ceo" />
          <figcaption>“Let&apos;s circle back.”</figcaption>
        </figure>

        <figure className="hero-piece hero-piece--intern">
          <SleepingIntern className="character-svg character-svg--intern" />
          <figcaption>“Five more minutes.”</figcaption>
        </figure>

        <figure className="hero-piece hero-piece--printer">
          <BrokenCopyMachine className="character-svg character-svg--printer" />
          <figcaption>Paper jam. Career jam.</figcaption>
        </figure>

        <div aria-live="polite" className="hero-warning">
          <span aria-hidden="true">!</span>
          {notice}
        </div>
      </div>

      <div className="hero-pitch">
        <p>{HERO_SENTENCE}</p>
        <div className="hero-actions">
          <button className="play-button" data-testid="hero-play" onClick={startChaos} type="button">
            <span aria-hidden="true">▶</span>
            {chaosStarted ? "HR NOTICED" : "PLAY NOW"}
          </button>
          <span className="hero-actions__hint">No account. No tutorial wall. Just poor management.</span>
        </div>
      </div>

      <div aria-hidden="true" className="floor-indicator">
        <span>FLOOR 01</span>
        <strong>MANDATORY ELEVATOR MEETING</strong>
      </div>
    </section>
  );
}
