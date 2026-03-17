import forge from "node-forge";

export interface PdfSignatureValidationResult {
    isValid: boolean;
    reason: string;
    signatureType: "PADES_OR_PKCS7" | "NONE" | "UNSUPPORTED";
    metadata: {
        title?: string;
        author?: string;
        producer?: string;
        creator?: string;
        creationDate?: string;
        modificationDate?: string;
    };
    diagnostics: {
        hasByteRange: boolean;
        hasSignatureDictionary: boolean;
        hasCryptoSubFilter: boolean;
        scanLikeDocument: boolean;
        byteRange?: [number, number, number, number];
    };
}

const BYTE_RANGE_REGEX = /\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]/;
const CONTENTS_HEX_REGEX = /\/Contents\s*<([0-9A-Fa-f\s\r\n]+)>/;

function extractByteRange(pdfText: string): [number, number, number, number] | null {
    const match = BYTE_RANGE_REGEX.exec(pdfText);
    if (!match) return null;

    return [
        Number.parseInt(match[1], 10),
        Number.parseInt(match[2], 10),
        Number.parseInt(match[3], 10),
        Number.parseInt(match[4], 10),
    ];
}

function extractSignatureContents(pdfText: string, fromIndex: number): Buffer | null {
    const tail = pdfText.slice(Math.max(0, fromIndex - 400), fromIndex + 24000);
    const match = CONTENTS_HEX_REGEX.exec(tail);
    if (!match) return null;

    const normalized = match[1].replace(/\s+/g, "").replace(/>+$/, "");
    if (!normalized || normalized.length % 2 !== 0) return null;

    const raw = Buffer.from(normalized, "hex");

    // Most PDFs pad signature placeholder with trailing null bytes.
    let end = raw.length;
    while (end > 0 && raw[end - 1] === 0) {
        end -= 1;
    }
    return raw.subarray(0, end);
}

function isScanLike(metadata: {
    producer?: string;
    creator?: string;
    title?: string;
}): boolean {
    const probe = `${metadata.producer ?? ""} ${metadata.creator ?? ""} ${metadata.title ?? ""}`.toLowerCase();
    return ["scan", "scanner", "camscanner", "adobescan", "genius scan", "office lens"].some((token) =>
        probe.includes(token)
    );
}

function extractMetadata(pdfText: string): {
    title?: string;
    author?: string;
    producer?: string;
    creator?: string;
    creationDate?: string;
    modificationDate?: string;
} {
    const findLiteral = (key: string): string | undefined => {
        const match = new RegExp(`/${key}\\s*\\(([^\\)]*)\\)`).exec(pdfText);
        return match?.[1];
    };

    const findDate = (key: string): string | undefined => {
        const match = new RegExp(`/${key}\\s*\\((D:[^\\)]*)\\)`).exec(pdfText);
        return match?.[1];
    };

    return {
        title: findLiteral("Title"),
        author: findLiteral("Author"),
        producer: findLiteral("Producer"),
        creator: findLiteral("Creator"),
        creationDate: findDate("CreationDate"),
        modificationDate: findDate("ModDate"),
    };
}

function verifyDetachedPkcs7(signatureBytes: Buffer, signedData: Buffer): boolean {
    const derBinary = signatureBytes.toString("binary");
    const asn1 = forge.asn1.fromDer(derBinary);
    const p7 = forge.pkcs7.messageFromAsn1(asn1) as forge.pkcs7.PkcsSignedData;

    if (!p7 || !Array.isArray(p7.certificates) || p7.certificates.length === 0) {
        return false;
    }

    // node-forge does not guarantee detached verification helpers in every build,
    // so we use the available verify path and fail closed on any inconsistency.
    const anyP7 = p7 as unknown as {
        content?: forge.util.ByteBuffer;
        verify?: () => boolean;
    };

    anyP7.content = forge.util.createBuffer(signedData.toString("binary"));

    if (typeof anyP7.verify !== "function") {
        return false;
    }

    return anyP7.verify();
}

export async function validatePdfSignature(pdfBuffer: Buffer): Promise<PdfSignatureValidationResult> {
    const pdfText = pdfBuffer.toString("latin1");
    const metadata = extractMetadata(pdfText);
    const byteRange = extractByteRange(pdfText);
    const hasByteRange = byteRange !== null;
    const hasSignatureDictionary = pdfText.includes("/Sig") || pdfText.includes("/Contents");
    const hasCryptoSubFilter =
        pdfText.includes("/SubFilter /ETSI.CAdES.detached") ||
        pdfText.includes("/SubFilter /adbe.pkcs7.detached") ||
        pdfText.includes("/SubFilter /adbe.pkcs7.sha1");
    const scanLikeDocument = isScanLike(metadata);

    const diagnostics: PdfSignatureValidationResult["diagnostics"] = {
        hasByteRange,
        hasSignatureDictionary,
        hasCryptoSubFilter,
        scanLikeDocument,
        byteRange: byteRange ?? undefined,
    };

    if (!hasByteRange || !hasSignatureDictionary || !hasCryptoSubFilter || !byteRange) {
        return {
            isValid: false,
            reason: "No cryptographic PDF signature structure found. Flat image/scan signatures are rejected.",
            signatureType: "NONE",
            metadata,
            diagnostics,
        };
    }

    const signatureContents = extractSignatureContents(pdfText, pdfText.indexOf("/ByteRange"));
    if (!signatureContents || signatureContents.length === 0) {
        return {
            isValid: false,
            reason: "Signature container not found or malformed.",
            signatureType: "UNSUPPORTED",
            metadata,
            diagnostics,
        };
    }

    const [r0, r1, r2, r3] = byteRange;
    const validRange = r0 === 0 && r1 >= 0 && r2 >= 0 && r3 >= 0 && r1 <= r2 && r2 + r3 <= pdfBuffer.length;
    if (!validRange) {
        return {
            isValid: false,
            reason: "Invalid ByteRange declaration in signed PDF.",
            signatureType: "UNSUPPORTED",
            metadata,
            diagnostics,
        };
    }

    const signedData = Buffer.concat([pdfBuffer.subarray(r0, r0 + r1), pdfBuffer.subarray(r2, r2 + r3)]);

    try {
        const verified = verifyDetachedPkcs7(signatureContents, signedData);
        if (!verified) {
            return {
                isValid: false,
                reason: "Cryptographic signature verification failed.",
                signatureType: "PADES_OR_PKCS7",
                metadata,
                diagnostics,
            };
        }

        return {
            isValid: true,
            reason: "Cryptographic signature verified (PAdES/PKCS#7 detached).",
            signatureType: "PADES_OR_PKCS7",
            metadata,
            diagnostics,
        };
    } catch {
        return {
            isValid: false,
            reason: "Unable to decode or verify CMS/PKCS#7 signature payload.",
            signatureType: "UNSUPPORTED",
            metadata,
            diagnostics,
        };
    }
}
