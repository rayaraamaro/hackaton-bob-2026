import { useState, useEffect } from 'react';
import { useWebSocket } from './useWebSocket';
import { getTokenUsage, TokenUsage } from '../services/api';

interface Alert {
  level: 'warning' | 'critical' | 'info';
  message: string;
  percentage: number;
}

export function useTokenMonitor(projectId: string | null) {
  const [tokens, setTokens] = useState(0);
  const [cost, setCost] = useState(0);
  const [limit, setLimit] = useState(50000);
  const [percentage, setPercentage] = useState(0);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const { lastMessage } = useWebSocket(projectId);

  // Fetch initial token usage
  useEffect(() => {
    if (!projectId) return;

    const fetchUsage = async () => {
      try {
        const usage: TokenUsage = await getTokenUsage(projectId);
        setTokens(usage.total_tokens);
        setCost(usage.total_cost);
        setLimit(usage.token_limit);
        setPercentage(usage.percentage);
      } catch (error) {
        console.error('Failed to fetch token usage:', error);
      }
    };

    fetchUsage();
  }, [projectId]);

  // Listen for real-time updates
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === 'token:update') {
      const data = lastMessage.data;
      setTokens(data.total_tokens);
      setCost(data.total_cost);
      setLimit(data.token_limit);
      setPercentage(data.percentage);
    }

    if (lastMessage.type === 'budget:alert') {
      const alert: Alert = {
        level: lastMessage.data.level,
        message: lastMessage.data.message,
        percentage: lastMessage.data.percentage * 100,
      };
      setAlerts((prev) => [...prev, alert]);
    }
  }, [lastMessage]);

  return {
    tokens,
    cost,
    limit,
    percentage,
    alerts,
  };
}

// Made with Bob
