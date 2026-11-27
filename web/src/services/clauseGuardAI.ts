import { getGenerativeModel, InferenceMode, type Part } from "firebase/ai";
import { ai } from "./firebase";

const CLOUD_MODEL = "gemini-2.5-flash";

// Helper: Convert an uploaded Image (JPEG/PNG) or PDF File to a Firebase AI Part
async function fileToGenerativePart(file: File): Promise<Part> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  return {
  type: "inlineData",
  inlineData: { data: base64Data, mimeType: file.type },
};
}

/**
 * 1. SCAN CLAUSE (Hybrid: On-Device First, Cloud Fallback)
 * - Text or JPEG/PNG -> Runs locally on Gemini Nano (offline, zero data leaves device).
 * - Multi-page PDF -> Automatically escalates to the cloud model.
 */
export async function scanContractClause(input: { text?: string; file?: File }) {
  const model = getGenerativeModel(ai, {
    mode: InferenceMode.PREFER_ON_DEVICE,
    inCloudParams: { model: CLOUD_MODEL },
  });

  const prompt = `You are ClauseGuard, a contract analyzer.
Identify red flags (auto-renewals, hidden fees, IP transfer, liability waivers) and translate the legalese into plain, concise bullet points.`;

  const parts: (string | Part)[] = [prompt];
  if (input.text) parts.push(input.text);
  if (input.file) parts.push(await fileToGenerativePart(input.file));

  const result = await model.generateContent(parts);

  return {
    analysis: result.response.text(),
    // Returns "on_device" or "in_cloud" so your UI can display a privacy badge
    source: result.response.inferenceSource ?? "unknown",
  };
}

/**
 * 2. NEGOTIATE / COUNTER-DRAFT (Explicit Cloud Escalation)
 * Triggered only when the user clicks "Negotiate / Counter-Draft".
 */
export async function draftCounterProposal(clauseText: string, context: string) {
  const model = getGenerativeModel(ai, {
    mode: InferenceMode.ONLY_IN_CLOUD,
    inCloudParams: { model: CLOUD_MODEL },
  });

  const prompt = `Context: ${context}
Original Clause:
"${clauseText}"

Draft a polite, formal redline counter-proposal that protects the signer and aligns with standard fair market norms.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}