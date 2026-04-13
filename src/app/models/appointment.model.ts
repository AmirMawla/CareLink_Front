export interface PatientInfo {
  id: number;
  full_name: string;
  phone_number: string;
}

export interface DoctorInfo {
  id: number;
  full_name: string;
  specialty: string;
}

export type AppointmentStatus =
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface Appointment {
  id: number;
  patient: PatientInfo;
  doctor: DoctorInfo;
  scheduled_datetime: string;
  status: AppointmentStatus;
  check_in_time?: string;
  waiting_time_minutes?: number;
  is_telemedicine: boolean;
}
