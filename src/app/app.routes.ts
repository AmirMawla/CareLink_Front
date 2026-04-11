import { Routes } from '@angular/router';

import { DoctorLayoutComponent } from './components/layouts/doctor-layout/doctor-layout.component';
import { DOCTOR_ROUTES } from './components/features/doctor/doctor.routes';

export const routes: Routes = [
  {
    path: 'doctor',
    component: DoctorLayoutComponent,
    children: DOCTOR_ROUTES,
  }
];
