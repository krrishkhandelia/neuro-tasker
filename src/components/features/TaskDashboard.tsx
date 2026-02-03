'use client';

import React, { useState, useEffect } from 'react';
import { db, initStats, MicroStep } from '@/lib/db'; 
import { useLiveQuery } from 'dexie-react-hooks';
import { decomposeTask } from '@/lib/ollama'; 
import VoiceInput from './VoiceInput';
import GamificationBar from './GamificationBar';
import FocusMode from './FocusMode'; 
import { speak } from '@/lib/voice-companion';
import { 
  Sparkles, Play, Loader2, Maximize2, 
  Clock, Zap, RotateCcw, Trash2
} from 'lucide-react';

export default function TaskDashboard() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<MicroStep[]>([]);
  const [isFocusMode, setIsFocusMode] = useState(false);

  // 1. Fetch History & Stats
  const tasks = useLiveQuery(() => db.tasks.toArray());
  const stats = useLiveQuery(() => db.userStats.get(1));

  useEffect(() => { initStats(); }, []);

  const handleDecompose = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const result = await decomposeTask(input);
      
      await db.tasks.add({
        title: input,
        createdAt: new Date(),
        completed: false,
        // @ts-ignore
        steps: result.map(s => ({ ...s, completed: false }))
      });
      
      setSteps(result);
      if (stats) await updateXP(20);
      setInput(''); // Clear input after generating

    } catch {
      alert("Mock Mode: AI not connected.");
    } finally {
      setLoading(false);
    }
  };

  const updateXP = async (amount: number) => {
    if (!stats) return;
    let newXp = stats.xp + amount;
    let newLevel = stats.level;
    const required = stats.level * 100;
    
    if (newXp >= required) {
      newXp = newXp - required;
      newLevel += 1;
      speak("Congratulations! You leveled up!");
    }
    await db.userStats.update(1, { xp: newXp, level: newLevel });
  };

  // Helper to delete history items
  const handleDelete = async (id?: number) => {
    if (id) await db.tasks.delete(id);
  };

  return (
    <div className="max-w-3xl mx-auto w-full space-y-8 p-4">
      {stats && <GamificationBar xp={stats.xp} level={stats.level} />}

      {/* INPUT SECTION */}
      <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">What's overwhelming you?</h2>
        
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., Clean my messy room..."
              className="w-full pl-4 pr-12 py-4 text-lg bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none transition-all"
              onKeyDown={(e) => e.key === 'Enter' && handleDecompose()}
            />
            <div className="absolute right-2 top-2">
              <VoiceInput onTranscript={setInput} />
            </div>
          </div>
          
          <button
            onClick={handleDecompose}
            disabled={loading || !input}
            className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all min-w-[150px] justify-center"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {loading ? "Thinking..." : "Break it Down"}
          </button>
        </div>
      </div>

      {/* CURRENT ACTIVE STEPS */}
      {steps.length > 0 && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-700">Micro-Wins ({steps.length})</h3>
            <button
              onClick={() => setIsFocusMode(true)}
              className="flex items-center gap-2 bg-black text-white px-5 py-2 rounded-full hover:scale-105 transition-transform"
            >
              <Play size={16} fill="white" /> Start Focus Mode
            </button>
          </div>

          <div className="grid gap-3">
            {steps.map((step) => (
              <div 
                key={step.id} 
                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-blue-100 text-green-600 flex items-center justify-center font-bold text-sm">
                    {step.id}
                  </div>
                  <div>
                    <span className="font-medium text-gray-800">{step.text}</span>
                    {step.energy_required && (
                      <div className="mt-1">
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                          step.energy_required === 'High' ? 'bg-red-100 text-red-600' :
                          step.energy_required === 'Medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {step.energy_required} Energy
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">
                        {step.duration}
                    </span>
                    <button onClick={() => speak(step.text)} className="text-gray-300 hover:text-green-600 transition-colors">
                        <Play size={16} />
                    </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- HISTORY SECTION (RESTORED) --- */}
      {tasks && tasks.length > 0 && (
        <div className="pt-12 border-t border-gray-200">
          <h3 className="text-sm font-bold text-gray-400 mb-6 uppercase tracking-wider flex items-center gap-2">
            <RotateCcw size={16} /> Previous Sessions
          </h3>
          
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="bg-gray-50 hover:bg-white p-4 rounded-xl border border-transparent hover:border-gray-200 transition-all flex justify-between items-center group">
                <div>
                  <h4 className="font-semibold text-gray-700">{task.title}</h4>
                  <span className="text-xs text-gray-400">
                    {task.createdAt.toLocaleDateString()} • {task.steps.length} steps
                  </span>
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => {
                        // RE-LOAD LOGIC:
                        // 1. Load steps into view
                        // @ts-ignore
                        setSteps(task.steps);
                        // 2. Scroll to top
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-sm bg-white border border-gray-200 text-green-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 font-medium"
                  >
                    Load
                  </button>
                  <button 
                    onClick={() => {
                        // @ts-ignore
                        setSteps(task.steps);
                        setIsFocusMode(true);
                    }}
                    className="p-2 text-gray-400 hover:text-black hover:bg-gray-200 rounded-lg"
                    title="Quick Focus"
                  >
                    <Maximize2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(task.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )).reverse()}
          </div>
        </div>
      )}

      {/* FOCUS MODE OVERLAY */}
      {isFocusMode && (
        <FocusMode 
          steps={steps} 
          onClose={() => setIsFocusMode(false)}
          onStepComplete={() => updateXP(10)} 
          onFinish={() => {
            speak("Task Complete!");
            setIsFocusMode(false);
            updateXP(50);
          }}
        />
      )}
    </div>
  );
}