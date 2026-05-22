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
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
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
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
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

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    };

    socket.onclose = () => {
      setConnected(false);
      addMessage({
        agent: 'System',
        content: 'WebSocket disconnected. Reconnecting in 3 seconds...',
        type: 'status',
      });
      reconnectTimer.current = setTimeout(() => {
        connect();
      }, 3000);
    };
  };

  useEffect(() => {
    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
    };
  }, [url]);

  const sendMessage = (message: Record<string, unknown>) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  return { sendMessage, connected };
};
