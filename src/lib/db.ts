import Dexie, { Table } from 'dexie';

export interface MicroStep {
  id: number;
  text: string;
  duration: string;
  completed: boolean;
  energy_required?: 'High' | 'Medium' | 'Low'; // New Feature: Energy
}

export interface Task {
  id?: number;
  title: string;
  createdAt: Date;
  completed: boolean;
  steps: MicroStep[];
}

export interface UserStats {
  id?: number;
  xp: number;
  level: number;
}

class NeuroTaskerDB extends Dexie {
  tasks!: Table<Task>;
  userStats!: Table<UserStats>;

  constructor() {
    super('NeuroTaskerDB');
    
    // Version 2 adds userStats. Dexie handles the upgrade automatically.
    this.version(2).stores({
      tasks: '++id, title, createdAt, completed',
      userStats: '++id, xp, level'
    });
  }
}

export const db = new NeuroTaskerDB();

// Helper to initialize stats if they don't exist
export async function initStats() {
  const exists = await db.userStats.get(1);
  if (!exists) {
    await db.userStats.add({ id: 1, xp: 0, level: 1 });
  }
}