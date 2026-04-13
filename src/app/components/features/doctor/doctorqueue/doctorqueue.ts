// import { Component, OnInit } from '@angular/core';
// import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';
// interface Appointment {
//   id: number;
//   patient: {
//     user: {
//       first_name: string;
//       last_name: string;
//     }
//   };
//   check_in_time: string;
//   scheduled_datetime: string;
//   status: string;
// }

// @Component({
//   selector: 'app-doctorqueue',
//   imports: [CommonModule, RouterModule],
//   templateUrl: './doctorqueue.html',
//   styleUrl: './doctorqueue.css',
// })
// export class Doctorqueue implements OnInit {
//   appointments: Appointment[] = [];
//   loading = true;
//   error = '';
//   today = new Date();
//   constructor(private http: HttpClient) {}

//   ngOnInit() {
//     this.loadQueue();
//   }

//   loadQueue() {
//     const token = localStorage.getItem('token');
//     const headers = new HttpHeaders({
//       'Authorization': `Token ${token}`
//     });

//     this.http.get<Appointment[]>('http://127.0.0.1:8000/api/medical/doctor/queue/', { headers })
//       .subscribe({
//         next: (data) => {
//           this.appointments = data;
//           this.loading = false;
//         },
//         error: (err) => {
//           this.error = 'Failed to load queue';
//           this.loading = false;
//         }
//       });
//   }

//   getWaitingTime(checkInTime: string): string {
//     const checkIn = new Date(checkInTime);
//     const now = new Date();
//     const diff = Math.floor((now.getTime() - checkIn.getTime()) / 60000);
//     return `${diff} min`;
//   }
// }
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Appointment {
  id: number;
  patient: {
    id: number;
    user: {
      id: number;
      first_name: string;
      last_name: string;
      username: string;
    };
    phone_number: string;
  };
  check_in_time: string;
  scheduled_datetime: string;
  status: string;
  is_telemedicine: boolean;
  meeting_link: string | null;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Appointment[];
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
  count = 0;
  nextPage: string | null = null;
  prevPage: string | null = null;
  searchQuery = '';
  cdr=inject(ChangeDetectorRef);

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadQueue();
    this.cdr.detectChanges();
  }

  loadQueue(url?: string) {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`
    });

    let apiUrl = url || 'http://127.0.0.1:8000/api/medical/doctor/queue/';

    if (!url && this.searchQuery) {
      apiUrl += `?search=${this.searchQuery}`;
    }

    this.loading = true;
    this.http.get<PaginatedResponse>(apiUrl, { headers })
      .subscribe({
        next: (data) => {
          this.appointments = data.results;
          this.count = data.count;
          this.nextPage = data.next;
          this.prevPage = data.previous;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = 'Failed to load queue';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  onSearch(event: Event) {
    this.searchQuery = (event.target as HTMLInputElement).value;
    this.loadQueue();
    this.cdr.detectChanges();
  }

  goToNext() {
    if (this.nextPage) this.loadQueue(this.nextPage);
  }

  goToPrev() {
    if (this.prevPage) this.loadQueue(this.prevPage);
  }

  getWaitingTime(checkInTime: string): string {
    const checkIn = new Date(checkInTime);
    const now = new Date();
    const diff = Math.floor((now.getTime() - checkIn.getTime()) / 60000);
    this.cdr.detectChanges();
    return `${diff} min`;
  }
}