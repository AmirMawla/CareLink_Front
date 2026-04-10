// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-doctorqueue',
//   imports: [],
//   templateUrl: './doctorqueue.html',
//   styleUrl: './doctorqueue.css',
// })
// export class Doctorqueue {

// }

import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
interface Appointment {
  id: number;
  patient: {
    user: {
      first_name: string;
      last_name: string;
    }
  };
  check_in_time: string;
  scheduled_datetime: string;
  status: string;
}

@Component({
  selector: 'app-doctorqueue',
  imports: [CommonModule, RouterModule],
  templateUrl: './doctorqueue.html',
  styleUrl: './doctorqueue.css',
})
export class Doctorqueue implements OnInit {
  appointments: Appointment[] = [];
  loading = true;
  error = '';
  today = new Date();
  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadQueue();
  }

  loadQueue() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`
    });

    this.http.get<Appointment[]>('http://127.0.0.1:8000/api/medical/doctor/queue/', { headers })
      .subscribe({
        next: (data) => {
          this.appointments = data;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load queue';
          this.loading = false;
        }
      });
  }

  getWaitingTime(checkInTime: string): string {
    const checkIn = new Date(checkInTime);
    const now = new Date();
    const diff = Math.floor((now.getTime() - checkIn.getTime()) / 60000);
    return `${diff} min`;
  }
}