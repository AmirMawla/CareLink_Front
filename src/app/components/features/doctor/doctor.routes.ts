import { Routes } from '@angular/router';
import { DoctorDashboard } from './doctor-dashboard/doctor-dashboard';
import { Doctorqueue } from './doctorqueue/doctorqueue';
import { Consultation } from './consultation/consultation';
import { PatientSummary } from './patient-summary/patient-summary';
import { DoctorAppointments } from './doctor-appointments/doctor-appointments';
import { DoctorAppointmentDetail } from './doctor-appointment-detail/doctor-appointment-detail';
import { DoctorPatients } from './doctor-patients/doctor-patients';
import { DoctorPatientDetail } from './doctor-patient-detail/doctor-patient-detail';

export const DOCTOR_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'dashboard',
    component: DoctorDashboard,
    title: 'Dashboard',
  },
  {
    path: 'appointments',
    component: DoctorAppointments,
    title: 'My Appointments',
  },
  {
    path: 'appointments/:id',
    component: DoctorAppointmentDetail,
    title: 'Appointment details',
  },
  {
    path: 'patients',
    component: DoctorPatients,
    title: 'My Patients',
  },
  {
    path: 'patients/:id',
    component: DoctorPatientDetail,
    title: 'Patient details',
  },
  {
    path: 'schedule',
    loadComponent: () => import('./weekly-schedule').then((m) => m.WeeklySchedule),
    title: 'Weekly schedule',
  },
  {
    path: 'schedule/exceptions',
    loadComponent: () => import('./schedule-exceptions').then((m) => m.ScheduleExceptions),
    title: 'Days off / exceptions',
  },
  {
    path: 'available-slots',
    loadComponent: () => import('./available-slots').then((m) => m.AvailableSlots),
    title: 'Available slots',
  },
  {
    path: 'profile',
    loadComponent: () => import('./doctor-profile').then((m) => m.DoctorProfile),
    title: 'My profile',
  },
  {
    path: 'queue',
    component: Doctorqueue
  },
  { 
    path: 'consultation/:id',
    component: Consultation
  },
  {     
    path: 'patient-summary/:id',
    component: PatientSummary
  },
];
