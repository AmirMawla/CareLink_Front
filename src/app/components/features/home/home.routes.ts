import { Routes } from '@angular/router';
import { Home } from './home/home';


export const HOME_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'home',
    component: Home,
    title: 'Carelink Home',
  },
];
