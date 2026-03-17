/**
 * DocuMate Configuration Constants
 * 
 * THE IRON RULES - These values are immutable and match the smart contracts
 */

// ============================================================
// REVENUE SPLIT - 75/20/5 (NEVER CHANGE)
// ============================================================

export const REVENUE_SPLIT = {
    /** Creator receives 75% of every sale */
    CREATOR: 75,
    /** DocuMate Treasury receives 20% of every sale */
    COMPANY: 20,
    /** Community staking - 5% of every sale */
    STAKING: 5,
} as const;

// Verify split adds up to 100%
const SPLIT_TOTAL = REVENUE_SPLIT.CREATOR + REVENUE_SPLIT.COMPANY + REVENUE_SPLIT.STAKING;
if (SPLIT_TOTAL !== 100) {
    throw new Error(`Revenue split must equal 100%, got ${SPLIT_TOTAL}%`);
}

// ============================================================
// SUBSCRIPTION TIERS
// ============================================================

export const SUBSCRIPTION_TIERS = {
    FREE: {
        id: "free",
        name: "Free Tier",
        price: 0,
        features: [
            "Basic AI Drafting",
            "Pay-per-send transactions",
            "Access to free templates",
            "Limited AI queries (10/day)",
        ],
    },
    POWER_USER: {
        id: "power_user",
        name: "Power User",
        price: 20, // $20/month in $DOCU
        features: [
            "Privacy-First AI Drafting (Phala TEE)",
            "Unlimited AI revisions",
            "Priority processing",
            "No send fees",
            "Early access to new templates",
        ],
    },
} as const;

// ============================================================
// VERIFICATION
// ============================================================

export const VERIFICATION = {
    /** Fee for "Blue Check" verification in $DOCU */
    FEE: 50,
    /** Minimum fee */
    MIN_FEE: 50,
    /** Maximum fee */
    MAX_FEE: 100,
} as const;

// ============================================================
// TEMPLATE CATEGORIES
// ============================================================

export const TEMPLATE_CATEGORIES = [
    { id: "Legal", emoji: "⚖️", color: "from-blue-500 to-indigo-600" },
    { id: "Creative", emoji: "🎨", color: "from-pink-500 to-purple-600" },
    { id: "Engineering", emoji: "⚙️", color: "from-green-500 to-emerald-600" },
] as const;

// ============================================================
// MINTING COSTS
// ============================================================

export const MINTING = {
    /** Estimated gas cost for minting a template NFT */
    ESTIMATED_GAS_COST: 5, // $DOCU
    /** Minimum price for listing a template */
    MIN_PRICE: 1,
    /** Maximum price for listing a template */
    MAX_PRICE: 10000,
} as const;

// ============================================================
// FEATURE FLAGS
// ============================================================

export const FEATURES = {
    /** Enable Phala TEE integration */
    TEE_ENABLED: true,
    /** Enable KILT DID integration */
    KILT_ENABLED: true,
    /** Enable marketplace purchases */
    MARKETPLACE_ENABLED: true,
    /** Enable subscription payments */
    SUBSCRIPTIONS_ENABLED: false, // Enable after contract deployment
    /** Enable admin panel */
    ADMIN_ENABLED: true,
    /** Development mode */
    DEV_MODE: process.env.NODE_ENV === "development",
} as const;
