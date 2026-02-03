import { Ollama } from 'ollama/browser'
import { scrubPII, restorePII } from "./pii-scrubber";

const ollama = new Ollama({
  host: process.env.NEXT_PUBLIC_OLLAMA_URL || 'http://127.0.0.1:11434'
});

export interface MicroStep {
  id: number;
  text: string;
  duration: string;
  energy_required: 'High' | 'Medium' | 'Low';
}

export async function streamDecomposeTask(
  userTask: string, 
  onPartialUpdate: (steps: MicroStep[]) => void
): Promise<MicroStep[]> {
  
  const { scrubbed, map } = scrubPII(userTask);
  const steps: MicroStep[] = [];
  let buffer = ""; 

  try {
    const response = await ollama.chat({
      model: 'neuro-coach',
      messages: [{ role: 'user', content: scrubbed }],
      stream: true, 
      format: 'json',
    });

    for await (const part of response) {
      buffer += part.message.content;

      // --- FIX: ROBUST REGEX STRATEGY ---
      // Old Regex failed on spaces (e.g., { "id": 1 }).
      // New Regex: Finds ANY block between { and } that contains "id".
      // This handles:
      // - {"id":1...} (Compact)
      // - { "id": 1... } (Spaced)
      // - {\n "id": 1... } (Multiline)
      const potentialMatches = buffer.match(/\{[^{}]*"id"[^{}]+\}/g);

      if (potentialMatches) {
        potentialMatches.forEach(jsonStr => {
          // Parse candidate
          const newStep = parseStep(jsonStr, map);
          
          // If valid AND not already added (dedupe by ID)
          if (newStep && !steps.find(s => s.id === newStep.id)) {
            steps.push(newStep);
            onPartialUpdate([...steps]); // <--- Update UI INSTANTLY
          }
        });
      }
    }

    // SAFETY NET: If streaming failed completely (0 steps), parse the full buffer
    if (steps.length === 0) {
      try {
        const cleanJson = buffer.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleanJson);
        const data = Array.isArray(parsed) ? parsed : (parsed.steps || []);
        
        const finalSteps = data.map((s: any) => parseStep(JSON.stringify(s), map)).filter(Boolean) as MicroStep[];
        return finalSteps;
      } catch (e) {
        console.error("Final parse failed", e);
      }
    }

    return steps;

  } catch (error) {
    console.error("Stream Error:", error);
    return [
        { id: 1, text: "Check Ollama connection", duration: "1m", energy_required: "Low" }
    ];
  }
}

// Helper to safely parse individual JSON chunks
function parseStep(jsonStr: string, map: Map<string, string>): MicroStep | null {
  try {
    const step = JSON.parse(jsonStr);
    
    // Strict Validation: Must have ID and Text to show up
    if (!step.id || !step.text) return null;

    return {
      ...step,
      text: restorePII(step.text, map),
      duration: step.duration || "5m",
      energy_required: step.energy_required || "Medium"
    };
  } catch {
    return null;
  }
}

export const decomposeTask = async (task: string) => {
    return streamDecomposeTask(task, () => {});
};