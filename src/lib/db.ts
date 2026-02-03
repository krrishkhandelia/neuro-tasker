import Dexie, { Table } from 'dexie';

export interface MicroStep {
  id: number;
  text: string;
  duration: string;
  energy_required?: 'High' | 'Medium' | 'Low';
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
  isDyslexicFont?: boolean; // NEW: Store font preference
}

class NeuroTaskerDB extends Dexie {
  tasks!: Table<Task>;
  userStats!: Table<UserStats>;

  constructor() {
    super('NeuroTaskerDB');
    // Bump version to 3 for the new field
    this.version(3).stores({
      tasks: '++id, title, createdAt, completed',
      userStats: '++id, xp, level, isDyslexicFont'
    });
  }
}

export const db = new NeuroTaskerDB();

export async function initStats() {
  const exists = await db.userStats.get(1);
  if (!exists) {
    // Default to standard font (false)
    await db.userStats.add({ id: 1, xp: 0, level: 1, isDyslexicFont: false });
  }
}