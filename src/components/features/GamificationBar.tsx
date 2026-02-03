import React from 'react';
import { Trophy } from 'lucide-react';

interface Props {
  xp: number;
  level: number;
}

export default function GamificationBar({ xp, level }: Props) {
  // Safety: Prevent division by zero if level is somehow 0
  const xpToNext = level * 100;
  
  // Calculate percentage and ensure it is a clean integer (0-100)
  const rawProgress = xpToNext > 0 ? (xp / xpToNext) * 100 : 0;
  const progress = Math.min(Math.round(rawProgress), 100);

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex items-center gap-4">
      <div className="bg-yellow-100 p-3 rounded-full text-yellow-600">
        <Trophy size={24} />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold text-gray-800 text-lg">Level {level}</span>
          <span className="text-sm text-gray-500">{xp} / {xpToNext} XP</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-500" 
            // FIX: Using string concatenation + integer prevents the yellow warning
            style={{ width: progress + "%" }}
          />
        </div>
      </div>
    </div>
  );
}