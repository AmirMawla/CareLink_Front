import { Routes } from '@angular/router';
import { Doctorqueue } from './components/layouts/erm&consultation/doctorqueue/doctorqueue';
import { Consultation } from './components/layouts/erm&consultation/consultation/consultation';
import { PatientSummary } from './components/layouts/erm&consultation/patient-summary/patient-summary';

import {Login} from './components/layouts/login/login'

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
  },
  
  {
    path : 'auth/login',
    component: Login
  }

];
