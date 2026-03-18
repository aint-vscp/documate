import React from "react";
import {
    AbsoluteFill,
    Sequence,
    interpolate,
    spring,
    useCurrentFrame,
    useVideoConfig,
} from "remotion";

const FPS = 30;

const TOKENS = {
    bg: "#0f131b",
    bgRaised: "#171d29",
    bgSoft: "#111722",
    text: "#f8fafc",
    muted: "#94a3b8",
    mutedStrong: "#cbd5e1",
    border: "rgba(255,255,255,0.1)",
    borderStrong: "rgba(255,255,255,0.2)",
    surface: "rgba(255,255,255,0.035)",
    surfaceHover: "rgba(255,255,255,0.06)",
    orange: "#f6851b",
    orangeSoft: "#fb923c",
    blue: "#4f8cff",
    teal: "#2ec7b9",
    emerald: "#34d399",
    yellow: "#fbbf24",
    red: "#f87171",
    cyan: "#22d3ee",
    gold: "#F59E0B",
    silver: "#94A3B8",
    bronze: "#CD7F32",
};

const FONTS = {
    sans: "'Space Grotesk', 'Segoe UI', system-ui, sans-serif",
    mono: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
};

const SCENE_1 = 240;
const SCENE_2 = 240;
const SCENE_3 = 300;
const SCENE_4 = 780;
const SCENE_5 = 300;
const SCENE_6 = 780;
const SCENE_7 = 60;

const TOTAL_FRAMES = SCENE_1 + SCENE_2 + SCENE_3 + SCENE_4 + SCENE_5 + SCENE_6 + SCENE_7;

const lerp = (frame: number, input: [number, number], output: [number, number]) => {
    return interpolate(frame, input, output, {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });
};

const reveal = (frame: number, start: number, duration: number) => {
    return spring({
        frame: frame - start,
        fps: FPS,
        config: { damping: 200 },
        durationInFrames: duration,
    });
};

const Typewriter: React.FC<{
    text: string;
    frame: number;
    start: number;
    charEveryFrames?: number;
}> = ({ text, frame, start, charEveryFrames = 1.2 }) => {
    const count = Math.max(0, Math.floor((frame - start) / charEveryFrames));
    return <>{text.slice(0, count)}</>;
};

const BackgroundAtmosphere: React.FC<{ frame: number; intensity?: number }> = ({ frame, intensity = 1 }) => {
    const driftX = Math.sin(frame / 90) * 60;
    const driftY = Math.cos(frame / 110) * 40;

    return (
        <>
            <AbsoluteFill
                style={{
                    backgroundColor: TOKENS.bg,
                    backgroundImage:
                        "radial-gradient(circle at 8% -12%, rgba(246,133,27,0.2), transparent 32%), radial-gradient(circle at 94% 16%, rgba(79,140,255,0.13), transparent 24%), linear-gradient(180deg, #111723 0%, #0f131b 48%, #0c111a 100%)",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
                    backgroundSize: "36px 36px",
                    opacity: 0.8,
                }}
            />
            <div
                style={{
                    position: "absolute",
                    width: 680,
                    height: 680,
                    left: -160 + driftX,
                    top: -190 + driftY,
                    borderRadius: 9999,
                    background: "radial-gradient(circle, rgba(246,133,27,0.18), rgba(246,133,27,0) 66%)",
                    opacity: intensity,
                    filter: "blur(12px)",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    width: 560,
                    height: 560,
                    right: -120 - driftX,
                    top: -120 - driftY,
                    borderRadius: 9999,
                    background: "radial-gradient(circle, rgba(79,140,255,0.2), rgba(79,140,255,0) 68%)",
                    opacity: intensity,
                    filter: "blur(10px)",
                }}
            />
        </>
    );
};

const MeshNetwork: React.FC<{ frame: number; opacity?: number }> = ({ frame, opacity = 1 }) => {
    const nodes = [
        [260, 180], [420, 240], [620, 170], [820, 280], [1020, 210], [1220, 300], [1440, 220], [1670, 320],
        [320, 460], [540, 390], [740, 520], [940, 430], [1160, 520], [1380, 430], [1600, 510],
        [240, 760], [470, 700], [680, 820], [900, 700], [1120, 820], [1340, 700], [1560, 790],
    ];

    return (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity }}>
            {nodes.map((node, i) => {
                const pulse = 0.35 + 0.65 * ((Math.sin(frame / 18 + i) + 1) / 2);
                return (
                    <circle
                        key={`node-${i}`}
                        cx={node[0] + Math.sin(frame / 100 + i) * 5}
                        cy={node[1] + Math.cos(frame / 120 + i) * 5}
                        r={2.5 + pulse}
                        fill={i % 3 === 0 ? TOKENS.orange : i % 3 === 1 ? TOKENS.blue : TOKENS.teal}
                        opacity={0.5 + pulse * 0.5}
                    />
                );
            })}
            {nodes.slice(0, -1).map((from, i) => {
                const to = nodes[(i + 3) % nodes.length];
                const p = 0.15 + ((Math.sin(frame / 45 + i) + 1) / 2) * 0.22;
                return (
                    <line
                        key={`edge-${i}`}
                        x1={from[0]}
                        y1={from[1]}
                        x2={to[0]}
                        y2={to[1]}
                        stroke={i % 2 === 0 ? "rgba(79,140,255,0.65)" : "rgba(246,133,27,0.65)"}
                        strokeWidth={1}
                        opacity={p}
                    />
                );
            })}
        </svg>
    );
};

const SurfaceCard: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => {
    return (
        <div
            style={{
                background: TOKENS.surface,
                border: `1px solid ${TOKENS.border}`,
                borderRadius: 12,
                boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
                backdropFilter: "blur(10px)",
                color: TOKENS.text,
                ...style,
            }}
        >
            {children}
        </div>
    );
};

const NeonTag: React.FC<{ label: string; color?: string }> = ({ label, color }) => {
    return (
        <div
            style={{
                display: "inline-flex",
                alignItems: "center",
                borderRadius: 4,
                padding: "4px 8px",
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontFamily: FONTS.mono,
                border: `1px solid ${color ? `${color}66` : "rgba(246,133,27,0.36)"}`,
                background: color ? `${color}22` : "rgba(246,133,27,0.12)",
                color: color || "#fdba74",
            }}
        >
            {label}
        </div>
    );
};

const Scene1Hook: React.FC = () => {
    const frame = useCurrentFrame();
    const first = reveal(frame, 8, 18);
    const second = reveal(frame, 88, 18);
    const third = reveal(frame, 162, 16);
    const flash = 1 - Math.abs(lerp(frame, [146, 154], [0, 1]) - 0.5) * 2;

    return (
        <AbsoluteFill style={{ fontFamily: FONTS.sans }}>
            <BackgroundAtmosphere frame={frame} intensity={1} />
            <MeshNetwork frame={frame} opacity={0.7} />
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: "#ffffff",
                    opacity: lerp(frame, [146, 152], [0.0, 0.85]) * lerp(frame, [152, 160], [1, 0]),
                }}
            />

            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center", width: "100%" }}>
                    <div
                        style={{
                            opacity: frame < 146 ? first : 0,
                            transform: `translateY(${(1 - first) * 28}px)`,
                            fontSize: 88,
                            fontWeight: 700,
                            letterSpacing: "-0.02em",
                            color: TOKENS.text,
                        }}
                    >
                        Every contract you&apos;ve ever signed.
                    </div>
                    <div
                        style={{
                            marginTop: 24,
                            opacity: frame > 60 && frame < 146 ? second : 0,
                            transform: `translateY(${(1 - second) * 24}px)`,
                            fontSize: 76,
                            fontWeight: 700,
                            letterSpacing: "-0.02em",
                            color: TOKENS.red,
                        }}
                    >
                        Anyone could fake it.
                    </div>
                    <div
                        style={{
                            marginTop: 36,
                            opacity: frame > 156 ? third : 0,
                            transform: `scale(${0.95 + third * 0.05})`,
                            fontSize: 132,
                            fontWeight: 800,
                            letterSpacing: "-0.03em",
                            background: `linear-gradient(135deg, ${TOKENS.orange}, ${TOKENS.orangeSoft}, ${TOKENS.blue})`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            textShadow: `0 0 ${24 + flash * 8}px rgba(246,133,27,0.35)`,
                        }}
                    >
                        Until now.
                    </div>
                </div>
            </div>
        </AbsoluteFill>
    );
};

const Scene2Pitch: React.FC = () => {
    const frame = useCurrentFrame();
    const line = "DocuMate - on-chain contract governance for the real world.";
    const pills = ["Verify Identity", "Sign On-Chain", "Build Reputation"];

    return (
        <AbsoluteFill style={{ fontFamily: FONTS.sans }}>
            <BackgroundAtmosphere frame={frame} intensity={0.9} />
            <MeshNetwork frame={frame} opacity={0.3} />

            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 1560, textAlign: "center" }}>
                    <div
                        style={{
                            fontSize: 70,
                            fontWeight: 700,
                            lineHeight: 1.2,
                            color: TOKENS.text,
                            minHeight: 180,
                        }}
                    >
                        <Typewriter text={line} frame={frame} start={10} charEveryFrames={1.35} />
                    </div>

                    <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 24 }}>
                        {pills.map((pill, i) => {
                            const start = 128 + i * 4;
                            const p = reveal(frame, start, 18);
                            return (
                                <div
                                    key={pill}
                                    style={{
                                        opacity: p,
                                        transform: `translateX(${(1 - p) * 32}px)`,
                                        padding: "10px 20px",
                                        borderRadius: 999,
                                        border: `1px solid ${TOKENS.borderStrong}`,
                                        background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
                                        color: TOKENS.mutedStrong,
                                        fontSize: 22,
                                        fontWeight: 600,
                                    }}
                                >
                                    {pill}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </AbsoluteFill>
    );
};

const Scene3Problem: React.FC = () => {
    const frame = useCurrentFrame();
    const cardData = [
        { value: 2.9, label: "employment fraud annually in Southeast Asia", prefix: "$", suffix: "B", color: TOKENS.red },
        { value: 1, label: "professional credentials are falsified", prefix: "1 in ", suffix: "3", color: TOKENS.orange },
        { value: 0, label: "ways to prove a contract's authenticity today", prefix: "", suffix: "0", color: TOKENS.yellow },
    ];

    return (
        <AbsoluteFill style={{ fontFamily: FONTS.sans }}>
            <BackgroundAtmosphere frame={frame} intensity={0.75} />

            <div style={{ position: "absolute", inset: 0, padding: "120px 110px 90px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
                    {cardData.map((card, i) => {
                        const start = 20 + i * 18;
                        const p = reveal(frame, start, 24);
                        const count = card.value === 0
                            ? 0
                            : interpolate(frame, [start + 10, start + 90], [0, card.value], {
                                  extrapolateLeft: "clamp",
                                  extrapolateRight: "clamp",
                              });
                        const num = i === 1 ? card.suffix : `${count.toFixed(1)}`;

                        return (
                            <SurfaceCard
                                key={card.label}
                                style={{
                                    padding: "36px 30px",
                                    transform: `translateX(${(1 - p) * (i % 2 === 0 ? -80 : 80)}px)`,
                                    opacity: p,
                                    minHeight: 280,
                                }}
                            >
                                <div style={{ fontSize: 84, fontWeight: 800, color: card.color, lineHeight: 1, letterSpacing: "-0.03em" }}>
                                    {i === 0 ? `${card.prefix}${num}${card.suffix}` : i === 1 ? card.prefix + num : card.suffix}
                                </div>
                                <div style={{ marginTop: 16, color: TOKENS.mutedStrong, fontSize: 24, lineHeight: 1.3 }}>{card.label}</div>
                            </SurfaceCard>
                        );
                    })}
                </div>

                <div
                    style={{
                        marginTop: 40,
                        textAlign: "center",
                        fontSize: 38,
                        fontWeight: 600,
                        color: TOKENS.text,
                        opacity: lerp(frame, [160, 230], [0, 1]),
                    }}
                >
                    DocuMate fixes the last one. Then the first two follow.
                </div>
            </div>
        </AbsoluteFill>
    );
};

const StepCard: React.FC<{
    index: number;
    title: string;
    body: string;
    visual: React.ReactNode;
    frame: number;
}> = ({ index, title, body, visual, frame }) => {
    const segment = 156;
    const local = frame - index * segment;
    const enter = reveal(local, 0, 20);
    const exit = reveal(local, 126, 20);
    const x = (1 - enter) * 180 - exit * 220;
    const visible = local >= 0 && local < segment;

    if (!visible) return null;

    return (
        <SurfaceCard
            style={{
                position: "absolute",
                left: 180 + x,
                right: 180 - x,
                top: 150,
                bottom: 150,
                padding: 36,
                opacity: Math.min(1, enter + 0.1),
                border: `1px solid ${TOKENS.borderStrong}`,
            }}
        >
            <div style={{ fontFamily: FONTS.mono, color: "#fdba74", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Step {index + 1}
            </div>
            <div style={{ marginTop: 10, fontSize: 52, fontWeight: 700, color: TOKENS.text, letterSpacing: "-0.02em" }}>{title}</div>
            <div style={{ marginTop: 12, fontSize: 24, lineHeight: 1.45, color: TOKENS.mutedStrong, maxWidth: 1180 }}>{body}</div>
            <div style={{ marginTop: 26 }}>{visual}</div>
        </SurfaceCard>
    );
};

const Scene4Pillars: React.FC = () => {
    const frame = useCurrentFrame();
    const pulse = 0.5 + Math.sin(frame / 8) * 0.5;

    return (
        <AbsoluteFill style={{ fontFamily: FONTS.sans }}>
            <BackgroundAtmosphere frame={frame} intensity={0.7} />

            <StepCard
                index={0}
                frame={frame}
                title="Verify Once"
                body="KILT DID verified on-chain via Polkadot identity precompile 0x0818. Not a database. Not a checkbox. Cryptographic proof."
                visual={
                    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                        <SurfaceCard style={{ padding: 18, borderRadius: 14, background: TOKENS.bgSoft }}>
                            <div style={{ color: TOKENS.muted, fontSize: 13 }}>Wallet</div>
                            <div style={{ marginTop: 6, fontFamily: FONTS.mono, fontSize: 17, color: TOKENS.text }}>0x3140...CA91</div>
                        </SurfaceCard>
                        <div style={{ fontSize: 28, color: TOKENS.cyan }}>-&gt;</div>
                        <SurfaceCard style={{ padding: 18, borderRadius: 14, background: TOKENS.bgSoft }}>
                            <div style={{ color: TOKENS.muted, fontSize: 13 }}>Identity Precompile</div>
                            <div style={{ marginTop: 6, fontFamily: FONTS.mono, fontSize: 18, color: TOKENS.blue }}>0x000...0818</div>
                        </SurfaceCard>
                        <div style={{ fontSize: 28, color: TOKENS.cyan }}>-&gt;</div>
                        <div style={{ borderRadius: 999, padding: "8px 14px", background: `rgba(52,211,153,${0.2 + pulse * 0.18})`, border: "1px solid rgba(52,211,153,0.5)", color: TOKENS.emerald, fontWeight: 700 }}>
                            Verified
                        </div>
                    </div>
                }
            />

            <StepCard
                index={1}
                frame={frame}
                title="Draft and Sign"
                body="AI-assisted legal drafting. When finalized, the document hash is written on-chain. Immutable. Timestamped. Yours."
                visual={
                    <SurfaceCard style={{ padding: 22, borderRadius: 14, background: TOKENS.bgSoft, maxWidth: 1060 }}>
                        <div style={{ fontSize: 20, color: TOKENS.text, marginBottom: 12 }}>Employment NDA Template</div>
                        {[0, 1, 2, 3].map((line) => (
                            <div
                                key={line}
                                style={{
                                    height: 10,
                                    borderRadius: 6,
                                    background: "rgba(255,255,255,0.12)",
                                    marginBottom: 9,
                                    width: `${88 - line * 9}%`,
                                    opacity: lerp(frame % 156, [10 + line * 6, 36 + line * 6], [0.1, 1]),
                                }}
                            />
                        ))}
                        <div style={{ marginTop: 12, color: TOKENS.orangeSoft, fontFamily: FONTS.mono, fontSize: 14 }}>
                            hash: 0x7f9a5d0b2a9f3c7dd5b4a0e913...ef92
                        </div>
                    </SurfaceCard>
                }
            />

            <StepCard
                index={2}
                frame={frame}
                title="Validate"
                body="Phala TEE simulation parses digital signatures. Every document gets a trust tier."
                visual={
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <SurfaceCard style={{ padding: "18px 20px", background: TOKENS.bgSoft, borderRadius: 12 }}>
                            <div style={{ color: TOKENS.muted, fontSize: 13 }}>Incoming Document</div>
                            <div style={{ marginTop: 6, color: TOKENS.text, fontSize: 18 }}>NDA_2026.pdf</div>
                        </SurfaceCard>
                        <div style={{ fontSize: 24, color: TOKENS.cyan }}>-&gt;</div>
                        <SurfaceCard style={{ padding: "16px 18px", background: TOKENS.bgSoft, borderRadius: 12 }}>
                            <div style={{ color: TOKENS.teal, fontFamily: FONTS.mono }}>Phala TEE</div>
                        </SurfaceCard>
                        <div style={{ fontSize: 24, color: TOKENS.cyan }}>-&gt;</div>
                        <div style={{ display: "flex", gap: 10 }}>
                            <NeonTag label="Gold" color={TOKENS.gold} />
                            <NeonTag label="Silver" color={TOKENS.silver} />
                            <NeonTag label="Bronze" color={TOKENS.bronze} />
                        </div>
                    </div>
                }
            />

            <StepCard
                index={3}
                frame={frame}
                title="Monetize"
                body="Hardcoded. Immutable. No platform can change it."
                visual={
                    <SurfaceCard style={{ padding: 22, borderRadius: 14, background: TOKENS.bgSoft, maxWidth: 1080 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                            <div style={{ color: TOKENS.text, fontSize: 22 }}>Template NFT Listing</div>
                            <div style={{ color: TOKENS.orangeSoft, fontWeight: 700 }}>120 PAS</div>
                        </div>
                        <div style={{ height: 16, borderRadius: 999, overflow: "hidden", display: "flex", border: `1px solid ${TOKENS.border}` }}>
                            <div style={{ width: `${lerp(frame % 156, [0, 80], [0, 75])}%`, background: "linear-gradient(90deg,#34d399,#10b981)" }} />
                            <div style={{ width: `${lerp(frame % 156, [12, 96], [0, 20])}%`, background: "linear-gradient(90deg,#f97316,#fb923c)" }} />
                            <div style={{ width: `${lerp(frame % 156, [24, 110], [0, 5])}%`, background: "linear-gradient(90deg,#f59e0b,#ef4444)" }} />
                        </div>
                        <div style={{ marginTop: 12, display: "flex", gap: 18, color: TOKENS.mutedStrong }}>
                            <span>75% creator</span>
                            <span>20% treasury</span>
                            <span>5% staking pool</span>
                        </div>
                    </SurfaceCard>
                }
            />

            <StepCard
                index={4}
                frame={frame}
                title="Build Trust"
                body="You are what you sign. On-chain. Forever."
                visual={
                    <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                        <SurfaceCard style={{ padding: 20, borderRadius: 14, background: TOKENS.bgSoft, width: 620 }}>
                            <div style={{ color: TOKENS.text, fontSize: 20, marginBottom: 12 }}>Profile Reputation</div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                <NeonTag label="Smart Contract Audit" />
                                <NeonTag label="NDA Verified" />
                                <NeonTag label="Employment Verified" />
                            </div>
                        </SurfaceCard>
                        <SurfaceCard style={{ padding: 16, borderRadius: 14, background: TOKENS.bgSoft, width: 350 }}>
                            <div style={{ color: TOKENS.red, fontWeight: 700 }}>Breach</div>
                            <div style={{ marginTop: 10, position: "relative", height: 8, background: "rgba(248,113,113,0.2)", borderRadius: 999 }}>
                                <div
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: `${lerp(frame % 156, [20, 80], [0, 100])}%`,
                                        background: "linear-gradient(90deg,#ef4444,#f87171)",
                                        borderRadius: 999,
                                    }}
                                />
                            </div>
                        </SurfaceCard>
                    </div>
                }
            />
        </AbsoluteFill>
    );
};

const Scene5LiveProof: React.FC = () => {
    const frame = useCurrentFrame();
    const cards = [
        { title: "2 Contracts Live", sub: "on Polkadot Hub Testnet", color: TOKENS.emerald },
        { title: "11 Transactions", sub: "verified on Blockscout", color: TOKENS.blue },
        { title: "0 Vulnerabilities", sub: "npm audit clean", color: TOKENS.orange },
    ];
    const url = "blockscout-testnet.polkadot.io";

    return (
        <AbsoluteFill style={{ fontFamily: FONTS.sans }}>
            <BackgroundAtmosphere frame={frame} intensity={0.85} />

            <div style={{ padding: "130px 120px 90px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
                    {cards.map((card, i) => {
                        const p = reveal(frame, 14 + i * 12, 20);
                        return (
                            <SurfaceCard
                                key={card.title}
                                style={{
                                    padding: 24,
                                    borderRadius: 12,
                                    background: TOKENS.surface,
                                    transform: `translateY(${(1 - p) * 20}px)`,
                                    opacity: p,
                                }}
                            >
                                <div style={{ color: card.color, fontSize: 48, fontWeight: 800, letterSpacing: "-0.02em" }}>{card.title}</div>
                                <div style={{ marginTop: 8, color: TOKENS.mutedStrong, fontSize: 21 }}>{card.sub}</div>
                            </SurfaceCard>
                        );
                    })}
                </div>

                <div
                    style={{
                        marginTop: 46,
                        fontFamily: FONTS.mono,
                        fontSize: 42,
                        color: TOKENS.cyan,
                        letterSpacing: "0.02em",
                    }}
                >
                    <Typewriter text={url} frame={frame} start={120} charEveryFrames={1.1} />
                </div>

                <div style={{ marginTop: 18, color: TOKENS.text, fontSize: 36, fontWeight: 600, opacity: lerp(frame, [170, 230], [0, 1]) }}>
                    This is not a prototype on localhost. This is live.
                </div>
            </div>
        </AbsoluteFill>
    );
};

const Scene6LiveDemo: React.FC = () => {
    const frame = useCurrentFrame();
    const heartbeat = 0.72 + 0.28 * ((Math.sin(frame / 14) + 1) / 2);
    const ticker = Math.floor(2 + ((frame / 22) % 9));

    return (
        <AbsoluteFill style={{ fontFamily: FONTS.sans }}>
            <BackgroundAtmosphere frame={frame} intensity={0.7} />
            <div style={{ padding: "72px 82px" }}>
                <SurfaceCard style={{ padding: 20, borderRadius: 16, marginBottom: 16, background: "rgba(17,23,34,0.92)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(246,133,27,0.15)", border: "1px solid rgba(246,133,27,0.35)" }} />
                            <div style={{ fontWeight: 700, fontSize: 24, background: `linear-gradient(135deg, ${TOKENS.orange}, ${TOKENS.orangeSoft}, ${TOKENS.blue})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                                DocuMate
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderRadius: 10, background: "linear-gradient(135deg,#f6851b,#fb923c)", color: "white", fontWeight: 700 }}>
                            <div style={{ width: 8, height: 8, borderRadius: 999, background: `rgba(52,211,153,${heartbeat})` }} />
                            0x3140...CA91
                            <div style={{ marginLeft: 8, padding: "4px 8px", borderRadius: 999, background: "rgba(52,211,153,0.2)", border: "1px solid rgba(52,211,153,0.45)", color: TOKENS.emerald, fontSize: 12 }}>
                                Verified
                            </div>
                        </div>
                    </div>
                </SurfaceCard>

                <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1.2fr 0.95fr", gap: 14, minHeight: 720 }}>
                    <SurfaceCard style={{ padding: 18, borderRadius: 14, background: "rgba(23,29,41,0.88)" }}>
                        <div style={{ color: TOKENS.muted, fontFamily: FONTS.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Left Panel</div>
                        <div style={{ marginTop: 8, color: TOKENS.text, fontSize: 22, fontWeight: 700 }}>Employment Contract - Senior Engineer</div>
                        <div style={{ marginTop: 12 }}><NeonTag label="Gold Tier" color={TOKENS.gold} /></div>
                        <div style={{ marginTop: 18, borderRadius: 10, border: `1px solid ${TOKENS.border}`, padding: 14, background: TOKENS.bgSoft }}>
                            {["Role", "Compensation", "Non-compete", "IP Assignment"].map((item, i) => (
                                <div key={item} style={{ height: 10, width: `${88 - i * 12}%`, borderRadius: 999, background: "rgba(255,255,255,0.16)", marginBottom: 9 }} />
                            ))}
                        </div>
                    </SurfaceCard>

                    <SurfaceCard style={{ padding: 18, borderRadius: 14, background: "rgba(23,29,41,0.9)" }}>
                        <div style={{ color: TOKENS.muted, fontFamily: FONTS.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Marketplace</div>
                        <div style={{ marginTop: 8, color: TOKENS.text, fontSize: 24, fontWeight: 700 }}>Template Listing</div>
                        <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ color: TOKENS.mutedStrong }}>Price</div>
                            <div style={{ color: TOKENS.orangeSoft, fontSize: 28, fontWeight: 800 }}>120 PAS</div>
                        </div>
                        <div style={{ marginTop: 18, borderRadius: 999, overflow: "hidden", height: 14, border: `1px solid ${TOKENS.border}` }}>
                            <div style={{ display: "flex", height: "100%" }}>
                                <div style={{ width: "75%", background: "linear-gradient(90deg,#34d399,#10b981)" }} />
                                <div style={{ width: "20%", background: "linear-gradient(90deg,#f97316,#fb923c)" }} />
                                <div style={{ width: "5%", background: "linear-gradient(90deg,#f59e0b,#ef4444)" }} />
                            </div>
                        </div>
                        <div style={{ marginTop: 9, display: "flex", justifyContent: "space-between", color: TOKENS.mutedStrong, fontSize: 14 }}>
                            <span>75% creator</span><span>20% treasury</span><span>5% pool</span>
                        </div>
                        <div style={{ marginTop: 24, padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(246,133,27,0.4)", background: "rgba(246,133,27,0.08)", color: TOKENS.orangeSoft, fontWeight: 700 }}>
                            Purchase confirmed #{ticker}
                        </div>
                    </SurfaceCard>

                    <SurfaceCard style={{ padding: 18, borderRadius: 14, background: "rgba(23,29,41,0.88)" }}>
                        <div style={{ color: TOKENS.muted, fontFamily: FONTS.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Reputation Profile</div>
                        <div style={{ marginTop: 8, color: TOKENS.text, fontSize: 22, fontWeight: 700 }}>Trust Signals</div>
                        <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <NeonTag label="Smart Contract Audit" />
                            <NeonTag label="NDA Verified" />
                            <NeonTag label="Employment Verified" />
                        </div>
                        <div style={{ marginTop: 18, borderRadius: 12, border: "1px solid rgba(248,113,113,0.35)", background: "rgba(248,113,113,0.08)", padding: 12 }}>
                            <div style={{ color: TOKENS.red, fontWeight: 700 }}>Breach Escalation Watch</div>
                            <div style={{ marginTop: 8, height: 8, borderRadius: 999, background: "rgba(248,113,113,0.18)", overflow: "hidden" }}>
                                <div style={{ width: `${22 + (frame % 120) / 2}%`, height: "100%", background: "linear-gradient(90deg,#ef4444,#f87171)" }} />
                            </div>
                        </div>
                    </SurfaceCard>
                </div>

                <SurfaceCard style={{ marginTop: 14, borderRadius: 12, padding: "11px 14px", background: "rgba(17,23,34,0.96)" }}>
                    <div style={{ color: TOKENS.mutedStrong, fontSize: 16 }}>
                        Live on Polkadot Hub Testnet · chainId 420420417 · 0x233FE6112E5Ad4Db1c83358B30D581F837314BB1
                    </div>
                </SurfaceCard>
            </div>
        </AbsoluteFill>
    );
};

const Scene7Close: React.FC = () => {
    const frame = useCurrentFrame();
    const fade = lerp(frame, [0, 18], [0, 1]);

    return (
        <AbsoluteFill
            style={{
                background: "linear-gradient(180deg, #05070d, #020304)",
                fontFamily: FONTS.sans,
                color: TOKENS.text,
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
                opacity: fade,
            }}
        >
            <div style={{ fontSize: 92, fontWeight: 800, letterSpacing: "-0.03em" }}>DocuMate</div>
            <div style={{ marginTop: 8, fontSize: 40, color: TOKENS.mutedStrong }}>You are what you sign.</div>
            <div style={{ marginTop: 22, fontSize: 16, color: TOKENS.muted, fontFamily: FONTS.mono }}>
                Polkadot Solidity Hackathon 2026 · Track 2 · PVM Smart Contracts · OpenGuild × Web3 Foundation
            </div>
        </AbsoluteFill>
    );
};

export const HackathonDemoVideo: React.FC = () => {
    return (
        <AbsoluteFill>
            <Sequence from={0} durationInFrames={SCENE_1}>
                <Scene1Hook />
            </Sequence>
            <Sequence from={SCENE_1} durationInFrames={SCENE_2}>
                <Scene2Pitch />
            </Sequence>
            <Sequence from={SCENE_1 + SCENE_2} durationInFrames={SCENE_3}>
                <Scene3Problem />
            </Sequence>
            <Sequence from={SCENE_1 + SCENE_2 + SCENE_3} durationInFrames={SCENE_4}>
                <Scene4Pillars />
            </Sequence>
            <Sequence from={SCENE_1 + SCENE_2 + SCENE_3 + SCENE_4} durationInFrames={SCENE_5}>
                <Scene5LiveProof />
            </Sequence>
            <Sequence from={SCENE_1 + SCENE_2 + SCENE_3 + SCENE_4 + SCENE_5} durationInFrames={SCENE_6}>
                <Scene6LiveDemo />
            </Sequence>
            <Sequence from={SCENE_1 + SCENE_2 + SCENE_3 + SCENE_4 + SCENE_5 + SCENE_6} durationInFrames={SCENE_7}>
                <Scene7Close />
            </Sequence>
        </AbsoluteFill>
    );
};

export const HACKATHON_DEMO_TOTAL_FRAMES = TOTAL_FRAMES;
