import { Routes } from '@angular/router';
import { QueueComponent } from './queue/queue';
import { AppointmentListComponent } from './appointment-list/appointment-list';
import { AvailableSlots } from '../doctor/available-slots/available-slots';
import { WeeklySchedule } from '../doctor/weekly-schedule/weekly-schedule';
import { ScheduleExceptions } from '../doctor/schedule-exceptions/schedule-exceptions';
import { DashboardComponent } from './dashboard/dashboard';
import { CheckedInComponent } from './checked-in/checked-in';
import { WaitingListComponent } from './waiting-list/waiting-list';
import { ReschedulesComponent } from './reschedules/reschedules';

export const RECEPTION_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'queue',
  },
  {
    path: 'queue',
    component: QueueComponent,
    title: 'Daily Queue',
  },
  {
    path: 'appointments',
    component: AppointmentListComponent,
    title: 'All Appointments',
  },
  {
    path: 'schedules',
    component: WeeklySchedule,
    title: 'Weekly Schedules',
  },
  {
    path: 'schedules/exceptions',
    component: ScheduleExceptions,
    title: 'Schedule Exceptions',
  },
  {
    path: 'slots',
    component: AvailableSlots,
    title: 'Available Slots',
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    title: 'Reception Dashboard'
  },
  {
  path:'check-in',
  component:CheckedInComponent,
  title:'Checked-In Patients'
  },
  {
  path:'waiting-list',
  component:WaitingListComponent,
  title:'Waiting List'
  },
  {
    path: 'appointments/reschedule',
    component: ReschedulesComponent,
    title: 'Reschedule Requests',
  },
];

