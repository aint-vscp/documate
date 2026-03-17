/**
 * Admin Dashboard Overview
 * Platform statistics and quick actions
 */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface DashboardStats {
    // Users
    totalUsers: number;
    newUsersToday: number;
    activeSubscribers: number;

    // Templates
    totalTemplates: number;
    verifiedTemplates: number;
    pendingVerifications: number;

    // Marketplace
    totalVolume: number;
    volumeToday: number;
    totalBurned: number;

    // Issues
    pendingBreaches: number;
    openDisputes: number;
}

interface RecentActivity {
    id: string;
    type: "verification" | "breach" | "purchase" | "mint";
    description: string;
    timestamp: string;
    status?: string;
}

// Mock data for MVP
const MOCK_STATS: DashboardStats = {
    totalUsers: 1247,
    newUsersToday: 23,
    activeSubscribers: 156,
    totalTemplates: 342,
    verifiedTemplates: 89,
    pendingVerifications: 12,
    totalVolume: 45670,
    volumeToday: 1250,
    totalBurned: 2283.5,
    pendingBreaches: 3,
    openDisputes: 7,
};

const MOCK_ACTIVITY: RecentActivity[] = [
    {
        id: "1",
        type: "verification",
        description: "New verification request: 'Enterprise NDA Template'",
        timestamp: "5 minutes ago",
        status: "pending",
    },
    {
        id: "2",
        type: "purchase",
        description: "Template purchased: 'Software License Agreement' for 75 DOCU",
        timestamp: "12 minutes ago",
    },
    {
        id: "3",
        type: "breach",
        description: "Breach report filed against user 5FHne...694ty",
        timestamp: "1 hour ago",
        status: "investigating",
    },
    {
        id: "4",
        type: "mint",
        description: "New template minted: 'Consulting SOW v2'",
        timestamp: "2 hours ago",
    },
    {
        id: "5",
        type: "verification",
        description: "Verification approved: 'Freelance Design Contract'",
        timestamp: "3 hours ago",
        status: "approved",
    },
];

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats>(MOCK_STATS);
    const [activity] = useState<RecentActivity[]>(MOCK_ACTIVITY);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch real data from backend API
    useEffect(() => {
        async function fetchDashboardData() {
            setIsLoading(true);
            try {
                const response = await fetch("/api/admin/stats");
                const data = await response.json();
                setStats(prev => ({
                    ...prev,
                    totalUsers: data.totalUsers || prev.totalUsers,
                    totalTemplates: data.totalTemplates || prev.totalTemplates,
                    pendingVerifications: data.verificationCount ?? prev.pendingVerifications,
                    pendingBreaches: data.breachCount ?? prev.pendingBreaches,
                }));
            } catch (error) {
                console.error("Failed to fetch admin stats:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchDashboardData();
    }, []);

    const getActivityIcon = (type: RecentActivity["type"]) => {
        switch (type) {
            case "verification":
                return (
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
            case "breach":
                return (
                    <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                );
            case "purchase":
                return (
                    <div className="w-10 h-10 bg-pink-500/20 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                );
            case "mint":
                return (
                    <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-gray-400 mt-1">Platform overview and quick actions</p>
            </div>

            {/* Alert Banner - Pending Actions */}
            {(stats.pendingVerifications > 0 || stats.pendingBreaches > 0) && (
                <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-2xl p-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-white">Action Required</h3>
                            <p className="text-gray-400 text-sm">
                                {stats.pendingVerifications} verification requests and {stats.pendingBreaches} breach reports pending review
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Link
                                href="/admin/verification"
                                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-sm font-medium transition-colors"
                            >
                                Review Verifications
                            </Link>
                            <Link
                                href="/admin/breaches"
                                className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-xl text-sm font-medium transition-colors"
                            >
                                Review Breaches
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity ${isLoading ? "opacity-50" : ""}`}>
                {/* Users */}
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <span className="text-emerald-400 text-sm font-medium">+{stats.newUsersToday} today</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.totalUsers.toLocaleString()}</p>
                    <p className="text-gray-400 text-sm mt-1">Total Users</p>
                </div>

                {/* Templates */}
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <span className="text-emerald-400 text-sm font-medium">{stats.verifiedTemplates} verified</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.totalTemplates.toLocaleString()}</p>
                    <p className="text-gray-400 text-sm mt-1">Total Templates</p>
                </div>

                {/* Volume */}
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <span className="text-emerald-400 text-sm font-medium">+{stats.volumeToday} today</span>
                    </div>
                    <p className="text-3xl font-bold text-white">${stats.totalVolume.toLocaleString()}</p>
                    <p className="text-gray-400 text-sm mt-1">Total Volume (DOCU)</p>
                </div>

                {/* Burned */}
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                            </svg>
                        </div>
                        <span className="text-orange-400 text-sm font-medium">5% of volume</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.totalBurned.toLocaleString()}</p>
                    <p className="text-gray-400 text-sm mt-1">Tokens Burned (DOCU)</p>
                </div>
            </div>

            {/* Revenue Split Reminder */}
            <div className="bg-gradient-to-r from-pink-500/5 to-purple-500/5 border border-pink-500/20 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    THE IRON RULES - Revenue Split
                </h3>
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-emerald-500" />
                        <span className="text-gray-400">75% Creator</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-pink-500" />
                        <span className="text-gray-400">20% Treasury</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-orange-500" />
                        <span className="text-gray-400">5% Burn</span>
                    </div>
                </div>
                <p className="text-gray-500 text-sm mt-3">
                    This split is enforced on-chain. Admin cannot modify individual transactions.
                </p>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        {activity.map((item) => (
                            <div key={item.id} className="flex items-start gap-4">
                                {getActivityIcon(item.type)}
                                <div className="flex-1 min-w-0">
                                    <p className="text-gray-300 text-sm">{item.description}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-gray-500 text-xs">{item.timestamp}</span>
                                        {item.status && (
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === "approved" ? "bg-emerald-500/20 text-emerald-400" :
                                                    item.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                                                        "bg-blue-500/20 text-blue-400"
                                                }`}>
                                                {item.status}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Link
                        href="/admin/logs"
                        className="block text-center text-pink-400 hover:text-pink-300 text-sm mt-4 pt-4 border-t border-gray-700/50"
                    >
                        View All Activity
                    </Link>
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <Link
                            href="/admin/verification"
                            className="flex flex-col items-center gap-2 p-4 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 rounded-xl transition-colors"
                        >
                            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <span className="text-gray-300 text-sm text-center">Review Verifications</span>
                        </Link>

                        <Link
                            href="/admin/breaches"
                            className="flex flex-col items-center gap-2 p-4 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 rounded-xl transition-colors"
                        >
                            <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <span className="text-gray-300 text-sm text-center">Manage Breaches</span>
                        </Link>

                        <Link
                            href="/admin/users"
                            className="flex flex-col items-center gap-2 p-4 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 rounded-xl transition-colors"
                        >
                            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <span className="text-gray-300 text-sm text-center">User Management</span>
                        </Link>

                        <Link
                            href="/admin/templates"
                            className="flex flex-col items-center gap-2 p-4 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 rounded-xl transition-colors"
                        >
                            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <span className="text-gray-300 text-sm text-center">Template Catalog</span>
                        </Link>
                    </div>

                    {/* Subscription Stats */}
                    <div className="mt-6 pt-4 border-t border-gray-700/50">
                        <h4 className="text-sm font-medium text-gray-400 mb-3">Subscription Breakdown</h4>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-300 text-sm">Power Users ($20/mo)</span>
                                <span className="text-white font-medium">{stats.activeSubscribers}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-300 text-sm">Monthly Revenue</span>
                                <span className="text-emerald-400 font-medium">${stats.activeSubscribers * 20}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
