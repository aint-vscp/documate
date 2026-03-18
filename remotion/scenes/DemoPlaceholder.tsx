import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

/**
 * Scene 5: Demo Placeholder (1:50 - 2:40, 1500 frames / 50 seconds)
 *
 * This scene is a placeholder where the user will insert their
 * actual screen recording demo. Shows an animated frame with
 * instructions and a timer.
 */
export const DemoPlaceholder: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Entrance
    const enterOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
    const enterScale = spring({ frame, fps, from: 0.95, to: 1, durationInFrames: 30 });

    // Timer: counts from 0:00 to 0:50
    const totalSeconds = Math.floor(frame / fps);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;

    // Pulse animation for the recording indicator
    const pulse = interpolate(frame % 60, [0, 30, 60], [0.6, 1, 0.6]);

    // Exit
    const exitOpacity = interpolate(frame, [1430, 1500], [1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

    return (
        <AbsoluteFill
            style={{
                fontFamily: "Inter, system-ui, sans-serif",
                background: "linear-gradient(135deg, #030712 0%, #0a0f1e 100%)",
                justifyContent: "center",
                alignItems: "center",
                opacity: enterOpacity * exitOpacity,
                transform: `scale(${enterScale})`,
            }}
        >
            {/* Outer frame (monitor mockup) */}
            <div
                style={{
                    width: 1600,
                    height: 900,
                    border: "2px solid rgba(255,255,255,0.1)",
                    borderRadius: 20,
                    background: "rgba(0,0,0,0.5)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                {/* Top bar */}
                <div
                    style={{
                        height: 44,
                        background: "rgba(255,255,255,0.04)",
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                        display: "flex",
                        alignItems: "center",
                        padding: "0 16px",
                        gap: 8,
                    }}
                >
                    {/* Traffic lights */}
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444" }} />
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#f59e0b" }} />
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#10b981" }} />
                    <div
                        style={{
                            flex: 1,
                            textAlign: "center",
                            fontSize: 13,
                            color: "#6b7280",
                        }}
                    >
                        localhost:3000/demo
                    </div>
                    {/* Recording indicator */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: "#ef4444",
                                opacity: pulse,
                            }}
                        />
                        <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>REC</span>
                    </div>
                </div>

                {/* Main content area -- placeholder */}
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 24,
                    }}
                >
                    {/* Large play icon */}
                    <div
                        style={{
                            width: 120,
                            height: 120,
                            borderRadius: "50%",
                            border: "3px solid rgba(168,85,247,0.4)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "rgba(168,85,247,0.08)",
                        }}
                    >
                        <div
                            style={{
                                width: 0,
                                height: 0,
                                borderTop: "24px solid transparent",
                                borderBottom: "24px solid transparent",
                                borderLeft: "40px solid #a855f7",
                                marginLeft: 8,
                            }}
                        />
                    </div>

                    <div style={{ fontSize: 36, fontWeight: 700, color: "white" }}>
                        Live Demo
                    </div>
                    <div style={{ fontSize: 20, color: "#9ca3af", maxWidth: 600, textAlign: "center" }}>
                        Insert your screen recording here showing the complete
                        DocuMate workflow: Connect MetaMask, verify DID, stake 50 PAS,
                        purchase template with 75/20/5 split, and show on-chain tx proof
                    </div>

                    {/* Timer */}
                    <div
                        style={{
                            marginTop: 16,
                            fontSize: 48,
                            fontFamily: "monospace",
                            fontWeight: 700,
                            color: "#a855f7",
                        }}
                    >
                        {timeStr}
                    </div>
                    <div style={{ fontSize: 14, color: "#6b7280" }}>
                        50 seconds reserved for demo
                    </div>
                </div>
            </div>

            {/* Corner label */}
            <div
                style={{
                    position: "absolute",
                    top: 24,
                    left: 40,
                    fontSize: 16,
                    color: "#6b7280",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                }}
            >
                Demo
            </div>
        </AbsoluteFill>
    );
};
