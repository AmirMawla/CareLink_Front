import { Routes } from '@angular/router';
import { Home } from './home/home';
import { DoctorList } from './doctor-list/doctor-list';

export const HOME_ROUTES: Routes = [
  {
    path: '',
    component: Home,
    title: 'Carelink Home',
  },
  {
    path: 'doctors',
    component: DoctorList,
    title: 'Find Doctors | CareLink',
  },
];
