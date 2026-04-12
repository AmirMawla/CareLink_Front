import { Routes } from '@angular/router';
import { DoctorDashboard } from './doctor-dashboard/doctor-dashboard';
import { Doctorqueue } from './doctorqueue/doctorqueue';
import { Consultation } from './consultation/consultation';
import { PatientSummary } from './patient-summary/patient-summary';
import { DoctorAppointments } from './doctor-appointments/doctor-appointments';

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
    component: Consultation,
    title: 'Appointment',
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
