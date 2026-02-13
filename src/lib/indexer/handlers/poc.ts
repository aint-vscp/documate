/**
 * POC-1 Transaction Handler
 * 
 * Processes system.remark calls that contain POC-1 data
 * and derives reputation tags from them
 */

import { reputationService, type POCTransaction } from "@/lib/reputation";

/**
 * Parse remark bytes to string
 */
function parseRemarkData(data: Uint8Array | string): string {
    if (typeof data === "string") {
        return data;
    }
    return new TextDecoder().decode(data);
}

/**
 * Check if remark is a POC-1 transaction
 */
function isPOC1Remark(remark: string): boolean {
    return remark.startsWith("POC1:");
}

/**
 * Handle incoming remark call
 * Called by the indexer when a system.remark is detected
 */
export async function handlePOCRemark(call: {
    extrinsic: {
        hash: string;
        signer: string;
        block: {
            number: number;
            timestamp: Date;
        };
    };
    args: {
        remark: Uint8Array | string;
    };
}): Promise<void> {
    const remarkString = parseRemarkData(call.args.remark);
    
    // Only process POC1 remarks
    if (!isPOC1Remark(remarkString)) {
        return;
    }

    console.log(`[POC Handler] Processing POC-1 remark: ${remarkString}`);

    // Parse the POC metadata
    const metadata = reputationService.parsePOCRemark(remarkString);
    if (!metadata) {
        console.warn(`[POC Handler] Failed to parse POC remark: ${remarkString}`);
        return;
    }

    // Create POC transaction record
    // Note: In real implementation, we'd also look up the paired transfer
    // to get the recipient and value
    const pocTx: POCTransaction = {
        hash: call.extrinsic.hash,
        from: call.extrinsic.signer,
        to: "", // Would be looked up from paired transfer
        value: 0, // Would be looked up from paired transfer
        remark: remarkString,
        blockNumber: call.extrinsic.block.number,
        timestamp: call.extrinsic.block.timestamp,
    };

    // Store POC transaction in database
    // await prisma.pOCTransaction.create({ data: pocTx });

    console.log(`[POC Handler] Indexed POC transaction: ${pocTx.hash}`);
}

/**
 * Handle transfer events to correlate with POC remarks
 * In POC-1 standard, a remark and transfer happen in same block
 */
export async function handleTransfer(event: {
    block: {
        number: number;
        timestamp: Date;
    };
    data: {
        from: string;
        to: string;
        amount: bigint;
    };
    extrinsicHash: string;
}): Promise<void> {
    // Look for corresponding POC remark in same extrinsic
    // This would correlate the payment with the contract reference

    console.log(`[Transfer Handler] Processing transfer: ${event.data.from} -> ${event.data.to}`);

    // In production:
    // 1. Find POC remark in same extrinsic
    // 2. Update POC transaction with recipient and value
    // 3. Derive reputation tags
    // 4. Store in database
}

/**
 * Process a complete POC-1 transaction (remark + transfer correlated)
 */
export async function processPOCTransaction(
    remarkHash: string,
    remarkData: string,
    transferTo: string,
    transferValue: number,
    blockNumber: number,
    timestamp: Date
): Promise<void> {
    const pocTx: POCTransaction = {
        hash: remarkHash,
        from: "", // Signer
        to: transferTo,
        value: transferValue,
        remark: remarkData,
        blockNumber,
        timestamp,
    };

    // Derive reputation tags
    const tags = reputationService.deriveTagsFromPOC(pocTx);

    console.log(`[POC Processor] Derived ${tags.length} tags from POC transaction`);

    // Store tags in database
    for (const tag of tags) {
        // await prisma.reputationTag.create({ data: tag });
        console.log(`[POC Processor] Created tag: ${tag.tag} for user ${tag.userId}`);
    }
}
