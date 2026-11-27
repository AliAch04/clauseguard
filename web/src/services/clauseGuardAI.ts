import {
  getGenerativeModel,
  InferenceMode,
  Schema,
  type Part,
} from "firebase/ai";
import { ai } from "./firebase";

const CLOUD_MODEL = "gemini-2.5-flash";

// --- Exported Types for your Colleague's React UI ---
export type RiskSeverity = "HIGH" | "MEDIUM" | "LOW";

export interface RedFlag {
  title: string;
  severity: RiskSeverity;
  clauseQuote: string;
  plainEnglish: string;
}

export interface ClauseAnalysis {
  summary: string;
  overallRisk: RiskSeverity;
  redFlags: RedFlag[];
}

export interface ScanResult {
  analysis: ClauseAnalysis;
  source: string; // "on_device" | "in_cloud" | "unknown"
}

// Structured JSON Schema for Firebase AI Logic
const clauseAnalysisSchema = Schema.object({
  properties: {
    summary: Schema.string({
      description: "A 1-2 sentence plain-English summary of the document or clause.",
    }),
    overallRisk: Schema.enumString({
      enum: ["HIGH", "MEDIUM", "LOW"],
      description: "Overall risk level for the signer.",
    }),
    redFlags: Schema.array({
      items: Schema.object({
        properties: {
          title: Schema.string({
            description: "Short label, e.g. 'Auto-Renewal Trap' or 'Broad IP Transfer'.",
          }),
          severity: Schema.enumString({
            enum: ["HIGH", "MEDIUM", "LOW"],
          }),
          clauseQuote: Schema.string({
            description: "Brief snippet or paraphrase of the problematic wording.",
          }),
          plainEnglish: Schema.string({
            description: "Clear explanation of what this means for the signer.",
          }),
        },
      }),
    }),
  },
});

// Helper: Convert File (JPEG, PNG, PDF) to Firebase AI Part
async function fileToGenerativePart(file: File): Promise<Part> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: base64,
      mimeType: file.type,
    },
  };
}

// Helper: Safely parse JSON even if the on-device model adds ```json fences
function parseAnalysisJSON(rawText: string): ClauseAnalysis {
  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as ClauseAnalysis;
  } catch {
    // Graceful fallback if local model returns plain text
    return {
      summary: rawText,
      overallRisk: "MEDIUM",
      redFlags: [],
    };
  }
}

/**
 * 1. SCAN CLAUSE (Hybrid: On-Device First, Cloud Fallback)
 * Returns typed JSON for easy rendering of severity badges and cards.
 */
export async function scanContractClause(input: {
  text?: string;
  file?: File;
}): Promise<ScanResult> {
  const model = getGenerativeModel(ai, {
    mode: InferenceMode.PREFER_ON_DEVICE,
    inCloudParams: {
      model: CLOUD_MODEL,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: clauseAnalysisSchema,
      },
    },
  });

  const prompt = `You are ClauseGuard, a contract analyzer.
Analyze the provided contract text or document for red flags (auto-renewals, hidden fees, IP transfer, liability waivers, unfair termination).
Respond ONLY with valid JSON matching this exact structure:
{
  "summary": "1-2 sentence plain-English summary",
  "overallRisk": "HIGH" | "MEDIUM" | "LOW",
  "redFlags": [
    {
      "title": "Short title",
      "severity": "HIGH" | "MEDIUM" | "LOW",
      "clauseQuote": "Relevant snippet",
      "plainEnglish": "Plain-English explanation"
    }
  ]
}`;

  const parts: (string | Part)[] = [prompt];
  if (input.text) parts.push(input.text);
  if (input.file) parts.push(await fileToGenerativePart(input.file));

  const result = await model.generateContent(parts);
  const rawText = result.response.text();

  return {
    analysis: parseAnalysisJSON(rawText),
    source: result.inferenceSource ?? "unknown",
  };
}

/**
 * 2. NEGOTIATE / COUNTER-DRAFT (Explicit Cloud Escalation)
 */
export async function draftCounterProposal(
  clauseText: string,
  context: string
): Promise<string> {
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