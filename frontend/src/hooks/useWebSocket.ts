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

const MAX_RECONNECT_DELAY = 30000; // 30 seconds
const INITIAL_RECONNECT_DELAY = 1000; // 1 second

export const useWebSocket = (url: string) => {
  const ws = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const { addMessage, updateAgentStatus } = useStore();
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef<number>(0);

  const getReconnectDelay = (): number => {
    // Exponential backoff: 1s, 2s, 4s, 8s, ..., capped at 30s
    const delay = Math.min(
      INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts.current),
      MAX_RECONNECT_DELAY
    );
    // Add jitter (±20%) to prevent thundering herd
    return delay * (0.8 + Math.random() * 0.4);
  };

  const scheduleReconnect = () => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    const delay = getReconnectDelay();
    reconnectAttempts.current += 1;
    reconnectTimer.current = setTimeout(() => {
      connect();
    }, delay);
  };

  const connect = () => {
    const wsUrl = getWsUrl(url);
    try {
      const socket = new WebSocket(wsUrl);
      ws.current = socket;

      socket.onopen = () => {
        setConnected(true);
        reconnectAttempts.current = 0;
        addMessage({
          agent: 'System',
          content: 'Connected to TraeGuardian orchestrator (LangGraph + local ML).',
          type: 'status',
        });
        try {
          socket.send(JSON.stringify({ type: 'restore_session' }));
        } catch (e) {
          console.error('Failed to send restore_session:', e);
        }
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
          reconnectTimer.current = null;
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as Record<string, unknown>;

          if (data.type === 'agent_status') {
            updateAgentStatus(String(data.agent), String(data.status));
          } else if (data.type === 'agent_response') {
            const errorType = data.error_type ? String(data.error_type) : null;
            const confidence = data.confidence ? (data.confidence as number) : null;
            const extra = errorType
              ? `\n\n[class: ${errorType}${confidence ? `, ${(confidence * 100).toFixed(1)}%` : ''}]`
              : '';
            addMessage({
              agent: String(data.agent),
              content: `${data.message}${extra}`,
              type: 'response',
            });
            updateAgentStatus(String(data.agent), 'Online');
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
          addMessage({
            agent: 'System',
            content: 'Error parsing server message',
            type: 'error',
          });
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnected(false);
        addMessage({
          agent: 'System',
          content: 'Connection error. Retrying...',
          type: 'error',
        });
      };

      socket.onclose = () => {
        setConnected(false);
        const delay = getReconnectDelay();
        const delaySeconds = Math.ceil(delay / 1000);
        addMessage({
          agent: 'System',
          content: `WebSocket disconnected. Reconnecting in ${delaySeconds}s...`,
          type: 'status',
        });
        scheduleReconnect();
      };
    } catch (e) {
      console.error('WebSocket creation error:', e);
      scheduleReconnect();
    }
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
      try {
        ws.current.send(JSON.stringify(message));
      } catch (e) {
        console.error('Failed to send WebSocket message:', e);
        addMessage({
          agent: 'System',
          content: 'Failed to send message to server',
          type: 'error',
        });
      }
    } else {
      console.warn('WebSocket not connected. Message queued:', message);
    }
  };

  return { sendMessage, connected };
};
