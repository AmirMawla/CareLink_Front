import { Routes } from '@angular/router';
import { DoctorDashboard } from './doctor-dashboard/doctor-dashboard';

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
];
