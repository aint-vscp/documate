import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

/**
 * Scene 2: Solution Overview (0:25 - 0:55, 900 frames)
 *
 * Introduces DocuMate and its four pillars.
 */
export const SolutionScene: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Brand entrance
    const brandScale = spring({ frame, fps, from: 0.6, to: 1, durationInFrames: 40 });
    const brandOpacity = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });

    // Tagline
    const tagOpacity = interpolate(frame, [40, 70], [0, 1], { extrapolateRight: "clamp" });
    const tagY = spring({ frame: Math.max(0, frame - 40), fps, from: 20, to: 0, durationInFrames: 30 });

    // Four pillars stagger
    const pillars = [
        { code: "AI", title: "DocuWriter", desc: "Prompt-to-contract drafting and autofill", color: "#3b82f6" },
        { code: "TEE", title: "Validation", desc: "Cryptographic PDF signature checks", color: "#10b981" },
        { code: "MKT", title: "Marketplace", desc: "Immutable 75/20/5 revenue split", color: "#ec4899" },
        { code: "RISK", title: "Staking", desc: "Breach reporting and on-chain slashing", color: "#f59e0b" },
    ];

    // Fade out
    const fadeOut = interpolate(frame, [830, 900], [1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

    return (
        <AbsoluteFill
            style={{
                justifyContent: "center",
                alignItems: "center",
                background: "linear-gradient(135deg, #030712 0%, #0a0f1e 50%, #030712 100%)",
                fontFamily: "Inter, system-ui, sans-serif",
                opacity: fadeOut,
            }}
        >
            {/* Background glow */}
            <div
                style={{
                    position: "absolute",
                    width: 600,
                    height: 600,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                }}
            />

            {/* Brand name */}
            <div
                style={{
                    opacity: brandOpacity,
                    transform: `scale(${brandScale})`,
                    textAlign: "center",
                    marginBottom: 20,
                }}
            >
                <div
                    style={{
                        fontSize: 90,
                        fontWeight: 800,
                        background: "linear-gradient(135deg, #ec4899, #a855f7, #3b82f6)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        letterSpacing: "-0.02em",
                    }}
                >
                    DocuMate
                </div>
            </div>

            {/* Tagline */}
            <div
                style={{
                    opacity: tagOpacity,
                    transform: `translateY(${tagY}px)`,
                    textAlign: "center",
                    marginBottom: 80,
                }}
            >
                <div style={{ fontSize: 32, color: "#d1d5db", fontWeight: 500 }}>
                    Decentralized Reputation & Marketplace Engine
                </div>
                <div
                    style={{
                        fontSize: 22,
                        color: "#9ca3af",
                        marginTop: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 12,
                    }}
                >
                    <span>Built on</span>
                    <span
                        style={{
                            background: "linear-gradient(90deg, #e6007a, #ec4899)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            fontWeight: 700,
                            fontSize: 24,
                        }}
                    >
                        Polkadot Hub
                    </span>
                    <span>EVM</span>
                </div>
            </div>

            {/* Four pillars */}
            <div style={{ display: "flex", gap: 32 }}>
                {pillars.map((p, i) => {
                    const delay = 150 + i * 60;
                    const pOpacity = interpolate(frame, [delay, delay + 40], [0, 1], { extrapolateRight: "clamp" });
                    const pY = spring({
                        frame: Math.max(0, frame - delay),
                        fps,
                        from: 40,
                        to: 0,
                        durationInFrames: 40,
                    });

                    return (
                        <div
                            key={p.title}
                            style={{
                                opacity: pOpacity,
                                transform: `translateY(${pY}px)`,
                                background: "rgba(255,255,255,0.04)",
                                border: `1px solid ${p.color}33`,
                                borderRadius: 20,
                                padding: "32px 28px",
                                width: 240,
                                textAlign: "center",
                            }}
                        >
                            <div
                                style={{
                                    width: 68,
                                    height: 68,
                                    borderRadius: 18,
                                    margin: "0 auto 16px auto",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: `${p.color}22`,
                                    border: `1px solid ${p.color}55`,
                                    color: p.color,
                                    fontSize: 20,
                                    fontWeight: 800,
                                    letterSpacing: "0.06em",
                                }}
                            >
                                {p.code}
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 700, color: p.color, marginBottom: 8 }}>
                                {p.title}
                            </div>
                            <div style={{ fontSize: 16, color: "#9ca3af", lineHeight: 1.4 }}>{p.desc}</div>
                        </div>
                    );
                })}
            </div>
        </AbsoluteFill>
    );
};
