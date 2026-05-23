import { create } from 'zustand';

/**
 * Generates a cryptographically secure unique message ID.
 * Prevents ID collisions using crypto API with fallback.
 */
function generateMessageId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

interface Message {
  id: string;
  agent: string;
  content: string;
  type: 'log' | 'status' | 'response' | 'error';
  timestamp: Date;
}

interface SystemHealth {
  models_ready?: boolean;
  huggingface?: { configured?: boolean };
  mongodb?: { ok: boolean };
  chroma?: { ok: boolean; documents?: number };
}

export type { SystemHealth };

interface AppState {
  messages: Message[];
  agentsStatus: Record<string, string>;
  systemHealth: SystemHealth;
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
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
  addMessage: (msg) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...msg,
          id: generateMessageId(),
          timestamp: new Date(),
        },
      ],
    })),
  clearMessages: () => set({ messages: [] }),
  updateAgentStatus: (agent, status) =>
    set((state) => ({
      agentsStatus: { ...state.agentsStatus, [agent]: status },
    })),
  setSystemHealth: (health) => set({ systemHealth: health }),
}));
