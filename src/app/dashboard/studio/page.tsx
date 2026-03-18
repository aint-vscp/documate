/**
 * Template Studio - Google-Docs-style rich editor + mint flow
 */
"use client";

import {
    useState,
    useCallback,
    useRef,
    useEffect,
    type ChangeEvent,
    type MouseEvent,
    type DragEvent,
} from "react";
import { useIsEVMConnected, useEVMAccount } from "@/hooks/useEVMWallet";
import { useDocuMateContract } from "@/hooks/useDocuMateContract";
import { WalletConnect } from "@/components/chain";
import { RevenueSplit } from "@/components/market";
import Link from "next/link";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, DOCUMATE_ABI } from "@/config/DocuMateABI";

type MintingStep = "create" | "preview" | "pricing" | "mint" | "success";
type TemplateCategory = "LEGAL" | "CREATIVE" | "ENGINEERING";

interface Placeholder {
    key: string;
    label: string;
    type: "text" | "date" | "number" | "address";
    required: boolean;
}

interface TemplateForm {
    title: string;
    description: string;
    category: TemplateCategory;
    content: string;
    placeholders: Placeholder[];
    price: number;
    requestVerification: boolean;
}

interface DragState {
    active: boolean;
    imgId: string;
    startX: number;
    startY: number;
    origLeft: number;
    origTop: number;
}

const CATEGORY_OPTIONS: { id: TemplateCategory; label: string; code: string; color: string }[] = [
    { id: "LEGAL",       label: "Legal",       code: "LGL", color: "from-blue-500 to-indigo-600" },
    { id: "CREATIVE",    label: "Creative",    code: "CR8", color: "from-orange-500 to-amber-500" },
    { id: "ENGINEERING", label: "Engineering", code: "ENG", color: "from-green-500 to-emerald-600" },
];

const MINTING_FEE     = 5;
const VERIFICATION_FEE = 50;

function execCmd(cmd: string, value?: string) {
    document.execCommand(cmd, false, value ?? undefined);
}

export default function TemplateStudioPage() {
    const isConnected = useIsEVMConnected();
    const account     = useEVMAccount();
    const { checkWalletVerificationForActions } = useDocuMateContract();

    const [step, setStep]                         = useState<MintingStep>("create");
    const [isProcessing, setIsProcessing]         = useState(false);
    const [mintError, setMintError]               = useState<string | null>(null);
    const [mintedTemplateId, setMintedTemplateId] = useState<string | null>(null);
    const [mintPaymentTx, setMintPaymentTx]       = useState<string | null>(null);
    const [canMintOnChain, setCanMintOnChain] = useState(false);
    const [verificationPrompt, setVerificationPrompt] = useState<string | null>(null);

    const [form, setForm] = useState<TemplateForm>({
        title: "", description: "", category: "LEGAL",
        content: "", placeholders: [], price: 50, requestVerification: false,
    });

    const [newPlaceholder, setNewPlaceholder] = useState<Placeholder>({
        key: "", label: "", type: "text", required: true,
    });

    const editorRef     = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const dragRef       = useRef<DragState | null>(null);
    const placeholderDetectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const extractPlaceholders = useCallback((html: string): Placeholder[] => {
        const regex = /\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g;
        const detected = new Map<string, Placeholder>();

        for (const match of html.matchAll(regex)) {
            const rawKey = match[1]?.trim();
            if (!rawKey) continue;
            const key = rawKey.toLowerCase();

            if (!detected.has(key)) {
                detected.set(key, {
                    key,
                    label: key.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
                    type: "text",
                    required: true,
                });
            }
        }

        return [...detected.values()];
    }, []);

    const mergeDetectedPlaceholders = useCallback((html: string) => {
        const detected = extractPlaceholders(html);
        if (detected.length === 0) return;

        setForm(prev => {
            const existingKeys = new Set(prev.placeholders.map(p => p.key));
            const newOnes = detected.filter(p => !existingKeys.has(p.key));
            if (newOnes.length === 0) return prev;
            return { ...prev, placeholders: [...prev.placeholders, ...newOnes] };
        });
    }, [extractPlaceholders]);

    const syncContent = useCallback(() => {
        if (!editorRef.current) return;

        const html = editorRef.current.innerHTML;

        // Keep content state in sync immediately.
        setForm(prev => (prev.content === html ? prev : { ...prev, content: html }));

        // Debounce placeholder detection until user pauses typing.
        if (placeholderDetectTimeoutRef.current) {
            clearTimeout(placeholderDetectTimeoutRef.current);
        }
        placeholderDetectTimeoutRef.current = setTimeout(() => {
            mergeDetectedPlaceholders(html);
            placeholderDetectTimeoutRef.current = null;
        }, 500);
    }, [mergeDetectedPlaceholders]);

    useEffect(() => {
        if (step === "create" && editorRef.current) {
            if (editorRef.current.innerHTML !== form.content) {
                editorRef.current.innerHTML = form.content || "";
            }

            // Keep variable fields synced even when loading pre-existing content.
            mergeDetectedPlaceholders(editorRef.current.innerHTML);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, form.content, mergeDetectedPlaceholders]);

    useEffect(() => {
        return () => {
            if (placeholderDetectTimeoutRef.current) {
                clearTimeout(placeholderDetectTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        const refreshVerification = async () => {
            if (!account) {
                if (isMounted) {
                    setCanMintOnChain(false);
                    setVerificationPrompt(null);
                }
                return;
            }

            const result = await checkWalletVerificationForActions(account);
            if (!isMounted) return;
            setCanMintOnChain(result.verified);
            setVerificationPrompt(result.verified ? null : (result.message || null));
        };

        void refreshVerification();

        return () => {
            isMounted = false;
        };
    }, [account, checkWalletVerificationForActions]);

    const tbBold      = () => { execCmd("bold");                     editorRef.current?.focus(); };
    const tbItalic    = () => { execCmd("italic");                   editorRef.current?.focus(); };
    const tbUnder     = () => { execCmd("underline");                editorRef.current?.focus(); };
    const tbH1        = () => { execCmd("formatBlock", "<h1>");      editorRef.current?.focus(); };
    const tbH2        = () => { execCmd("formatBlock", "<h2>");      editorRef.current?.focus(); };
    const tbPara      = () => { execCmd("formatBlock", "<p>");       editorRef.current?.focus(); };
    const tbUL        = () => { execCmd("insertUnorderedList");      editorRef.current?.focus(); };
    const tbOL        = () => { execCmd("insertOrderedList");        editorRef.current?.focus(); };
    const tbAlignL    = () => { execCmd("justifyLeft");              editorRef.current?.focus(); };
    const tbAlignC    = () => { execCmd("justifyCenter");            editorRef.current?.focus(); };
    const tbHR        = () => {
        execCmd("insertHTML", "<hr style='border-color:#333;margin:12px 0;' /><p><br></p>");
        editorRef.current?.focus();
    };

    const insertPlaceholderTag = useCallback((key: string) => {
        editorRef.current?.focus();
        execCmd("insertHTML", `<span style="background:#1e3a5f;color:#67e8f9;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:0.85em;">{{${key}}}</span>&nbsp;`);
        syncContent();
    }, [syncContent]);

    const handleImageUpload = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setMintError("Only image files can be inserted.");
            if (event.target) event.target.value = "";
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setMintError("Image too large (max 5 MB).");
            if (event.target) event.target.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const src = typeof reader.result === "string" ? reader.result : "";
            if (!src) { setMintError("Failed to read image."); return; }

            const id = `studio-img-${Date.now()}`;
            const html = `<img id="${id}" src="${src}" alt="${file.name}" data-draggable="true" style="max-width:320px;max-height:240px;cursor:grab;display:inline-block;margin:4px;border-radius:6px;border:1px solid #333;" /><p><br></p>`;

            editorRef.current?.focus();
            execCmd("insertHTML", html);
            syncContent();
            setMintError(null);
        };
        reader.onerror = () => setMintError("Failed to read the selected image.");
        reader.readAsDataURL(file);
        if (event.target) event.target.value = "";
    }, [syncContent]);

    const handleEditorMouseDown = useCallback((e: MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        if (target.tagName !== "IMG" || !(target as HTMLImageElement).dataset.draggable) return;

        e.preventDefault();
        const img  = target as HTMLImageElement;
        const rect = img.getBoundingClientRect();

        img.style.position = "absolute";
        img.style.left     = `${rect.left + window.scrollX}px`;
        img.style.top      = `${rect.top  + window.scrollY}px`;
        img.style.cursor   = "grabbing";
        img.style.zIndex   = "100";

        dragRef.current = {
            active: true,
            imgId:  img.id,
            startX: e.clientX,
            startY: e.clientY,
            origLeft: parseFloat(img.style.left),
            origTop:  parseFloat(img.style.top),
        };
    }, []);

    useEffect(() => {
        const onMouseMove = (e: globalThis.MouseEvent) => {
            if (!dragRef.current?.active) return;
            const ds  = dragRef.current;
            const img = document.getElementById(ds.imgId) as HTMLImageElement | null;
            if (!img) return;
            img.style.left = `${ds.origLeft + (e.clientX - ds.startX)}px`;
            img.style.top  = `${ds.origTop  + (e.clientY - ds.startY)}px`;
        };
        const onMouseUp = () => {
            if (!dragRef.current?.active) return;
            const img = document.getElementById(dragRef.current.imgId) as HTMLImageElement | null;
            if (img) img.style.cursor = "grab";
            dragRef.current = null;
            syncContent();
        };
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup",   onMouseUp);
        return () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup",   onMouseUp);
        };
    }, [syncContent]);

    const handleEditorDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
        const file = e.dataTransfer.files?.[0];
        if (!file?.type.startsWith("image/")) return;
        e.preventDefault();
        const fakeEvt = { target: { files: [file], value: "" } } as unknown as ChangeEvent<HTMLInputElement>;
        handleImageUpload(fakeEvt);
    }, [handleImageUpload]);

    const detectPlaceholders = useCallback(() => {
        const html = editorRef.current?.innerHTML ?? form.content;
        mergeDetectedPlaceholders(html);
    }, [form.content, mergeDetectedPlaceholders]);

    const addPlaceholder = useCallback(() => {
        if (!newPlaceholder.key || !newPlaceholder.label) return;
        setForm(prev => ({ ...prev, placeholders: [...prev.placeholders, { ...newPlaceholder }] }));
        setNewPlaceholder({ key: "", label: "", type: "text", required: true });
    }, [newPlaceholder]);

    const removePlaceholder = useCallback((key: string) => {
        setForm(prev => ({ ...prev, placeholders: prev.placeholders.filter(p => p.key !== key) }));
    }, []);

    const totalCost = MINTING_FEE + (form.requestVerification ? VERIFICATION_FEE : 0);

    const handleMint = async () => {
        if (!account) return;
        setIsProcessing(true);
        setMintError(null);
        setMintPaymentTx(null);

        try {
            const verification = await checkWalletVerificationForActions(account);
            if (!verification.verified) {
                throw new Error(verification.message || "You need to verify your identity before minting. Connect your KILT DID on Polkadot Hub.");
            }

            if (!window.ethereum) {
                throw new Error("MetaMask provider unavailable.");
            }

            // Pay minting fee on-chain before template creation.
            const provider = new ethers.BrowserProvider(window.ethereum as never);
            const signer = await provider.getSigner();
            const readContract = new ethers.Contract(CONTRACT_ADDRESS, DOCUMATE_ABI, provider);

            let treasuryAddress: string;
            try {
                treasuryAddress = await readContract.treasury();
            } catch {
                throw new Error("Unable to resolve treasury wallet from contract.");
            }

            if (!/^0x[a-fA-F0-9]{40}$/.test(treasuryAddress)) {
                throw new Error("Contract treasury address is invalid.");
            }

            const feeInPas = totalCost / 1000;
            const paymentTx = await signer.sendTransaction({
                to: treasuryAddress,
                value: ethers.parseEther(feeInPas.toFixed(6)),
            });
            const paymentReceipt = await paymentTx.wait();
            const paymentTxHash = paymentReceipt?.hash || paymentTx.hash;
            if (!paymentTxHash) {
                throw new Error("Mint fee payment did not return a transaction hash.");
            }

            setMintPaymentTx(paymentTxHash);

            const mintResponse = await fetch("/api/market/mint", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: form.title,
                    description: form.description,
                    category: form.category,
                    content: form.content,
                    price: form.price,
                    placeholders: form.placeholders,
                    creatorAddress: account,
                    paymentTxHash,
                    mintFeeDocu: totalCost,
                }),
            });
            const mintData = await mintResponse.json();
            if (!mintData.success) throw new Error(mintData.error || "Minting failed");

            const templateId = mintData.data.templateId;
            setMintedTemplateId(templateId);

            if (form.requestVerification) {
                await fetch("/api/verification/submit", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        templateId,
                        creatorAddress: account,
                        feePaid: VERIFICATION_FEE,
                        paymentTx: paymentTxHash,
                    }),
                });
            }

            setStep("success");
        } catch (error) {
            setMintError(error instanceof Error ? error.message : "Minting failed.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isConnected) {
        return (
            <div className="w-full min-h-[calc(100vh-10rem)] flex items-center justify-center p-6">
                <div className="surface-card text-center w-full max-w-2xl p-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Template Studio</h1>
                    <p className="text-white/40 mb-6">Connect your wallet to create and mint templates.</p>
                    <WalletConnect />
                </div>
            </div>
        );
    }

    const TB = ({ label, onClick }: { label: string; onClick: () => void }) => (
        <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onClick(); }}
            className="px-2.5 py-1 text-xs font-medium text-white/60 hover:text-white hover:bg-white/[0.07] rounded transition-colors border border-transparent hover:border-white/[0.08]"
        >
            {label}
        </button>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/dashboard/market" className="text-xs text-white/35 hover:text-white flex items-center gap-1.5 mb-2 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Market
                    </Link>
                    <h1 className="text-2xl font-bold text-white">Template Studio</h1>
                    <p className="text-white/35 text-sm mt-0.5">Create and mint your templates as NFTs</p>
                </div>
                <div className="hidden md:flex items-center gap-1">
                    {(["create","preview","pricing","mint","success"] as MintingStep[]).map((s, i) => {
                        const order = ["create","preview","pricing","mint","success"];
                        const isActive = step === s;
                        const isPast   = order.indexOf(step) > i;
                        return (
                            <div key={s} className="flex items-center">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                                    isActive ? "bg-cyan-400 text-black" : isPast ? "bg-white/10 text-white/40" : "bg-white/[0.04] text-white/20"
                                }`}>
                                    {isPast ? "?" : i + 1}
                                </div>
                                {i < 4 && <div className={`w-6 h-px mx-1 ${isPast ? "bg-cyan-400/50" : "bg-white/[0.07]"}`} />}
                            </div>
                        );
                    })}
                </div>
            </div>

            {step === "create" && (
                <div className="space-y-5">
                    <div className="surface-card p-5">
                        <h2 className="text-sm font-semibold text-white/60 mono-label mb-4">Basic Information</h2>
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                                placeholder="Template title, e.g. Professional NDA"
                                className="w-full bg-black border border-white/[0.08] rounded-lg px-4 py-2.5 text-white placeholder-white/20 focus:border-cyan-400/40 focus:outline-none text-sm"
                            />
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                                placeholder="Describe what this template is for..."
                                rows={2}
                                className="w-full bg-black border border-white/[0.08] rounded-lg px-4 py-2.5 text-white placeholder-white/20 focus:border-cyan-400/40 focus:outline-none text-sm resize-none"
                            />
                            <div className="grid grid-cols-3 gap-2">
                                {CATEGORY_OPTIONS.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setForm(p => ({ ...p, category: cat.id }))}
                                        className={`flex items-center gap-2 p-3 rounded-lg border transition-all text-sm ${
                                            form.category === cat.id
                                                ? `bg-gradient-to-br ${cat.color} border-transparent text-white`
                                                : "border-white/[0.07] text-white/40 hover:border-white/20 hover:text-white/70"
                                        }`}
                                    >
                                        <span className="text-xs font-bold font-mono">{cat.code}</span>
                                        <span>{cat.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="surface-card overflow-hidden">
                        <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-white/[0.06] bg-white/[0.01]">
                            <TB label="B"        onClick={tbBold} />
                            <TB label="I"        onClick={tbItalic} />
                            <TB label="U"        onClick={tbUnder} />
                            <div className="w-px h-4 bg-white/[0.1] mx-1" />
                            <TB label="H1"       onClick={tbH1} />
                            <TB label="H2"       onClick={tbH2} />
                            <TB label="Para"     onClick={tbPara} />
                            <div className="w-px h-4 bg-white/[0.1] mx-1" />
                            <TB label="Bullets"  onClick={tbUL} />
                            <TB label="Numbers"  onClick={tbOL} />
                            <div className="w-px h-4 bg-white/[0.1] mx-1" />
                            <TB label="Left"     onClick={tbAlignL} />
                            <TB label="Center"   onClick={tbAlignC} />
                            <TB label="Rule"     onClick={tbHR} />
                            <div className="w-px h-4 bg-white/[0.1] mx-1" />
                            <button
                                type="button"
                                onMouseDown={(e) => { e.preventDefault(); imageInputRef.current?.click(); }}
                                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-cyan-400 hover:text-white hover:bg-white/[0.07] rounded border border-transparent hover:border-white/[0.08] transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Image
                            </button>
                            <div className="flex-1" />
                            <button
                                type="button"
                                onMouseDown={(e) => { e.preventDefault(); detectPlaceholders(); }}
                                className="px-2.5 py-1 text-xs text-cyan-400/70 hover:text-cyan-300 transition-colors"
                            >
                                Detect {"{{"} vars {"}}"}
                            </button>
                        </div>

                        {form.placeholders.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 px-4 py-2 bg-white/[0.01] border-b border-white/[0.05]">
                                <span className="text-[10px] text-white/20 mono-label self-center mr-1">insert:</span>
                                {form.placeholders.map(p => (
                                    <button
                                        key={p.key}
                                        type="button"
                                        onMouseDown={(e) => { e.preventDefault(); insertPlaceholderTag(p.key); }}
                                        className="text-[11px] px-2 py-0.5 rounded bg-cyan-400/10 border border-cyan-400/20 text-cyan-300 hover:bg-cyan-400/20 transition-colors font-mono"
                                    >
                                        {`{{${p.key}}}`}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div
                            ref={editorRef}
                            contentEditable
                            suppressContentEditableWarning
                            onInput={syncContent}
                            onMouseDown={handleEditorMouseDown}
                            onDrop={handleEditorDrop}
                            onDragOver={(e) => e.preventDefault()}
                            data-placeholder="Start writing your template... Use {{placeholder}} for variable fields, or drag an image in."
                            className="relative min-h-[420px] p-8 text-white/85 text-sm leading-7 focus:outline-none
                                [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:mb-3 [&_h1]:mt-5
                                [&_h2]:text-xl  [&_h2]:font-semibold [&_h2]:text-white/90 [&_h2]:mb-2 [&_h2]:mt-4
                                [&_p]:text-white/75 [&_p]:mb-1
                                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-white/70
                                [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:text-white/70
                                [&_hr]:border-white/10 [&_hr]:my-4
                                empty:before:content-[attr(data-placeholder)] empty:before:text-white/20 empty:before:pointer-events-none"
                        />

                        <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            aria-label="Upload image"
                            title="Upload image"
                            className="hidden"
                        />
                    </div>

                    {mintError && <p className="text-red-400 text-sm px-1">{mintError}</p>}

                    <div className="surface-card p-5">
                        <h2 className="text-sm font-semibold text-white/60 mono-label mb-4">Variable Fields</h2>
                        {form.placeholders.length > 0 && (
                            <div className="mb-3 space-y-1.5">
                                {form.placeholders.map((p) => (
                                    <div key={p.key} className="flex items-center justify-between px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                                        <div className="flex items-center gap-3">
                                            <code className="text-xs text-cyan-300 font-mono">{`{{${p.key}}}`}</code>
                                            <span className="text-sm text-white/60">{p.label}</span>
                                            <span className="text-xs text-white/20 px-1.5 py-0.5 bg-white/[0.04] rounded">{p.type}</span>
                                        </div>
                                        <button
                                            onClick={() => removePlaceholder(p.key)}
                                            aria-label={`Remove placeholder ${p.key}`}
                                            title={`Remove placeholder ${p.key}`}
                                            className="text-white/20 hover:text-red-400 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex items-end gap-2">
                            <div className="flex-1">
                                <label className="block text-xs text-white/25 mb-1">Key</label>
                                <input
                                    type="text"
                                    value={newPlaceholder.key}
                                    onChange={(e) => setNewPlaceholder(p => ({ ...p, key: e.target.value.toLowerCase().replace(/\s/g, "_") }))}
                                    placeholder="client_name"
                                    className="w-full bg-black border border-white/[0.08] rounded-md px-3 py-2 text-white text-xs focus:border-cyan-400/40 focus:outline-none"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs text-white/25 mb-1">Label</label>
                                <input
                                    type="text"
                                    value={newPlaceholder.label}
                                    onChange={(e) => setNewPlaceholder(p => ({ ...p, label: e.target.value }))}
                                    placeholder="Client Name"
                                    className="w-full bg-black border border-white/[0.08] rounded-md px-3 py-2 text-white text-xs focus:border-cyan-400/40 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-white/25 mb-1">Type</label>
                                <select
                                    value={newPlaceholder.type}
                                    onChange={(e) => setNewPlaceholder(p => ({ ...p, type: e.target.value as Placeholder["type"] }))}
                                    aria-label="Placeholder type"
                                    title="Placeholder type"
                                    className="bg-black border border-white/[0.08] rounded-md px-3 py-2 text-white text-xs focus:border-cyan-400/40 focus:outline-none"
                                >
                                    <option value="text">Text</option>
                                    <option value="date">Date</option>
                                    <option value="number">Number</option>
                                    <option value="address">Address</option>
                                </select>
                            </div>
                            <button
                                onClick={addPlaceholder}
                                disabled={!newPlaceholder.key || !newPlaceholder.label}
                                className="px-4 py-2 bg-cyan-400/10 text-cyan-400 rounded-md text-xs hover:bg-cyan-400/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-cyan-400/20"
                            >
                                Add
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => setStep("preview")}
                        disabled={!form.title || !form.content.replace(/<[^>]*>/g, "").trim()}
                        className="w-full py-3.5 bg-cyan-400 text-black font-semibold rounded-lg hover:bg-cyan-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Continue to Preview
                    </button>
                </div>
            )}

            {step === "preview" && (
                <div className="space-y-5">
                    <div className="surface-card p-6">
                        <h2 className="text-sm font-semibold text-white/60 mono-label mb-5">Preview</h2>
                        <div className="flex items-start gap-4 mb-5">
                            <div className={`w-12 h-12 bg-gradient-to-br ${CATEGORY_OPTIONS.find(c => c.id === form.category)?.color} rounded-lg flex items-center justify-center shrink-0`}>
                                <span className="text-xs font-bold text-white/80">{CATEGORY_OPTIONS.find(c => c.id === form.category)?.code}</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">{form.title}</h3>
                                <p className="text-white/40 text-sm mt-0.5">{form.description}</p>
                                <div className="flex gap-2 mt-2">
                                    <span className="text-xs px-2 py-0.5 rounded border border-white/[0.07] text-white/30">{form.category}</span>
                                    <span className="text-xs px-2 py-0.5 rounded border border-white/[0.07] text-white/30">{form.placeholders.length} vars</span>
                                </div>
                            </div>
                        </div>
                        <div
                            className="bg-black/40 border border-white/[0.06] rounded-lg p-6 max-h-[28rem] overflow-y-auto text-sm text-white/75 leading-7
                                [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:mb-2
                                [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white/90 [&_h2]:mb-1
                                [&_p]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
                                [&_hr]:border-white/10 [&_hr]:my-3
                                [&_img]:rounded [&_img]:max-h-56 [&_img]:w-auto [&_img]:my-2"
                            dangerouslySetInnerHTML={{ __html: form.content }}
                        />
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setStep("create")} className="flex-1 py-3 bg-white/[0.05] text-white rounded-lg hover:bg-white/[0.09] transition-colors text-sm font-medium border border-white/[0.07]">Back to Editor</button>
                        <button onClick={() => setStep("pricing")} className="flex-1 py-3 bg-cyan-400 text-black rounded-lg font-semibold hover:bg-cyan-300 transition-colors text-sm">Set Pricing</button>
                    </div>
                </div>
            )}

            {step === "pricing" && (
                <div className="space-y-5">
                    <div className="surface-card p-6">
                        <h2 className="text-sm font-semibold text-white/60 mono-label mb-5">Pricing</h2>
                        <label className="block text-xs text-white/30 mb-1.5">Listing Price ($DOCU)</label>
                        <div className="relative mb-6">
                            <input
                                type="number"
                                value={form.price}
                                onChange={(e) => setForm(p => ({ ...p, price: Math.max(1, parseInt(e.target.value) || 0) }))}
                                aria-label="Listing price in DOCU"
                                title="Listing price in DOCU"
                                className="w-full bg-black border border-white/[0.08] rounded-lg px-4 py-3.5 text-2xl font-bold text-white focus:border-cyan-400/40 focus:outline-none"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 text-sm">$DOCU</span>
                        </div>
                        <RevenueSplit price={form.price} detailed />
                    </div>
                    <div className="surface-card p-5">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.requestVerification}
                                onChange={(e) => setForm(p => ({ ...p, requestVerification: e.target.checked }))}
                                className="mt-0.5 w-4 h-4 accent-cyan-400"
                            />
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-white">Request Verification</span>
                                    <span className="neon-tag">+${VERIFICATION_FEE}</span>
                                </div>
                                <p className="text-xs text-white/35 mt-1">Verified templates sell 3-5x more.</p>
                            </div>
                        </label>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setStep("preview")} className="flex-1 py-3 bg-white/[0.05] text-white rounded-lg hover:bg-white/[0.09] border border-white/[0.07] text-sm font-medium">Back</button>
                        <button onClick={() => setStep("mint")} className="flex-1 py-3 bg-cyan-400 text-black rounded-lg font-semibold hover:bg-cyan-300 text-sm">Review &amp; Mint</button>
                    </div>
                </div>
            )}

            {step === "mint" && (
                <div className="space-y-5">
                    <div className="surface-card p-6 space-y-3">
                        <h2 className="text-sm font-semibold text-white/60 mono-label mb-4">Confirm Minting</h2>
                        {[
                            ["Template",            form.title],
                            ["Category",            form.category],
                            ["Listing Price",       `${form.price} $DOCU`],
                            ["Your Earnings (75%)", `${(form.price * 0.75).toFixed(2)} $DOCU / sale`],
                        ].map(([k, v]) => (
                            <div key={k} className="flex justify-between text-sm">
                                <span className="text-white/35">{k}</span>
                                <span className="text-white font-medium">{v}</span>
                            </div>
                        ))}
                        <div className="border-t border-white/[0.06] pt-3 space-y-2">
                            <div className="flex justify-between text-sm"><span className="text-white/35">Minting Fee</span><span className="text-white">{MINTING_FEE} $DOCU</span></div>
                            {form.requestVerification && (
                                <div className="flex justify-between text-sm"><span className="text-white/35">Verification Fee</span><span className="text-white">{VERIFICATION_FEE} $DOCU</span></div>
                            )}
                            <div className="flex justify-between text-base font-bold pt-1">
                                <span className="text-white">Total</span>
                                <span className="text-cyan-400">{totalCost} $DOCU</span>
                            </div>
                        </div>
                    </div>
                    {mintError && (
                        <div className="rounded-lg border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-400">{mintError}</div>
                    )}
                    {!canMintOnChain && verificationPrompt && (
                        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                            {verificationPrompt}
                        </div>
                    )}
                    {mintPaymentTx && (
                        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-xs text-emerald-300 font-mono">
                            Mint fee paid on-chain: {mintPaymentTx}
                        </div>
                    )}
                    <div className="flex gap-3">
                        <button onClick={() => setStep("pricing")} disabled={isProcessing} className="flex-1 py-3 bg-white/[0.05] text-white rounded-lg border border-white/[0.07] text-sm font-medium disabled:opacity-40">Back</button>
                        <button onClick={handleMint} disabled={isProcessing || !canMintOnChain} className="flex-1 py-3 bg-cyan-400 text-black rounded-lg font-semibold hover:bg-cyan-300 text-sm disabled:opacity-40 flex items-center justify-center gap-2">
                            {isProcessing ? (
                                <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Minting...</>
                            ) : `Mint Template (${totalCost} $DOCU)`}
                        </button>
                    </div>
                </div>
            )}

            {step === "success" && (
                <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-full bg-green-400/10 border border-green-400/20 flex items-center justify-center mx-auto mb-5">
                        <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-1">Template Minted</h1>
                    <p className="text-white/35 text-sm mb-2">Live on DocuMarket</p>
                    {mintedTemplateId && <p className="text-white/20 text-xs font-mono mb-8">ID: {mintedTemplateId}</p>}
                    <div className="flex gap-3 justify-center">
                        <Link href="/dashboard/market" className="subtle-button text-sm">View in Market</Link>
                        <button
                            onClick={() => {
                                setStep("create");
                                setForm({ title:"", description:"", category:"LEGAL", content:"", placeholders:[], price:50, requestVerification:false });
                                setMintedTemplateId(null);
                                if (editorRef.current) editorRef.current.innerHTML = "";
                            }}
                            className="brand-button text-sm"
                        >
                            Create Another
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
