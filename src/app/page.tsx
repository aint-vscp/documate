/**
 * DocuMate Landing Page
 */
"use client";

import Link from "next/link";
import Image from "next/image";
import { WalletConnect } from "@/components/chain";

const stats = [
  { label: "Live Contracts", value: "2",        sub: "Marketplace + Staking" },
  { label: "Testnet Status", value: "Live",     sub: "Polkadot Hub EVM" },
  { label: "Revenue Split",  value: "75/20/5",  sub: "Immutable on-chain" },
  { label: "Trust Layer",    value: "POC-1",    sub: "Proof of Contract" },
];

const comparisonRows = [
  {
    feature: "Identity Verification",
    others: "Email confirmation or manual KYC - centralized, spoofable, revocable",
    documate: "KILT DID anchored on-chain via Polkadot identity precompile - cryptographic, self-sovereign, permanent",
  },
  {
    feature: "Document Authenticity",
    others: "PDF with a digital signature - copied in seconds, no chain of custody",
    documate: "Document hash written on-chain at signing - tamper-proof, timestamped, publicly verifiable",
  },
  {
    feature: "Revenue & Economics",
    others: "Platform takes 15-30% with no transparency on where fees go",
    documate: "75% creator, 20% treasury, 5% staking pool - hardcoded in the contract, immutable, on-chain",
  },
  {
    feature: "Reputation & Accountability",
    others: "LinkedIn endorsements - anyone can write anything, zero verification",
    documate: "Reputation tags derived from verified on-chain contract history - you are what you sign",
  },
  {
    feature: "Fraud Consequence",
    others: "Terms of service violation - account banned, data deleted, no real consequence",
    documate: "On-chain staking slash - permanent Breach tag on profile, cryptographic proof of violation",
  },
];

const archItems = [
  { label: "Identity",   value: "DID Verification",    color: "text-cyan-300" },
  { label: "Economics",  value: "Immutable Split",      color: "text-amber-300" },
  { label: "Validation", value: "Cryptographic Tiering",color: "text-orange-300" },
  { label: "Reputation", value: "Staking + Slashing",   color: "text-green-300" },
];

const principles = [
  { title: "Visibility of System Status",  copy: "Wallet, chain, tx state, and verification outcomes are always visible in one glance." },
  { title: "Error Prevention by Design",   copy: "Pre-checks and deterministic contract rules reduce failed actions in critical flows." },
  { title: "Recognition over Recall",      copy: "Guided product sections and semantic labels keep users oriented without extra explanation." },
];

const demoSteps = [
  "Connect wallet and confirm Polkadot Hub chain state.",
  "Verify DID and show verification badge transition.",
  "Generate and finalize a document with hash proof.",
  "Run a market purchase and show 75/20/5 execution.",
  "Open whitepaper and architecture for due diligence.",
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      {/* ambient top glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-96 bg-gradient-to-b from-orange-500/[0.07] to-transparent z-0" />

      {/* nav */}
      <nav className="fixed top-0 left-0 right-0 z-40 border-b border-white/[0.08] bg-[#131a26]/88 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="h-8 w-auto shrink-0">
              <Image src="/logo.png" alt="DocuMate" width={32} height={32} style={{ objectFit: "contain" }} priority={true} />
            </div>
            <span className="text-base font-bold gradient-text">DocuMate</span>
            <span className="neon-tag hidden md:inline-flex">Dual Track</span>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            {[
              { label: "Proof",        href: "#proof" },
              { label: "Architecture", href: "#architecture" },
              { label: "Demo Flow",    href: "#demo-flow" },
              { label: "Whitepaper",   href: "/whitepaper" },
            ].map((item) => (
              <Link key={item.href} href={item.href}
                className="text-sm text-white/45 hover:text-white transition-colors duration-150">
                {item.label}
              </Link>
            ))}
          </div>

          <WalletConnect />
        </div>
      </nav>

      {/* hero */}
      <section className="relative z-10 px-6 pb-20 pt-32">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] items-start">

            {/* left */}
            <div>
              <p className="mono-label text-[10px] text-white/25 tracking-widest">Polkadot Hub Runtime dApp</p>
              <h1 className="mt-4 text-5xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
                End Fraud with<br />
                <span className="gradient-text">Verifiable</span><br />
                <span className="gradient-text">Contracts.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/45">
                DocuMate turns documents into on-chain trust assets — DID-linked identity,
                cryptographic validation, deterministic economics, and staking-backed accountability.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/dashboard/profile" className="brand-button">Open Dashboard</Link>
                <Link href="/whitepaper" className="subtle-button">Whitepaper</Link>
                <Link href="#demo-flow" className="subtle-button">60s Demo</Link>
              </div>

              {/* stats strip */}
              <div id="proof" className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.07] sm:grid-cols-4">
                {stats.map((s, i) => (
                  <div key={s.label}
                    className={`bg-white/[0.02] hover:bg-white/[0.04] transition-colors p-4 ${i > 0 ? "border-l border-white/[0.07]" : ""}`}>
                    <p className="mono-label text-[10px] text-white/25">{s.label}</p>
                    <p className="mt-1.5 text-xl font-bold text-white">{s.value}</p>
                    <p className="mt-0.5 text-xs text-white/35">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* right — value snapshot */}
            <div className="surface-card p-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0" />
                <p className="mono-label text-[10px] text-cyan-300/80">WHY DOCUMATE</p>
              </div>
              <h2 className="text-xl font-bold text-white">DocuMate vs the alternatives</h2>
              <p className="mt-1 text-xs text-white/35 sm:hidden">(vs traditional platforms)</p>
              <div className="mt-4 space-y-2.5">
                {comparisonRows.map((row, i) => (
                  <div key={row.feature} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                    <div className="grid grid-cols-[84px_1fr] gap-3 sm:grid-cols-[86px_1fr_1fr] sm:items-start">
                      <p className="mono-label text-[10px] text-white/20 uppercase leading-4">
                        0{i + 1} {row.feature}
                      </p>
                      <p className="hidden text-xs text-white/45 leading-5 sm:block">
                        <span className="text-red-300/60">✗ </span>
                        {row.others}
                      </p>
                      <p className="text-xs text-amber-300 leading-5">
                        <span className="text-amber-300">✓ </span>
                        {row.documate}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/dashboard/market" className="mt-6 subtle-button w-full text-center justify-center">
                Run Market Purchase Flow
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* architecture */}
      <section id="architecture" className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-20">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="surface-card p-7">
            <p className="mono-label text-[10px] text-white/25">System Architecture</p>
            <h3 className="mt-2 text-2xl font-bold text-white">Hub-and-Spoke Trust Stack</h3>
            <p className="mt-4 text-sm text-white/45 leading-7">
              Next.js orchestrates UX, Polkadot Hub EVM enforces immutable logic,
              and validation pipelines provide signature-aware trust tiers.
            </p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {archItems.map((item) => (
                <div key={item.label}
                  className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3.5 hover:bg-white/[0.04] transition-colors">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/60 shrink-0" />
                  <div>
                    <p className="mono-label text-[10px] text-white/25">{item.label}</p>
                    <p className={`text-sm font-semibold ${item.color}`}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card p-7">
            <p className="mono-label text-[10px] text-white/25">UX Quality Rules</p>
            <h3 className="mt-2 text-2xl font-bold text-white">Demo-first interaction design</h3>
            <div className="mt-5 space-y-3">
              {principles.map((item, i) => (
                <div key={item.title} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-baseline gap-3">
                    <span className="mono-label text-[10px] text-white/20 shrink-0">0{i + 1}</span>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                  </div>
                  <p className="mt-2 pl-7 text-xs text-white/45 leading-6">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* demo flow */}
      <section id="demo-flow" className="relative z-10 border-y border-white/[0.05] bg-white/[0.01] px-6 py-16">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-10 text-center">
            <p className="mono-label text-[10px] text-white/25">Product Demo Path</p>
            <h3 className="mt-2 text-3xl font-bold text-white">Show value in under 60 seconds</h3>
          </div>
          <div className="grid gap-px overflow-hidden rounded-xl border border-white/[0.07] md:grid-cols-5">
            {demoSteps.map((step, i) => (
              <div key={step} className="bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors">
                <p className="mono-label text-[10px] text-cyan-400/55">Step 0{i + 1}</p>
                <p className="mt-3 text-xs text-white/50 leading-6">{step}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/dashboard/profile" className="brand-button">Start Demo</Link>
            <Link href="/dashboard/market" className="subtle-button">Open DocuMarket</Link>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="relative z-10 px-6 py-8">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between border-t border-white/[0.06] pt-6">
          <div>
            <p className="text-sm font-bold text-white">DocuMate</p>
            <p className="mt-0.5 text-xs text-white/25">Decentralized reputation and document trust infrastructure.</p>
          </div>
          <div className="flex items-center gap-5 text-xs text-white/35">
            <Link href="/whitepaper" className="hover:text-white transition-colors">Whitepaper</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
