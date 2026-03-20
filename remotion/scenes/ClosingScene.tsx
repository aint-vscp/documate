import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

/**
 * Scene 6: Closing / Call to Action (2:40 - 3:00, 600 frames)
 */
export const ClosingScene: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Brand entrance
    const brandOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
    const brandScale = spring({ frame, fps, from: 0.8, to: 1, durationInFrames: 40 });

    // Tagline
    const tagOpacity = interpolate(frame, [40, 70], [0, 1], { extrapolateRight: "clamp" });

    // Stats row
    const statsOpacity = interpolate(frame, [100, 140], [0, 1], { extrapolateRight: "clamp" });

    // CTA items
    const ctaOpacity = interpolate(frame, [200, 240], [0, 1], { extrapolateRight: "clamp" });

    // Track badge
    const badgeOpacity = interpolate(frame, [300, 340], [0, 1], { extrapolateRight: "clamp" });

    return (
        <AbsoluteFill
            style={{
                fontFamily: "Inter, system-ui, sans-serif",
                background: "linear-gradient(135deg, #030712 0%, #1e1b4b 50%, #030712 100%)",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            {/* Background glow */}
            <div
                style={{
                    position: "absolute",
                    width: 800,
                    height: 800,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 60%)",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                }}
            />

            {/* Brand */}
            <div
                style={{
                    opacity: brandOpacity,
                    transform: `scale(${brandScale})`,
                    textAlign: "center",
                }}
            >
                <div
                    style={{
                        fontSize: 100,
                        fontWeight: 800,
                        background: "linear-gradient(135deg, #ec4899, #a855f7, #3b82f6)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                    }}
                >
                    DocuMate
                </div>
            </div>

            {/* Tagline */}
            <div style={{ opacity: tagOpacity, textAlign: "center", marginTop: 16 }}>
                <div style={{ fontSize: 28, color: "#d1d5db" }}>
                    Trust. Verify. Earn. On-Chain.
                </div>
            </div>

            {/* Stats */}
            <div
                style={{
                    opacity: statsOpacity,
                    display: "flex",
                    gap: 60,
                    marginTop: 50,
                }}
            >
                {[
                    { value: "2", label: "Core Contracts" },
                    { value: "4", label: "Passing Tests" },
                    { value: "Live", label: "Testnet Proof" },
                    { value: "75/20/5", label: "Iron Rule" },
                ].map((stat) => (
                    <div key={stat.label} style={{ textAlign: "center" }}>
                        <div
                            style={{
                                fontSize: 40,
                                fontWeight: 800,
                                background: "linear-gradient(135deg, #ec4899, #a855f7)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                            }}
                        >
                            {stat.value}
                        </div>
                        <div style={{ fontSize: 14, color: "#9ca3af", marginTop: 4 }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Product roadmap */}
            <div
                style={{
                    opacity: ctaOpacity,
                    display: "flex",
                    gap: 24,
                    marginTop: 50,
                }}
            >
                {[
                    "Mainnet Deploy",
                    "KILT Precompile Integration",
                    "Phala TEE Production",
                    "Ecosystem Partnerships",
                ].map((item) => (
                    <div
                        key={item}
                        style={{
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 12,
                            padding: "10px 20px",
                            fontSize: 15,
                            color: "#d1d5db",
                            fontWeight: 500,
                        }}
                    >
                        {item}
                    </div>
                ))}
            </div>

            {/* Track badge */}
            <div
                style={{
                    opacity: badgeOpacity,
                    marginTop: 50,
                    background: "linear-gradient(135deg, #e6007a20, #ec489920)",
                    border: "1px solid #e6007a40",
                    borderRadius: 16,
                    padding: "14px 32px",
                    textAlign: "center",
                }}
            >
                <div style={{ fontSize: 14, color: "#e6007a", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    Production Roadmap
                </div>
                <div style={{ fontSize: 20, color: "white", fontWeight: 700, marginTop: 4 }}>
                    Runtime-native verification and trust automation
                </div>
            </div>
        </AbsoluteFill>
    );
};
