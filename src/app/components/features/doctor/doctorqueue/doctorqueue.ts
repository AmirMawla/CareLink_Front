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
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, finalize, takeUntil } from 'rxjs';
import { DoctorDashboardService } from '../../../../services/doctor-dashboard';
import { QueueItem } from '../../../../models/doctor-dashboard.model';

type QueueSort = 'wait_desc' | 'wait_asc' | 'scheduled_asc' | 'scheduled_desc' | 'name_asc';

@Component({
  selector: 'app-doctorqueue',
  imports: [CommonModule, RouterModule],
  templateUrl: './doctorqueue.html',
  styleUrl: './doctorqueue.css',
})
export class Doctorqueue implements OnInit, OnDestroy {
  private readonly dashboard = inject(DoctorDashboardService);
  private readonly destroy$ = new Subject<void>();

  readonly today = new Date();
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly lastUpdatedAt = signal<Date | null>(null);

  readonly query = signal('');
  readonly sort = signal<QueueSort>('wait_asc');

  readonly items = signal<QueueItem[]>([]);

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const sort = this.sort();
    const base = q
      ? this.items().filter((i) => (i.patient_name || '').toLowerCase().includes(q))
      : this.items();

    const arr = [...base];
    arr.sort((a, b) => {
      if (sort === 'wait_desc') return (b.wait_minutes ?? 0) - (a.wait_minutes ?? 0);
      if (sort === 'wait_asc') return (a.wait_minutes ?? 0) - (b.wait_minutes ?? 0);
      if (sort === 'scheduled_asc') return new Date(a.scheduled_datetime).getTime() - new Date(b.scheduled_datetime).getTime();
      if (sort === 'scheduled_desc') return new Date(b.scheduled_datetime).getTime() - new Date(a.scheduled_datetime).getTime();
      if (sort === 'name_asc') return (a.patient_name || '').localeCompare(b.patient_name || '');
      return 0;
    });
    return arr;
  });

  readonly stats = computed(() => {
    const list = this.items();
    const waiting = list.length;
    const maxWait = waiting ? Math.max(...list.map((i) => i.wait_minutes ?? 0)) : 0;
    const avgWait = waiting ? Math.round(list.reduce((s, i) => s + (i.wait_minutes ?? 0), 0) / waiting) : 0;
    const next = waiting
      ? [...list].sort((a, b) => new Date(a.scheduled_datetime).getTime() - new Date(b.scheduled_datetime).getTime())[0]
      : null;
    return { waiting, maxWait, avgWait, next };
  });

  ngOnInit(): void {
    this.refresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refresh(): void {
    this.error.set(null);
    this.loading.set(true);
    this.dashboard
      .getQueueToday()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (res) => {
          this.items.set(res?.items ?? []);
          this.lastUpdatedAt.set(new Date());
        },
        error: () => {
          this.error.set('Failed to load today queue.');
        },
      });
  }

  onQueryInput(v: string): void {
    this.query.set(v);
  }

  setSort(v: string): void {
    this.sort.set((v as QueueSort) || 'wait_desc');
  }

  trackById(_: number, item: QueueItem): number {
    return item.id;
  }

  waitLabel(minutes: number): string {
    const m = Math.max(0, Math.floor(minutes || 0));
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return mm ? `${h}h ${mm}m` : `${h}h`;
  }
}