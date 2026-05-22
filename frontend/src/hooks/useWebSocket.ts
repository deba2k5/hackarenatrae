import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore';

declare global {
  interface Window {
    TRAEGUARDIAN_CONFIG?: { wsUrl?: string; apiUrl?: string };
  }
}

function getWsUrl(fallback: string): string {
  return window.TRAEGUARDIAN_CONFIG?.wsUrl ?? fallback;
}

export const useWebSocket = (url: string) => {
  const ws = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const { addMessage, updateAgentStatus } = useStore();

  useEffect(() => {
    const wsUrl = getWsUrl(url);
    const socket = new WebSocket(wsUrl);
    ws.current = socket;

    socket.onopen = () => {
      setConnected(true);
      addMessage({
        agent: 'System',
        content: 'Connected to TraeGuardian orchestrator (LangGraph + local ML).',
        type: 'status',
      });
      socket.send(JSON.stringify({ type: 'restore_session' }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'agent_status') {
        updateAgentStatus(data.agent, data.status);
      } else if (data.type === 'agent_response') {
        const extra = data.error_type
          ? `\n\n[class: ${data.error_type}${data.confidence ? `, ${(data.confidence * 100).toFixed(1)}%` : ''}]`
          : '';
        addMessage({
          agent: data.agent,
          content: `${data.message}${extra}`,
          type: 'response',
        });
        updateAgentStatus(data.agent, 'Online');
      }
    };

    socket.onerror = () => {
      setConnected(false);
      addMessage({
        agent: 'System',
        content: 'WebSocket disconnected. Start backend: uvicorn on port 8000.',
        type: 'error',
      });
    };

    socket.onclose = () => setConnected(false);

    return () => {
      socket.close();
      setConnected(false);
    };
  }, [url]);

  const sendMessage = (message: Record<string, unknown>) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  return { sendMessage, connected };
};
