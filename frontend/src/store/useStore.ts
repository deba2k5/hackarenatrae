import { create } from 'zustand';

interface Message {
  id: string;
  agent: string;
  content: string;
  type: 'log' | 'status' | 'response' | 'error';
}

interface SystemHealth {
  models_ready?: boolean;
  huggingface?: { configured?: boolean };
  mongodb?: { ok: boolean };
  chroma?: { ok: boolean; documents?: number };
}

interface AppState {
  messages: Message[];
  agentsStatus: Record<string, string>;
  systemHealth: SystemHealth;
  addMessage: (msg: Omit<Message, 'id'>) => void;
  updateAgentStatus: (agent: string, status: string) => void;
  setSystemHealth: (health: SystemHealth) => void;
}

export const useStore = create<AppState>((set) => ({
  messages: [],
  systemHealth: {},
  agentsStatus: {
    Terminal: 'Standby',
    Recovery: 'Standby',
    Memory: 'Standby'
  },
  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, { ...msg, id: Math.random().toString(36).substr(2, 9) }]
  })),
  updateAgentStatus: (agent, status) => set((state) => ({
    agentsStatus: {
      ...state.agentsStatus,
      [agent]: status
    }
  })),
  setSystemHealth: (health) => set({ systemHealth: health })
}));
