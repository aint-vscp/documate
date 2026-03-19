"use client";

import { useCallback } from "react";
import { ethers } from "ethers";
import { DOCUMATE_ABI, CONTRACT_ADDRESS, POLKADOT_HUB_TESTNET } from "@/config/DocuMateABI";

const VERIFICATION_BLOCK_MESSAGE = "You need to verify your identity before minting. Connect your KILT DID on Polkadot Hub.";

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
        const rawMessage = err?.message ?? "";
        if (rawMessage.includes("require(false)") || rawMessage.includes("no data present")) {
            return "Contract call reverted. Contract method/config mismatch or DID verification may be missing.";
        }
        return "Contract call reverted. Please verify wallet DID status and contract configuration.";
    }

    return err?.message || "Contract transaction failed.";
}

async function contractHasSelector(contract: ethers.Contract, functionName: string): Promise<boolean> {
    const provider = contract.runner?.provider;
    if (!provider) return true;

    let selector: string;
    try {
        const fragment = contract.interface.getFunction(functionName);
        if (!fragment) return false;
        selector = fragment.selector.slice(2).toLowerCase();
    } catch {
        return false;
    }

    const address = String(contract.target);
    const code = await provider.getCode(address);
    if (!code || code === "0x") return false;
    return code.toLowerCase().includes(selector);
}

async function contractHasCode(contract: ethers.Contract): Promise<boolean> {
    const provider = contract.runner?.provider;
    if (!provider) return false;
    const address = String(contract.target);
    const code = await provider.getCode(address);
    return !!code && code !== "0x";
}

async function contractSupportsUploadDocument(contract: ethers.Contract): Promise<boolean> {
    const provider = contract.runner?.provider;
    if (!provider) return false;

    const address = String(contract.target);
    let data: string;

    try {
        data = contract.interface.encodeFunctionData("uploadDocument", ["documate-probe"]);
    } catch {
        return false;
    }

    try {
        await provider.call({ to: address, data });
        return true;
    } catch (error) {
        const err = error as { data?: string; info?: { error?: { data?: string } } };
        const revertData = typeof err?.data === "string"
            ? err.data
            : (typeof err?.info?.error?.data === "string" ? err.info.error.data : "");

        // Non-empty revert data indicates a matched function reverted in-contract.
        return revertData.length > 2;
    }
}

async function assertContractTargetChain(contract: ethers.Contract): Promise<void> {
    const provider = contract.runner?.provider;
    if (!provider) {
        throw new Error("Provider unavailable. Connect MetaMask on Polkadot Hub TestNet and retry.");
    }

    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);
    if (chainId !== POLKADOT_HUB_TESTNET.chainId) {
        throw new Error(
            `Wrong network. Switch MetaMask to ${POLKADOT_HUB_TESTNET.name} (chainId ${POLKADOT_HUB_TESTNET.chainId}) and retry.`
        );
    }
}

export function useDocuMateContract() {
    const getReadContract = useCallback((): ethers.Contract | null => {
        const providerObject = getMetaMaskProvider();
        if (!providerObject) return null;
        const hasConfiguredAddress = /^0x[a-fA-F0-9]{40}$/.test(CONTRACT_ADDRESS)
            && CONTRACT_ADDRESS.toLowerCase() !== "0x0000000000000000000000000000000000000000";
        if (!hasConfiguredAddress) return null;
        const provider = new ethers.BrowserProvider(providerObject as never);
        return new ethers.Contract(CONTRACT_ADDRESS, DOCUMATE_ABI, provider);
    }, []);

    const getWriteContract = useCallback(async (): Promise<ethers.Contract | null> => {
        const providerObject = getMetaMaskProvider();
        if (!providerObject) return null;
        const hasConfiguredAddress = /^0x[a-fA-F0-9]{40}$/.test(CONTRACT_ADDRESS)
            && CONTRACT_ADDRESS.toLowerCase() !== "0x0000000000000000000000000000000000000000";
        if (!hasConfiguredAddress) return null;
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

    const checkWalletVerificationForActions = useCallback(async (address: string): Promise<{ verified: boolean; message?: string }> => {
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
            return {
                verified: false,
                message: "Connect your wallet before attempting this action.",
            };
        }

        const verified = await checkVerified(address);
        if (!verified) {
            return {
                verified: false,
                message: VERIFICATION_BLOCK_MESSAGE,
            };
        }

        return { verified: true };
    }, [checkVerified]);

    const uploadDocument = useCallback(async (ipfsHash: string) => {
        const contract = await getWriteContract();
        if (!contract) throw new Error("Contract not available");
        await assertContractTargetChain(contract);

        const hasCode = await contractHasCode(contract);
        if (!hasCode) {
            throw new Error(`Document anchoring contract is misconfigured. No bytecode found at ${String(contract.target)}.`);
        }

        const hasUploadDocument = await contractSupportsUploadDocument(contract);
        if (!hasUploadDocument) {
            throw new Error(`Document anchoring contract is misconfigured. uploadDocument() is not available at ${String(contract.target)}.`);
        }

        try {
            const tx = await contract.uploadDocument(ipfsHash);
            return tx.wait();
        } catch (error) {
            throw new Error(decodeContractError(error));
        }
    }, [getWriteContract]);

    const canUploadDocument = useCallback(async (): Promise<boolean> => {
        const contract = await getWriteContract();
        if (!contract) return false;
        try {
            await assertContractTargetChain(contract);
            return contractHasSelector(contract, "uploadDocument");
        } catch {
            return false;
        }
    }, [getWriteContract]);

    const executeTransaction = useCallback(async (creatorAddress: string, amountInEther: string) => {
        const contract = await getWriteContract();
        if (!contract) throw new Error("Contract not available");
        await assertContractTargetChain(contract);

        if (!/^0x[a-fA-F0-9]{40}$/.test(creatorAddress)) {
            throw new Error("Template creator wallet is invalid or unavailable.");
        }

        const runner = contract.runner as unknown as { getAddress?: () => Promise<string> };
        const signerAddress = typeof runner?.getAddress === "function"
            ? (await runner.getAddress()).toLowerCase()
            : null;

        if (signerAddress && signerAddress === creatorAddress.toLowerCase()) {
            throw new Error("You cannot buy your own template NFT.");
        }

        if (signerAddress && typeof (contract as unknown as { isVerified?: unknown }).isVerified === "function") {
            const verification = await checkWalletVerificationForActions(signerAddress);
            if (!verification.verified) {
                throw new Error(verification.message || VERIFICATION_BLOCK_MESSAGE);
            }
        }

        const value = ethers.parseEther(amountInEther);
        try {
            // DocuMateMarketplace uses purchase(address); DocuMate.sol uses executeTransaction(address).
            let tx;
            const hasPurchase = await contractHasSelector(contract, "purchase");
            const hasExecuteTransaction = await contractHasSelector(contract, "executeTransaction");

            if (hasPurchase) {
                tx = await contract.purchase(creatorAddress, { value });
            } else if (hasExecuteTransaction) {
                tx = await contract.executeTransaction(creatorAddress, { value });
            } else {
                throw new Error("Marketplace contract is misconfigured. Neither purchase() nor executeTransaction() exists at configured address.");
            }
            return tx.wait();
        } catch (error) {
            throw new Error(decodeContractError(error));
        }
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
        checkWalletVerificationForActions,
        uploadDocument,
        canUploadDocument,
        executeTransaction,
        getPlatformStats,
        getUserDocuments,
        calculateSplit,
    };
}
