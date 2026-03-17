import Link from "next/link";

const sections = [
  {
    id: "abstract",
    title: "Abstract",
    body: "DocuMate is a decentralized contract governance and professional reputation engine on Polkadot Hub EVM. It combines on-chain document proofing, a deterministic 75/20/5 marketplace revenue split, DID-linked identity workflows, and privacy-preserving validation pathways to reduce fraud and create portable work credibility.",
  },
  {
    id: "problem",
    title: "Problem",
    body: "Freelancers and clients still rely on screenshots, unverifiable PDFs, and isolated platform ratings. That creates room for fake credentials, payment disputes, and employment scams. DocuMate addresses this by anchoring verifiable work evidence and payouts on-chain.",
  },
  {
    id: "architecture",
    title: "Architecture",
    body: "The system uses a hub-and-spoke architecture: a Next.js application as the orchestration layer, Polkadot Hub EVM contracts for immutable state transitions, DID verification pathways for identity trust, and a TEE-oriented validation path for high-integrity document checks.",
  },
  {
    id: "economics",
    title: "Marketplace Economics",
    body: "Every template purchase executes an immutable contract split: 75% to creator earnings, 20% to protocol treasury, and 5% to community staking incentives. The split is enforced by contract constants rather than policy, preserving trust and transparency for all parties.",
  },
  {
    id: "security",
    title: "Security Model",
    body: "DocuMate uses wallet-based authorization, contract-level access controls, signature-aware document validation tiers, and staking/slashing mechanics for breach reporting. This combines cryptographic integrity with aligned economic penalties for malicious behavior.",
  },
  {
    id: "roadmap",
    title: "Roadmap",
    body: "Near-term priorities include full native precompile verification, production-grade TEE integration, expanded credential interoperability, and a stronger analytics/indexing layer for proof-of-contract reputation profiles.",
  },
];

export default function WhitepaperPage() {
  return (
    <main className="min-h-screen text-white">
      <div className="relative overflow-hidden border-b border-slate-800/70">
        <div className="absolute inset-0">
          <div className="absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        </div>

        <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-sm text-slate-300 hover:text-white transition-colors">
            Back to Home
          </Link>
          <span className="rounded-full border border-cyan-500/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-200 mono-label">
            Whitepaper v1
          </span>
        </div>

        <div className="relative mx-auto max-w-6xl px-6 pb-14 pt-8">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            <span className="gradient-text">
              DocuMate Whitepaper
            </span>
          </h1>
          <p className="mt-6 max-w-3xl text-lg text-slate-300">
            Decentralized Reputation and Contract Governance on Polkadot Hub EVM.
            This document summarizes the protocol vision, architecture, economics,
            and trust model behind DocuMate.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#sections"
              className="brand-button"
            >
              Read Sections
            </a>
            <Link
              href="/dashboard"
              className="subtle-button"
            >
              Open App Demo
            </Link>
          </div>
        </div>
      </div>

      <section id="sections" className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-14 md:grid-cols-[240px_1fr]">
        <aside className="surface-card h-fit p-4 md:sticky md:top-6">
          <p className="mb-3 text-xs text-slate-400 mono-label">Contents</p>
          <nav className="space-y-2">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="block rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/70 hover:text-white transition-colors"
              >
                {section.title}
              </a>
            ))}
          </nav>
        </aside>

        <div className="space-y-6">
          {sections.map((section) => (
            <article
              key={section.id}
              id={section.id}
              className="surface-card p-7"
            >
              <h2 className="text-2xl font-semibold text-white">{section.title}</h2>
              <p className="mt-4 text-slate-300 leading-7">{section.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
