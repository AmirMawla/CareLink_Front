import { Routes } from '@angular/router';

import { DoctorLayoutComponent } from './components/layouts/doctor-layout/doctor-layout.component';
import { DOCTOR_ROUTES } from './components/features/doctor/doctor.routes';

import {Login} from './components/features/auth/login/login'
import {Signup} from './components/features/auth/signup/signup'
import {Profile} from './components/features/auth/profile/profile'
import { ADMIN_ROUTES } from './components/features/admin/admin.routes';
import { AdminLayoutComponent } from './components/layouts/admin-layout/admin-layout.component';
import { ChangePassword } from './components/features/auth/change-password/change-password';

import {Consultationhistory} from './components/features/doctor/consultationhistory/consultationhistory'
import{Doctorqueue} from './components/features/doctor/doctorqueue/doctorqueue'
import {Consultation} from './components/features/doctor/consultation/consultation'
import {PatientSummary} from './components/features/doctor/patient-summary/patient-summary'
import {DoctorAppointments} from './components/features/doctor/doctor-appointments/doctor-appointments'

import { PatientAppointments} from './components/features/patient/patient-appointments/patient-appointments';
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
    path : 'auth/ChangePassword',
    component : ChangePassword
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
