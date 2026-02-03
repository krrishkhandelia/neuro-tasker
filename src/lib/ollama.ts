import ollama from 'ollama/browser'
import { scrubPII, restorePII } from "./pii-scrubber";

export interface MicroStep {
  id: number;
  text: string;
  duration: string;
  // Feature 1: Added Energy Tag to the interface so the UI works
  energy_required: 'High' | 'Medium' | 'Low'; 
}

export async function decomposeTask(userTask: string): Promise<MicroStep[]> {
  // 1. Privacy Scrub
  const { scrubbed, map } = scrubPII(userTask);

  try {
    // 2. Call Your Local Custom Model
    // We strictly rely on the 'neuro-coach' Modelfile for instructions.
    const response = await ollama.chat({
      model: 'neuro-coach',
      messages: [{ role: 'user', content: scrubbed }],
      format: 'json', 
      stream: false
    })

    // 3. Parse and Restore
    // Clean any potential markdown formatting the model adds
    const cleanJson = response.message.content.replace(/```json|```/g, "").trim();
    const data = JSON.parse(cleanJson);
    
    // Handle cases where model wraps it differently
    const stepsArray = Array.isArray(data) ? data : (data.steps || []);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return stepsArray.map((step: any) => ({
      ...step,
      text: restorePII(step.text, map),
      // Feature 3: Default fallbacks for the new UI features
      duration: step.duration || "5m",
      energy_required: step.energy_required || "Medium"
    }));

  } catch (error) {
    console.error("Local LLM Error:", error);
    // Fallback if local model is offline
    return [
      { id: 1, text: "Ensure Ollama is running (Mock)", duration: "1m", energy_required: "Low" as const },
      { id: 2, text: "Run 'ollama serve' in terminal", duration: "1m", energy_required: "Low" as const }
    ];
  }
}