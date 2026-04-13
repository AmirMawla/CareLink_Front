export type ChartPeriod = '7d' | '30d' | '90d';

export interface DoctorProfileMe {
  id: number;
  username?: string;
  email?: string;
  role?: string;
  specialty?: string;
  session_duration?: number | null;
  buffer_time?: number | null;
}

export interface DoctorProfileUpdateResponse {
  message: string;
  doctor: DoctorProfileMe;
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
  /** Doctor profile session price (same unit as stored in backend, typically whole currency units). */
  session_price?: number;
  /** Total revenue: COMPLETED appointments × session_price (all time). */
  revenue_total?: number;
  revenue_this_month?: number;
  revenue_today?: number;
  revenue_last_month?: number;
  /** Month-over-month change for this month's revenue vs last calendar month; null if last month revenue was 0 but this month has revenue. */
  revenue_mom_change_percent?: number | null;
  completed_this_month?: number;
  completed_last_month?: number;
  /** Completed / non-cancelled appointments, percent. */
  completion_rate?: number;
}

export interface ChartPoint {
  date: string;
  label: string;
  count: number;
  /** Same-day COMPLETED count (used for revenue). */
  completed_count?: number;
  /** completed_count × session_price for that day. */
  revenue?: number;
}

export interface AppointmentsOverTimeResponse {
  period: string;
  session_price?: number;
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
  has_consultation?: boolean;
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

export interface DoctorAppointmentDetailPatient {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  email?: string;
  role?: string;
  date_of_birth?: string | null;
  phone_number?: string;
  medical_history?: string;
}

export interface DoctorAppointmentDetailPrescription {
  id: number;
  drug_name: string;
  dose: string;
  duration_days: number;
}

export interface DoctorAppointmentDetailTest {
  id: number;
  test_name: string;
}

export interface DoctorAppointmentDetailConsultation {
  id: number;
  diagnosis?: string;
  clinical_notes?: string;
  created_at?: string;
  prescriptions: DoctorAppointmentDetailPrescription[];
  tests: DoctorAppointmentDetailTest[];
}

export interface DoctorAppointmentDetailData {
  id: number;
  patient: DoctorAppointmentDetailPatient;
  scheduled_datetime: string;
  status: string;
  check_in_time?: string | null;
  is_telemedicine: boolean;
  meeting_link?: string | null;
  consultation: DoctorAppointmentDetailConsultation | null;
}

export interface DoctorAppointmentDetailResponse {
  appointment: DoctorAppointmentDetailData;
}


export interface DoctorPatientListRow {
  id: number;
  username: string;
  email: string;
  date_of_birth?: string | null;
  phone_number?: string;
  appointments_count: number;
  last_appointment_at?: string | null;
  next_appointment_at?: string | null;
}

export interface DoctorPatientsListResponse {
  count: number;
  page: number;
  total_pages: number;
  page_size: number;
  patients: DoctorPatientListRow[];
}

export interface DoctorPatientDetailAppointment {
  id: number;
  scheduled_datetime: string;
  status: string;
  is_telemedicine: boolean;
  meeting_link?: string | null;
  check_in_time?: string | null;
  consultation: DoctorAppointmentDetailConsultation | null;
}

export interface DoctorPatientDetailData {
  id: number;
  username: string;
  email: string;
  role?: string;
  date_of_birth?: string | null;
  phone_number?: string;
  medical_history?: string;
  last_appointment_at?: string | null;
  next_appointment_at?: string | null;
  appointments: DoctorPatientDetailAppointment[];
}

export interface DoctorPatientDetailResponse {
  patient: DoctorPatientDetailData;
}

export interface DoctorWeeklySchedule {
  id: number;
  doctor: number;
  day_of_week: number; 
  start_time: string; 
  end_time: string;
}

export interface DoctorWeeklyScheduleResponse {
  message: string;
  schedule: DoctorWeeklySchedule;
}

export interface DoctorWeeklyScheduleBulkSetResponse {
  message: string;
  days_set: number[];
  schedules: DoctorWeeklySchedule[];
}

export interface DoctorWeeklyScheduleBulkDeleteResponse {
  message: string;
  deleted_count: number;
}

export interface DoctorScheduleException {
  id: number;
  doctor: number;
  date: string; // YYYY-MM-DD
  is_day_off: boolean;
  start_time?: string | null; // HH:MM:SS
  end_time?: string | null;
}

export interface DoctorScheduleExceptionResponse {
  message: string;
  exception: DoctorScheduleException;
}

export interface DoctorAvailableSlotsResponse {
  doctor: DoctorProfileMe & {
    role?: string;
    session_duration?: number;
    buffer_time?: number;
  };
  weekly_schedules: DoctorWeeklySchedule[];
  schedule_exceptions: DoctorScheduleException[];
  range_start: string;
  range_end: string;
  selected_date: string | null;
  available_slots: string[];
  session_duration: number;
  buffer_time: number;
}
