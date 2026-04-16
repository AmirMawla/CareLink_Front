import { Routes } from '@angular/router';
import { UserList } from './user-list/user-list';
import { AnalyticsDashboard } from './analytics-dashboard/analytics-dashboard';
import { ClinicalAnalytics } from './clinical-analytics/clinical-analytics';
import { PatientAnalytics } from './patient-analytics/patient-analytics';
import { DoctorAnalytics } from './doctor-analytics/doctor-analytics';
import { ReportGenerator } from './report-generator/report-generator';
import { AuditLogs } from './audit-logs/audit-logs';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'dashboard',
    component: AnalyticsDashboard,
    title: 'Dashboard | CareLink',
  },
  {
    path: 'reports',
    component: ReportGenerator,
    title: 'Report Center | CareLink',
  },
  {
    path: 'audits',
    component: AuditLogs,
    title: 'Reschedualing and audits',
  },
  /* Analytics Deep Dives (Nested to match Sidebar) */
  {
    path: 'analytics/clinical',
    component: ClinicalAnalytics,
    title: 'Clinical Performance | CareLink',
  },
  {
    path: 'analytics/patients',
    component: PatientAnalytics,
    title: 'Patient Engagement | CareLink',
  },
  {
    path: 'analytics/staff',
    component: DoctorAnalytics,
    title: 'Staff & Resources | CareLink',
  },
  /* Management */
  {
    path: 'users',
    component: UserList,
    title: 'User Management | CareLink',
  },
];