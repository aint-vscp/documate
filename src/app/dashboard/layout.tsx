/**
 * Dashboard Layout
 * Shared layout for all dashboard pages with sidebar navigation
 */
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { WalletConnect } from "@/components/chain";

const navItems = [
    {
        name: "Profile",
        href: "/dashboard/profile",
        icon: (
            <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
            </svg>
        ),
    },
    {
        name: "Documents",
        href: "/dashboard/documents",
        icon: (
            <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
            </svg>
        ),
    },
    {
        name: "DocuWriter",
        href: "/dashboard/filing",
        icon: (
            <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
            </svg>
        ),
    },
    {
        name: "People",
        href: "/dashboard/people",
        icon: (
            <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5V9H2v11h5m10 0v-3a3 3 0 00-6 0v3m6 0H7m3-11a3 3 0 100 6 3 3 0 000-6zm7 1a2 2 0 11-4 0 2 2 0 014 0z"
                />
            </svg>
        ),
    },
    {
        name: "DocuMarket",
        href: "/dashboard/market",
        icon: (
            <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
            </svg>
        ),
    },
    {
        name: "Template Studio",
        href: "/dashboard/studio",
        icon: (
            <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
            </svg>
        ),
    },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="relative min-h-screen bg-[#101620] flex">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-[#111722]/95 backdrop-blur-xl border-r border-white/[0.08] z-40">
                <div className="px-5 py-5 border-b border-white/[0.07]">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="w-8 h-8 max-h-8 rounded-lg overflow-hidden border border-orange-300/25 bg-orange-400/10 shrink-0">
                            <Image
                                src="/logo.png"
                                alt="DocuMate"
                                width={32}
                                height={32}
                                className="h-full w-full object-cover"
                                priority
                            />
                        </div>
                        <div>
                            <span className="text-base font-bold gradient-text">DocuMate</span>
                            <p className="mono-label text-[9px] text-white/30 mt-0.5">Ember Wallet Suite</p>
                        </div>
                    </Link>
                </div>

                <nav className="px-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                    ? "bg-gradient-to-r from-orange-500/25 via-amber-500/20 to-blue-500/20 text-white border border-orange-300/45 shadow-[0_8px_20px_rgba(246,133,27,0.2)]"
                                    : "text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent hover:border-white/10"
                                    }`}
                            >
                                {item.icon}
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="px-3 mt-4 space-y-1.5">
                    <Link href="/whitepaper" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/40 hover:text-white/80 hover:bg-white/[0.03] rounded-md border-l-2 border-transparent pl-[14px] transition-all duration-150">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <span>Whitepaper</span>
                    </Link>
                    <Link href="/" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/40 hover:text-white/80 hover:bg-white/[0.03] rounded-md border-l-2 border-transparent pl-[14px] transition-all duration-150">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        <span>Landing</span>
                    </Link>
                </div>

                <div className="absolute bottom-5 left-3 right-3">
                    <div className="flex items-center gap-2 rounded-md border border-orange-300/20 bg-orange-500/5 px-3.5 py-2.5">
                        <span className="relative flex h-1.5 w-1.5 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400" />
                        </span>
                        <span className="mono-label text-[10px] text-white/35">Polkadot Hub Testnet</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64">
                {/* Top Bar */}
                <header className="sticky top-0 z-30 bg-[#111722]/90 backdrop-blur-xl border-b border-white/[0.08] px-8 py-3.5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-base font-semibold text-white">
                                {navItems.find((item) => pathname === item.href || pathname.startsWith(item.href + "/"))?.name ||
                                    "Dashboard"}
                            </h1>
                            <p className="mono-label text-[10px] text-orange-300/65 mt-0.5">DocuMate Ember · Onchain Workspace</p>
                        </div>
                        <WalletConnect />
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-8">{children}</div>
            </main>
        </div>
    );
}
