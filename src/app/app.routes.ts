import { Routes } from '@angular/router';
import { Doctorqueue } from './components/layouts/doctorqueue/doctorqueue';
import { Consultation } from './components/layouts/consultation/consultation';
import { PatientSummary } from './components/layouts/patient-summary/patient-summary';
export const routes: Routes = [
 {
    path: 'doctor/queue',
    component: Doctorqueue
  },
  { 
    path: 'doctor/consultation/:id',
    component: Consultation
  },
  {     
    path: 'doctor/patient-summary/:id',
    component: PatientSummary
  }

];
