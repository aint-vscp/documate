/**
 * Profile Page
 * Shows DID, credentials, and blockchain reputation (CV)
 */
"use client";

import { useState, useEffect } from "react";
import { DidBadge, CVCards } from "@/components/chain";
import { useSelectedAccount, useIsWalletConnected } from "@/hooks/useWallet";
import {
    loadUserProfile,
    createUserProfile,
    type UserProfile,
} from "@/lib/polkadot/kilt";
import type { ReputationProfile, ProfessionalIdentityClaim } from "@/types";

export default function ProfilePage() {
    const selectedAccount = useSelectedAccount();
    const isConnected = useIsWalletConnected();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [reputation, setReputation] = useState<ReputationProfile | null>(null);
    const [isLoadingReputation, setIsLoadingReputation] = useState(false);
    const [isCreatingDid, setIsCreatingDid] = useState(false);
    const [showClaimForm, setShowClaimForm] = useState(false);

    // Form state
    const [formData, setFormData] = useState<ProfessionalIdentityClaim>({
        name: "",
        role: "",
        skills: [],
        bio: "",
    });
    const [skillInput, setSkillInput] = useState("");

    // Load profile on mount
    useEffect(() => {
        const saved = loadUserProfile();
        if (saved) {
            setProfile(saved);
        }
    }, []);

    // Fetch reputation when account changes
    useEffect(() => {
        if (selectedAccount?.address) {
            fetchReputation(selectedAccount.address);
        }
    }, [selectedAccount?.address]);

    const fetchReputation = async (address: string) => {
        setIsLoadingReputation(true);
        try {
            const res = await fetch(
                `/api/reputation/${address}?network=westend-asset-hub&blocks=5000`
            );
            const data = await res.json();
            if (data.success) {
                setReputation(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch reputation:", error);
        } finally {
            setIsLoadingReputation(false);
        }
    };

    const handleCreateDid = async () => {
        if (!formData.name || !formData.role) return;

        setIsCreatingDid(true);
        try {
            const newProfile = await createUserProfile(formData);
            setProfile(newProfile);
            setShowClaimForm(false);
        } catch (error) {
            console.error("Failed to create DID:", error);
        } finally {
            setIsCreatingDid(false);
        }
    };

    const addSkill = () => {
        if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
            setFormData({
                ...formData,
                skills: [...formData.skills, skillInput.trim()],
            });
            setSkillInput("");
        }
    };

    const removeSkill = (skill: string) => {
        setFormData({
            ...formData,
            skills: formData.skills.filter((s) => s !== skill),
        });
    };

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mb-6">
                    <svg
                        className="w-10 h-10 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                    Connect Your Wallet
                </h2>
                <p className="text-gray-400 max-w-md">
                    Connect a Polkadot wallet to access your decentralized identity and
                    reputation profile.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Identity Section */}
            <section className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700/50 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-white mb-1">
                            Decentralized Identity
                        </h2>
                        <p className="text-gray-400 text-sm">
                            Your self-sovereign professional identity on KILT Protocol
                        </p>
                    </div>
                    <DidBadge profile={profile} showDetails />
                </div>

                {profile ? (
                    <div className="space-y-4">
                        <div className="bg-gray-800/50 rounded-xl p-4">
                            <p className="text-gray-400 text-sm mb-1">DID</p>
                            <code className="text-emerald-400 text-sm break-all">
                                {profile.did}
                            </code>
                        </div>

                        {profile.credentials.length > 0 && (
                            <div>
                                <p className="text-gray-400 text-sm mb-2">
                                    Professional Profile
                                </p>
                                <div className="bg-gray-800/50 rounded-xl p-4">
                                    <h3 className="text-white font-semibold text-lg">
                                        {profile.credentials[0].credentialSubject.name}
                                    </h3>
                                    <p className="text-pink-400">
                                        {profile.credentials[0].credentialSubject.role}
                                    </p>
                                    {profile.credentials[0].credentialSubject.skills && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {(
                                                profile.credentials[0].credentialSubject
                                                    .skills as string[]
                                            ).map((skill) => (
                                                <span
                                                    key={skill}
                                                    className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ) : showClaimForm ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-colors"
                                placeholder="John Doe"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-400 text-sm mb-2">
                                Professional Role *
                            </label>
                            <input
                                type="text"
                                value={formData.role}
                                onChange={(e) =>
                                    setFormData({ ...formData, role: e.target.value })
                                }
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-colors"
                                placeholder="Full Stack Developer"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-400 text-sm mb-2">Skills</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={skillInput}
                                    onChange={(e) => setSkillInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && addSkill()}
                                    className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-colors"
                                    placeholder="Add a skill..."
                                />
                                <button
                                    onClick={addSkill}
                                    className="px-4 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                            {formData.skills.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {formData.skills.map((skill) => (
                                        <span
                                            key={skill}
                                            className="inline-flex items-center gap-1 text-sm bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full"
                                        >
                                            {skill}
                                            <button
                                                onClick={() => removeSkill(skill)}
                                                className="hover:text-white"
                                            >
                                                &times;
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-gray-400 text-sm mb-2">
                                Bio (Optional)
                            </label>
                            <textarea
                                value={formData.bio}
                                onChange={(e) =>
                                    setFormData({ ...formData, bio: e.target.value })
                                }
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-colors resize-none"
                                rows={3}
                                placeholder="Brief description of your expertise..."
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleCreateDid}
                                disabled={isCreatingDid || !formData.name || !formData.role}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCreatingDid ? "Creating DID..." : "Create Identity"}
                            </button>
                            <button
                                onClick={() => setShowClaimForm(false)}
                                className="px-6 py-3 bg-gray-800 text-gray-400 rounded-xl hover:text-white hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowClaimForm(true)}
                        className="w-full py-4 border-2 border-dashed border-gray-700 rounded-xl text-gray-400 hover:border-pink-500 hover:text-pink-400 transition-colors flex items-center justify-center gap-2"
                    >
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
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        Claim Your Professional Identity
                    </button>
                )}
            </section>

            {/* Wallet Address */}
            <section className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                    Connected Wallet
                </h2>
                <div className="bg-gray-800/50 rounded-xl p-4">
                    <p className="text-gray-400 text-sm mb-1">
                        {selectedAccount?.meta.name || "Account"}
                    </p>
                    <code className="text-white text-sm break-all">
                        {selectedAccount?.address}
                    </code>
                </div>
            </section>

            {/* Reputation Section */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-white">
                            Proof of Contract CV
                        </h2>
                        <p className="text-gray-400 text-sm">
                            Your verified on-chain reputation from POC-1 transactions
                        </p>
                    </div>
                    <button
                        onClick={() =>
                            selectedAccount && fetchReputation(selectedAccount.address)
                        }
                        className="text-sm text-pink-400 hover:text-pink-300 transition-colors flex items-center gap-1"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                        Refresh
                    </button>
                </div>
                <CVCards profile={reputation} isLoading={isLoadingReputation} />
            </section>
        </div>
    );
}
