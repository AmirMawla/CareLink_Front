import { Routes } from '@angular/router';
import { QueueComponent } from './queue/queue';
import { AppointmentListComponent } from './appointment-list/appointment-list';
import { BookAppointment } from './book-appointment/book-appointment';
// import { WeeklyScheduleComponent } from '../doctor/schedules/weekly.component';
// import { ScheduleExceptionsComponent } from '../doctor/exceptions/exceptions.component';
// import { AvailableSlotsComponent } from '../doctor/slots/slots.component';

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
  // {
  //   path: 'schedules',
  //   component: WeeklyScheduleComponent,
  //   title: 'Weekly Schedules',
  // },
  // {
  //   path: 'schedules/exceptions',
  //   component: ScheduleExceptionsComponent,
  //   title: 'Schedule Exceptions',
  // },
  // {
  //   path: 'slots',
  //   component: AvailableSlotsComponent,
  //   title: 'Available Slots',
  // },
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

