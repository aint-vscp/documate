import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

/**
 * Scene 4: Tech Stack & Architecture (1:25 - 1:50, 750 frames)
 */
export const TechScene: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const titleOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
    const titleY = spring({ frame, fps, from: 30, to: 0, durationInFrames: 35 });

    const stack = [
        { layer: "Smart Contracts", tech: "Solidity ^0.8.24", detail: "Marketplace + Staking on Polkadot Hub EVM", color: "#ec4899", icon: "SC" },
        { layer: "Identity Gate", tech: "Precompile Interface", detail: "onlyVerified flow with runtime-ready path", color: "#10b981", icon: "ID" },
        { layer: "Document Trust", tech: "Phala-style TEE API", detail: "PKCS#7/CMS signature validation", color: "#8b5cf6", icon: "TEE" },
        { layer: "Frontend", tech: "Next.js 15 + TypeScript", detail: "Dashboard, market, studio, admin", color: "#3b82f6", icon: "WEB" },
        { layer: "Validation", tech: "Hardhat + Testnet", detail: "4 passing tests + live smoke checks", color: "#f59e0b", icon: "QA" },
        { layer: "Persistence", tech: "Prisma", detail: "Templates, purchases, breaches, audit logs", color: "#6366f1", icon: "DB" },
    ];

    // Polkadot advantage
    const advantageOpacity = interpolate(frame, [450, 490], [0, 1], { extrapolateRight: "clamp" });

    // Fade out
    const fadeOut = interpolate(frame, [680, 750], [1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

    return (
        <AbsoluteFill
            style={{
                fontFamily: "Inter, system-ui, sans-serif",
                background: "linear-gradient(180deg, #030712 0%, #0f172a 100%)",
                padding: "70px 100px",
                opacity: fadeOut,
            }}
        >
            {/* Title */}
            <div
                style={{
                    opacity: titleOpacity,
                    transform: `translateY(${titleY}px)`,
                    marginBottom: 40,
                }}
            >
                <div style={{ fontSize: 52, fontWeight: 800, color: "white" }}>Tech Stack</div>
                <div style={{ fontSize: 20, color: "#9ca3af", marginTop: 8 }}>
                    Production-ready architecture on Polkadot Hub
                </div>
            </div>

            <div style={{ display: "flex", gap: 60 }}>
                {/* Left: Stack layers */}
                <div style={{ flex: 1 }}>
                    {stack.map((item, i) => {
                        const delay = 60 + i * 50;
                        const iOpacity = interpolate(frame, [delay, delay + 40], [0, 1], { extrapolateRight: "clamp" });
                        const iX = spring({ frame: Math.max(0, frame - delay), fps, from: 50, to: 0, durationInFrames: 35 });

                        return (
                            <div
                                key={item.layer}
                                style={{
                                    opacity: iOpacity,
                                    transform: `translateX(${iX}px)`,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 16,
                                    marginBottom: 16,
                                    background: "rgba(255,255,255,0.03)",
                                    border: `1px solid ${item.color}30`,
                                    borderRadius: 14,
                                    padding: "14px 20px",
                                }}
                            >
                                <div style={{ fontSize: 16, width: 44, textAlign: "center", color: item.color, fontWeight: 800 }}>{item.icon}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                                        <span style={{ fontSize: 18, fontWeight: 700, color: item.color }}>{item.layer}</span>
                                        <span style={{ fontSize: 15, color: "#d1d5db" }}>{item.tech}</span>
                                    </div>
                                    <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{item.detail}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Right: Why Polkadot */}
                <div style={{ flex: 0.8, opacity: advantageOpacity }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: "#e6007a", marginBottom: 24 }}>
                        Why Polkadot Hub?
                    </div>
                    {[
                        { title: "EVM Compatible", desc: "Deploy Solidity directly -- same devs, same tools" },
                        { title: "KILT Precompiles", desc: "Native on-chain identity without oracles" },
                        { title: "XCM Messaging", desc: "Portable reputation across all parachains" },
                        { title: "Shared Security", desc: "Enterprise-grade from day one" },
                    ].map((adv, i) => {
                        const aDelay = 500 + i * 40;
                        const aOpacity = interpolate(frame, [aDelay, aDelay + 30], [0, 1], { extrapolateRight: "clamp" });
                        return (
                            <div
                                key={adv.title}
                                style={{
                                    opacity: aOpacity,
                                    marginBottom: 20,
                                    paddingLeft: 16,
                                    borderLeft: "3px solid #e6007a40",
                                }}
                            >
                                <div style={{ fontSize: 18, fontWeight: 600, color: "#f9fafb" }}>{adv.title}</div>
                                <div style={{ fontSize: 14, color: "#9ca3af", marginTop: 2 }}>{adv.desc}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </AbsoluteFill>
    );
};
