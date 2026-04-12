import { Routes } from '@angular/router';

import { DoctorLayoutComponent } from './components/layouts/doctor-layout/doctor-layout.component';
import { DOCTOR_ROUTES } from './components/features/doctor/doctor.routes';

import {Login} from './components/features/auth/login/login'
import {Signup} from './components/features/auth/signup/signup'
import { ADMIN_ROUTES } from './components/features/admin/admin.routes';
import { AdminLayoutComponent } from './components/layouts/admin-layout/admin-layout.component';

export const routes: Routes = [
  {
    path : 'auth/login',
    component: Login
  },
  {
    path : 'auth/register',
    component : Signup
  },
  {
    path: 'doctor',
    component: DoctorLayoutComponent,
    children: DOCTOR_ROUTES
  },
    
  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: ADMIN_ROUTES
  },
    

];
