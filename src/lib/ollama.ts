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

function getPersonaInstructions(neuroType: string = 'General', name: string = 'User') {
  switch (neuroType) {
    case 'ADHD':
      return `Target: ADHD (Dopamine-seeking).
      - TONE: Gamified, Urgent.
      - STRATEGY: Speed-run the planning phase.
      - EXAMPLE ARCS: "Loot Supplies" -> "Craft Plan" -> "Deploy Invites".
      - END GOAL: The task must be fully conquered by the last step.`;
      
    case 'Anxiety':
      return `Target: Anxiety (Overwhelm).
      - TONE: Warm, collaborative Body Double.
      - STRATEGY: Start with comfort (Low Energy), move to doing (Medium), finish with relief (Completion).
      - CRITICAL: Do not leave them hanging. Guide them to the very end so they feel safe.
      - EXAMPLE: "Get tea" -> "Open app" -> "Pick date" -> "Send invites" -> "Close laptop".`;
      
    case 'Dyslexia':
      return `Target: Dyslexia (Visual).
      - TONE: Ultra-concise.
      - STRATEGY: Linear visual timeline.
      - RULE: 7-12 steps. Subject-Verb-Object. Cover the whole task.`;
      
    default:
      return `Target: General Productivity.
      - TONE: Logical, Chronological.
      - STRATEGY: Beginning, Middle, End. Ensure the final step completes the user's intent.`;
  }
}

export async function streamDecomposeTask(
  userTask: string, 
  userProfile: { name?: string, neuroType?: string }, 
  onPartialUpdate: (steps: MicroStep[]) => void
): Promise<MicroStep[]> {
  
  const { scrubbed, map } = scrubPII(userTask);
  const steps: MicroStep[] = [];
  let buffer = ""; 

  const styleGuide = getPersonaInstructions(userProfile.neuroType, userProfile.name);
  
  const finalPrompt = `
    TASK: "${scrubbed}"
    
    STYLE GUIDE: 
    ${styleGuide}
    
    INSTRUCTIONS:
    1. BREAKDOWN: Create a complete roadmap from start to finish.
    2. LENGTH: 7 to 15 steps (use more steps for complex tasks like "planning a party").
    3. COMPLETION: The final step must result in the task being DONE.
    4. FORMAT: JSON only. Keys: "id", "text", "duration", "energy_required".
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

    if (steps.length === 0) {
      try {
        const cleanJson = buffer.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleanJson);
        const data = Array.isArray(parsed) ? parsed : (parsed.steps || []);
        return data.map((s: any) => parseStep(JSON.stringify(s), map)).filter(Boolean) as MicroStep[];
      } catch (e) {
        console.error("Final parse failed", e);
      }
    }
    return steps;
  } catch (error) {
    console.error("Ollama Error:", error);
    return [{ id: 1, text: "Connection Error", duration: "0m", energy_required: "Low" }];
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

export const decomposeTask = async (task: string) => {
    return streamDecomposeTask(task, { name: 'User', neuroType: 'General' }, () => {});
};