import React from "react";
import { AbsoluteFill, Sequence } from "remotion";

const bg: React.CSSProperties = {
    background:
        "radial-gradient(1000px 600px at 10% -10%, rgba(230,0,122,0.20), transparent 60%), radial-gradient(900px 500px at 100% 10%, rgba(85,43,191,0.24), transparent 60%), #090b14",
    color: "#f8fafc",
    fontFamily: "Inter, Segoe UI, system-ui, sans-serif",
};

const section: React.CSSProperties = {
    ...bg,
    padding: "90px 110px",
    justifyContent: "center",
};

const title: React.CSSProperties = {
    fontSize: 68,
    fontWeight: 800,
    letterSpacing: -1.2,
    lineHeight: 1.08,
    maxWidth: 1600,
};

const copy: React.CSSProperties = {
    marginTop: 18,
    fontSize: 32,
    lineHeight: 1.3,
    color: "#d1d5db",
    maxWidth: 1600,
};

const badgeRow: React.CSSProperties = {
    display: "flex",
    gap: 12,
    marginTop: 24,
    flexWrap: "wrap",
};

const badge = (text: string): React.ReactElement => (
    <div
        style={{
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.07)",
            padding: "8px 14px",
            fontSize: 21,
            color: "#e5e7eb",
        }}
    >
        {text}
    </div>
);

const IdentityScene: React.FC = () => (
    <AbsoluteFill style={section}>
        <div style={title}>1) Identity Precompile Gate</div>
        <div style={copy}>
            Contract calls the runtime identity precompile before sensitive actions.
        </div>
        <div style={badgeRow}>
            {badge("chainId 420420417")}
            {badge("0x0000000000000000000000000000000000000818")}
            {badge("identityPrecompile.staticcall")}
        </div>
    </AbsoluteFill>
);

const AnchorScene: React.FC = () => (
    <AbsoluteFill style={section}>
        <div style={title}>2) Document Anchor Trust Layer</div>
        <div style={copy}>
            Document lifecycle is tied to a verifiable chain transaction hash.
        </div>
        <div style={badgeRow}>{badge("anchorStatus: anchored")}{badge("chain tx hash required")}</div>
    </AbsoluteFill>
);

const TeeScene: React.FC = () => (
    <AbsoluteFill style={section}>
        <div style={title}>3) TEE Visibility: Gold, Silver, Bronze</div>
        <div style={copy}>
            Trust evidence is surfaced by tier so reviewers can judge certainty quickly.
        </div>
        <div style={badgeRow}>{badge("Gold")}{badge("Silver")}{badge("Bronze")}</div>
    </AbsoluteFill>
);

const SettlementScene: React.FC = () => (
    <AbsoluteFill style={section}>
        <div style={title}>4) Deterministic Settlement</div>
        <div style={copy}>Revenue split is encoded and shown literally as 75/20/5.</div>
        <div style={badgeRow}>{badge("75/20/5")}{badge("creator/treasury/staking")}</div>
    </AbsoluteFill>
);

const ReputationScene: React.FC = () => (
    <AbsoluteFill style={section}>
        <div style={title}>5) Reputation and Slashing Accountability</div>
        <div style={copy}>
            Abuse reports escalate to slashable outcomes for persistent accountability.
        </div>
        <div style={badgeRow}>{badge("breach evidence")}{badge("stake slash path")}</div>
    </AbsoluteFill>
);

const LiveProofScene: React.FC = () => (
    <AbsoluteFill style={section}>
        <div style={title}>Final 30s Live Proof Hold</div>
        <div style={copy}>
            Explorer-backed contract proof is held on screen for verification.
        </div>
        <div style={badgeRow}>
            {badge("Marketplace: 0x233FE6112E5Ad4Db1c83358B30D581F837314BB1")}
            {badge("Staking: 0x1cf190eabe490B50AaBE91b4567ebe88126e8D24")}
            {badge("Blockscout testnet links visible")}
        </div>
    </AbsoluteFill>
);

export const HackathonDemoVideo: React.FC = () => {
    return (
        <AbsoluteFill>
            <Sequence from={0} durationInFrames={300}>
                <IdentityScene />
            </Sequence>
            <Sequence from={300} durationInFrames={300}>
                <AnchorScene />
            </Sequence>
            <Sequence from={600} durationInFrames={300}>
                <TeeScene />
            </Sequence>
            <Sequence from={900} durationInFrames={300}>
                <SettlementScene />
            </Sequence>
            <Sequence from={1200} durationInFrames={300}>
                <ReputationScene />
            </Sequence>
            <Sequence from={1500} durationInFrames={300}>
                <ReputationScene />
            </Sequence>
            <Sequence from={1800} durationInFrames={900}>
                <LiveProofScene />
            </Sequence>
        </AbsoluteFill>
    );
};
