/**
 * Template Service
 * Manages document templates including free official templates and purchased ones
 */

import type { DocumentTemplate, TemplateCategory } from "@/types";

// ============================================================
// Free Official DocuMate Templates
// ============================================================

export const FREE_TEMPLATES: DocumentTemplate[] = [
    {
        id: "nda-basic",
        name: "Non-Disclosure Agreement (NDA)",
        description: "A simple mutual NDA for protecting confidential information between two parties.",
        category: "Legal",
        content: `# NON-DISCLOSURE AGREEMENT

**Effective Date:** {{effective_date}}

This Non-Disclosure Agreement ("Agreement") is entered into by and between:

**Disclosing Party:** {{party_a_name}}  
**Address:** {{party_a_address}}

**Receiving Party:** {{party_b_name}}  
**Address:** {{party_b_address}}

## 1. CONFIDENTIAL INFORMATION

"Confidential Information" means any non-public information disclosed by either party to the other, either directly or indirectly, in writing, orally, or by inspection of tangible objects.

## 2. PURPOSE

The parties wish to explore a potential business relationship concerning: {{purpose}}

## 3. OBLIGATIONS

The Receiving Party agrees to:
- Hold all Confidential Information in strict confidence
- Not disclose Confidential Information to any third parties
- Use Confidential Information only for the stated Purpose
- Protect Confidential Information with reasonable care

## 4. DURATION

This Agreement shall remain in effect for {{duration_years}} year(s) from the Effective Date.

## 5. RETURN OF MATERIALS

Upon termination, the Receiving Party shall return or destroy all Confidential Information.

## 6. GOVERNING LAW

This Agreement shall be governed by the laws of {{jurisdiction}}.

---

**SIGNATURES**

_________________________
{{party_a_name}}
Date: _______________

_________________________
{{party_b_name}}
Date: _______________
`,
        placeholders: [
            { key: "effective_date", label: "Effective Date", type: "date", required: true },
            { key: "party_a_name", label: "Your Name/Company", type: "text", required: true },
            { key: "party_a_address", label: "Your Address", type: "textarea", required: true },
            { key: "party_b_name", label: "Other Party Name", type: "text", required: true },
            { key: "party_b_address", label: "Other Party Address", type: "textarea", required: true },
            { key: "purpose", label: "Purpose of Disclosure", type: "textarea", required: true },
            { key: "duration_years", label: "Duration (Years)", type: "number", required: true, defaultValue: "2" },
            { key: "jurisdiction", label: "Governing Jurisdiction", type: "text", required: true },
        ],
        isFree: true,
        price: 0,
        creator: "documate",
        royaltyPercent: 0,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
    },
    {
        id: "freelance-agreement",
        name: "Freelance Service Agreement",
        description: "Standard contract for freelance work including scope, payment terms, and deliverables.",
        category: "Engineering",
        content: `# FREELANCE SERVICE AGREEMENT

**Agreement Date:** {{agreement_date}}

## PARTIES

**Client:** {{client_name}}  
**Address:** {{client_address}}  
**Wallet Address:** {{client_wallet}}

**Freelancer:** {{freelancer_name}}  
**Address:** {{freelancer_address}}  
**Wallet Address:** {{freelancer_wallet}}

## 1. SERVICES

The Freelancer agrees to provide the following services:

{{service_description}}

## 2. DELIVERABLES

The following deliverables will be provided:

{{deliverables}}

## 3. TIMELINE

- **Project Start Date:** {{start_date}}
- **Project Deadline:** {{deadline}}

## 4. PAYMENT TERMS

**Total Project Fee:** {{total_amount}} $DOCU

Payment Schedule:
- {{payment_schedule}}

All payments shall be made in $DOCU tokens to the Freelancer's wallet address.

## 5. REVISIONS

The Client is entitled to {{revision_count}} revision(s) included in the project fee.

## 6. INTELLECTUAL PROPERTY

Upon full payment, all deliverables and associated intellectual property rights shall transfer to the Client.

## 7. CONFIDENTIALITY

Both parties agree to keep confidential any proprietary information shared during the project.

## 8. TERMINATION

Either party may terminate this agreement with {{notice_days}} days written notice. Payment shall be made for work completed up to termination.

## 9. PROOF OF CONTRACT

This agreement will be recorded on the Polkadot blockchain using the POC-1 standard upon finalization by both parties.

---

**SIGNATURES**

_________________________
**Client:** {{client_name}}
Date: _______________

_________________________
**Freelancer:** {{freelancer_name}}
Date: _______________
`,
        placeholders: [
            { key: "agreement_date", label: "Agreement Date", type: "date", required: true },
            { key: "client_name", label: "Client Name", type: "text", required: true },
            { key: "client_address", label: "Client Address", type: "textarea", required: true },
            { key: "client_wallet", label: "Client Wallet Address", type: "address", required: true },
            { key: "freelancer_name", label: "Freelancer Name", type: "text", required: true },
            { key: "freelancer_address", label: "Freelancer Address", type: "textarea", required: true },
            { key: "freelancer_wallet", label: "Freelancer Wallet", type: "address", required: true },
            { key: "service_description", label: "Service Description", type: "textarea", required: true },
            { key: "deliverables", label: "Deliverables List", type: "textarea", required: true },
            { key: "start_date", label: "Start Date", type: "date", required: true },
            { key: "deadline", label: "Deadline", type: "date", required: true },
            { key: "total_amount", label: "Total Amount ($DOCU)", type: "number", required: true },
            { key: "payment_schedule", label: "Payment Schedule", type: "textarea", required: true, defaultValue: "50% upfront, 50% on completion" },
            { key: "revision_count", label: "Number of Revisions", type: "number", required: true, defaultValue: "2" },
            { key: "notice_days", label: "Termination Notice (Days)", type: "number", required: true, defaultValue: "7" },
        ],
        isFree: true,
        price: 0,
        creator: "documate",
        royaltyPercent: 0,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
    },
    {
        id: "invoice-simple",
        name: "Simple Invoice",
        description: "A clean invoice template for billing clients for services rendered.",
        category: "Creative",
        content: `# INVOICE

**Invoice Number:** {{invoice_number}}  
**Invoice Date:** {{invoice_date}}  
**Due Date:** {{due_date}}

---

## FROM

**{{sender_name}}**  
{{sender_address}}  
Wallet: {{sender_wallet}}

---

## BILL TO

**{{client_name}}**  
{{client_address}}  
Wallet: {{client_wallet}}

---

## SERVICES RENDERED

| Description | Amount |
|-------------|--------|
| {{service_1}} | {{amount_1}} $DOCU |
| {{service_2}} | {{amount_2}} $DOCU |
| {{service_3}} | {{amount_3}} $DOCU |

---

## SUMMARY

**Subtotal:** {{subtotal}} $DOCU  
**Tax ({{tax_percent}}%):** {{tax_amount}} $DOCU  
**Total Due:** {{total}} $DOCU

---

## PAYMENT INSTRUCTIONS

Please send payment in $DOCU tokens to the wallet address listed above.

Payment Reference: {{invoice_number}}

---

**Thank you for your business!**
`,
        placeholders: [
            { key: "invoice_number", label: "Invoice Number", type: "text", required: true },
            { key: "invoice_date", label: "Invoice Date", type: "date", required: true },
            { key: "due_date", label: "Due Date", type: "date", required: true },
            { key: "sender_name", label: "Your Name/Company", type: "text", required: true },
            { key: "sender_address", label: "Your Address", type: "textarea", required: true },
            { key: "sender_wallet", label: "Your Wallet Address", type: "address", required: true },
            { key: "client_name", label: "Client Name", type: "text", required: true },
            { key: "client_address", label: "Client Address", type: "textarea", required: true },
            { key: "client_wallet", label: "Client Wallet", type: "address", required: true },
            { key: "service_1", label: "Service Line 1", type: "text", required: true },
            { key: "amount_1", label: "Amount 1", type: "number", required: true },
            { key: "service_2", label: "Service Line 2", type: "text", required: false },
            { key: "amount_2", label: "Amount 2", type: "number", required: false, defaultValue: "0" },
            { key: "service_3", label: "Service Line 3", type: "text", required: false },
            { key: "amount_3", label: "Amount 3", type: "number", required: false, defaultValue: "0" },
            { key: "subtotal", label: "Subtotal", type: "number", required: true },
            { key: "tax_percent", label: "Tax Percentage", type: "number", required: true, defaultValue: "0" },
            { key: "tax_amount", label: "Tax Amount", type: "number", required: true, defaultValue: "0" },
            { key: "total", label: "Total Due", type: "number", required: true },
        ],
        isFree: true,
        price: 0,
        creator: "documate",
        royaltyPercent: 0,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
    },
];

// ============================================================
// Template Storage (localStorage for MVP)
// ============================================================

const PURCHASED_TEMPLATES_KEY = "documate-purchased-templates";
const CUSTOM_TEMPLATES_KEY = "documate-custom-templates";

/**
 * Get all available templates (free + purchased)
 */
export function getAllTemplates(): DocumentTemplate[] {
    const purchased = getPurchasedTemplates();
    const custom = getCustomTemplates();
    return [...FREE_TEMPLATES, ...purchased, ...custom];
}

/**
 * Get free official templates only
 */
export function getFreeTemplates(): DocumentTemplate[] {
    return FREE_TEMPLATES;
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: TemplateCategory): DocumentTemplate[] {
    return getAllTemplates().filter((t) => t.category === category);
}

/**
 * Get a template by ID
 */
export function getTemplateById(id: string): DocumentTemplate | null {
    return getAllTemplates().find((t) => t.id === id) || null;
}

/**
 * Get user's purchased templates
 */
export function getPurchasedTemplates(): DocumentTemplate[] {
    if (typeof window === "undefined") return [];

    const stored = localStorage.getItem(PURCHASED_TEMPLATES_KEY);
    if (!stored) return [];

    try {
        return JSON.parse(stored) as DocumentTemplate[];
    } catch {
        return [];
    }
}

/**
 * Add a purchased template
 */
export function addPurchasedTemplate(template: DocumentTemplate): void {
    if (typeof window === "undefined") return;

    const templates = getPurchasedTemplates();
    templates.push(template);
    localStorage.setItem(PURCHASED_TEMPLATES_KEY, JSON.stringify(templates));
}

/**
 * Get user's custom templates
 */
export function getCustomTemplates(): DocumentTemplate[] {
    if (typeof window === "undefined") return [];

    const stored = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
    if (!stored) return [];

    try {
        return JSON.parse(stored) as DocumentTemplate[];
    } catch {
        return [];
    }
}

/**
 * Save a custom template
 */
export function saveCustomTemplate(template: DocumentTemplate): void {
    if (typeof window === "undefined") return;

    const templates = getCustomTemplates();
    const existingIndex = templates.findIndex((t) => t.id === template.id);

    if (existingIndex >= 0) {
        templates[existingIndex] = template;
    } else {
        templates.push(template);
    }

    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates));
}

// ============================================================
// Template Content Rendering
// ============================================================

/**
 * Render a template with placeholder values
 */
export function renderTemplate(
    template: DocumentTemplate,
    values: Record<string, string>
): string {
    let content = template.content;

    // Replace all placeholders with their values
    for (const placeholder of template.placeholders) {
        const value = values[placeholder.key] || placeholder.defaultValue || "";
        const regex = new RegExp(`\\{\\{${placeholder.key}\\}\\}`, "g");
        content = content.replace(regex, value);
    }

    return content;
}

/**
 * Extract placeholder keys from template content
 */
export function extractPlaceholders(content: string): string[] {
    const regex = /\{\{(\w+)\}\}/g;
    const matches: string[] = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
        if (!matches.includes(match[1])) {
            matches.push(match[1]);
        }
    }

    return matches;
}

/**
 * Build PlaceholderField[] from template content by auto-detecting {{...}} tokens.
 * Merges with any existing placeholders defined on the template (those take priority).
 */
export function buildPlaceholderFields(template: DocumentTemplate): import("@/types").PlaceholderField[] {
    const existingByKey = new Map(template.placeholders.map((p) => [p.key, p]));
    const contentKeys = extractPlaceholders(template.content);

    return contentKeys.map((key) => {
        if (existingByKey.has(key)) {
            return existingByKey.get(key)!;
        }
        // Auto-generate a field definition from the key name
        const label = key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());

        let type: "text" | "date" | "address" | "number" | "textarea" = "text";
        const keyLower = key.toLowerCase();
        if (keyLower.includes("date") || keyLower.includes("deadline")) type = "date";
        else if (keyLower.includes("wallet") || keyLower.includes("address")) type = "address";
        else if (keyLower.includes("amount") || keyLower.includes("total") || keyLower.includes("subtotal") || keyLower.includes("percent") || keyLower.includes("price") || keyLower.includes("count")) type = "number";
        else if (keyLower.includes("description") || keyLower.includes("bio") || keyLower.includes("deliverables") || keyLower.includes("notes")) type = "textarea";

        return { key, label, type, required: false };
    });
}

/**
 * Validate that all required placeholders have values
 */
export function validatePlaceholderValues(
    template: DocumentTemplate,
    values: Record<string, string>
): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    for (const placeholder of template.placeholders) {
        if (placeholder.required && !values[placeholder.key]?.trim()) {
            missing.push(placeholder.label);
        }
    }

    return {
        valid: missing.length === 0,
        missing,
    };
}
