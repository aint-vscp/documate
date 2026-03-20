import React from "react";
import { AbsoluteFill, Img, Sequence, staticFile } from "remotion";
import { HookScene } from "./scenes/HookScene";
import { SolutionScene } from "./scenes/SolutionScene";
import { HowItWorksScene } from "./scenes/HowItWorksScene";
import { TechScene } from "./scenes/TechScene";
import { DemoPlaceholder } from "./scenes/DemoPlaceholder";
import { ClosingScene } from "./scenes/ClosingScene";

/**
 * DocuMate Product Pitch Video
 *
 * Total: 3 minutes (5400 frames @ 30fps)
 *
 * Timeline:
 *   0:00 - 0:25  Hook / Problem Statement        (750 frames)
 *   0:25 - 0:55  Solution Overview                (900 frames)
 *   0:55 - 1:25  How It Works (75/20/5 + DID)     (900 frames)
 *   1:25 - 1:50  Tech Stack & Architecture         (750 frames)
 *   1:50 - 2:40  DEMO SPACE (user adds recording)  (1500 frames)
 *   2:40 - 3:00  CTA / Closing                     (600 frames)
 */
export const PitchVideo: React.FC = () => {
    return (
        <AbsoluteFill style={{ backgroundColor: "#030712" }}>
            <div
                style={{
                    position: "absolute",
                    top: 28,
                    left: 32,
                    zIndex: 100,
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "10px 14px",
                    borderRadius: 14,
                    background: "rgba(3,7,18,0.55)",
                    border: "1px solid rgba(236,72,153,0.25)",
                    backdropFilter: "blur(8px)",
                }}
            >
                <Img
                    src={staticFile("logo.png")}
                    alt="DocuMate"
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        objectFit: "cover",
                    }}
                />
                <div
                    style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                        fontSize: 24,
                        fontWeight: 700,
                        background: "linear-gradient(135deg, #ec4899, #a855f7, #3b82f6)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        letterSpacing: "-0.01em",
                    }}
                >
                    DocuMate
                </div>
            </div>

            {/* Scene 1: Hook / Problem */}
            <Sequence from={0} durationInFrames={750}>
                <HookScene />
            </Sequence>

            {/* Scene 2: Solution */}
            <Sequence from={750} durationInFrames={900}>
                <SolutionScene />
            </Sequence>

            {/* Scene 3: How It Works */}
            <Sequence from={1650} durationInFrames={900}>
                <HowItWorksScene />
            </Sequence>

            {/* Scene 4: Tech Stack */}
            <Sequence from={2550} durationInFrames={750}>
                <TechScene />
            </Sequence>

            {/* Scene 5: DEMO PLACEHOLDER - User will insert screen recording here */}
            <Sequence from={3300} durationInFrames={1500}>
                <DemoPlaceholder />
            </Sequence>

            {/* Scene 6: Closing / CTA */}
            <Sequence from={4800} durationInFrames={600}>
                <ClosingScene />
            </Sequence>
        </AbsoluteFill>
    );
};
