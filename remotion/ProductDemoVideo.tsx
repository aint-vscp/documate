import React from "react";
import {
    AbsoluteFill,
    Img,
    interpolate,
    spring,
    staticFile,
    useCurrentFrame,
} from "remotion";

interface VoiceLine {
    startFrame: number;
    endFrame: number;
    text: string;
}

const T = {
    bg: "#0f131b",
    bgCard: "rgba(255,255,255,0.035)",
    bgNav: "rgba(19,26,38,0.88)",
    bgSidebar: "#111722",
    accent: "#f6851b",
    accentSoft: "#fb923c",
    text: "#f8fafc",
    muted: "#94a3b8",
    border: "rgba(255,255,255,0.1)",
    green: "#34d399",
    red: "#f87171",
    teal: "#2ec7b9",
    gold: "#F59E0B",
    silver: "#94A3B8",
    bronze: "#CD7F32",
    pink: "#E6007A",
    white: "#ffffff",
    black: "#000000",
    dotRed: "#ff5f57",
    dotYellow: "#febc2e",
    dotGreen: "#28c840",
    font: "'Space Grotesk', sans-serif",
    mono: "'IBM Plex Mono', monospace",
    radius: 12,
};

const gridBg: React.CSSProperties = {
    backgroundImage:
        "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
    backgroundSize: "40px 40px",
};

const FPS = 30;
const TOTAL_FRAMES = 5400;

const LANDING_HERO_SUBTITLE =
    "DocuMate turns documents into on-chain trust assets — DID-linked identity, cryptographic validation, deterministic economics, and staking-backed accountability.";

const SIDEBAR_ITEMS = ["Profile", "Documents", "DocuWriter", "People", "DocuMarket", "Template Studio"];

const COMPARISON_ROWS = [
    {
        feature: "Identity Verification",
        others: "Email confirmation or manual KYC - centralized, spoofable, revocable",
        documate:
            "KILT DID anchored on-chain via Polkadot identity precompile - cryptographic, self-sovereign, permanent",
    },
    {
        feature: "Document Authenticity",
        others: "PDF with a digital signature - copied in seconds, no chain of custody",
        documate:
            "Document hash written on-chain at signing - tamper-proof, timestamped, publicly verifiable",
    },
    {
        feature: "Revenue & Economics",
        others: "Platform takes 15-30% with no transparency on where fees go",
        documate:
            "75% creator, 20% treasury, 5% staking pool - hardcoded in the contract, immutable, on-chain",
    },
    {
        feature: "Reputation & Accountability",
        others: "LinkedIn endorsements - anyone can write anything, zero verification",
        documate:
            "Reputation tags derived from verified on-chain contract history - you are what you sign",
    },
    {
        feature: "Fraud Consequence",
        others: "Terms of service violation - account banned, data deleted, no real consequence",
        documate:
            "On-chain staking slash - permanent Breach tag on profile, cryptographic proof of violation",
    },
] as const;

const SCRIPT: VoiceLine[] = [
    { startFrame: 0, endFrame: 90, text: "Ten billion dollars. Lost last year. To fake documents." },
    {
        startFrame: 90,
        endFrame: 180,
        text: "PDFs are forged in minutes. LinkedIn is unverified. Email disappears the moment it's deleted.",
    },
    {
        startFrame: 180,
        endFrame: 270,
        text: "None of these are proof. The trust layer for professional documents does not exist.",
    },
    { startFrame: 270, endFrame: 300, text: "Until now." },
    {
        startFrame: 300,
        endFrame: 480,
        text: "DocuMate is on-chain contract governance. Every document you sign becomes an immutable trust asset on Polkadot Hub.",
    },
    {
        startFrame: 480,
        endFrame: 660,
        text: "We built on Polkadot because it has something Ethereum does not — a native identity precompile at 0x0818. Cryptographic verification, not a checkbox.",
    },
    { startFrame: 660, endFrame: 900, text: "Watch what happens when you open the app." },
    {
        startFrame: 900,
        endFrame: 1080,
        text: "Connect your wallet. DocuMate checks your identity against the Polkadot precompile instantly. Verified — or not. No gray area.",
    },
    {
        startFrame: 1080,
        endFrame: 1300,
        text: "Select a template. Employment contract, NDA, service agreement. The AI drafts it in seconds.",
    },
    {
        startFrame: 1300,
        endFrame: 1560,
        text: "When you finalize — the document hash is written on-chain. Timestamped. Immutable. Publicly verifiable. No one can claim this document does not exist.",
    },
    {
        startFrame: 1560,
        endFrame: 1800,
        text: "That transaction hash is your proof. Not an email. Not a PDF. An on-chain record that cannot be deleted.",
    },
    {
        startFrame: 1800,
        endFrame: 2040,
        text: "Every document gets classified by a Trusted Execution Environment — a Phala simulation running inside a secure enclave.",
    },
    {
        startFrame: 2040,
        endFrame: 2250,
        text: "Gold means cryptographically valid. Silver means structured but unverified. Bronze means no trustworthy evidence. You know exactly what you are signing.",
    },
    {
        startFrame: 2250,
        endFrame: 2400,
        text: "This does not exist on Ethereum. It requires the Polkadot stack.",
    },
    {
        startFrame: 2400,
        endFrame: 2640,
        text: "Lawyers and professionals tokenize their document templates as NFTs and sell them on DocuMarket.",
    },
    {
        startFrame: 2640,
        endFrame: 2880,
        text: "Every purchase executes a smart contract. 75 to the creator. 20 to the treasury. 5 to the staking pool.",
    },
    {
        startFrame: 2880,
        endFrame: 3120,
        text: "The platform cannot change these numbers. They are written into the contract. Not a terms of service. Code.",
    },
    { startFrame: 3120, endFrame: 3300, text: "This is what deterministic economics looks like." },
    {
        startFrame: 3300,
        endFrame: 3540,
        text: "Your reputation on DocuMate is not an endorsement. It is derived strictly from your verified on-chain contract history.",
    },
    {
        startFrame: 3540,
        endFrame: 3750,
        text: "Smart Contract Audit. NDA Verified. Employment Contract. Every tag represents a real signed document on Polkadot Hub.",
    },
    {
        startFrame: 3750,
        endFrame: 3960,
        text: "Breach a contract — admin verifies, on-chain slash executes, and your profile gets a permanent High Risk tag.",
    },
    {
        startFrame: 3960,
        endFrame: 4050,
        text: "You cannot delete it. You cannot appeal to a platform. It is on-chain. Forever.",
    },
    {
        startFrame: 4050,
        endFrame: 4200,
        text: "This is not a prototype. Two smart contracts are live on Polkadot Hub testnet with eleven verified transactions.",
    },
    {
        startFrame: 4200,
        endFrame: 4350,
        text: "Zero vulnerabilities. Deployed at 0x233FE6 — verify on Blockscout right now.",
    },
    { startFrame: 4350, endFrame: 4500, text: "We did not build a demo. We built the product." },
    {
        startFrame: 4500,
        endFrame: 4700,
        text: "Imagine a world where your professional reputation cannot be faked, cannot be erased, and cannot be bought.",
    },
    {
        startFrame: 4700,
        endFrame: 4900,
        text: "Every contract. Every reputation. Every breach. Immutable. On Polkadot Hub.",
    },
    { startFrame: 4900, endFrame: 5100, text: "That is what DocuMate is building." },
    { startFrame: 5100, endFrame: 5350, text: "You are what you sign." },
];

const clampInterpolate = (v: number, i: [number, number], o: [number, number]) =>
    interpolate(v, i, o, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const Logo: React.FC<{ size?: number }> = ({ size = 40 }) => (
    <Img src={staticFile("logo.png")} style={{ width: size, height: size, objectFit: "contain" }} />
);

const SubtitleBar = ({ frame }: { frame: number }) => {
    const active = SCRIPT.find((l) => frame >= l.startFrame && frame < l.endFrame);
    if (!active) return null;
    const p = (frame - active.startFrame) / (active.endFrame - active.startFrame);
    const opacity = interpolate(p, [0, 0.06, 0.88, 1.0], [0, 1, 1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });
    const y = interpolate(p, [0, 0.06], [14, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });
    return (
        <div
            style={{
                position: "absolute",
                bottom: 64,
                left: "50%",
                transform: `translateX(-50%) translateY(${y}px)`,
                opacity,
                maxWidth: 920,
                width: "88%",
                textAlign: "center",
                zIndex: 9999,
            }}
        >
            <div
                style={{
                    background: "rgba(0,0,0,0.78)",
                    border: "1px solid rgba(255,255,255,0.13)",
                    borderRadius: 10,
                    padding: "13px 26px",
                    display: "inline-block",
                }}
            >
                <span
                    style={{
                        fontFamily: T.font,
                        fontSize: 22,
                        fontWeight: 500,
                        color: T.text,
                        lineHeight: 1.5,
                        letterSpacing: "0.01em",
                    }}
                >
                    {active.text}
                </span>
            </div>
        </div>
    );
};

const NavBar: React.FC = () => (
    <div
        style={{
            height: 64,
            width: "100%",
            background: T.bgNav,
            borderBottom: `1px solid ${T.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            position: "relative",
            zIndex: 10,
        }}
    >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Logo size={32} />
            <span style={{ color: T.text, fontSize: 18, fontWeight: 600 }}>DocuMate</span>
            <span
                style={{
                    marginLeft: 12,
                    padding: "4px 10px",
                    borderRadius: 20,
                    fontSize: 10,
                    letterSpacing: "0.1em",
                    color: T.accent,
                    background: "rgba(246,133,27,0.15)",
                    border: "1px solid rgba(246,133,27,0.36)",
                    fontFamily: T.mono,
                }}
            >
                DUAL TRACK
            </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {["Proof", "Architecture", "Demo Flow", "Whitepaper"].map((it) => (
                <span key={it} style={{ color: T.muted, fontSize: 14 }}>
                    {it}
                </span>
            ))}
        </div>
        <div
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                borderRadius: 20,
                padding: "6px 14px",
                background: "rgba(246,133,27,0.15)",
                border: "1px solid rgba(246,133,27,0.4)",
            }}
        >
            <span style={{ width: 8, height: 8, borderRadius: 999, background: T.green }} />
            <span style={{ color: T.text, fontSize: 13, fontFamily: T.mono }}>0x3140...ca91</span>
        </div>
    </div>
);

const DashboardSidebar: React.FC<{ active: string }> = ({ active }) => (
    <aside style={{ width: 240, height: "100%", background: T.bgSidebar, borderRight: `1px solid ${T.border}` }}>
        <div style={{ padding: 20, display: "flex", alignItems: "center", gap: 10 }}>
            <Logo size={28} />
            <span style={{ color: T.text, fontSize: 16, fontWeight: 600 }}>DocuMate</span>
        </div>
        <div style={{ height: 1, background: T.border }} />
        <div style={{ paddingTop: 12 }}>
            {SIDEBAR_ITEMS.map((item) => {
                const isActive = item === active;
                return (
                    <div
                        key={item}
                        style={{
                            height: 40,
                            color: isActive ? T.text : T.muted,
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            paddingLeft: 20,
                            borderLeft: isActive ? `3px solid ${T.accent}` : "3px solid transparent",
                            background: isActive ? "rgba(246,133,27,0.1)" : "transparent",
                            fontSize: 14,
                        }}
                    >
                        {item}
                    </div>
                );
            })}
        </div>
    </aside>
);

const BrowserChrome: React.FC<{ url: string; children: React.ReactNode }> = ({ url, children }) => (
    <div
        style={{
            borderRadius: 14,
            border: `1px solid ${T.border}`,
            overflow: "hidden",
            background: T.bgCard,
            width: "100%",
            height: "100%",
        }}
    >
        <div
            style={{
                height: 36,
                background: "rgba(255,255,255,0.04)",
                display: "flex",
                alignItems: "center",
                paddingLeft: 14,
                paddingRight: 14,
                gap: 7,
            }}
        >
            <span style={{ width: 10, height: 10, borderRadius: 999, background: T.dotRed }} />
            <span style={{ width: 10, height: 10, borderRadius: 999, background: T.dotYellow }} />
            <span style={{ width: 10, height: 10, borderRadius: 999, background: T.dotGreen }} />
            <div style={{ flex: 1, textAlign: "center", fontSize: 12, color: T.muted, fontFamily: T.mono }}>{url}</div>
        </div>
        <div style={{ height: "calc(100% - 36px)" }}>{children}</div>
    </div>
);

const Page3D: React.FC<{
    rotateY?: number;
    rotateX?: number;
    scale?: number;
    children: React.ReactNode;
}> = ({ rotateY = 0, rotateX = 0, scale = 1, children }) => (
    <div
        style={{
            transform: `perspective(1200px) rotateY(${rotateY}deg) rotateX(${rotateX}deg) scale(${scale})`,
            transformStyle: "preserve-3d",
            transformOrigin: "center center",
            boxShadow: rotateY !== 0 ? `${rotateY * 2}px 0 40px rgba(0,0,0,0.6)` : "none",
            width: "100%",
            height: "100%",
        }}
    >
        {children}
    </div>
);

const HeroPage: React.FC<{ openButtonBoost?: number }> = ({ openButtonBoost = 0 }) => (
    <div style={{ width: 1920, height: 1080, background: T.bg, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, ...gridBg }} />
        <NavBar />
        <div
            style={{
                position: "absolute",
                top: 120,
                left: 80,
                right: 80,
                bottom: 40,
                display: "grid",
                gridTemplateColumns: "1fr 0.92fr",
                gap: 60,
            }}
        >
            <div>
                <div style={{ fontFamily: T.mono, fontSize: 11, color: T.teal, letterSpacing: "0.12em" }}>
                    POLKADOT HUB RUNTIME DAPP
                </div>
                <div style={{ marginTop: 20, color: T.text, fontSize: 72, fontWeight: 800, lineHeight: 1.04 }}>
                    End Fraud with
                </div>
                <div style={{ color: T.accent, fontSize: 72, fontWeight: 800, lineHeight: 1.04 }}>Verifiable</div>
                <div style={{ color: T.accent, fontSize: 72, fontWeight: 800, lineHeight: 1.04 }}>Contracts.</div>
                <p
                    style={{
                        color: T.muted,
                        fontSize: 18,
                        lineHeight: 1.7,
                        maxWidth: 520,
                        marginTop: 24,
                    }}
                >
                    {LANDING_HERO_SUBTITLE}
                </p>
                <div style={{ marginTop: 40, display: "flex", gap: 12 }}>
                    <button
                        style={{
                            background: `rgba(246,133,27,${0.85 + openButtonBoost * 0.15})`,
                            color: T.text,
                            border: "none",
                            borderRadius: 8,
                            padding: "12px 16px",
                            fontWeight: 700,
                        }}
                    >
                        Open Dashboard
                    </button>
                    <button
                        style={{
                            background: "transparent",
                            color: T.text,
                            border: `1px solid ${T.border}`,
                            borderRadius: 8,
                            padding: "12px 16px",
                            fontWeight: 600,
                        }}
                    >
                        Whitepaper
                    </button>
                    <button
                        style={{
                            background: "transparent",
                            color: T.text,
                            border: `1px solid ${T.border}`,
                            borderRadius: 8,
                            padding: "12px 16px",
                            fontWeight: 600,
                        }}
                    >
                        60s Demo
                    </button>
                </div>
            </div>
            <div
                style={{
                    background: T.bgCard,
                    border: `1px solid ${T.border}`,
                    borderRadius: 16,
                    padding: 28,
                    backdropFilter: "blur(10px)",
                    height: "fit-content",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: T.accent }} />
                    <span style={{ color: T.muted, fontFamily: T.mono, fontSize: 11 }}>WHY DOCUMATE</span>
                </div>
                <div style={{ marginTop: 10, color: T.text, fontSize: 20, fontWeight: 600 }}>
                    DocuMate vs the alternatives
                </div>
                <div style={{ marginTop: 10 }}>
                    {COMPARISON_ROWS.map((row, idx) => (
                        <div key={row.feature} style={{ padding: "11px 0", borderBottom: idx < 4 ? `1px solid ${T.border}` : "none" }}>
                            <div style={{ color: T.muted, fontSize: 12 }}>{row.feature}</div>
                            <div style={{ marginTop: 4, color: T.red, fontSize: 11 }}>{row.others}</div>
                            <div style={{ marginTop: 3, color: T.accent, fontSize: 11 }}>{row.documate}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

const DashboardPage: React.FC<{
    active: string;
    title: string;
    breadcrumb?: string;
    children: React.ReactNode;
}> = ({ active, title, breadcrumb = "Dashboard", children }) => (
    <div style={{ width: 1920, height: 1080, background: T.bg, padding: 34 }}>
        <BrowserChrome url="documate.app/dashboard">
            <div style={{ display: "flex", height: "100%" }}>
                <DashboardSidebar active={active} />
                <div style={{ flex: 1, position: "relative", background: T.bg }}>
                    <div
                        style={{
                            height: 76,
                            borderBottom: `1px solid ${T.border}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0 22px",
                        }}
                    >
                        <div>
                            <div style={{ color: T.muted, fontFamily: T.mono, fontSize: 11 }}>{breadcrumb}</div>
                            <div style={{ color: T.text, fontWeight: 700, fontSize: 22, marginTop: 3 }}>{title}</div>
                        </div>
                    </div>
                    <div style={{ position: "absolute", inset: "76px 0 0 0", padding: 22 }}>{children}</div>
                </div>
            </div>
        </BrowserChrome>
    </div>
);

const StudioPage: React.FC<{ text: string; cursorVisible: boolean }> = ({ text, cursorVisible }) => (
    <div>
        <div style={{ color: T.text, fontSize: 28, fontWeight: 700 }}>DocuWriter</div>
        <button
            style={{
                marginTop: 12,
                background: T.bgCard,
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                color: T.text,
                padding: "10px 12px",
                width: 360,
                textAlign: "left",
            }}
        >
            Employment Contract Template ▼
        </button>
        <div
            style={{
                marginTop: 16,
                background: T.bgCard,
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                padding: 24,
                fontFamily: T.mono,
                fontSize: 13,
                color: T.text,
                minHeight: 400,
                whiteSpace: "pre-wrap",
                lineHeight: 1.6,
            }}
        >
            {text}
            <span
                style={{
                    display: "inline-block",
                    width: 2,
                    height: 16,
                    background: T.text,
                    marginLeft: 2,
                    opacity: cursorVisible ? 1 : 0,
                }}
            />
        </div>
        <button
            style={{
                marginTop: 14,
                width: "100%",
                height: 48,
                background: T.accent,
                color: T.text,
                border: "none",
                borderRadius: 8,
                fontWeight: 600,
            }}
        >
            Anchor to Blockchain
        </button>
    </div>
);

const MarketPage: React.FC = () => (
    <div>
        <div style={{ color: T.text, fontSize: 28, fontWeight: 700 }}>DocuMarket</div>
        <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 20 }}>
            {["Professional NDA Template", "Software Development Contract", "Partnership Agreement"].map((name, i) => (
                <div
                    key={name}
                    style={{
                        background: T.bgCard,
                        border: `1px solid ${T.border}`,
                        borderRadius: 12,
                        padding: 20,
                    }}
                >
                    <div style={{ color: T.text, fontSize: 16, fontWeight: 600 }}>{name}</div>
                    <div style={{ marginTop: 8, color: T.muted, fontSize: 12, fontFamily: T.mono }}>0xA800...5f15</div>
                    <div style={{ marginTop: 12 }}>
                        <span style={{ color: T.accent, fontSize: 24, fontWeight: 700 }}>{(i + 3) * 25}</span>
                        <span style={{ color: T.muted, fontSize: 14, marginLeft: 6 }}>PAS</span>
                    </div>
                    <button
                        style={{
                            marginTop: 12,
                            height: 36,
                            width: "100%",
                            background: T.accent,
                            color: T.text,
                            border: "none",
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 600,
                        }}
                    >
                        Purchase
                    </button>
                </div>
            ))}
        </div>
    </div>
);

const ProfilePage: React.FC<{ breached?: boolean }> = ({ breached = false }) => (
    <div>
        <div style={{ color: T.text, fontSize: 28, fontWeight: 700 }}>Profile</div>
        <div
            style={{
                marginTop: 18,
                background: T.bgCard,
                border: `1px solid ${T.border}`,
                borderRadius: 16,
                padding: 28,
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                    style={{
                        width: 64,
                        height: 64,
                        borderRadius: 999,
                        background: T.accent,
                        display: "grid",
                        placeItems: "center",
                        color: T.text,
                        fontSize: 24,
                        fontWeight: 700,
                    }}
                >
                    VS
                </div>
                <div>
                    <div style={{ color: T.text, fontSize: 22, fontWeight: 600 }}>Vash Santos</div>
                    <div style={{ marginTop: 2, color: T.muted, fontSize: 13, fontFamily: T.mono }}>0x3140...ca91</div>
                </div>
                <span
                    style={{
                        marginLeft: 16,
                        padding: "5px 10px",
                        borderRadius: 999,
                        background: "rgba(52,211,153,0.15)",
                        color: T.green,
                        fontSize: 12,
                        fontWeight: 600,
                    }}
                >
                    ✓ Verified
                </span>
            </div>
            <div style={{ marginTop: 20, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["Smart Contract Audit", "NDA Verified", "Employment Contract"].map((tag) => (
                    <span
                        key={tag}
                        style={{
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 500,
                            padding: "4px 12px",
                            background: "rgba(46,199,185,0.15)",
                            border: "1px solid rgba(46,199,185,0.3)",
                            color: T.teal,
                        }}
                    >
                        {tag}
                    </span>
                ))}
                {breached ? (
                    <span
                        style={{
                            borderRadius: 20,
                            fontSize: 13,
                            fontWeight: 700,
                            padding: "5px 14px",
                            background: "rgba(248,113,113,0.15)",
                            border: "1px solid rgba(248,113,113,0.3)",
                            color: T.red,
                        }}
                    >
                        HIGH RISK
                    </span>
                ) : null}
            </div>
        </div>
    </div>
);

const CursorArrow: React.FC<{ left: number; top: number; opacity?: number }> = ({ left, top, opacity = 1 }) => (
    <div
        style={{
            position: "absolute",
            left,
            top,
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
            opacity,
            zIndex: 200,
        }}
    >
        <svg width="24" height="24" viewBox="0 0 24 24">
            <path
                d="M4 2L4 18L8 14L11 20L13 19L10 13L16 13Z"
                fill="white"
                stroke="rgba(0,0,0,0.3)"
                strokeWidth="1"
            />
        </svg>
    </div>
);

const ClickRipple: React.FC<{ x: number; y: number; startFrame: number; currentFrame: number }> = ({
    x,
    y,
    startFrame,
    currentFrame,
}) => {
    const rel = currentFrame - startFrame;
    if (rel < 0 || rel > 20) return null;
    const scale = interpolate(rel, [0, 20], [0, 2.5], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const opacity = interpolate(rel, [0, 20], [0.6, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return (
        <div
            style={{
                position: "absolute",
                left: x - 10,
                top: y - 10,
                width: 20,
                height: 20,
                borderRadius: 999,
                border: `2px solid rgba(246,133,27,${opacity})`,
                transform: `scale(${scale})`,
                opacity,
                zIndex: 150,
            }}
        />
    );
};

const TxHashDisplay: React.FC<{ hash: string; progress: number }> = ({ hash, progress }) => {
    const chars = Math.floor(hash.length * progress);
    return (
        <div style={{ marginTop: 14 }}>
            <div style={{ color: T.muted, fontFamily: T.mono, fontSize: 11 }}>Tx Hash</div>
            <div style={{ color: T.text, fontFamily: T.mono, fontSize: 14, marginTop: 4 }}>{hash.slice(0, chars)}</div>
            <div style={{ color: T.muted, fontFamily: T.mono, fontSize: 12, marginTop: 6 }}>
                blockscout-testnet.polkadot.io/tx/0x4f3a...
            </div>
        </div>
    );
};

const MetricCard: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color = T.text }) => (
    <div
        style={{
            background: T.bgCard,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: "20px 24px",
            textAlign: "center",
        }}
    >
        <div style={{ color: T.muted, fontSize: 13, marginBottom: 8 }}>{label}</div>
        <div style={{ color, fontSize: 48, fontWeight: 700 }}>{value}</div>
    </div>
);

const RevenueBar: React.FC<{ frame: number; startFrame: number }> = ({ frame, startFrame }) => {
    const rel = frame - startFrame;
    const s1 = clampInterpolate(rel, [0, 40], [0, 75]);
    const s2 = clampInterpolate(rel - 40, [0, 25], [0, 20]);
    const s3 = clampInterpolate(rel - 70, [0, 10], [0, 5]);
    return (
        <div>
            <div style={{ display: "flex", marginBottom: 8, fontFamily: T.mono, fontSize: 12, color: T.muted, gap: 12 }}>
                <span style={{ opacity: rel >= 0 ? 1 : 0 }}>75% · 0.60 PAS</span>
                <span style={{ opacity: rel >= 40 ? 1 : 0 }}>20% · 0.16 PAS</span>
                <span style={{ opacity: rel >= 70 ? 1 : 0 }}>5% · 0.04 PAS</span>
            </div>
            <div
                style={{
                    width: "100%",
                    height: 48,
                    background: T.bgCard,
                    borderRadius: 8,
                    border: `1px solid ${T.border}`,
                    overflow: "hidden",
                    display: "flex",
                }}
            >
                <div style={{ width: `${s1}%`, background: T.accent }} />
                <div style={{ width: `${s2}%`, background: "rgba(148,163,184,0.6)" }} />
                <div style={{ width: `${s3}%`, background: T.teal }} />
            </div>
        </div>
    );
};

const studioFullText =
    "EMPLOYMENT AGREEMENT\\n\\nThis Employment Agreement ('Agreement') is entered into as of [DATE] between [EMPLOYER NAME] ('Company') and [EMPLOYEE NAME] ('Employee').\\n\\n1. POSITION AND DUTIES\\nEmployee agrees to serve in the position of [JOB TITLE] and perform services as assigned by Company.\\n\\n2. COMPENSATION\\nCompany agrees to pay Employee [SALARY] and provide benefits according to company policy.\\n\\n3. CONFIDENTIALITY\\nEmployee agrees to maintain confidentiality of proprietary information.\\n\\n4. TERM AND TERMINATION\\nThis Agreement shall commence immediately and continue until terminated by either party under applicable law.\\n\\nSigned by both parties and anchored on-chain.";

const ProductScene: React.FC = () => {
    const frame = useCurrentFrame();

    const scene1 = frame >= 0 && frame < 300;
    const scene2 = frame >= 300 && frame < 900;
    const scene3 = frame >= 900 && frame < 1800;
    const scene4 = frame >= 1800 && frame < 2400;
    const scene5 = frame >= 2400 && frame < 3300;
    const scene6 = frame >= 3300 && frame < 4050;
    const scene7 = frame >= 4050 && frame < 4500;
    const scene8 = frame >= 4500 && frame <= 5400;

    const local2 = frame - 300;
    const local3 = frame - 900;
    const local4 = frame - 1800;
    const local5 = frame - 2400;
    const local6 = frame - 3300;
    const local7 = frame - 4050;
    const local8 = frame - 4500;

    const c1Scale = spring({ frame: Math.max(0, frame - 60), fps: FPS, config: { damping: 14 } });

    return (
        <AbsoluteFill
            style={{
                width: 1920,
                height: 1080,
                background: T.bg,
                overflow: "hidden",
                position: "relative",
                fontFamily: T.font,
            }}
        >
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap')`}
            </style>

            {scene1 ? (
                <AbsoluteFill style={{ display: "grid", placeItems: "center", color: T.text }}>
                    <div
                        style={{
                            opacity: clampInterpolate(frame, [0, 5], [0, 1]),
                            fontFamily: T.mono,
                            color: T.muted,
                            fontSize: 11,
                            position: "absolute",
                            top: 220,
                        }}
                    >
                        Last year, $10,000,000,000 was lost to document fraud.
                    </div>

                    <div
                        style={{
                            opacity: frame < 60 ? 0 : clampInterpolate(frame - 60, [0, 20], [1, 0]),
                            fontSize: 42,
                            color: T.muted,
                            position: "absolute",
                            top: 300,
                        }}
                    >
                        Last year...
                    </div>

                    <div
                        style={{
                            fontWeight: 800,
                            color: T.text,
                            fontSize: interpolate(frame, [60, 120], [96, 160], {
                                extrapolateLeft: "clamp",
                                extrapolateRight: "clamp",
                            }),
                            transform: `scale(${1 + c1Scale * 2})`,
                            opacity: frame >= 60 ? 1 : 0,
                        }}
                    >
                        $10,000,000,000
                    </div>

                    <div style={{ position: "absolute", top: 470, display: "flex", gap: 24 }}>
                        {["PDF Signature", "LinkedIn Endorsement", "Email Thread"].map((txt, i) => {
                            const inF = 120 + i * 10;
                            const rowRel = frame - inF;
                            const x = spring({ frame: rowRel, fps: FPS, config: { damping: 12, stiffness: 120 } });
                            const strikeStart = [180, 195, 210][i];
                            const dash = clampInterpolate(frame - strikeStart, [0, 10], [320, 0]);
                            const collapse = frame >= 225 ? clampInterpolate(frame - 225, [0, 15], [1, 0]) : 1;
                            return (
                                <div
                                    key={txt}
                                    style={{
                                        width: 320,
                                        padding: 16,
                                        borderRadius: T.radius,
                                        background: T.bgCard,
                                        border: `1px solid ${T.border}`,
                                        transform: `translateX(${(1 - x) * 400}px) scale(${collapse})`,
                                        opacity: x * collapse,
                                        position: "relative",
                                    }}
                                >
                                    <div style={{ color: T.text, fontWeight: 600 }}>{txt}</div>
                                    <svg width="320" height="48" style={{ position: "absolute", left: 0, top: 0 }}>
                                        <line
                                            x1="0"
                                            y1="26"
                                            x2="320"
                                            y2="26"
                                            stroke={T.red}
                                            strokeWidth="2"
                                            strokeDasharray="320"
                                            strokeDashoffset={dash}
                                        />
                                    </svg>
                                </div>
                            );
                        })}
                    </div>

                    <div
                        style={{
                            position: "absolute",
                            width: 20,
                            height: 20,
                            borderRadius: 999,
                            background: T.white,
                            transform: `scale(${clampInterpolate(frame - 240, [0, 30], [0, 100])})`,
                            opacity: interpolate(frame - 240, [0, 15, 30], [0.8, 0.4, 0], {
                                extrapolateLeft: "clamp",
                                extrapolateRight: "clamp",
                            }),
                        }}
                    />
                </AbsoluteFill>
            ) : null}

            {scene2 ? (
                <AbsoluteFill>
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            transform: `translateX(${clampInterpolate(local2, [0, 90], [-200, 0])}px)`,
                        }}
                    >
                        <Page3D
                            rotateY={interpolate(local2, [0, 90, 180], [-45, -15, 0], {
                                easing: easeInOutCubic,
                                extrapolateRight: "clamp",
                            })}
                            scale={clampInterpolate(local2, [0, 180], [0.85, 0.95])}
                        >
                            <HeroPage
                                openButtonBoost={interpolate(local2, [410, 420], [0, 1], {
                                    extrapolateLeft: "clamp",
                                    extrapolateRight: "clamp",
                                })}
                            />
                        </Page3D>
                    </div>

                    {local2 >= 300 ? (
                        <CursorArrow
                            left={clampInterpolate(local2 - 360, [0, 60], [1400, 280])}
                            top={clampInterpolate(local2 - 360, [0, 60], [800, 420])}
                        />
                    ) : null}

                    <ClickRipple x={360} y={472} startFrame={300 + 418} currentFrame={frame} />

                    {local2 >= 420 ? (
                        <>
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    transform: `translateX(${clampInterpolate(local2 - 420, [0, 90], [0, -1920])}px)`,
                                }}
                            >
                                <HeroPage />
                            </div>
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    transform: `translateX(${clampInterpolate(local2 - 420, [0, 90], [1920, 0])}px)`,
                                }}
                            >
                                <DashboardPage active="Profile" title="Profile">
                                    <ProfilePage />
                                </DashboardPage>
                            </div>
                        </>
                    ) : null}
                </AbsoluteFill>
            ) : null}

            {scene3 ? (
                <AbsoluteFill>
                    <DashboardPage active="DocuWriter" title="DocuWriter">
                        <StudioPage
                            text={studioFullText.slice(
                                0,
                                Math.floor(
                                    interpolate(local3, [180, 600], [0, studioFullText.length], {
                                        extrapolateLeft: "clamp",
                                        extrapolateRight: "clamp",
                                    })
                                )
                            )}
                            cursorVisible={Math.floor(local3 / 15) % 2 === 0}
                        />
                        {local3 >= 780 ? (
                            <TxHashDisplay
                                hash="0x4f3a8b2cc2a4b19de8f97a6a20e975ef8ef01bcfe9d778143dd4a1158ab93e71"
                                progress={clampInterpolate(local3, [790, 850], [0, 1])}
                            />
                        ) : null}
                    </DashboardPage>

                    <CursorArrow
                        left={
                            local3 < 80
                                ? 640
                                : local3 < 180
                                  ? clampInterpolate(local3, [120, 180], [640, 700])
                                  : local3 < 716
                                    ? 700
                                    : clampInterpolate(local3, [660, 716], [700, 1000])
                        }
                        top={
                            local3 < 80
                                ? 248
                                : local3 < 180
                                  ? clampInterpolate(local3, [120, 180], [248, 292])
                                  : local3 < 716
                                    ? 292
                                    : clampInterpolate(local3, [660, 716], [292, 806])
                        }
                    />

                    <ClickRipple x={700} y={292} startFrame={900 + 80} currentFrame={frame} />
                    <ClickRipple x={1000} y={806} startFrame={900 + 716} currentFrame={frame} />

                    {local3 >= 720 && local3 < 780 ? (
                        <div
                            style={{
                                position: "absolute",
                                left: 366,
                                top: 823,
                                width: 1010,
                                height: 6,
                                borderRadius: 999,
                                border: `1px solid ${T.border}`,
                                overflow: "hidden",
                                background: T.bgCard,
                            }}
                        >
                            <div
                                style={{
                                    width: `${clampInterpolate(local3 - 720, [0, 40], [0, 100])}%`,
                                    height: "100%",
                                    background: T.accent,
                                }}
                            />
                        </div>
                    ) : null}
                </AbsoluteFill>
            ) : null}

            {scene4 ? (
                <AbsoluteFill style={{ display: "grid", placeItems: "center" }}>
                    <div
                        style={{
                            width: 1020,
                            padding: 30,
                            borderRadius: 16,
                            border: `1px solid ${T.border}`,
                            background: T.bgCard,
                            transform: `translateX(${clampInterpolate(local4, [0, 60], [400, 0])}px) rotateY(${interpolate(
                                local4 - 360,
                                [0, 45, 90],
                                [0, 15, 0],
                                {
                                    extrapolateLeft: "clamp",
                                    extrapolateRight: "clamp",
                                }
                            )}deg) rotateZ(${local4 >= 60 && local4 <= 150 ? Math.sin(local4) * 0.4 : 0}deg)`,
                        }}
                    >
                        <div style={{ color: T.text, fontSize: 32, fontWeight: 700 }}>TEE Classification</div>
                        <div style={{ marginTop: 14, position: "relative", height: 240, border: `1px solid ${T.border}`, borderRadius: 12 }}>
                            <div
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    right: 0,
                                    top: clampInterpolate(local4 - 60, [0, 90], [0, 300]),
                                    height: 2,
                                    background: `linear-gradient(90deg, transparent, ${T.teal}, transparent)`,
                                }}
                            />
                            <div style={{ padding: 20, color: T.muted, fontFamily: T.mono, fontSize: 13, lineHeight: 1.8 }}>
                                <div style={{ opacity: clampInterpolate(local4 - 70, [0, 10], [0, 1]) }}>Parsing signatures...</div>
                                <div style={{ opacity: clampInterpolate(local4 - 100, [0, 10], [0, 1]) }}>Verifying structure...</div>
                                <div style={{ opacity: clampInterpolate(local4 - 130, [0, 10], [0, 1]) }}>
                                    Checking cryptographic proof...
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
                            <span style={{ color: T.bronze, opacity: 0.2, transform: "scale(0.9)" }}>BRONZE</span>
                            <span style={{ color: T.silver, opacity: 0.2, transform: "scale(0.9)" }}>SILVER</span>
                            <span
                                style={{
                                    color: T.gold,
                                    fontWeight: 800,
                                    transform: `scale(${spring({ frame: local4 - 180, fps: FPS, config: { damping: 10, stiffness: 120 } })})`,
                                    opacity: 1,
                                    boxShadow: "0 0 18px rgba(245,158,11,0.5)",
                                    padding: "0 8px",
                                }}
                            >
                                GOLD
                            </span>
                        </div>
                        <div
                            style={{
                                marginTop: 10,
                                color: T.green,
                                opacity: clampInterpolate(local4 - 270, [0, 90], [0, 1]),
                                transform: `translateY(${clampInterpolate(local4 - 270, [0, 90], [10, 0])}px)`,
                            }}
                        >
                            VERIFIED · CRYPTOGRAPHICALLY VALID
                        </div>
                    </div>
                </AbsoluteFill>
            ) : null}

            {scene5 ? (
                <AbsoluteFill>
                    <DashboardPage active="DocuMarket" title="DocuMarket">
                        <MarketPage />
                        {local5 >= 180 ? (
                            <div
                                style={{
                                    position: "absolute",
                                    left: "50%",
                                    top: 150,
                                    transform: `translateX(-50%) translateY(${clampInterpolate(local5 - 180, [0, 40], [300, 0])}px)`,
                                    width: 420,
                                    background: T.bg,
                                    border: `1px solid ${T.border}`,
                                    borderRadius: 12,
                                    padding: 16,
                                }}
                            >
                                <div style={{ color: T.text, fontWeight: 700 }}>Purchase Template</div>
                                <div style={{ marginTop: 8, color: T.muted, fontSize: 13 }}>Employment Contract Template</div>
                                <button
                                    style={{
                                        marginTop: 12,
                                        width: "100%",
                                        height: 40,
                                        border: "none",
                                        borderRadius: 8,
                                        background: T.accent,
                                        color: T.text,
                                        fontWeight: 700,
                                    }}
                                >
                                    Confirm Purchase
                                </button>
                            </div>
                        ) : null}
                        {local5 >= 360 ? (
                            <div
                                style={{
                                    position: "absolute",
                                    left: 22,
                                    right: 22,
                                    bottom: 20,
                                    padding: 16,
                                    borderRadius: 12,
                                    border: `1px solid ${T.border}`,
                                    background: T.bgCard,
                                }}
                            >
                                <RevenueBar frame={local5} startFrame={360} />
                                <div style={{ marginTop: 12, color: T.text, opacity: clampInterpolate(local5 - 600, [0, 20], [0, 1]) }}>
                                    Hardcoded in the smart contract.
                                </div>
                                <div style={{ marginTop: 4, color: T.accent, opacity: clampInterpolate(local5 - 660, [0, 20], [0, 1]) }}>
                                    Immutable. Forever.
                                </div>
                            </div>
                        ) : null}
                    </DashboardPage>

                    <CursorArrow
                        left={
                            local5 < 180
                                ? clampInterpolate(local5, [120, 180], [780, 560])
                                : local5 < 300
                                  ? 560
                                  : clampInterpolate(local5, [300, 360], [560, 850])
                        }
                        top={local5 < 180 ? clampInterpolate(local5, [120, 180], [630, 360]) : local5 < 300 ? 360 : 360}
                    />
                    <ClickRipple x={560} y={360} startFrame={2400 + 175} currentFrame={frame} />
                    <ClickRipple x={850} y={360} startFrame={2400 + 300} currentFrame={frame} />
                </AbsoluteFill>
            ) : null}

            {scene6 ? (
                <AbsoluteFill>
                    <DashboardPage active="Profile" title="Profile">
                        <div
                            style={{
                                opacity: clampInterpolate(local6, [0, 60], [0, 1]),
                                transform: `translateY(${clampInterpolate(local6, [0, 60], [20, 0])}px)`,
                            }}
                        >
                            <ProfilePage breached={local6 >= 540} />
                        </div>
                    </DashboardPage>

                    {local6 >= 330 && local6 <= 335 ? (
                        <div style={{ position: "absolute", inset: 0, background: T.red, opacity: 0.5 }} />
                    ) : null}

                    {local6 >= 335 ? (
                        <div
                            style={{
                                position: "absolute",
                                left: "50%",
                                transform: `translateX(-50%) translateY(${120 - spring({ frame: local6 - 335, fps: FPS }) * 120}px)`,
                                top: 0,
                                width: 580,
                                padding: 16,
                                textAlign: "center",
                                background: "rgba(248,113,113,0.16)",
                                border: `1px solid rgba(248,113,113,0.4)`,
                                color: T.red,
                                fontWeight: 700,
                            }}
                        >
                            BREACH CONFIRMED
                        </div>
                    ) : null}
                </AbsoluteFill>
            ) : null}

            {scene7 ? (
                <AbsoluteFill style={{ padding: 70 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 18 }}>
                        <div
                            style={{
                                transform: `translateY(${30 - spring({ frame: local7, fps: FPS }) * 30}px)`,
                                opacity: clampInterpolate(local7, [0, 60], [0, 1]),
                            }}
                        >
                            <MetricCard label="Contracts Live" value={`${Math.floor(clampInterpolate(local7, [0, 60], [0, 2]))}`} />
                        </div>
                        <div
                            style={{
                                transform: `translateY(${30 - spring({ frame: local7 - 35, fps: FPS }) * 30}px)`,
                                opacity: clampInterpolate(local7 - 35, [0, 60], [0, 1]),
                            }}
                        >
                            <MetricCard label="Transactions" value={`${Math.floor(clampInterpolate(local7 - 35, [0, 60], [0, 11]))}`} />
                        </div>
                        <div
                            style={{
                                transform: `translateY(${30 - spring({ frame: local7 - 70, fps: FPS }) * 30}px)`,
                                opacity: clampInterpolate(local7 - 70, [0, 60], [0, 1]),
                            }}
                        >
                            <MetricCard label="Vulnerabilities" value="0" color={T.green} />
                        </div>
                    </div>
                    <div style={{ marginTop: 30, color: T.muted, fontFamily: T.mono, fontSize: 16 }}>
                        {
                            "https://blockscout-testnet.polkadot.io/address/0x233FE6112E5Ad4Db1c83358B30D581F837314BB1".slice(
                                0,
                                Math.floor(clampInterpolate(local7 - 150, [0, 40], [0, 90]))
                            )
                        }
                    </div>
                    <div style={{ marginTop: 10, color: T.muted, fontFamily: T.mono, fontSize: 16 }}>
                        {
                            "https://blockscout-testnet.polkadot.io/txs".slice(
                                0,
                                Math.floor(clampInterpolate(local7 - 195, [0, 40], [0, 39]))
                            )
                        }
                    </div>
                </AbsoluteFill>
            ) : null}

            {scene8 ? (
                <AbsoluteFill>
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            transform: `scale(${clampInterpolate(local8, [0, 120], [0.9, 0.12])})`,
                            opacity: interpolate(local8, [90, 120], [1, 0], {
                                extrapolateLeft: "clamp",
                                extrapolateRight: "clamp",
                            }),
                            transformOrigin: "center",
                        }}
                    >
                        <DashboardPage active="Profile" title="Proof">
                            <div style={{ color: T.text, fontSize: 32, fontWeight: 700 }}>DocuMate Composite</div>
                        </DashboardPage>
                    </div>

                    <svg width="1920" height="1080" style={{ position: "absolute", inset: 0 }}>
                        {new Array(20).fill(0).map((_, i) => {
                            const nodeStart = i * 12;
                            const show = local8 >= 30 + nodeStart;
                            if (!show) return null;
                            const angle = (Math.PI * 2 * i) / 20;
                            const radius = 300 + (i % 4) * 70;
                            const x = 960 + Math.cos(angle) * radius;
                            const y = 540 + Math.sin(angle) * radius;
                            const pulse = 1 + Math.sin(local8 * 0.1 + i) * 0.15;
                            const nextAngle = (Math.PI * 2 * ((i + 1) % 20)) / 20;
                            const nx = 960 + Math.cos(nextAngle) * radius;
                            const ny = 540 + Math.sin(nextAngle) * radius;
                            return (
                                <g key={i}>
                                    <line x1={x} y1={y} x2={nx} y2={ny} stroke={T.accent} opacity={0.3} />
                                    <circle cx={x} cy={y} r={8 * pulse} fill={T.accent} opacity={0.7} />
                                </g>
                            );
                        })}
                    </svg>

                    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
                        <div style={{ marginTop: -200, color: T.text, fontSize: 64, fontWeight: 700, opacity: clampInterpolate(local8 - 150, [0, 20], [0, 1]) }}>
                            Every contract.
                        </div>
                        <div style={{ marginTop: -120, color: T.text, fontSize: 64, fontWeight: 700, opacity: clampInterpolate(local8 - 220, [0, 20], [0, 1]) }}>
                            Every reputation.
                        </div>
                        <div style={{ marginTop: -40, color: T.text, fontSize: 64, fontWeight: 700, opacity: clampInterpolate(local8 - 290, [0, 20], [0, 1]) }}>
                            Every breach.
                        </div>
                        <div
                            style={{
                                marginTop: 60,
                                color: T.accent,
                                fontSize: 48,
                                fontWeight: 700,
                                opacity: clampInterpolate(local8 - 400, [0, 20], [0, 1]),
                            }}
                        >
                            Immutable. On Polkadot Hub.
                        </div>
                    </div>

                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: T.black,
                            opacity: clampInterpolate(local8 - 400, [0, 20], [0, 1]),
                            display: "grid",
                            placeItems: "center",
                        }}
                    >
                        <div
                            style={{
                                textAlign: "center",
                                transform: `scale(${spring({ frame: local8 - 420, fps: FPS, config: { damping: 11 } })})`,
                            }}
                        >
                            <Logo size={160} />
                            <div
                                style={{
                                    marginTop: 24,
                                    color: T.accent,
                                    fontSize: 42,
                                    fontWeight: 500,
                                    letterSpacing: "0.02em",
                                    opacity: clampInterpolate(local8 - 600, [0, 30], [0, 1]),
                                }}
                            >
                                You are what you sign.
                            </div>
                            <div
                                style={{
                                    marginTop: 14,
                                    color: T.muted,
                                    fontFamily: T.mono,
                                    fontSize: 18,
                                    opacity: clampInterpolate(local8 - 750, [0, 20], [0, 1]),
                                }}
                            >
                                github.com/aint-vscp/documate
                            </div>
                        </div>
                    </div>
                </AbsoluteFill>
            ) : null}

            <SubtitleBar frame={frame} />
        </AbsoluteFill>
    );
};

export const ProductDemoVideo: React.FC = () => {
    return <ProductScene />;
};

export const PRODUCT_DEMO_TOTAL_FRAMES = TOTAL_FRAMES;
