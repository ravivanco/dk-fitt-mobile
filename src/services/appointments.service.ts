import { apiClient } from '@/services/api.client';

export type Appointment = {
  id_cita: number | string;
  fecha_hora: string;
  estado?: string;
  nombre_nutricionista?: string;
  notas?: string;
  [key: string]: unknown;
};

type AppointmentsResponse =
  | { success: true; data: Appointment[] }
  | { success?: boolean; data?: unknown; [key: string]: unknown };

export async function fetchMyAppointments(params?: { proximas?: boolean }): Promise<Appointment[]> {
  const proximas = params?.proximas ?? true;
  const response = await apiClient.get<AppointmentsResponse>('/appointments/me', {
    params: { proximas: proximas ? 'true' : 'false' },
    timeout: 60_000,
  });

  const payload: any = response.data as any;
  const data = payload?.data;
  return Array.isArray(data) ? (data as Appointment[]) : [];
}

