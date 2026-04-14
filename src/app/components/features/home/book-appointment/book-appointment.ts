import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { ApiService } from '../../../../services/api.service';

const WEEKDAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export interface DoctorProfileBrief {
  id: number;
  username: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  specialty: string;
  specialty_display: string;
  session_duration: number;
  buffer_time: number;
}

export interface WeeklyScheduleRow {
  id: number;
  doctor: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface ScheduleExceptionRow {
  id: number;
  doctor: number;
  date: string;
  is_day_off: boolean;
  start_time: string | null;
  end_time: string | null;
}

export interface PatientBookingBlock {
  active: boolean;
  scheduled_datetime: string;
  ends_at: string;
  message: string;
}

export interface BusyInterval {
  scheduled_datetime: string;
  ends_at: string;
  doctor_id: number;
  doctor_name: string;
}

export interface PatientBookingInfo {
  can_book_with_this_doctor: boolean;
  same_doctor_block: PatientBookingBlock | null;
  busy_intervals: BusyInterval[];
}

export interface DoctorAppointmentDetailsResponse {
  doctor: DoctorProfileBrief;
  weekly_schedules: WeeklyScheduleRow[];
  schedule_exceptions: ScheduleExceptionRow[];
  range_start: string;
  range_end: string;
  selected_date: string | null;
  available_slots: string[];
  session_duration: number;
  buffer_time: number;
  patient_booking?: PatientBookingInfo | null;
}

export interface SlotDayGroup {
  dateKey: string;
  label: string;
  slots: string[];
}

@Component({
  selector: 'app-book-appointment',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './book-appointment.html',
  styleUrl: './book-appointment.css',
})
export class BookAppointmentComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly doctorId = signal<number | null>(null);
  readonly details = signal<DoctorAppointmentDetailsResponse | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly needsAuth = signal(false);

  filterMode = signal<'range' | 'date'>('date');
  daysAhead = signal(3);
  singleDate = signal('');

  readonly confirmOpen = signal(false);
  readonly selectedSlotIso = signal<string | null>(null);
  readonly telemedicine = signal(false);
  readonly booking = signal(false);
  readonly bookError = signal('');
  readonly bookSuccess = signal(false);

  readonly slotGroups = computed<SlotDayGroup[]>(() => {
    const d = this.details();
    if (!d?.available_slots?.length) return [];
    return this.groupSlotsByLocalDay(d.available_slots);
  });

  readonly displayName = computed(() => {
    const doc = this.details()?.doctor;
    if (!doc) return '';
    const fn = (doc.first_name || '').trim();
    const ln = (doc.last_name || '').trim();
    if (fn || ln) return `Dr. ${fn} ${ln}`.trim();
    return doc.username ? `Dr. ${doc.username}` : 'Doctor';
  });

  readonly initials = computed(() => {
    const doc = this.details()?.doctor;
    if (!doc) return '—';
    const fn = (doc.first_name || '').trim();
    const ln = (doc.last_name || '').trim();
    if (fn && ln) return (fn.charAt(0) + ln.charAt(0)).toUpperCase();
    const u = (doc.username || 'DR').trim();
    return u.slice(0, 2).toUpperCase();
  });

  readonly returnUrl = computed(() => {
    const id = this.doctorId();
    return id != null ? `/doctors/${id}` : '/doctors';
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('doctorId');
    const id = idParam ? parseInt(idParam, 10) : NaN;
    if (Number.isNaN(id) || id < 1) {
      this.error.set('Invalid doctor link.');
      return;
    }
    this.doctorId.set(id);
    this.singleDate.set(this.minDateStr());
    const token = localStorage.getItem('token');
    if (!token) {
      this.needsAuth.set(true);
      return;
    }
    this.loadDetails();
  }

  weekdayLabel(day: number): string {
    return WEEKDAY_LABELS[day] ?? `Day ${day}`;
  }

  formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }

  formatDateTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  openConfirm(iso: string): void {
    this.bookError.set('');
    this.selectedSlotIso.set(iso);
    this.telemedicine.set(false);
    this.confirmOpen.set(true);
  }

  closeConfirm(): void {
    if (this.booking()) return;
    this.confirmOpen.set(false);
    this.selectedSlotIso.set(null);
  }

  submitBooking(): void {
    const token = localStorage.getItem('token');
    const doctorId = this.doctorId();
    const slot = this.selectedSlotIso();
    if (!token || doctorId == null || !slot) return;

    this.booking.set(true);
    this.bookError.set('');
    const headers = new HttpHeaders({ Authorization: `Token ${token}` });
    const url = this.api.resolve(`/api/appointments/book/${doctorId}`);
    this.http
      .post<{ message?: string; appointment?: { id: number } }>(url, {
        scheduled_datetime: slot,
        is_telemedicine: this.telemedicine(),
      }, { headers })
      .subscribe({
        next: () => {
          this.booking.set(false);
          this.bookSuccess.set(true);
          this.confirmOpen.set(false);
          this.loadDetails();
        },
        error: (err) => {
          this.booking.set(false);
          const code = err?.error?.code as string | undefined;
          const serverMsg = err?.error?.errors?.scheduled_datetime?.[0];
          let msg =
            serverMsg ||
            err?.error?.message ||
            'Could not book this slot. Try another time.';
          if (code === 'same_doctor_pending') {
            msg =
              serverMsg ||
              'You already have an upcoming visit with this doctor. Wait until it finishes, then book again.';
          } else if (code === 'time_overlap') {
            msg =
              serverMsg ||
              'This time overlaps another visit you already booked (including its full session). Pick a different time.';
          }
          this.bookError.set(msg);
        },
      });
  }

  applyFilters(): void {
    if (!localStorage.getItem('token')) {
      this.needsAuth.set(true);
      return;
    }
    this.loadDetails();
  }

  setMode(mode: 'range' | 'date'): void {
    this.filterMode.set(mode);
    this.error.set('');
    if (mode === 'range') {
      this.loadDetails();
    }
  }

  minDateStr(): string {
    const t = new Date();
    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, '0');
    const d = String(t.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private authHeaders(): HttpHeaders | null {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return new HttpHeaders({ Authorization: `Token ${token}` });
  }

  loadDetails(): void {
    const id = this.doctorId();
    const headers = this.authHeaders();
    if (id == null || !headers) {
      this.needsAuth.set(true);
      return;
    }

    let params = new HttpParams();
    if (this.filterMode() === 'date') {
      const d = (this.singleDate() || '').trim();
      if (!d) {
        this.error.set('Pick a date to load slots.');
        return;
      }
      params = params.set('date', d);
    } else {
      params = params.set('days', String(Math.max(1, Math.min(365, this.daysAhead()))));
    }

    this.loading.set(true);
    this.error.set('');
    const url = this.api.resolve(`/api/appointments/doctor/${id}`);
    this.http.get<DoctorAppointmentDetailsResponse>(url, { headers, params }).subscribe({
      next: (data) => {
        this.details.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 401 || err.status === 403) {
          this.needsAuth.set(true);
          this.error.set('Please sign in to view this doctor’s availability.');
        } else {
          this.error.set(err?.error?.message || 'Could not load availability.');
        }
      },
    });
  }

  private groupSlotsByLocalDay(slots: string[]): SlotDayGroup[] {
    const map = new Map<string, { order: number; slots: string[] }>();
    for (const iso of slots) {
      const d = new Date(iso);
      const y = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      const key = `${y}-${mo}-${da}`;
      const order = d.getTime();
      if (!map.has(key)) {
        map.set(key, { order, slots: [] });
      }
      map.get(key)!.slots.push(iso);
    }
    const entries = [...map.entries()].sort((a, b) => a[1].order - b[1].order);
    return entries.map(([dateKey, v]) => ({
      dateKey,
      label: this.formatDayHeading(dateKey),
      slots: v.slots.sort(),
    }));
  }

  private formatDayHeading(dateKey: string): string {
    const [y, m, d] = dateKey.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cmp = new Date(dt);
    cmp.setHours(0, 0, 0, 0);
    const diff = (cmp.getTime() - today.getTime()) / 86400000;
    const weekday = dt.toLocaleDateString(undefined, { weekday: 'long' });
    const medium = dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    if (diff === 0) return `Today · ${medium}`;
    if (diff === 1) return `Tomorrow · ${medium}`;
    return `${weekday} · ${medium}`;
  }
}
