"use client";

import { useCallback } from "react";
import { ethers } from "ethers";
import { STAKING_ABI, STAKING_CONTRACT_ADDRESS } from "@/config/DocuMateStakingABI";

type EthereumProvider = {
    isMetaMask?: boolean;
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    providers?: EthereumProvider[];
};

function getMetaMaskProvider(): EthereumProvider | null {
    if (typeof window === "undefined" || !window.ethereum) return null;
    const injected = window.ethereum as unknown as EthereumProvider;

    if (Array.isArray(injected.providers) && injected.providers.length > 0) {
        return injected.providers.find((p) => p?.isMetaMask) ?? null;
    }

    return injected.isMetaMask ? injected : null;
}

function decodeStakingError(error: unknown): string {
    const err = error as { code?: string; data?: string; message?: string };
    const iface = new ethers.Interface(STAKING_ABI);

    if (typeof err?.data === "string") {
        try {
            const parsed = iface.parseError(err.data);
            switch (parsed?.name) {
                case "AlreadyStaked":
                    return "You already have an active 50 PAS stake.";
                case "StakeLocked":
                    return "Stake is still locked for 7 days before withdrawal.";
                case "InvalidAmount":
                    return "Stake must be exactly 50 PAS.";
                case "NotStaked":
                    return "No active stake found for this wallet.";
                default:
                    return parsed?.name || "Staking contract reverted.";
            }
        } catch {
            // fallback below
        }
    }

    if (err?.code === "CALL_EXCEPTION") {
        return "Transaction reverted by staking contract.";
    }

    return err?.message || "Staking transaction failed.";
}

export function useStakingContract() {
    const getReadContract = useCallback((): ethers.Contract | null => {
        const providerObject = getMetaMaskProvider();
        if (!providerObject) return null;
        if (STAKING_CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") return null;
        const provider = new ethers.BrowserProvider(providerObject as never);
        return new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, provider);
    }, []);

    const getWriteContract = useCallback(async (): Promise<ethers.Contract | null> => {
        const providerObject = getMetaMaskProvider();
        if (!providerObject) return null;
        if (STAKING_CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") return null;
        const provider = new ethers.BrowserProvider(providerObject as never);
        const signer = await provider.getSigner();
        return new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);
    }, []);

    const stakeReputation = useCallback(async () => {
        const contract = await getWriteContract();
        if (!contract) throw new Error("Staking contract not available");
        const stakeAmount = ethers.parseEther("50");
        try {
            const tx = await contract.stakeReputation({ value: stakeAmount });
            return tx.wait();
        } catch (error) {
            throw new Error(decodeStakingError(error));
        }
    }, [getWriteContract]);

    const unstake = useCallback(async () => {
        const contract = await getWriteContract();
        if (!contract) throw new Error("Staking contract not available");
        try {
            const tx = await contract.unstake();
            return tx.wait();
        } catch (error) {
            throw new Error(decodeStakingError(error));
        }
    }, [getWriteContract]);

    const slashStake = useCallback(async (userAddress: string, reason: string) => {
        const contract = await getWriteContract();
        if (!contract) throw new Error("Staking contract not available");
        const tx = await contract.slashStake(userAddress, reason);
        return tx.wait();
    }, [getWriteContract]);

    const getStakeInfo = useCallback(async (address: string) => {
        const contract = getReadContract();
        if (!contract) return null;
        try {
            const [staked, amount, since] = await contract.getStakeInfo(address);
            return {
                staked: staked as boolean,
                amount: ethers.formatEther(amount),
                since: Number(since),
            };
        } catch {
            return null;
        }
    }, [getReadContract]);

    const getPoolStats = useCallback(async () => {
        const contract = getReadContract();
        if (!contract) return null;
        try {
            const [staked, slashed, balance, count] = await contract.getPoolStats();
            return {
                totalStaked: ethers.formatEther(staked),
                totalSlashed: ethers.formatEther(slashed),
                poolBalance: ethers.formatEther(balance),
                stakerCount: Number(count),
            };
        } catch {
            return null;
        }
    }, [getReadContract]);

    return {
        stakeReputation,
        unstake,
        slashStake,
        getStakeInfo,
        getPoolStats,
    };
}
