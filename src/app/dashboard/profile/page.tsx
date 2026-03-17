/**
 * Profile Page
 * Shows DID, credentials, and blockchain reputation (CV)
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { DidBadge } from "@/components/chain";
import { useEVMAccount, useIsEVMConnected } from "@/hooks/useEVMWallet";
import { useDocuMateContract } from "@/hooks/useDocuMateContract";
import { useStakingContract } from "@/hooks/useStakingContract";
import {
    loadUserProfile,
    createUserProfile,
    type UserProfile,
} from "@/lib/polkadot/kilt";
import type { ProfessionalIdentityClaim } from "@/types";

const BREACH_REASONS = [
    { value: "NON_DELIVERY", label: "Non-Delivery", desc: "Work or deliverable was never received" },
    { value: "QUALITY_ISSUE", label: "Quality Issue", desc: "Work delivered does not meet agreed standards" },
    { value: "PAYMENT_DISPUTE", label: "Payment Dispute", desc: "Payment was not made or was insufficient" },
    { value: "CONFIDENTIALITY_BREACH", label: "Confidentiality Breach", desc: "Sensitive information was disclosed" },
    { value: "FRAUD", label: "Fraud", desc: "Intentional deception or misrepresentation" },
    { value: "OTHER", label: "Other", desc: "Other breach of contract" },
] as const;

export default function ProfilePage() {
    const account = useEVMAccount();
    const isConnected = useIsEVMConnected();
    const { checkVerified, verifyDID, getPlatformStats } = useDocuMateContract();
    const { stakeReputation, unstake, getStakeInfo, getPoolStats } = useStakingContract();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoadingReputation, setIsLoadingReputation] = useState(false);
    const [isCreatingDid, setIsCreatingDid] = useState(false);
    const [showClaimForm, setShowClaimForm] = useState(false);
    const [showBreachModal, setShowBreachModal] = useState(false);
    const [isSubmittingBreach, setIsSubmittingBreach] = useState(false);
    const [breachSuccess, setBreachSuccess] = useState(false);
    const [evmVerified, setEvmVerified] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [platformStats, setPlatformStats] = useState<{ totalDocuments: number; totalTransactions: number; totalVolume: string } | null>(null);
    const [stakeInfo, setStakeInfo] = useState<{ staked: boolean; amount: string; since: number } | null>(null);
    const [poolStats, setPoolStats] = useState<{ totalStaked: string; totalSlashed: string; poolBalance: string; stakerCount: number } | null>(null);
    const [isStaking, setIsStaking] = useState(false);
    const [isUnstaking, setIsUnstaking] = useState(false);

    // Breach form state
    const [breachForm, setBreachForm] = useState({
        targetAddress: "",
        reason: "NON_DELIVERY",
        description: "",
        evidence: "",
        contractHash: "",
    });

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

    const fetchOnChainStats = useCallback(async () => {
        setIsLoadingReputation(true);
        try {
            const stats = await getPlatformStats();
            if (stats) setPlatformStats(stats);
        } catch (error) {
            console.error("Failed to fetch on-chain stats:", error);
        } finally {
            setIsLoadingReputation(false);
        }
    }, [getPlatformStats]);

    // Fetch on-chain status when account changes
    useEffect(() => {
        if (account) {
            checkVerified(account).then(setEvmVerified);
            fetchOnChainStats();
            // Fetch staking info
            getStakeInfo(account).then((info) => { if (info) setStakeInfo(info); });
            getPoolStats().then((stats) => { if (stats) setPoolStats(stats); });
        }
    }, [account, checkVerified, fetchOnChainStats, getStakeInfo, getPoolStats]);

    const handleVerifyOnChain = async () => {
        if (!account) return;
        setIsVerifying(true);
        try {
            await verifyDID(account);
            setEvmVerified(true);
        } catch (error) {
            console.error("On-chain verification failed:", error);
            alert("Verification failed. Only the contract owner can verify addresses.");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleStake = async () => {
        if (!account) return;
        setIsStaking(true);
        try {
            const current = await getStakeInfo(account);
            if (current?.staked) {
                alert("You already have an active 50 PAS stake. Use Withdraw after the lock period.");
                return;
            }

            await stakeReputation();
            const info = await getStakeInfo(account);
            if (info) setStakeInfo(info);
            const stats = await getPoolStats();
            if (stats) setPoolStats(stats);
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Staking failed";
            alert(msg.includes("user rejected") ? "Transaction cancelled." : msg);
        } finally {
            setIsStaking(false);
        }
    };

    const handleUnstake = async () => {
        if (!account) return;
        setIsUnstaking(true);
        try {
            await unstake();
            setStakeInfo({ staked: false, amount: "0", since: 0 });
            const stats = await getPoolStats();
            if (stats) setPoolStats(stats);
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Unstaking failed";
            if (msg.includes("StakeLocked")) {
                alert("Stake is locked. You must wait 7 days before unstaking.");
            } else {
                alert(msg.includes("user rejected") ? "Transaction cancelled." : msg);
            }
        } finally {
            setIsUnstaking(false);
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

    const handleSubmitBreach = useCallback(async () => {
        if (!account || !breachForm.targetAddress || !breachForm.reason) return;
        if (breachForm.targetAddress === account) {
            alert("You cannot report yourself.");
            return;
        }

        setIsSubmittingBreach(true);
        setBreachSuccess(false);
        try {
            const res = await fetch("/api/breaches/report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reporterAddress: account,
                    targetAddress: breachForm.targetAddress,
                    reason: breachForm.reason,
                    description: breachForm.description || undefined,
                    evidence: breachForm.evidence || undefined,
                    contractHash: breachForm.contractHash || undefined,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setBreachSuccess(true);
                setBreachForm({ targetAddress: "", reason: "NON_DELIVERY", description: "", evidence: "", contractHash: "" });
                setTimeout(() => {
                    setShowBreachModal(false);
                    setBreachSuccess(false);
                }, 2000);
            } else {
                alert(data.error || "Failed to submit breach report.");
            }
        } catch (error) {
            console.error("Breach report submission error:", error);
            alert("Network error. Please try again.");
        } finally {
            setIsSubmittingBreach(false);
        }
    }, [account, breachForm]);

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
                    Connect MetaMask to access your decentralized identity and
                    reputation profile.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <section className="surface-card p-6">
                <p className="mono-label text-xs text-cyan-200">Identity and Reputation</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Professional Trust Profile</h2>
                <p className="mt-2 text-sm text-slate-300">
                    Manage DID verification, staking-backed reputation, and breach reporting from one control plane.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-3">
                        <p className="mono-label text-[11px] text-slate-400">Wallet</p>
                        <p className="mt-1 text-sm text-white font-medium">{account?.slice(0, 6)}...{account?.slice(-4)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-3">
                        <p className="mono-label text-[11px] text-slate-400">Verification</p>
                        <p className={`mt-1 text-sm font-medium ${evmVerified ? "text-emerald-400" : "text-yellow-400"}`}>
                            {evmVerified ? "On-Chain Verified" : "Pending Verification"}
                        </p>
                    </div>
                    <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-3">
                        <p className="mono-label text-[11px] text-slate-400">Stake Status</p>
                        <p className={`mt-1 text-sm font-medium ${stakeInfo?.staked ? "text-emerald-400" : "text-slate-300"}`}>
                            {stakeInfo?.staked ? "Active" : "Not Staked"}
                        </p>
                    </div>
                </div>
            </section>

            {/* Identity Section */}
            <section className="surface-card p-6">
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

            {/* On-Chain Verification */}
            <section className="surface-card p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                    On-Chain Verification (Polkadot Hub)
                </h2>
                <div className="bg-gray-800/50 rounded-xl p-4">
                    {evmVerified ? (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-emerald-400 font-medium">Verified on Polkadot Hub</p>
                                <p className="text-gray-500 text-sm">Your address is verified on the DocuMate smart contract</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-yellow-400 font-medium">Not yet verified on-chain</p>
                                <p className="text-gray-500 text-sm">Verify your DID on the Polkadot Hub EVM contract</p>
                            </div>
                            <button
                                onClick={handleVerifyOnChain}
                                disabled={isVerifying}
                                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 text-sm font-medium"
                            >
                                {isVerifying ? "Verifying..." : "Verify DID"}
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* Connected Wallet */}
            <section className="surface-card p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                    Connected Wallet
                </h2>
                <div className="bg-gray-800/50 rounded-xl p-4">
                    <p className="text-gray-400 text-sm mb-1">MetaMask Account</p>
                    <code className="text-white text-sm break-all">
                        {account}
                    </code>
                </div>
            </section>

            {/* On-Chain Activity */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-white">
                            On-Chain Activity
                        </h2>
                        <p className="text-gray-400 text-sm">
                            Platform stats from the DocuMate smart contract
                        </p>
                    </div>
                    <button
                        onClick={fetchOnChainStats}
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
                {isLoadingReputation ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
                    </div>
                ) : platformStats ? (
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4">
                            <p className="text-2xl font-bold text-white">{platformStats.totalDocuments}</p>
                            <p className="text-sm text-gray-400">Documents On-Chain</p>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30 rounded-xl p-4">
                            <p className="text-2xl font-bold text-white">{platformStats.totalTransactions}</p>
                            <p className="text-sm text-gray-400">Transactions</p>
                        </div>
                        <div className="bg-gradient-to-br from-pink-500/20 to-orange-500/20 border border-pink-500/30 rounded-xl p-4">
                            <p className="text-2xl font-bold text-white">{platformStats.totalVolume} $DOCU</p>
                            <p className="text-sm text-gray-400">Total Volume</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-8 text-center">
                        <p className="text-gray-500">No on-chain activity yet. Start by verifying your DID and uploading documents.</p>
                    </div>
                )}
            </section>

            {/* Reputation Staking */}
            <section className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Reputation Staking
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">
                            Lock 50 PAS to back your reputation. Slashed if a breach is confirmed against you.
                        </p>
                    </div>
                </div>

                {stakeInfo?.staked ? (
                    <div className="space-y-4">
                        <div className="bg-gray-800/50 rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-emerald-400 font-medium">Reputation Staked</p>
                                    <p className="text-gray-500 text-sm">{stakeInfo.amount} PAS locked</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="bg-gray-800/80 rounded-lg p-3">
                                    <p className="text-gray-500">Staked Since</p>
                                    <p className="text-white font-medium">
                                        {stakeInfo.since > 0 ? new Date(stakeInfo.since * 1000).toLocaleDateString() : "—"}
                                    </p>
                                </div>
                                <div className="bg-gray-800/80 rounded-lg p-3">
                                    <p className="text-gray-500">Unlock Date</p>
                                    <p className="text-white font-medium">
                                        {stakeInfo.since > 0 ? new Date((stakeInfo.since + 7 * 86400) * 1000).toLocaleDateString() : "—"}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleUnstake}
                            disabled={isUnstaking}
                            className="w-full py-3 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
                        >
                            {isUnstaking ? "Unstaking..." : "Withdraw Stake"}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-gray-800/50 rounded-xl p-4 space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                                <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-gray-400">Stake <span className="text-white font-semibold">50 PAS</span> to show you stand behind your work</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-gray-400">7-day minimum lock period</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <span className="text-gray-400">Stake is <span className="text-red-400 font-semibold">slashed</span> if a breach is confirmed against you</span>
                            </div>
                        </div>
                        <button
                            onClick={handleStake}
                            disabled={isStaking}
                            className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:opacity-90 transition-opacity font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isStaking ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Staking...
                                </>
                            ) : (
                                "Stake 50 PAS"
                            )}
                        </button>
                    </div>
                )}

                {/* Pool Stats */}
                {poolStats && (
                    <div className="mt-4 pt-4 border-t border-gray-700/30 grid grid-cols-3 gap-3 text-center text-sm">
                        <div>
                            <p className="text-white font-semibold">{poolStats.totalStaked} PAS</p>
                            <p className="text-gray-500">Total Staked</p>
                        </div>
                        <div>
                            <p className="text-red-400 font-semibold">{poolStats.totalSlashed} PAS</p>
                            <p className="text-gray-500">Total Slashed</p>
                        </div>
                        <div>
                            <p className="text-white font-semibold">{poolStats.stakerCount}</p>
                            <p className="text-gray-500">Active Stakers</p>
                        </div>
                    </div>
                )}
            </section>

            {/* Report Breach Section */}
            <section className="surface-card p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-white mb-1">Report a Breach</h2>
                        <p className="text-gray-400 text-sm">
                            Had a bad experience? Report a breach of contract to protect the community.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowBreachModal(true)}
                        className="px-5 py-2.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/30 hover:text-red-300 transition-all font-medium text-sm flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        Report Breach
                    </button>
                </div>
            </section>

            {/* Breach Report Modal */}
            {showBreachModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-gray-700/50 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        {breachSuccess ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">Report Submitted</h3>
                                <p className="text-gray-400">Our admin team will investigate and take action.</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-semibold text-white">Report Breach of Contract</h3>
                                    <button
                                        onClick={() => setShowBreachModal(false)}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">Target Wallet Address *</label>
                                        <input
                                            type="text"
                                            value={breachForm.targetAddress}
                                            onChange={(e) => setBreachForm({ ...breachForm, targetAddress: e.target.value })}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors font-mono text-sm"
                                            placeholder="0x..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">Reason *</label>
                                        <div className="space-y-2">
                                            {BREACH_REASONS.map((r) => (
                                                <label
                                                    key={r.value}
                                                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                                                        breachForm.reason === r.value
                                                            ? "border-red-500/50 bg-red-500/10"
                                                            : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="breachReason"
                                                        value={r.value}
                                                        checked={breachForm.reason === r.value}
                                                        onChange={(e) => setBreachForm({ ...breachForm, reason: e.target.value })}
                                                        className="mt-0.5 accent-red-500"
                                                    />
                                                    <div>
                                                        <p className="text-white text-sm font-medium">{r.label}</p>
                                                        <p className="text-gray-500 text-xs">{r.desc}</p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">Description</label>
                                        <textarea
                                            value={breachForm.description}
                                            onChange={(e) => setBreachForm({ ...breachForm, description: e.target.value })}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors resize-none"
                                            rows={3}
                                            placeholder="Describe the breach in detail..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">Evidence URL</label>
                                        <input
                                            type="text"
                                            value={breachForm.evidence}
                                            onChange={(e) => setBreachForm({ ...breachForm, evidence: e.target.value })}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors text-sm"
                                            placeholder="https://... or IPFS hash"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">Contract / TX Hash</label>
                                        <input
                                            type="text"
                                            value={breachForm.contractHash}
                                            onChange={(e) => setBreachForm({ ...breachForm, contractHash: e.target.value })}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors font-mono text-sm"
                                            placeholder="0x..."
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={handleSubmitBreach}
                                        disabled={isSubmittingBreach || !breachForm.targetAddress || !breachForm.reason}
                                        className="flex-1 px-6 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmittingBreach ? "Submitting..." : "Submit Report"}
                                    </button>
                                    <button
                                        onClick={() => setShowBreachModal(false)}
                                        className="px-6 py-3 bg-gray-800 text-gray-400 rounded-xl hover:text-white hover:bg-gray-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
