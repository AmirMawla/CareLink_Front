import { Routes } from '@angular/router';

import { DoctorLayoutComponent } from './components/layouts/doctor-layout/doctor-layout.component';
import { DOCTOR_ROUTES } from './components/features/doctor/doctor.routes';

import {Login} from './components/features/auth/login/login'
import {Signup} from './components/features/auth/signup/signup'
import {Profile} from './components/features/auth/profile/profile'
import { ADMIN_ROUTES } from './components/features/admin/admin.routes';
import { AdminLayoutComponent } from './components/layouts/admin-layout/admin-layout.component';
import { HOME_ROUTES } from './components/features/home/home.routes';

export const routes: Routes = [
 
  {
    path : '',
    // component: ,
    children: HOME_ROUTES
  },
 
  {
    path : 'auth/login',
    component: Login
  },
  {
    path : 'auth/register',
    component : Signup
  },
  {
    path : 'auth/profile',
    component : Profile
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
