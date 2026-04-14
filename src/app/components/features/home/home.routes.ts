import { Routes } from '@angular/router';
import { Home } from './home/home';
import { DoctorList } from './doctor-list/doctor-list';
import { Profile } from '../auth/profile/profile';
import { ChangePassword } from '../auth/change-password/change-password';

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
  {
    path : 'ChangePassword',
    component : ChangePassword
  },
  {
    path : 'profile',
    component : Profile
  },
];
