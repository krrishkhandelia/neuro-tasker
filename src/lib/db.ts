import Dexie, { Table } from 'dexie';

export interface MicroStep {
  id: number;
  text: string;
  duration: string;
  energy_required?: 'High' | 'Medium' | 'Low';
}

export interface Task {
  id?: number;
  userId: number; // <--- NEW: Links task to a specific profile
  title: string;
  createdAt: Date;
  completed: boolean;
  steps: MicroStep[];
}

export interface UserStats {
  id?: number;
  xp: number;
  level: number;
  isDyslexicFont?: boolean;
  name?: string; 
  neuroType?: string;
}

class NeuroTaskerDB extends Dexie {
  tasks!: Table<Task>;
  userStats!: Table<UserStats>;

  constructor() {
    super('NeuroTaskerDB');
    // Bump version to 5 to add 'userId' index
    this.version(5).stores({
      tasks: '++id, userId, title, createdAt, completed',
      userStats: '++id, xp, level, isDyslexicFont, name, neuroType'
    });
  }
}

export const db = new NeuroTaskerDB();

export async function initStats() {
  // We no longer force-create a user here. 
  // We let the Profile Selector handle creation.
}