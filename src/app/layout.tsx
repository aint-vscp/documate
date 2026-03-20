import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://documate.app"),
  title: "DocuMate Ember | Decentralized Trust Infrastructure",
  description:
    "DocuMate Ember: trust infrastructure for contracts and reputation on Polkadot Hub EVM. Immutable economics, verifiable workflows, and a demo-ready governance stack.",
  keywords: [
    "blockchain",
    "Polkadot",
    "DID",
    "reputation",
    "freelance",
    "contracts",
    "NFT",
  ],
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "DocuMate Ember | Decentralized Trust Infrastructure",
    description:
      "DocuMate Ember: trust infrastructure for contracts and reputation on Polkadot Hub EVM.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 1200,
        alt: "DocuMate",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} font-sans antialiased bg-gray-950 text-white min-h-screen tracking-[0.01em]`}
      >
        {children}
      </body>
    </html>
  );
}
