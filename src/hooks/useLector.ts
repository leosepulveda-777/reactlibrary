import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import type { LectorResponse } from '@/types';

interface UseLectorResult {
  lector: LectorResponse | null;
  loading: boolean;
  recargar: () => void;
}

export function useLector(): UseLectorResult {
  const { user } = useAuth();
  const toast    = useToast();
  const [lector,  setLector]  = useState<LectorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick,    setTick]    = useState(0);

  useEffect(() => {
    if (!user?.userId) { setLoading(false); return; }
    setLoading(true);
    api.get<LectorResponse>(`/v1/lectores/usuario/${user.userId}`)
      .then(data => setLector(data))
      .catch(e   => toast((e as Error).message, 'error'))
      .finally(() => setLoading(false));
  }, [user?.userId, tick]);

  function recargar() { setTick(t => t + 1); }

  return { lector, loading, recargar };
}