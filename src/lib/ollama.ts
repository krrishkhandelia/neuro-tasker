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

// Helper to generate persona-specific instructions
function getPersonaInstructions(neuroType: string = 'General', name: string = 'User') {
  switch (neuroType) {
    case 'ADHD':
      return `User has ADHD. Make steps "Novel" and "Exciting". Use gamified verbs (e.g., "Quest: Open Laptop", "Mission: Find files"). Keep it VERY short and punchy.`;
    case 'Anxiety':
      return `User has Anxiety. Be extremely reassuring. The first step must be ridiculously easy (e.g., "Just sit in the chair"). Use calming, low-pressure language.`;
    case 'Dyslexia':
      return `User has Dyslexia. Use simple, plain English. No complex sentences. Focus on visual clarity.`;
    default:
      return `User needs clear, concrete executive function support. Be direct and logical.`;
  }
}

export async function streamDecomposeTask(
  userTask: string, 
  userProfile: { name?: string, neuroType?: string }, // <--- New Param
  onPartialUpdate: (steps: MicroStep[]) => void
): Promise<MicroStep[]> {
  
  const { scrubbed, map } = scrubPII(userTask);
  const steps: MicroStep[] = [];
  let buffer = ""; 

  // DYNAMIC PROMPT INJECTION
  // We keep the Modelfile structure (JSON) but inject style guides here.
  const styleGuide = getPersonaInstructions(userProfile.neuroType, userProfile.name);
  
  const finalPrompt = `
    Task: "${scrubbed}"
    
    STYLE GUIDE: ${styleGuide}
    
    REMINDER: Output valid JSON only.
  `;

  try {
    const response = await ollama.chat({
      model: 'neuro-coach',
      messages: [{ role: 'user', content: finalPrompt }],
      stream: true, 
      format: 'json',
    });

    for await (const part of response) {
      buffer += part.message.content;

      // Robust Regex to catch steps live
      const potentialMatches = buffer.match(/\{[^{}]*"id"[^{}]+\}/g);

      if (potentialMatches) {
        potentialMatches.forEach(jsonStr => {
          const newStep = parseStep(jsonStr, map);
          if (newStep && !steps.find(s => s.id === newStep.id)) {
            steps.push(newStep);
            onPartialUpdate([...steps]); 
          }
        });
      }
    }

    // Safety Net
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

function parseStep(jsonStr: string, map: Map<string, string>): MicroStep | null {
  try {
    const step = JSON.parse(jsonStr);
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

// Backward compatibility alias
export const decomposeTask = async (task: string) => {
    return streamDecomposeTask(task, { name: 'User', neuroType: 'General' }, () => {});
};