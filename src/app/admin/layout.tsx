/**
 * Admin Dashboard Layout
 * Protected layout for admin-only features
 * Verification Queue, Breach Management, Platform Stats
 */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIsWalletConnected, useSelectedAccount } from "@/hooks/useWallet";
import { WalletConnect } from "@/components/chain";

// Admin addresses - In production, fetch from database
const ADMIN_ADDRESSES = [
    "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY", // Alice (dev)
    // Add more admin addresses
];

const NAV_ITEMS = [
    {
        name: "Overview",
        href: "/admin",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
        ),
    },
    {
        name: "Verification Queue",
        href: "/admin/verification",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        badge: "verificationCount",
    },
    {
        name: "Breach Reports",
        href: "/admin/breaches",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ),
        badge: "breachCount",
    },
    {
        name: "Users",
        href: "/admin/users",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ),
    },
    {
        name: "Templates",
        href: "/admin/templates",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
    },
    {
        name: "Audit Log",
        href: "/admin/logs",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
        ),
    },
];

interface AdminStats {
    verificationCount: number;
    breachCount: number;
    totalUsers: number;
    totalTemplates: number;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isConnected = useIsWalletConnected();
    const selectedAccount = useSelectedAccount();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<AdminStats>({
        verificationCount: 0,
        breachCount: 0,
        totalUsers: 0,
        totalTemplates: 0,
    });

    // Check admin status
    useEffect(() => {
        if (selectedAccount?.address) {
            const adminCheck = ADMIN_ADDRESSES.includes(selectedAccount.address);
            setIsAdmin(adminCheck);
            setIsLoading(false);

            if (adminCheck) {
                // Fetch admin stats
                fetchStats();
            }
        } else {
            setIsAdmin(false);
            setIsLoading(false);
        }
    }, [selectedAccount?.address]);

    const fetchStats = async () => {
        try {
            const response = await fetch("/api/admin/stats");
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Failed to fetch admin stats:", error);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Verifying admin access...</p>
                </div>
            </div>
        );
    }

    // Not connected
    if (!isConnected) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Admin Access Required</h1>
                    <p className="text-gray-400 mb-6">Connect your wallet to access the admin dashboard.</p>
                    <WalletConnect />
                </div>
            </div>
        );
    }

    // Not admin
    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
                    <p className="text-gray-400 mb-4">
                        Your wallet is not authorized for admin access.
                    </p>
                    <p className="text-gray-500 text-sm font-mono break-all">
                        {selectedAccount?.address}
                    </p>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    // Admin Dashboard
    return (
        <div className="min-h-screen bg-gray-950">
            {/* Admin Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950/90 backdrop-blur-xl border-b border-red-500/20">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <span className="text-xl font-bold text-white">DocuMate</span>
                                <span className="ml-2 px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-medium rounded-full">
                                    ADMIN
                                </span>
                            </div>
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard"
                            className="text-gray-400 hover:text-white transition-colors text-sm"
                        >
                            Exit Admin
                        </Link>
                        <WalletConnect />
                    </div>
                </div>
            </header>

            <div className="flex pt-[73px]">
                {/* Sidebar */}
                <aside className="fixed left-0 top-[73px] bottom-0 w-64 bg-gray-900/50 border-r border-gray-800/50 overflow-y-auto">
                    <nav className="p-4 space-y-1">
                        {NAV_ITEMS.map((item) => {
                            const isActive = pathname === item.href || 
                                (item.href !== "/admin" && pathname.startsWith(item.href));
                            const badgeCount = item.badge ? stats[item.badge as keyof AdminStats] : 0;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                                        isActive
                                            ? "bg-gradient-to-r from-red-500/20 to-pink-500/20 text-white border border-red-500/30"
                                            : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {item.icon}
                                        <span className="font-medium">{item.name}</span>
                                    </div>
                                    {badgeCount > 0 && (
                                        <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded-full">
                                            {badgeCount}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Quick Stats */}
                    <div className="p-4 mt-4 border-t border-gray-800/50">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Platform Stats
                        </h3>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Total Users</span>
                                <span className="text-white font-medium">{stats.totalUsers}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Templates</span>
                                <span className="text-white font-medium">{stats.totalTemplates}</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 ml-64 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
