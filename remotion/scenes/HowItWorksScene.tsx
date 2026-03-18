import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

/**
 * Scene 3: How It Works -- 75/20/5 Revenue Split & Document Lifecycle (0:55 - 1:25, 900 frames)
 */
export const HowItWorksScene: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Title entrance
    const titleOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
    const titleY = spring({ frame, fps, from: 30, to: 0, durationInFrames: 35 });

    // Revenue split animation
    const splitShow = interpolate(frame, [60, 90], [0, 1], { extrapolateRight: "clamp" });

    // Bar widths animate
    const barProgress = interpolate(frame, [100, 200], [0, 1], { extrapolateRight: "clamp" });

    // Document lifecycle
    const lifecycleOpacity = interpolate(frame, [350, 390], [0, 1], { extrapolateRight: "clamp" });

    const steps = [
        { label: "Create", code: "01", color: "#3b82f6" },
        { label: "Verify DID", code: "02", color: "#10b981" },
        { label: "Purchase / Stake", code: "03", color: "#a855f7" },
        { label: "On-Chain Proof", code: "04", color: "#ec4899" },
    ];

    // "Iron Rule" callout
    const ironOpacity = interpolate(frame, [250, 290], [0, 1], { extrapolateRight: "clamp" });

    // Fade out
    const fadeOut = interpolate(frame, [830, 900], [1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

    return (
        <AbsoluteFill
            style={{
                fontFamily: "Inter, system-ui, sans-serif",
                background: "linear-gradient(135deg, #030712 0%, #0f172a 100%)",
                padding: "80px 120px",
                opacity: fadeOut,
            }}
        >
            {/* Title */}
            <div
                style={{
                    opacity: titleOpacity,
                    transform: `translateY(${titleY}px)`,
                    marginBottom: 50,
                }}
            >
                <div style={{ fontSize: 56, fontWeight: 800, color: "white" }}>How It Works</div>
                <div style={{ fontSize: 22, color: "#9ca3af", marginTop: 8 }}>
                    Immutable revenue split + verifiable document lifecycle
                </div>
            </div>

            <div style={{ display: "flex", gap: 80 }}>
                {/* Left: Revenue Split */}
                <div style={{ flex: 1, opacity: splitShow }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: "#f9fafb", marginBottom: 30 }}>
                        The 75/20/5 Split
                    </div>

                    {/* Bars */}
                    {[
                        { label: "Creator", pct: 75, color: "#10b981" },
                        { label: "Treasury", pct: 20, color: "#a855f7" },
                        { label: "Community", pct: 5, color: "#ec4899" },
                    ].map((item) => (
                        <div key={item.label} style={{ marginBottom: 20 }}>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: 8,
                                    fontSize: 18,
                                }}
                            >
                                <span style={{ color: "#d1d5db", fontWeight: 600 }}>{item.label}</span>
                                <span style={{ color: item.color, fontWeight: 700 }}>{item.pct}%</span>
                            </div>
                            <div
                                style={{
                                    height: 24,
                                    borderRadius: 12,
                                    background: "rgba(255,255,255,0.06)",
                                    overflow: "hidden",
                                }}
                            >
                                <div
                                    style={{
                                        height: "100%",
                                        width: `${item.pct * barProgress}%`,
                                        borderRadius: 12,
                                        background: `linear-gradient(90deg, ${item.color}88, ${item.color})`,
                                        transition: "width 0.3s",
                                    }}
                                />
                            </div>
                        </div>
                    ))}

                    {/* Iron rule callout */}
                    <div
                        style={{
                            marginTop: 30,
                            opacity: ironOpacity,
                            background: "rgba(234, 179, 8, 0.08)",
                            border: "1px solid rgba(234, 179, 8, 0.25)",
                            borderRadius: 12,
                            padding: "16px 20px",
                        }}
                    >
                        <div style={{ fontSize: 16, color: "#fbbf24", fontWeight: 600 }}>
                            Hardcoded in the smart contract. No one can change it. Ever.
                        </div>
                    </div>
                </div>

                {/* Right: Document Lifecycle */}
                <div style={{ flex: 1, opacity: lifecycleOpacity }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: "#f9fafb", marginBottom: 30 }}>
                        Document Lifecycle
                    </div>

                    {steps.map((step, i) => {
                        const delay = 400 + i * 70;
                        const sOpacity = interpolate(frame, [delay, delay + 40], [0, 1], { extrapolateRight: "clamp" });
                        const sX = spring({
                            frame: Math.max(0, frame - delay),
                            fps,
                            from: 40,
                            to: 0,
                            durationInFrames: 35,
                        });

                        return (
                            <div key={step.label} style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
                                <div
                                    style={{
                                        opacity: sOpacity,
                                        transform: `translateX(${sX}px)`,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 20,
                                        flex: 1,
                                    }}
                                >
                                    {/* Step number */}
                                    <div
                                        style={{
                                            width: 56,
                                            height: 56,
                                            borderRadius: 16,
                                            background: `${step.color}20`,
                                            border: `2px solid ${step.color}50`,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: 20,
                                            fontWeight: 800,
                                            letterSpacing: "0.08em",
                                            flexShrink: 0,
                                        }}
                                    >
                                        {step.code}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 22, fontWeight: 700, color: step.color }}>
                                            Step {i + 1}: {step.label}
                                        </div>
                                    </div>
                                </div>

                                {/* Arrow */}
                                {i < steps.length - 1 && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: `calc(50% + 88px)`,
                                            marginTop: 66,
                                            opacity: sOpacity * 0.4,
                                            color: "#4b5563",
                                            fontSize: 20,
                                        }}
                                    >
                                        ↓
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* POC-1 proof */}
                    <div
                        style={{
                            marginTop: 20,
                            background: "rgba(99, 102, 241, 0.08)",
                            border: "1px solid rgba(99, 102, 241, 0.3)",
                            borderRadius: 12,
                            padding: "14px 18px",
                            opacity: interpolate(frame, [680, 720], [0, 1], { extrapolateRight: "clamp" }),
                        }}
                    >
                        <div style={{ fontSize: 14, fontFamily: "monospace", color: "#a5b4fc" }}>
                            breach.validate(confirmed) -&gt; slashStake(target, reason)
                        </div>
                        <div style={{ fontSize: 13, color: "#6366f1", marginTop: 4 }}>
                            Enforced accountability on Polkadot Hub EVM
                        </div>
                    </div>
                </div>
            </div>
        </AbsoluteFill>
    );
};
