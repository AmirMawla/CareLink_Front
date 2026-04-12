import { Routes } from '@angular/router';
import { UserList } from './user-list/user-list';
import { AnalyticsDashboard } from './analytics-dashboard/analytics-dashboard';
import { ClinicalAnalytics } from './clinical-analytics/clinical-analytics';
import { PatientAnalytics } from './patient-analytics/patient-analytics';
import { DoctorAnalytics } from './doctor-analytics/doctor-analytics';

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
  {
    path: 'clinical-insights',
    component: ClinicalAnalytics,
    title: 'Clinical Insights'
  },
  {
    path: 'patients-analytics',
    component: PatientAnalytics,
    title: 'Patient Analytics'
  },
  {
    path: 'staff-analytics',
    component: DoctorAnalytics,
    title: 'Staff Analytics'
  }
];