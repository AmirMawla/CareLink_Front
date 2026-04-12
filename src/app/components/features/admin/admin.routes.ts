import { Routes } from '@angular/router';
import { UserList } from './user-list/user-list';
import { AnalyticsDashboard } from './analytics-dashboard/analytics-dashboard';

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
  {
    path: 'analytics',
    component: AnalyticsDashboard,
    title: 'Hospital Analytics'
  },
];