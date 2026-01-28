
export interface Section {
  id: string;
  title: string;
  content: string;
  notes?: string;
  attachments?: string[];
  aiSuggested?: boolean;
  suggestions?: string[];
}

export type TaskStatus = 'backlog' | 'todo' | 'doing' | 'done';
export type TaskPriority = 'urgent' | 'normal' | 'low';

export interface PlotChoice {
  id: string;
  text: string;
  targetNodeId: string | null;
}

export interface PlotNode {
  id: string;
  title: string;
  type: 'dialogue' | 'scene' | 'choice' | 'action';
  content: string;
  choices: PlotChoice[];
  color?: string;
  position: { x: number; y: number };
}

export interface StoryFlowData {
  id: string;
  name: string;
  plotNodes: PlotNode[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TaskComment {
  id: string;
  text: string;
  timestamp: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  checklist: ChecklistItem[];
  comments: TaskComment[];
  attachments?: string[];
  reminder?: number; // Timestamp for the reminder
  reminderSent?: boolean; // Flag to prevent multiple alerts
}

export interface GameProject {
  id: string;
  title: string;
  genre: string;
  lastModified: number;
  timeSpent: number; // в миллисекундах
  hourlyRate: number; // стоимость часа
  sections: Section[];
  tasks: Task[];
  storyFlows: StoryFlowData[];
}

export type ViewState = 'dashboard' | 'editor';

export interface AIResponse {
  suggestion: string;
  type: 'expand' | 'rewrite' | 'summarize' | 'brainstorm';
}
