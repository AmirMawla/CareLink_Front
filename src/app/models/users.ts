export interface BaseProfile {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  role: string;
}

export interface DoctorProfile extends BaseProfile {
  specialty: string;
  session_duration: number;
  buffer_time: number;
  session_price: number;
}

export interface PatientProfile extends BaseProfile {
  date_of_birth: string;
  phone_number: string;
  medical_history: string;
}

export interface ReceptionistProfile extends BaseProfile {
  doctor: number;
  doctor_name: string;
}

export interface AdminProfile extends BaseProfile {}