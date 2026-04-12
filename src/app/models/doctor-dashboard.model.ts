export type ChartPeriod = '7d' | '30d' | '90d';

export interface DoctorProfileMe {
  id: number;
  username?: string;
  email?: string;
  specialty?: string;
}

export interface DoctorDashboardStats {
  total_appointments: number;
  appointments_new_this_month: number;
  total_patients: number;
  patients_new_this_month: number;
  completed_total: number;
  completed_today: number;
  no_show_total: number;
  no_show_rate: number;
  avg_wait_minutes_today: number;
  checked_in_today: number;
  pending_requests: number;
  confirmed_today: number;
  currently_waiting: number;
}

export interface ChartPoint {
  date: string;
  label: string;
  count: number;
}

export interface AppointmentsOverTimeResponse {
  period: string;
  points: ChartPoint[];
}

export interface StatusSegment {
  status: string;
  count: number;
  percent: number;
}

export interface StatusBreakdownResponse {
  segments: StatusSegment[];
  total: number;
}

export interface PendingAppointmentRow {
  id: number;
  scheduled_datetime: string;
  status: string;
  is_telemedicine: boolean;
  patient_id: number;
  patient_username: string;
  patient_first_name?: string;
  patient_last_name?: string;
}


export interface DoctorAppointmentListRow extends PendingAppointmentRow {
  check_in_time?: string | null;
  patient_email?: string;
  patient_phone?: string;
  meeting_link?: string | null;
}

export interface DoctorAppointmentsListResponse {
  count: number;
  page: number;
  total_pages: number;
  page_size: number;
  appointments: DoctorAppointmentListRow[];
}

export interface PendingRequestsResponse {
  count: number;
  page: number;
  total_pages: number;
  page_size: number;
  appointments: PendingAppointmentRow[];
}

export interface QueueItem {
  id: number;
  patient_initials: string;
  patient_name: string;
  scheduled_datetime: string;
  wait_minutes: number;
}

export interface QueueTodayResponse {
  items: QueueItem[];
}
