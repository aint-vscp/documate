import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

/**
 * Scene 1: Hook / Problem Statement (0:00 - 0:25, 750 frames)
 *
 * Opens with a bold stat, then reveals the problem statement.
 */
export const HookScene: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Stat counter animation
    const statValue = Math.min(
        Math.round(interpolate(frame, [20, 90], [0, 10], { extrapolateRight: "clamp", extrapolateLeft: "clamp" })),
        10
    );

    // Title fade in
    const titleOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
    const titleY = spring({ frame, fps, from: 40, to: 0, durationInFrames: 40 });

    // Stat scale
    const statScale = spring({ frame: Math.max(0, frame - 10), fps, from: 0.5, to: 1, durationInFrames: 30 });
    const statOpacity = interpolate(frame, [10, 40], [0, 1], { extrapolateRight: "clamp" });

    // Problem text
    const problemOpacity = interpolate(frame, [120, 160], [0, 1], { extrapolateRight: "clamp" });
    const problemY = spring({ frame: Math.max(0, frame - 120), fps, from: 30, to: 0, durationInFrames: 40 });

    // Scam stat
    const scamOpacity = interpolate(frame, [220, 260], [0, 1], { extrapolateRight: "clamp" });

    // Subtext
    const subOpacity = interpolate(frame, [350, 400], [0, 1], { extrapolateRight: "clamp" });

    // Fade out
    const fadeOut = interpolate(frame, [680, 750], [1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

    return (
        <AbsoluteFill
            style={{
                justifyContent: "center",
                alignItems: "center",
                background: "linear-gradient(135deg, #030712 0%, #0f172a 50%, #030712 100%)",
                fontFamily: "Inter, system-ui, sans-serif",
                opacity: fadeOut,
            }}
        >
            {/* Background grid effect */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
                    backgroundSize: "60px 60px",
                }}
            />

            {/* Main stat */}
            <div
                style={{
                    opacity: statOpacity,
                    transform: `scale(${statScale})`,
                    textAlign: "center",
                }}
            >
                <div
                    style={{
                        fontSize: 140,
                        fontWeight: 800,
                        background: "linear-gradient(135deg, #ec4899, #a855f7, #6366f1)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        lineHeight: 1,
                    }}
                >
                    ${statValue}B+
                </div>
                <div
                    style={{
                        fontSize: 28,
                        color: "#9ca3af",
                        marginTop: 12,
                        opacity: titleOpacity,
                        transform: `translateY(${titleY}px)`,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                    }}
                >
                    Lost to consumer fraud annually
                </div>
            </div>

            {/* Problem statement */}
            <div
                style={{
                    marginTop: 80,
                    textAlign: "center",
                    opacity: problemOpacity,
                    transform: `translateY(${problemY}px)`,
                }}
            >
                <div
                    style={{
                        fontSize: 44,
                        fontWeight: 700,
                        color: "white",
                        maxWidth: 1200,
                        lineHeight: 1.3,
                    }}
                >
                    Fake credentials. Unverifiable contracts.
                    <br />
                    No portable professional reputation.
                </div>
            </div>

            {/* Second stat */}
            <div
                style={{
                    marginTop: 50,
                    opacity: scamOpacity,
                    display: "flex",
                    gap: 60,
                }}
            >
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 48, fontWeight: 800, color: "#f472b6" }}>$367M+</div>
                    <div style={{ fontSize: 18, color: "#6b7280", marginTop: 4 }}>Employment scams / year</div>
                </div>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 48, fontWeight: 800, color: "#a78bfa" }}>36%</div>
                    <div style={{ fontSize: 18, color: "#6b7280", marginTop: 4 }}>Freelancers face non-payment</div>
                </div>
            </div>

            {/* Subtext */}
            <div
                style={{
                    marginTop: 60,
                    opacity: subOpacity,
                    fontSize: 24,
                    color: "#6b7280",
                    fontStyle: "italic",
                }}
            >
                The document industry needs a trust layer.
            </div>
        </AbsoluteFill>
    );
};
