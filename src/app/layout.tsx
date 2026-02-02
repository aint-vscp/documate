import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "DocuMate | Contract Governance & Professional Reputation",
  description:
    "Decentralized contract governance and professional reputation network built on Polkadot. Proof of Contract standard for verified freelancer CVs.",
  keywords: [
    "blockchain",
    "Polkadot",
    "DID",
    "reputation",
    "freelance",
    "contracts",
    "NFT",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} font-sans antialiased bg-gray-950 text-white min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
