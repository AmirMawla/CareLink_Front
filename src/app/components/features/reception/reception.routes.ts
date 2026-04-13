import { Routes } from '@angular/router';
import { QueueComponent } from './queue/queue';
import { AppointmentListComponent } from './appointment-list/appointment-list';
import { BookAppointment } from './book-appointment/book-appointment';
import { AvailableSlots } from '../doctor/available-slots/available-slots';
import { WeeklySchedule } from '../doctor/weekly-schedule/weekly-schedule';
import { ScheduleExceptions } from '../doctor/schedule-exceptions/schedule-exceptions';

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
      path: 'appointments/book',
      component: BookAppointment,
      title: 'Book New Appointment',
  },
  // {
  //   path: 'appointments/reschedule',
  //   component: RescheduleComponent,
  //   title: 'Reschedule Appointment',
  // }
];

