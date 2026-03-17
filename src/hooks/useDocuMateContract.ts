"use client";

import { useCallback } from "react";
import { ethers } from "ethers";
import { DOCUMATE_ABI, CONTRACT_ADDRESS } from "@/config/DocuMateABI";

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

function decodeContractError(error: unknown): string {
    const err = error as { code?: string; data?: string; message?: string };
    const iface = new ethers.Interface(DOCUMATE_ABI);

    if (typeof err?.data === "string") {
        try {
            const parsed = iface.parseError(err.data);
            if (parsed?.name === "NotVerified") return "Wallet is not verified for marketplace transactions yet.";
            if (parsed?.name === "ZeroPayment") return "Transaction value must be greater than 0.";
            if (parsed?.name === "TransferFailed") return "Transfer failed during split execution.";
            return `${parsed?.name ?? "ContractError"}`;
        } catch {
            // fall through to generic mapping
        }
    }

    if (err?.code === "CALL_EXCEPTION") {
        return "Contract call reverted. Please verify wallet DID status and contract configuration.";
    }

    return err?.message || "Contract transaction failed.";
}

export function useDocuMateContract() {
    const getReadContract = useCallback((): ethers.Contract | null => {
        const providerObject = getMetaMaskProvider();
        if (!providerObject) return null;
        const provider = new ethers.BrowserProvider(providerObject as never);
        return new ethers.Contract(CONTRACT_ADDRESS, DOCUMATE_ABI, provider);
    }, []);

    const getWriteContract = useCallback(async (): Promise<ethers.Contract | null> => {
        const providerObject = getMetaMaskProvider();
        if (!providerObject) return null;
        const provider = new ethers.BrowserProvider(providerObject as never);
        const signer = await provider.getSigner();
        return new ethers.Contract(CONTRACT_ADDRESS, DOCUMATE_ABI, signer);
    }, []);

    const checkVerified = useCallback(async (address: string): Promise<boolean> => {
        const contract = getReadContract();
        if (!contract) return false;
        try {
            return await contract.isVerified(address);
        } catch {
            return false;
        }
    }, [getReadContract]);

    const uploadDocument = useCallback(async (ipfsHash: string) => {
        const contract = await getWriteContract();
        if (!contract) throw new Error("Contract not available");
        const tx = await contract.uploadDocument(ipfsHash);
        return tx.wait();
    }, [getWriteContract]);

    const executeTransaction = useCallback(async (creatorAddress: string, amountInEther: string) => {
        const contract = await getWriteContract();
        if (!contract) throw new Error("Contract not available");
        const value = ethers.parseEther(amountInEther);
        try {
            // DocuMateMarketplace uses purchase(address); DocuMate.sol uses executeTransaction(address).
            let tx;
            if (typeof (contract as unknown as { purchase?: unknown }).purchase === "function") {
                tx = await contract.purchase(creatorAddress, { value });
            } else {
                tx = await contract.executeTransaction(creatorAddress, { value });
            }
            return tx.wait();
        } catch (error) {
            throw new Error(decodeContractError(error));
        }
    }, [getWriteContract]);

    const verifyDID = useCallback(async (userAddress: string) => {
        const contract = await getWriteContract();
        if (!contract) throw new Error("Contract not available");
        const tx = await contract.mockKiltPrecompile(userAddress);
        return tx.wait();
    }, [getWriteContract]);

    const getPlatformStats = useCallback(async () => {
        const contract = getReadContract();
        if (!contract) return null;
        try {
            // DocuMate.sol path
            if (typeof (contract as unknown as { getPlatformStats?: unknown }).getPlatformStats === "function") {
                const [txCount, volume] = await contract.getPlatformStats();
                const docCount = await contract.getDocumentCount();
                return {
                    totalDocuments: Number(docCount),
                    totalTransactions: Number(txCount),
                    totalVolume: ethers.formatEther(volume),
                };
            }

            // DocuMateMarketplace.sol path
            const totalVolume = await contract.totalVolume();
            return {
                totalDocuments: 0,
                totalTransactions: 0,
                totalVolume: ethers.formatEther(totalVolume),
            };
        } catch {
            return null;
        }
    }, [getReadContract]);

    const getUserDocuments = useCallback(async (address: string) => {
        const contract = getReadContract();
        if (!contract) return [];
        try {
            return await contract.getUserDocuments(address);
        } catch {
            return [];
        }
    }, [getReadContract]);

    const calculateSplit = useCallback(async (amountInEther: string) => {
        const contract = getReadContract();
        if (!contract) return null;
        try {
            const value = ethers.parseEther(amountInEther);
            const [creator, treasury, staking] = await contract.calculateSplit(value);
            return {
                creator: ethers.formatEther(creator),
                treasury: ethers.formatEther(treasury),
                staking: ethers.formatEther(staking),
            };
        } catch {
            return null;
        }
    }, [getReadContract]);

    return {
        getReadContract,
        getWriteContract,
        checkVerified,
        uploadDocument,
        executeTransaction,
        verifyDID,
        getPlatformStats,
        getUserDocuments,
        calculateSplit,
    };
}
