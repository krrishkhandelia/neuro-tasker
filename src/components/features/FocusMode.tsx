'use client';
import React, { useState } from 'react';
import { X, CheckCircle, ArrowRight, Clock, Play } from 'lucide-react';
import { MicroStep } from '@/lib/db'; // Ensure this points to your DB/Type definition
import { speak } from '@/lib/voice-companion';

interface FocusModeProps {
  steps: MicroStep[];
  onClose: () => void;
  onStepComplete?: () => void; // Hook for XP
  onFinish?: () => void;       // Hook for Final XP
}

export default function FocusMode({ steps, onClose, onStepComplete, onFinish }: FocusModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentStep = steps[currentIndex];
  const isLast = currentIndex === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      if (onFinish) onFinish();
      onClose(); // Task Complete
    } else {
      if (onStepComplete) onStepComplete();
      setCurrentIndex((prev) => prev + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
      {/* Exit Button */}
      <button 
        onClick={onClose} 
        className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-colors"
      >
        <X size={32} />
      </button>

      {/* Main Content */}
      <div className="max-w-2xl w-full text-center space-y-12">
        <div className="flex flex-col items-center gap-2">
            <div className="text-sm font-mono text-green-400 tracking-[0.2em] uppercase">
            Focus Mode • Step {currentIndex + 1} of {steps.length}
            </div>
            
            {/* Subtle Energy Badge (New Feature) */}
            {currentStep?.energy_required && (
                <span className={`text-[10px] px-2 py-0.5 rounded border ${
                    currentStep.energy_required === 'High' ? 'border-red-500 text-red-400' :
                    currentStep.energy_required === 'Medium' ? 'border-yellow-500 text-yellow-400' :
                    'border-green-500 text-green-400'
                }`}>
                    {currentStep.energy_required} Energy
                </span>
            )}
        </div>

        <h2 className="text-4xl md:text-6xl font-bold leading-tight">
          {currentStep?.text}
        </h2>

        <div className="flex items-center justify-center gap-4 text-xl text-gray-400">
          <div className="flex items-center gap-2">
            <Clock size={20} />
            <span>Estimated: <span className="text-white font-semibold">{currentStep?.duration}</span></span>
          </div>
          
          {/* Subtle Voice Button (New Feature) */}
          <button 
            onClick={() => speak(currentStep?.text)}
            className="p-2 hover:bg-gray-800 rounded-full hover:text-green-400 transition-colors"
            title="Read Aloud"
          >
            <Play size={20} />
          </button>
        </div>

        {/* Big Action Button */}
        <button
          onClick={handleNext}
          className="group mt-12 bg-white text-black px-10 py-5 rounded-full text-2xl font-bold flex items-center justify-center gap-4 mx-auto hover:scale-105 transition-transform"
        >
          {isLast ? "Finish Task" : "Next Step"}
          {isLast ? <CheckCircle size={28} /> : <ArrowRight size={28} />}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 h-2 bg-gray-800 w-full">
        <div 
          className="h-full bg-green-500 transition-all duration-500 ease-out"
          style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
        />
      </div>
    </div>
  );
}