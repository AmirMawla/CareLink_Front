import { Routes } from '@angular/router';

import { DoctorLayoutComponent } from './components/layouts/doctor-layout/doctor-layout.component';
import { DOCTOR_ROUTES } from './components/features/doctor/doctor.routes';

import { Login } from './components/features/auth/login/login';
import { Signup } from './components/features/auth/signup/signup';
import { Profile } from './components/features/auth/profile/profile';
import { ADMIN_ROUTES } from './components/features/admin/admin.routes';
import { AdminLayoutComponent } from './components/layouts/admin-layout/admin-layout.component';
import { QueueComponent } from './components/features/reception/queue/queue';
import { ReceptionistLayoutComponent } from './components/layouts/receptionist-layout/receptionist-layout.component';
import { AppointmentListComponent } from './components/features/reception/appointment-list/appointment-list';
import { RECEPTION_ROUTES } from './components/features/reception/reception.routes';

export const routes: Routes = [
  {
    path: 'auth/login',
    component: Login,
  },
  {
    path: 'auth/register',
    component: Signup,
  },
  {
    path: 'auth/profile',
    component: Profile,
  },
  {
    path: 'doctor',
    component: DoctorLayoutComponent,
    children: DOCTOR_ROUTES,
  },

  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: ADMIN_ROUTES,
  },
  {
    path: 'receptionist',
    component: ReceptionistLayoutComponent,
    children: RECEPTION_ROUTES,
  },
];
