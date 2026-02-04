'use client';

import React, { useState } from 'react';
import { db } from '@/lib/db';
import { Sparkles, ArrowRight } from 'lucide-react';

interface Props {
  onComplete: (newUserId: number) => void;
}

export default function Onboarding({ onComplete }: Props) {
  const [name, setName] = useState('');
  const [neuroType, setNeuroType] = useState('General');

  const handleSave = async () => {
    if (!name.trim()) return;
    
    // Create NEW user in DB
    const newId = await db.userStats.add({ 
      name: name,
      neuroType: neuroType,
      xp: 0,
      level: 1,
      isDyslexicFont: false
    });
    
    // Pass the new ID back to dashboard to auto-login
    onComplete(Number(newId)); 
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6 animate-in zoom-in-95 duration-300">
      <div className="max-w-md w-full space-y-8 text-center">
        
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 p-4 rounded-full text-green-600">
            <Sparkles size={48} />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-gray-800 tracking-tight">
          New Profile
        </h1>
        <p className="text-gray-500 text-lg">
          Let's set up your personal space.
        </p>

        <div className="space-y-4 text-left bg-gray-50 p-6 rounded-2xl border border-gray-100 mt-8">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex"
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Focus Style</label>
            <select 
              value={neuroType}
              onChange={(e) => setNeuroType(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none bg-white"
            >
              <option value="General">General Focus</option>
              <option value="ADHD">ADHD (Need Novelty)</option>
              <option value="Dyslexia">Dyslexia (Readability)</option>
              <option value="Anxiety">Anxiety (Breaking Friction)</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!name}
          className="w-full bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create Profile <ArrowRight size={20} />
        </button>

      </div>
    </div>
  );
}