import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Subject, of } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { DoctorScheduleException } from '../../../../models/doctor-dashboard.model';
import { DoctorDashboardService } from '../../../../services/doctor-dashboard';

function toTimeInputValue(raw: string | null | undefined): string {
  const s = (raw || '').trim();
  if (!s) return '';
  const m = s.match(/^(\d{2}:\d{2})(:\d{2})?$/);
  return m ? m[1] : s.slice(0, 5);
}

function isValidTimeRange(start: string, end: string): boolean {
  if (!start || !end) return false;
  return start < end;
}

function todayIsoDate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

@Component({
  selector: 'app-schedule-exceptions',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, DatePipe],
  templateUrl: './schedule-exceptions.html',
  styleUrls: ['./schedule-exceptions.css', '../doctor-appointments/doctor-appointments.css'],
})
export class ScheduleExceptions implements OnInit, OnDestroy {
  private readonly service = inject(DoctorDashboardService);
  private readonly destroy$ = new Subject<void>();
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);
  readonly deletingId = signal<number | null>(null);

  readonly exceptions = signal<DoctorScheduleException[]>([]);

  // Create/edit drawer
  readonly editorOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly formDate = signal(todayIsoDate());
  readonly formDayOff = signal(true);
  readonly formStart = signal('09:00');
  readonly formEnd = signal('17:00');
  readonly formError = signal<string | null>(null);

  readonly toastVisible = signal(false);
  readonly toastMessage = signal('');

  readonly sorted = computed(() => {
    const rows = [...(this.exceptions() || [])];
    rows.sort((a, b) => String(a.date).localeCompare(String(b.date)));
    return rows;
  });

  readonly upcoming = computed(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return this.sorted().filter((e) => {
      const d = new Date(String(e.date) + 'T00:00:00');
      return d.getTime() >= today;
    });
  });

  readonly past = computed(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return this.sorted().filter((e) => {
      const d = new Date(String(e.date) + 'T00:00:00');
      return d.getTime() < today;
    });
  });

  ngOnInit(): void {
    this.reload();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service
      .getDoctorScheduleExceptions()
      .pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          this.error.set(this.apiErrorMessage(err));
          return of([] as DoctorScheduleException[]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((rows) => this.exceptions.set(rows || []));
  }

  openCreate(): void {
    this.editorOpen.set(true);
    this.editingId.set(null);
    this.formError.set(null);
    this.formDate.set(todayIsoDate());
    this.formDayOff.set(true);
    this.formStart.set('09:00');
    this.formEnd.set('17:00');
  }

  openEdit(row: DoctorScheduleException): void {
    this.editorOpen.set(true);
    this.editingId.set(row.id);
    this.formError.set(null);
    this.formDate.set(String(row.date));
    this.formDayOff.set(!!row.is_day_off);
    this.formStart.set(toTimeInputValue(row.start_time) || '09:00');
    this.formEnd.set(toTimeInputValue(row.end_time) || '17:00');
  }

  closeEditor(): void {
    this.editorOpen.set(false);
    this.editingId.set(null);
    this.formError.set(null);
  }

  toggleDayOff(value: boolean): void {
    this.formDayOff.set(value);
    if (value) {
      // keep times but they won't be sent
      return;
    }
  }

  save(): void {
    const date = (this.formDate() || '').trim();
    const isDayOff = !!this.formDayOff();
    const start = (this.formStart() || '').trim();
    const end = (this.formEnd() || '').trim();

    this.formError.set(null);
    if (!date) {
      this.formError.set('Please select a date.');
      return;
    }
    if (!isDayOff && !isValidTimeRange(start, end)) {
      this.formError.set('Please choose a valid time range (start must be before end).');
      return;
    }

    const payload = isDayOff
      ? { date, is_day_off: true, start_time: null, end_time: null }
      : { date, is_day_off: false, start_time: start, end_time: end };

    this.saving.set(true);
    const editingId = this.editingId();
    const req$ = editingId
      ? this.service.updateDoctorScheduleException(editingId, payload)
      : this.service.createDoctorScheduleException(payload);

    req$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.saving.set(false)),
        catchError((err) => {
          this.formError.set(this.apiErrorMessage(err));
          return of(null);
        }),
      )
      .subscribe((res) => {
        if (!res?.exception) return;
        const saved = res.exception;
        this.exceptions.update((rows) => {
          const others = rows.filter((r) => r.id !== saved.id);
          return [...others, saved].sort((a, b) => String(a.date).localeCompare(String(b.date)));
        });
        this.showToast(res.message?.includes('updated') ? 'Exception updated' : 'Exception saved');
        this.closeEditor();
      });
  }

  delete(row: DoctorScheduleException): void {
    this.deletingId.set(row.id);
    this.service
      .deleteDoctorScheduleException(row.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.deletingId.set(null)),
        catchError((err) => {
          this.showToast(this.apiErrorMessage(err));
          return of(null);
        }),
      )
      .subscribe(() => {
        this.exceptions.update((rows) => rows.filter((r) => r.id !== row.id));
        this.showToast('Exception deleted');
      });
  }

  isPast(dateIso: string): boolean {
    const d = new Date(dateIso + 'T00:00:00');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return d.getTime() < today.getTime();
  }

  exceptionTypeLabel(row: DoctorScheduleException): string {
    if (row.is_day_off) return 'Day off';
    const st = toTimeInputValue(row.start_time);
    const en = toTimeInputValue(row.end_time);
    if (st && en) return `Custom hours: ${st}–${en}`;
    return 'Custom hours';
  }

  badgeClass(row: DoctorScheduleException): string {
    if (row.is_day_off) return 'badge badge-cancelled';
    return 'badge badge-info';
  }

  trackByExc = (_: number, r: DoctorScheduleException) => r.id;

  private showToast(msg: string): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMessage.set(msg);
    this.toastVisible.set(true);
    this.toastTimer = setTimeout(() => {
      this.toastVisible.set(false);
      this.toastTimer = null;
    }, 2800);
  }

  private apiErrorMessage(err: unknown): string {
    const httpErr = err as HttpErrorResponse;
    const status = httpErr?.status;
    const body = httpErr?.error;

    if (typeof body === 'string' && body.trim()) {
      const t = body.replace(/<[^>]+>/g, '').trim();
      if (t.length) return t.length > 220 ? `${t.slice(0, 220)}…` : t;
    }

    if (body && typeof body === 'object') {
      const e = body as Record<string, unknown>;
      const detail = e['detail'];
      if (typeof detail === 'string') return detail;
      const msg = e['message'];
      if (typeof msg === 'string') return msg;
      const errors = e['errors'] as Record<string, unknown> | undefined;
      if (errors && typeof errors === 'object') {
        const k = Object.keys(errors)[0];
        const v = (errors as Record<string, unknown>)[k];
        if (Array.isArray(v) && v.length && typeof v[0] === 'string') return v[0];
        if (typeof v === 'string') return v;
      }
    }

    if (status === 403) return 'You do not have permission to edit exceptions.';
    if (status === 404) return 'Exception not found.';
    if (status === 401) return 'Please sign in again.';
    if (status === 0) return 'Could not reach the server.';
    return 'Something went wrong. Try again.';
  }
}

