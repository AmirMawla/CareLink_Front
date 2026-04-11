import { Routes } from '@angular/router';
import { Doctorqueue } from './components/features/doctor/doctorqueue/doctorqueue';
import { Consultation } from './components/features/doctor/consultation/consultation';
import { PatientSummary } from './components/features/doctor/patient-summary/patient-summary';
import {Login} from './components/features/auth/login/login'

import { DoctorLayoutComponent } from './components/layouts/doctor-layout/doctor-layout.component';
import { DOCTOR_ROUTES } from './components/features/doctor/doctor.routes';

export const routes: Routes = [
  {
    path : 'auth/login',
    component: Login
  },
  {
    path: 'doctor',
    component: DoctorLayoutComponent,
    children: DOCTOR_ROUTES,
  }
];
