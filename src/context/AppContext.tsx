import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  FocusSession,
  ScreenTimeLog,
  UserProfile,
  UserTarget,
  WeeklyReflection,
} from '../types/domain';
import { repository } from '../services/repository';

interface AppContextValue {
  user: UserProfile | null;
  loadingAuth: boolean;
  loadingData: boolean;
  dataError: string | null;
  logs: ScreenTimeLog[];
  focusSessions: FocusSession[];
  target: UserTarget | null;
  reflections: WeeklyReflection[];
  refreshUserData: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const [logs, setLogs] = useState<ScreenTimeLog[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [target, setTarget] = useState<UserTarget | null>(null);
  const [reflections, setReflections] = useState<WeeklyReflection[]>([]);

  const loadDataForUser = useCallback(async (activeUser: UserProfile) => {
    setLoadingData(true);
    setDataError(null);
    try {
      const [logsRes, focusRes, targetRes, reflRes] = await Promise.all([
        repository.getScreenTimeLogs(activeUser.id),
        repository.getFocusSessions(activeUser.id),
        repository.getUserTarget(activeUser.id),
        repository.getWeeklyReflections(activeUser.id),
      ]);

      if (logsRes.error || focusRes.error || targetRes.error || reflRes.error) {
        setDataError(
          logsRes.error ||
            focusRes.error ||
            targetRes.error ||
            reflRes.error ||
            'Terjadi kesalahan saat memuat data dari penyimpanan.',
        );
      }

      setLogs(logsRes.data);
      setFocusSessions(focusRes.data);
      setTarget(targetRes.data);
      setReflections(reflRes.data);
    } catch (err) {
      setDataError(
        err instanceof Error
          ? err.message
          : 'Gagal memuat data pengguna. Kami tidak menampilkan data palsu.',
      );
    } finally {
      setLoadingData(false);
    }
  }, []);

  const refreshUserData = useCallback(async () => {
    const current = await repository.getCurrentUser();
    setUser(current);
    if (current) {
      await loadDataForUser(current);
    } else {
      setLogs([]);
      setFocusSessions([]);
      setTarget(null);
      setReflections([]);
    }
  }, [loadDataForUser]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingAuth(true);
      try {
        const current = await repository.getCurrentUser();
        if (!mounted) return;
        setUser(current);
        if (current) {
          await loadDataForUser(current);
        }
      } finally {
        if (mounted) setLoadingAuth(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [loadDataForUser]);

  return (
    <AppContext.Provider
      value={{
        user,
        loadingAuth,
        loadingData,
        dataError,
        logs,
        focusSessions,
        target,
        reflections,
        refreshUserData,
        setUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp harus digunakan di dalam AppProvider.');
  }
  return ctx;
}
