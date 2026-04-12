import { Routes } from '@angular/router';
import { UserList } from './user-list/user-list';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'users',
  },
  {
    path: 'users',
    component: UserList,
    title: 'User Management',
  },
];