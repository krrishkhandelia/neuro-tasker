'use client';

import React, { useState, useEffect } from 'react';
import { db, MicroStep } from '@/lib/db'; 
import { useLiveQuery } from 'dexie-react-hooks';
import { streamDecomposeTask } from '@/lib/ollama'; 
import VoiceInput from './VoiceInput';
import GamificationBar from './GamificationBar';
import FocusMode from './FocusMode'; 
import Onboarding from './Onboarding'; 
import ProfileSelector from './ProfileSelector'; 
import { speak } from '@/lib/voice-companion';
import { 
  Sparkles, Play, Loader2, Maximize2, 
  RotateCcw, Trash2, Type, LogOut
} from 'lucide-react';

export default function TaskDashboard() {
  const [activeUserId, setActiveUserId] = useState<number | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // DASHBOARD STATE
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<MicroStep[]>([]);
  const [isFocusMode, setIsFocusMode] = useState(false);

  // QUERIES
  const allProfiles = useLiveQuery(() => db.userStats.toArray());
  
  const currentUser = useLiveQuery(
    async () => {
      return activeUserId ? await db.userStats.get(activeUserId) : undefined;
    },
    [activeUserId]
  );

  const userTasks = useLiveQuery(
    () => activeUserId ? db.tasks.where('userId').equals(activeUserId).toArray() : [],
    [activeUserId]
  );

  useEffect(() => { 
    // No-op for now, initStats handled by onboarding
  }, []);

  // --- HANDLERS ---

  const handleDeleteProfile = async (id: number) => {
    // 1. Delete User
    await db.userStats.delete(id);
    // 2. Delete ALL their tasks (Clean up)
    const tasksToDelete = await db.tasks.where('userId').equals(id).primaryKeys();
    await db.tasks.bulkDelete(tasksToDelete);
  };

  const handleDecompose = async () => {
    if (!input.trim() || !activeUserId || !currentUser) return;
    setLoading(true);
    setSteps([]); 
    
    try {
      // PASS PROFILE DATA TO AI HERE
      const finalSteps = await streamDecomposeTask(
        input, 
        { name: currentUser.name, neuroType: currentUser.neuroType }, // <--- CUSTOMIZATION
        (partialSteps) => {
          setSteps(partialSteps); 
        }
      );

      if (finalSteps && finalSteps.length > 0) {
        setSteps(finalSteps);
      }
      
      await db.tasks.add({
        userId: activeUserId,
        title: input,
        createdAt: new Date(),
        completed: false,
        // @ts-ignore
        steps: finalSteps.map(s => ({ ...s, completed: false }))
      });
      
      if (currentUser) await updateXP(20);
      setInput(''); 

    } catch {
      alert("Mock Mode: AI not connected.");
    } finally {
      setLoading(false);
    }
  };

  const updateXP = async (amount: number) => {
    if (!currentUser || !activeUserId) return;
    let newXp = currentUser.xp + amount;
    let newLevel = currentUser.level;
    const required = currentUser.level * 100;
    
    if (newXp >= required) {
      newXp = newXp - required;
      newLevel += 1;
      speak(`Way to go ${currentUser.name}! You leveled up!`);
    }
    await db.userStats.update(activeUserId, { xp: newXp, level: newLevel });
  };

  const toggleDyslexicFont = async () => {
    if (!currentUser || !activeUserId) return;
    await db.userStats.update(activeUserId, { isDyslexicFont: !currentUser.isDyslexicFont });
  };

  const handleDeleteTask = async (id?: number) => {
    if (id) await db.tasks.delete(id);
  };

  const handleLogout = () => {
    setSteps([]);
    setInput('');
    setActiveUserId(null); 
  };

  // --- VIEW LOGIC ---

  if (!allProfiles) return null;

  if (isCreatingNew) {
    return <Onboarding onComplete={(newId) => {
      setIsCreatingNew(false);
      setActiveUserId(newId);
    }} />;
  }

  if (!activeUserId) {
    return (
      <ProfileSelector 
        profiles={allProfiles} 
        onSelectProfile={setActiveUserId}
        onCreateNew={() => setIsCreatingNew(true)}
        onDeleteProfile={handleDeleteProfile} // <--- Connected
      />
    );
  }

  const fontClass = currentUser?.isDyslexicFont ? 'font-[family-name:var(--font-lexend)]' : 'font-sans';

  return (
    <div className={`max-w-3xl mx-auto w-full space-y-8 p-4 ${fontClass}`}>
      
      {/* HEADER */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
        
        {/* Left: User Info */}
        <div className="w-full sm:flex-1">
             <div className="mb-2 pl-1 flex justify-between items-center">
                <div>
                  <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Welcome,</span>
                  <h3 className="text-xl font-bold text-gray-800">
                    {currentUser?.name} <span className="text-gray-300 text-sm font-normal">({currentUser?.neuroType})</span>
                  </h3>
                </div>
             </div>
             {currentUser && <GamificationBar xp={currentUser.xp} level={currentUser.level} />}
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-6">
            <button
              onClick={toggleDyslexicFont}
              className={`p-2 px-4 rounded-lg transition-all flex items-center gap-2 text-sm font-bold border ${
                currentUser?.isDyslexicFont 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' 
                  : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
              }`}
              title="Toggle Dyslexia-Friendly Font"
            >
              <Type size={18} />
            </button>

            <button
              onClick={handleLogout}
              className="p-2 px-3 rounded-lg bg-gray-50 text-gray-400 border border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"
              title="Switch Profile"
            >
              <LogOut size={18} />
            </button>
        </div>
      </div>

      {/* INPUT */}
      <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">What's overwhelming you?</h2>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`e.g., Clean my messy room...`}
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
            className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all min-w-[150px] justify-center"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {loading ? "Thinking..." : "Break it Down"}
          </button>
        </div>
      </div>

      {/* ACTIVE RESULTS */}
      {(steps.length > 0 || loading) && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-700">Micro-Wins ({steps.length})</h3>
            {steps.length > 0 && (
              <button
                onClick={() => setIsFocusMode(true)}
                className="flex items-center gap-2 bg-black text-white px-5 py-2 rounded-full hover:scale-105 transition-transform shadow-lg"
              >
                <Play size={16} fill="white" /> Start Focus Mode
              </button>
            )}
          </div>
          <div className="grid gap-3">
            {loading && steps.length === 0 && (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 h-24 flex items-center gap-4">
                    <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {steps.map((step) => (
              <div key={step.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow group">
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

      {/* HISTORY */}
      {userTasks && userTasks.length > 0 && (
        <div className="pt-12 border-t border-gray-200">
          <h3 className="text-sm font-bold text-gray-400 mb-6 uppercase tracking-wider flex items-center gap-2">
            <RotateCcw size={16} /> Previous Sessions
          </h3>
          <div className="space-y-3">
            {userTasks.map((task) => (
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
                        // @ts-ignore
                        setSteps(task.steps);
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
                    onClick={() => handleDeleteTask(task.id)}
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

      {/* FOCUS MODE */}
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