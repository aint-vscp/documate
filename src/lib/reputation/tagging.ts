/**
 * Dynamic Reputation Tagging Service
 * 
 * Derives professional reputation tags from on-chain activity:
 * - Analyzes POC-1 (Proof of Contract) metadata from transactions
 * - Assigns role tags based on contract types
 * - Tracks high-value transactions for badges
 * - Handles negative tags from breach confirmations
 * 
 * This mirrors the PRD requirement:
 * "System analyzes POC metadata to assign tags (e.g., 'Smart Contract Audit', 'Graphic Design')"
 */

// ============================================================
// TYPES
// ============================================================

export type TagSource = 
    | "POC_COMPLETION"    // Derived from completed POC transaction
    | "TEMPLATE_SALES"    // High volume seller
    | "VERIFICATION"      // Verified creator status
    | "MANUAL"            // Admin-assigned
    | "BREACH";           // Negative tag from breach

export interface ReputationTag {
    id: string;
    userId: string;
    tag: string;
    source: TagSource;
    txHash?: string;
    pocHash?: string;
    value?: number;
    issuedAt: Date;
    expiresAt?: Date;
}

export interface POCTransaction {
    hash: string;
    from: string;
    to: string;
    value: number;
    remark: string; // POC1:0xABC...:Type=ReactDev
    blockNumber: number;
    timestamp: Date;
}

export interface POCMetadata {
    standard: string;        // "POC1"
    contractHash: string;    // Hash of the contract PDF
    type?: string;           // Contract type (e.g., "ReactDev", "SmartContract")
    milestone?: number;      // Milestone number if applicable
}

// ============================================================
// TAG DERIVATION RULES
// ============================================================

/**
 * Maps contract types from POC to professional tags
 */
const TYPE_TO_TAG_MAP: Record<string, string> = {
    // Development
    "ReactDev": "React Developer",
    "SmartContract": "Smart Contract Dev",
    "SolidityDev": "Solidity Developer",
    "RustDev": "Rust Developer",
    "Frontend": "Frontend Developer",
    "Backend": "Backend Developer",
    "FullStack": "Full Stack Developer",
    "Mobile": "Mobile Developer",
    "Web3": "Web3 Developer",
    
    // Design
    "GraphicDesign": "Graphic Designer",
    "UIDesign": "UI Designer",
    "UXDesign": "UX Designer",
    "BrandDesign": "Brand Designer",
    "NFTArt": "NFT Artist",
    
    // Professional Services
    "Legal": "Legal Expert",
    "Audit": "Smart Contract Auditor",
    "Consulting": "Consultant",
    "Marketing": "Marketing Specialist",
    "ContentWriting": "Content Writer",
    "Translation": "Translator",
    
    // Other
    "Other": "Freelancer",
};

/**
 * Value thresholds for badges (in DOCU)
 */
const VALUE_BADGES = {
    HIGH_VALUE_PRO: 10000,      // $10k+ contract value
    PREMIUM_FREELANCER: 5000,   // $5k+ contract value
    RISING_TALENT: 1000,        // $1k+ contract value
} as const;

/**
 * Sales volume thresholds for seller badges
 */
const SALES_BADGES = {
    TOP_SELLER: 100,       // 100+ sales
    POWER_SELLER: 50,      // 50+ sales
    ESTABLISHED: 10,       // 10+ sales
} as const;

// ============================================================
// SERVICE CLASS
// ============================================================

export class ReputationTaggingService {
    /**
     * Parse POC-1 remark from transaction
     * Format: POC1:<contractHash>:Type=<type>[:Milestone=<n>]
     */
    parsePOCRemark(remark: string): POCMetadata | null {
        if (!remark.startsWith("POC1:")) {
            return null;
        }

        try {
            const parts = remark.split(":");
            if (parts.length < 2) return null;

            const metadata: POCMetadata = {
                standard: parts[0],
                contractHash: parts[1],
            };

            // Parse additional key=value pairs
            for (let i = 2; i < parts.length; i++) {
                const [key, value] = parts[i].split("=");
                if (key === "Type") {
                    metadata.type = value;
                } else if (key === "Milestone") {
                    metadata.milestone = parseInt(value, 10);
                }
            }

            return metadata;
        } catch {
            return null;
        }
    }

    /**
     * Derive tags from a POC transaction
     */
    deriveTagsFromPOC(transaction: POCTransaction): ReputationTag[] {
        const tags: ReputationTag[] = [];
        const metadata = this.parsePOCRemark(transaction.remark);

        if (!metadata) return tags;

        // 1. Role tag based on contract type
        if (metadata.type && TYPE_TO_TAG_MAP[metadata.type]) {
            tags.push({
                id: `tag_${Date.now()}_role`,
                userId: transaction.to, // Freelancer/recipient
                tag: TYPE_TO_TAG_MAP[metadata.type],
                source: "POC_COMPLETION",
                txHash: transaction.hash,
                pocHash: metadata.contractHash,
                value: transaction.value,
                issuedAt: transaction.timestamp,
            });
        }

        // 2. Value-based badges
        if (transaction.value >= VALUE_BADGES.HIGH_VALUE_PRO) {
            tags.push({
                id: `tag_${Date.now()}_hvp`,
                userId: transaction.to,
                tag: "High Value Pro",
                source: "POC_COMPLETION",
                txHash: transaction.hash,
                value: transaction.value,
                issuedAt: transaction.timestamp,
            });
        } else if (transaction.value >= VALUE_BADGES.PREMIUM_FREELANCER) {
            tags.push({
                id: `tag_${Date.now()}_pf`,
                userId: transaction.to,
                tag: "Premium Freelancer",
                source: "POC_COMPLETION",
                txHash: transaction.hash,
                value: transaction.value,
                issuedAt: transaction.timestamp,
            });
        } else if (transaction.value >= VALUE_BADGES.RISING_TALENT) {
            tags.push({
                id: `tag_${Date.now()}_rt`,
                userId: transaction.to,
                tag: "Rising Talent",
                source: "POC_COMPLETION",
                txHash: transaction.hash,
                value: transaction.value,
                issuedAt: transaction.timestamp,
            });
        }

        return tags;
    }

    /**
     * Derive seller badges based on sales count
     */
    deriveSalesBadge(userId: string, salesCount: number): ReputationTag | null {
        let badge: string | null = null;

        if (salesCount >= SALES_BADGES.TOP_SELLER) {
            badge = "Top Seller";
        } else if (salesCount >= SALES_BADGES.POWER_SELLER) {
            badge = "Power Seller";
        } else if (salesCount >= SALES_BADGES.ESTABLISHED) {
            badge = "Established Creator";
        }

        if (!badge) return null;

        return {
            id: `tag_${Date.now()}_sales`,
            userId,
            tag: badge,
            source: "TEMPLATE_SALES",
            issuedAt: new Date(),
        };
    }

    /**
     * Create breach tag (permanent negative reputation)
     */
    createBreachTag(
        userId: string,
        severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
        breachId: string
    ): ReputationTag {
        const tagLabels: Record<string, string> = {
            LOW: "Low Risk",
            MEDIUM: "Caution",
            HIGH: "High Risk",
            CRITICAL: "Breach Record",
        };

        return {
            id: `tag_${Date.now()}_breach`,
            userId,
            tag: tagLabels[severity],
            source: "BREACH",
            pocHash: breachId, // Reference to breach report
            issuedAt: new Date(),
            // No expiry - breach tags are permanent per PRD
        };
    }

    /**
     * Create verification tag
     */
    createVerificationTag(userId: string): ReputationTag {
        return {
            id: `tag_${Date.now()}_verified`,
            userId,
            tag: "Verified Creator",
            source: "VERIFICATION",
            issuedAt: new Date(),
        };
    }

    /**
     * Aggregate unique tags for a user (deduplication)
     */
    aggregateTags(tags: ReputationTag[]): ReputationTag[] {
        const uniqueTags = new Map<string, ReputationTag>();

        for (const tag of tags) {
            const key = `${tag.userId}_${tag.tag}`;
            const existing = uniqueTags.get(key);

            // Keep the tag with higher value or more recent date
            if (!existing || 
                (tag.value && (!existing.value || tag.value > existing.value)) ||
                tag.issuedAt > existing.issuedAt) {
                uniqueTags.set(key, tag);
            }
        }

        return Array.from(uniqueTags.values());
    }

    /**
     * Get tag display color based on source
     */
    getTagColor(source: TagSource): { bg: string; text: string } {
        const colors: Record<TagSource, { bg: string; text: string }> = {
            POC_COMPLETION: { bg: "bg-emerald-500/20", text: "text-emerald-400" },
            TEMPLATE_SALES: { bg: "bg-orange-500/20", text: "text-orange-400" },
            VERIFICATION: { bg: "bg-blue-500/20", text: "text-blue-400" },
            MANUAL: { bg: "bg-amber-500/20", text: "text-amber-400" },
            BREACH: { bg: "bg-red-500/20", text: "text-red-400" },
        };
        return colors[source];
    }

    /**
     * Sort tags by priority (negative first for visibility)
     */
    sortTagsByPriority(tags: ReputationTag[]): ReputationTag[] {
        const priority: Record<TagSource, number> = {
            BREACH: 0,           // Negative tags first
            VERIFICATION: 1,     // Then verified status
            POC_COMPLETION: 2,   // Then role tags
            TEMPLATE_SALES: 3,   // Then sales badges
            MANUAL: 4,           // Manual tags last
        };

        return [...tags].sort((a, b) => priority[a.source] - priority[b.source]);
    }
}

// ============================================================
// SINGLETON EXPORT
// ============================================================

export const reputationService = new ReputationTaggingService();

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get all available role tags for dropdown/filter
 */
export function getAllRoleTags(): string[] {
    return Object.values(TYPE_TO_TAG_MAP);
}

/**
 * Check if a user has any negative tags
 */
export function hasNegativeTags(tags: ReputationTag[]): boolean {
    return tags.some(t => t.source === "BREACH");
}

/**
 * Get the primary role tag for a user
 */
export function getPrimaryRoleTag(tags: ReputationTag[]): ReputationTag | null {
    const roleTags = tags.filter(t => t.source === "POC_COMPLETION");
    if (roleTags.length === 0) return null;
    
    // Return the one with highest value
    return roleTags.reduce((best, tag) => 
        (tag.value || 0) > (best.value || 0) ? tag : best
    );
}

const REPUTATION_STORE_KEY = "documate-reputation-tags";

function normalizeAddress(address: string): string {
    return (address || "").trim().toLowerCase();
}

export function deriveReputationTags(
    templateName: string,
    placeholderValues: Record<string, string>
): string[] {
    const name = templateName.toLowerCase();
    const tags = new Set<string>();

    if (/nda|non.disclosure/.test(name))         { tags.add("Legal Consultant"); tags.add("Contract Author"); }
    if (/employment/.test(name))                  { tags.add("HR Professional"); tags.add("Talent Acquisition"); }
    if (/service agreement|services/.test(name))  { tags.add("Freelancer"); tags.add("Service Provider"); }
    if (/software|dev|code|engineer/.test(name))  { tags.add("Software Engineer"); }
    if (/ai|machine learning|ml|data/.test(name)) { tags.add("AI Engineer"); tags.add("Data Scientist"); }
    if (/design|creative|brand/.test(name))       { tags.add("Creative Professional"); tags.add("Designer"); }
    if (/consulting|advisory/.test(name))         { tags.add("Consultant"); }
    if (/partnership|joint venture/.test(name))   { tags.add("Business Development"); }
    if (/lease|rental|property/.test(name))       { tags.add("Real Estate"); }
    if (/medical|health|clinical/.test(name))     { tags.add("Healthcare Professional"); }

    const roleValues = Object.entries(placeholderValues)
        .filter(([k]) => /role|title|position|profession|job/.test(k.toLowerCase()))
        .map(([, v]) => v.trim())
        .filter(Boolean);

    roleValues.forEach(role => {
        const r = role.toLowerCase();
        if (/engineer|developer|programmer/.test(r)) tags.add("Software Engineer");
        if (/ai|ml|machine learning/.test(r))        tags.add("AI Engineer");
        if (/designer|ux|ui/.test(r))                tags.add("Designer");
        if (/manager|lead|head/.test(r))             tags.add("Team Lead");
        if (/lawyer|attorney|legal/.test(r))         tags.add("Legal Consultant");
        if (/marketing|growth/.test(r))              tags.add("Marketing Professional");
        if (/analyst|data|science/.test(r))          tags.add("Data Analyst");
        if (tags.size === 0) tags.add(role.replace(/\b\w/g, c => c.toUpperCase()));
    });

    if (tags.size === 0) tags.add("Document Professional");
    return [...tags];
}

export function addReputationTagsForAddress(address: string, tags: string[]): void {
    try {
        const normalizedAddress = normalizeAddress(address);
        if (!normalizedAddress) return;

        const raw = localStorage.getItem(REPUTATION_STORE_KEY);
        const store: Record<string, string[]> = raw ? JSON.parse(raw) : {};
        const existing = new Set(store[normalizedAddress] ?? []);
        tags.forEach(t => existing.add(t));
        store[normalizedAddress] = [...existing];
        localStorage.setItem(REPUTATION_STORE_KEY, JSON.stringify(store));
    } catch {
        // localStorage unavailable
    }
}

export function getReputationTagsForAddress(address: string): string[] {
    try {
        const normalizedAddress = normalizeAddress(address);
        if (!normalizedAddress) return [];

        const raw = localStorage.getItem(REPUTATION_STORE_KEY);
        if (!raw) return [];
        const store: Record<string, string[]> = JSON.parse(raw);
        return store[normalizedAddress] ?? [];
    } catch {
        return [];
    }
}
