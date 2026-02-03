/**
 * Dashboard Layout
 * Shared layout for all dashboard pages with sidebar navigation
 */
"use client";

import Link from "next/link";
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
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-gray-950 flex">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900/50 border-r border-gray-800/50 backdrop-blur-xl z-40">
                <div className="p-6">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <svg
                                className="w-6 h-6 text-white"
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
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                            DocuMate
                        </span>
                    </Link>
                </div>

                <nav className="px-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                    ? "bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-white border border-pink-500/30"
                                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                                    }`}
                            >
                                {item.icon}
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="absolute bottom-6 left-4 right-4">
                    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            <span className="text-xs text-gray-400">Westend Testnet</span>
                        </div>
                        <p className="text-xs text-gray-500">
                            Connected to Asset Hub for testing
                        </p>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64">
                {/* Top Bar */}
                <header className="sticky top-0 z-30 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/50 px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-semibold text-white">
                                {navItems.find((item) => item.href === pathname)?.name ||
                                    "Dashboard"}
                            </h1>
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
