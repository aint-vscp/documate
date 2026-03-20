import React from "react";
import { Composition } from "remotion";
import { PitchVideo } from "./PitchVideo";
import { ProductDemoVideo } from "./ProductDemoVideo";

// Total video: 3 minutes = 180 seconds @ 30fps = 5400 frames
// Breakdown:
//   Hook/Problem  : 0:00 - 0:25   (750 frames)
//   Solution      : 0:25 - 0:55   (900 frames)
//   How It Works  : 0:55 - 1:25   (900 frames)
//   Tech Stack    : 1:25 - 1:50   (750 frames)
//   DEMO SPACE    : 1:50 - 2:40   (1500 frames) <-- User inserts screen recording
//   CTA / Closing : 2:40 - 3:00   (600 frames)

export const Root: React.FC = () => {
    return (
        <>
            <Composition
                id="PitchVideo"
                component={PitchVideo}
                durationInFrames={5400}
                fps={30}
                width={1920}
                height={1080}
            />
            <Composition
                id="ProductDemoVideo"
                component={ProductDemoVideo}
                durationInFrames={5400}
                fps={30}
                width={1920}
                height={1080}
            />
        </>
    );
};
