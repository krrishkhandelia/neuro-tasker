'use client';

import React from 'react';
import { UserStats } from '@/lib/db';
import { User, Plus, ArrowRight, Trash2 } from 'lucide-react';

interface Props {
  profiles: UserStats[];
  onSelectProfile: (id: number) => void;
  onCreateNew: () => void;
  onDeleteProfile: (id: number) => void; // <--- New Prop
}

export default function ProfileSelector({ profiles, onSelectProfile, onCreateNew, onDeleteProfile }: Props) {
  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="max-w-md w-full space-y-8">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-800">Who is focusing today?</h1>
          <p className="text-gray-500">Select your local profile to continue.</p>
        </div>

        {/* Profile List */}
        <div className="grid gap-3">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="group relative flex items-center"
            >
              {/* Main Card */}
              <button
                onClick={() => profile.id && onSelectProfile(profile.id)}
                className="flex-1 bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-green-500 transition-all flex items-center justify-between z-10"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-xl">
                    {profile.name?.charAt(0).toUpperCase() || <User size={24} />}
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-gray-800 text-lg group-hover:text-green-700 transition-colors">
                      {profile.name || "Unnamed Hero"}
                    </h3>
                    <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded-full">
                      Lvl {profile.level} • {profile.neuroType || "General"}
                    </span>
                  </div>
                </div>
                <ArrowRight className="text-gray-300 group-hover:text-green-500 transition-colors" />
              </button>

              {/* Delete Button (Appears on Hover) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if(confirm(`Are you sure you want to delete ${profile.name}? This cannot be undone.`)) {
                     profile.id && onDeleteProfile(profile.id);
                  }
                }}
                className="absolute -right-12 p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                title="Delete Profile"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}

          {/* Create New Button */}
          <button
            onClick={onCreateNew}
            className="mt-4 w-full border-2 border-dashed border-gray-300 p-4 rounded-xl flex items-center justify-center gap-2 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-all font-medium"
          >
            <Plus size={20} /> Create New Profile
          </button>
        </div>

      </div>
    </div>
  );
}