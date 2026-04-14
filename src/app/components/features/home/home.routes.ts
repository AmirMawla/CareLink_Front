import { Routes } from '@angular/router';
import { Home } from './home/home';
import { DoctorList } from './doctor-list/doctor-list';
import { BookAppointmentComponent } from './book-appointment/book-appointment';
import { PatientAppointments } from './patient-appointments/patient-appointments';
import { AppointmentSummaryComponent } from './appointment-summary/appointment-summary';
import { Profile } from '../auth/profile/profile';
import { ChangePassword } from '../auth/change-password/change-password';

export const HOME_ROUTES: Routes = [
  {
    path: '',
    component: Home,
    title: 'Carelink Home',
  },
  {
    path: 'doctors/:doctorId',
    component: BookAppointmentComponent,
    title: 'Book appointment | CareLink',
  },
  {
    path: 'doctors',
    component: DoctorList,
    title: 'Find Doctors | CareLink',
  },
  {
    path: 'my-appointments',
    component: PatientAppointments,
    title: 'My appointments | CareLink',
  },
  {
    path: 'patient/history/:id',
    component: AppointmentSummaryComponent,
    title: 'Appointment summary | CareLink',
  },
  {
    path : 'ChangePassword',
    component : ChangePassword
  },
  {
    path : 'profile',
    component : Profile
  },
];
