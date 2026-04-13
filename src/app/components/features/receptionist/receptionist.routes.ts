import { Routes } from "@angular/router";
import { WeeklySchedule } from "../doctor/weekly-schedule/weekly-schedule";
import { ScheduleExceptions } from "../doctor/schedule-exceptions/schedule-exceptions";
import { AvailableSlots } from "../doctor/available-slots/available-slots";



export const RECEPTIONIST_ROUTES: Routes = [
    {
      path: 'schedule',
      component: WeeklySchedule,
      title: 'Weekly schedule',
    },
    {
      path: 'schedule/exceptions',
      component: ScheduleExceptions,
      title: 'Days off / exceptions',
    },
    {
      path: 'available-slots',
      component: AvailableSlots,
      title: 'Available slots',
    }
    
  ];
  