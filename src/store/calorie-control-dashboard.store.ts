import type { CalorieControlDashboard } from '@/services/calorie-control.service';
import { fetchCalorieControlDashboard } from '@/services/calorie-control.service';

type Listener = () => void;

const dashboardsByDate = new Map<string, CalorieControlDashboard>();
const listenersByDate = new Map<string, Set<Listener>>();

function notify(date: string) {
  const listeners = listenersByDate.get(date);
  if (!listeners) return;
  for (const listener of Array.from(listeners)) {
    try {
      listener();
    } catch {
      // ignore
    }
  }
}

export function getCachedCalorieControlDashboard(date: string): CalorieControlDashboard | undefined {
  return dashboardsByDate.get(date);
}

export function setCachedCalorieControlDashboard(date: string, value: CalorieControlDashboard) {
  dashboardsByDate.set(date, value);
  notify(date);
}

export function subscribeCalorieControlDashboard(date: string, listener: Listener): () => void {
  const set = listenersByDate.get(date) ?? new Set<Listener>();
  set.add(listener);
  listenersByDate.set(date, set);
  return () => {
    const current = listenersByDate.get(date);
    if (!current) return;
    current.delete(listener);
    if (current.size === 0) listenersByDate.delete(date);
  };
}

export async function refreshCalorieControlDashboard(date: string): Promise<CalorieControlDashboard> {
  const dashboard = await fetchCalorieControlDashboard(date);
  setCachedCalorieControlDashboard(date, dashboard);
  return dashboard;
}

