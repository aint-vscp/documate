/**
 * Document Generation API
 * Uses AI to fill template placeholders based on user prompt
 */

import { NextRequest, NextResponse } from "next/server";
import { getTemplateById } from "@/lib/document/templateService";

// Mock AI responses for different template types
const AI_RESPONSES: Record<string, Record<string, string>> = {
    "nda-basic": {
        effective_date: new Date().toISOString().split("T")[0],
        party_a_name: "Your Company LLC",
        party_a_address: "123 Business Street, Suite 100, New York, NY 10001",
        party_b_name: "Partner Corp",
        party_b_address: "456 Corporate Avenue, San Francisco, CA 94105",
        purpose: "Discussing potential collaboration on software development projects and sharing technical specifications",
        duration_years: "2",
        jurisdiction: "State of California",
    },
    "freelance-agreement": {
        agreement_date: new Date().toISOString().split("T")[0],
        client_name: "Client Company Inc.",
        client_address: "789 Client Street, Los Angeles, CA 90001",
        client_wallet: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
        freelancer_name: "Professional Developer",
        freelancer_address: "321 Freelancer Lane, Austin, TX 78701",
        freelancer_wallet: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
        service_description: "Full-stack web application development using Next.js, TypeScript, and Polkadot integration",
        deliverables: "1. Responsive web application\n2. Smart contract integration\n3. User authentication system\n4. Documentation",
        start_date: new Date().toISOString().split("T")[0],
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        total_amount: "5000",
        payment_schedule: "50% ($2,500) upon signing, 50% ($2,500) upon completion",
        revision_count: "3",
        notice_days: "14",
    },
    "invoice-simple": {
        invoice_number: `INV-${Date.now().toString(36).toUpperCase()}`,
        invoice_date: new Date().toISOString().split("T")[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        sender_name: "Your Business Name",
        sender_address: "123 Your Street, Your City, ST 12345",
        sender_wallet: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
        client_name: "Client Name",
        client_address: "456 Client Street, Client City, ST 67890",
        client_wallet: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
        service_1: "Web Development Services",
        amount_1: "3000",
        service_2: "UI/UX Design",
        amount_2: "1500",
        service_3: "Maintenance & Support",
        amount_3: "500",
        subtotal: "5000",
        tax_percent: "0",
        tax_amount: "0",
        total: "5000",
    },
};

/**
 * Parse AI prompt to extract values (simplified for MVP)
 */
function parsePromptForValues(
    prompt: string,
    templateId: string
): Record<string, string> {
    const baseValues = AI_RESPONSES[templateId] || {};
    const values = { ...baseValues };

    // Extract company/party names
    const companyMatch = prompt.match(/(?:with|for|between)\s+([A-Z][a-zA-Z\s]+(?:Corp|LLC|Inc|Ltd)?)/i);
    if (companyMatch) {
        if (templateId === "nda-basic") {
            values.party_b_name = companyMatch[1].trim();
        } else if (templateId === "freelance-agreement") {
            values.client_name = companyMatch[1].trim();
        } else if (templateId === "invoice-simple") {
            values.client_name = companyMatch[1].trim();
        }
    }

    // Extract duration (years)
    const durationMatch = prompt.match(/(\d+)\s*(?:year|yr)/i);
    if (durationMatch && templateId === "nda-basic") {
        values.duration_years = durationMatch[1];
    }

    // Extract amounts
    const amountMatch = prompt.match(/\$?([\d,]+)\s*(?:docu|dollars?)?/i);
    if (amountMatch) {
        const amount = amountMatch[1].replace(/,/g, "");
        if (templateId === "freelance-agreement") {
            values.total_amount = amount;
            const half = Math.floor(parseInt(amount) / 2);
            values.payment_schedule = `50% ($${half.toLocaleString()}) upon signing, 50% ($${half.toLocaleString()}) upon completion`;
        } else if (templateId === "invoice-simple") {
            values.subtotal = amount;
            values.total = amount;
            values.amount_1 = amount;
        }
    }

    // Extract purpose/description
    const purposeMatch = prompt.match(/(?:for|regarding|about)\s+(.+?)(?:\.|,|$)/i);
    if (purposeMatch) {
        if (templateId === "nda-basic") {
            values.purpose = purposeMatch[1].trim();
        } else if (templateId === "freelance-agreement") {
            values.service_description = purposeMatch[1].trim();
        }
    }

    return values;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { templateId, prompt, currentValues } = body;

        if (!templateId || !prompt) {
            return NextResponse.json(
                { success: false, error: "Missing templateId or prompt" },
                { status: 400 }
            );
        }

        // Verify template exists
        const template = getTemplateById(templateId);
        if (!template) {
            return NextResponse.json(
                { success: false, error: "Template not found" },
                { status: 404 }
            );
        }

        // In production, this would call an actual LLM API
        // For MVP, we use pattern matching on the prompt
        const generatedValues = parsePromptForValues(prompt, templateId);

        // Merge with existing values (don't overwrite user-provided values)
        const mergedValues: Record<string, string> = { ...generatedValues };
        for (const [key, value] of Object.entries(currentValues || {})) {
            if (value && typeof value === "string" && value.trim()) {
                mergedValues[key] = value;
            }
        }

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        return NextResponse.json({
            success: true,
            values: mergedValues,
            message: "Document details generated successfully",
        });
    } catch (error) {
        console.error("Document generation error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to generate document" },
            { status: 500 }
        );
    }
}
