import { NgFor, NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Subject, of } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { DoctorWeeklySchedule } from '../../../../models/doctor-dashboard.model';
import { DoctorDashboardService } from '../../../../services/doctor-dashboard';

type DayKey = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const DAYS: { key: DayKey; label: string; short: string }[] = [
  { key: 0, label: 'Monday', short: 'Mon' },
  { key: 1, label: 'Tuesday', short: 'Tue' },
  { key: 2, label: 'Wednesday', short: 'Wed' },
  { key: 3, label: 'Thursday', short: 'Thu' },
  { key: 4, label: 'Friday', short: 'Fri' },
  { key: 5, label: 'Saturday', short: 'Sat' },
  { key: 6, label: 'Sunday', short: 'Sun' },
];

function toTimeInputValue(raw: string | null | undefined): string {
  const s = (raw || '').trim();
  if (!s) return '';
  // API may return HH:MM:SS; HTML time wants HH:MM (seconds optional but not always consistent)
  const m = s.match(/^(\d{2}:\d{2})(:\d{2})?$/);
  return m ? m[1] : s.slice(0, 5);
}

function isValidTimeRange(start: string, end: string): boolean {
  if (!start || !end) return false;
  return start < end;
}

@Component({
  selector: 'app-weekly-schedule',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './weekly-schedule.html',
  styleUrls: ['./weekly-schedule.css', '../doctor-appointments/doctor-appointments.css'],
})
export class WeeklySchedule implements OnInit, OnDestroy {
  private readonly service = inject(DoctorDashboardService);
  private readonly destroy$ = new Subject<void>();
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  readonly days = DAYS;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly schedules = signal<DoctorWeeklySchedule[]>([]);

  readonly savingDay = signal<DayKey | null>(null);
  readonly deletingDay = signal<DayKey | null>(null);
  readonly bulkBusy = signal(false);

  readonly bulkStart = signal('09:00');
  readonly bulkEnd = signal('17:00');

  readonly toastVisible = signal(false);
  readonly toastMessage = signal('');

  readonly draftStart = signal<Record<number, string>>({});
  readonly draftEnd = signal<Record<number, string>>({});

  readonly byDay = computed(() => {
    const map = new Map<DayKey, DoctorWeeklySchedule>();
    for (const s of this.schedules()) {
      const day = s.day_of_week as DayKey;
      if (!map.has(day)) map.set(day, s);
    }
    return map;
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
      .getDoctorWeeklySchedules()
      .pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          this.error.set(this.apiErrorMessage(err));
          return of([] as DoctorWeeklySchedule[]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((rows) => {
        this.schedules.set(rows || []);
        this.seedDrafts(rows || []);
      });
  }

  private seedDrafts(rows: DoctorWeeklySchedule[]): void {
    const nextStart: Record<number, string> = {};
    const nextEnd: Record<number, string> = {};
    for (const d of DAYS) {
      const row = rows.find((r) => r.day_of_week === d.key);
      nextStart[d.key] = toTimeInputValue(row?.start_time) || '';
      nextEnd[d.key] = toTimeInputValue(row?.end_time) || '';
    }
    this.draftStart.set(nextStart);
    this.draftEnd.set(nextEnd);
  }

  daySchedule(day: DayKey): DoctorWeeklySchedule | null {
    return this.byDay().get(day) ?? null;
  }

  dayHasSchedule(day: DayKey): boolean {
    return !!this.daySchedule(day);
  }

  rangeLabel(day: DayKey): string {
    const s = this.daySchedule(day);
    if (!s) return 'Off';
    return `${toTimeInputValue(s.start_time)} – ${toTimeInputValue(s.end_time)}`;
  }

  onDraftStart(day: DayKey, value: string): void {
    this.draftStart.update((m) => ({ ...m, [day]: value }));
  }

  onDraftEnd(day: DayKey, value: string): void {
    this.draftEnd.update((m) => ({ ...m, [day]: value }));
  }

  canSaveDay(day: DayKey): boolean {
    const st = (this.draftStart()[day] || '').trim();
    const en = (this.draftEnd()[day] || '').trim();
    return isValidTimeRange(st, en) && this.savingDay() !== day && this.deletingDay() !== day && !this.bulkBusy();
  }

  saveDay(day: DayKey): void {
    const st = (this.draftStart()[day] || '').trim();
    const en = (this.draftEnd()[day] || '').trim();
    if (!isValidTimeRange(st, en)) {
      this.showToast('Please choose a valid time range.');
      return;
    }
    this.savingDay.set(day);
    this.service
      .createDoctorWeeklySchedule({ day_of_week: day, start_time: st, end_time: en })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.savingDay.set(null)),
        catchError((err) => {
          this.showToast(this.apiErrorMessage(err));
          return of(null);
        }),
      )
      .subscribe((res) => {
        if (!res?.schedule) return;
        this.schedules.update((rows) => {
          const other = rows.filter((r) => r.day_of_week !== day);
          return [...other, res.schedule].sort((a, b) => a.day_of_week - b.day_of_week);
        });
        this.showToast(res.message?.includes('updated') ? 'Schedule updated' : 'Schedule saved');
      });
  }

  clearDraft(day: DayKey): void {
    const s = this.daySchedule(day);
    this.draftStart.update((m) => ({ ...m, [day]: toTimeInputValue(s?.start_time) || '' }));
    this.draftEnd.update((m) => ({ ...m, [day]: toTimeInputValue(s?.end_time) || '' }));
  }

  deleteDay(day: DayKey): void {
    const s = this.daySchedule(day);
    if (!s) return;
    this.deletingDay.set(day);
    this.service
      .deleteDoctorWeeklySchedule(s.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.deletingDay.set(null)),
        catchError((err) => {
          this.showToast(this.apiErrorMessage(err));
          return of(null);
        }),
      )
      .subscribe(() => {
        this.schedules.update((rows) => rows.filter((r) => r.id !== s.id));
        this.draftStart.update((m) => ({ ...m, [day]: '' }));
        this.draftEnd.update((m) => ({ ...m, [day]: '' }));
        this.showToast('Schedule deleted');
      });
  }

  copyDayToBulk(day: DayKey): void {
    const st = (this.draftStart()[day] || '').trim();
    const en = (this.draftEnd()[day] || '').trim();
    if (!isValidTimeRange(st, en)) {
      this.showToast('Set a valid time on that day first.');
      return;
    }
    this.bulkStart.set(st);
    this.bulkEnd.set(en);
    this.showToast('Copied to bulk action.');
  }

  canBulkApply(): boolean {
    return (
      isValidTimeRange(this.bulkStart().trim(), this.bulkEnd().trim()) &&
      !this.bulkBusy() &&
      this.savingDay() === null &&
      this.deletingDay() === null
    );
  }

  bulkApplyExceptFriday(): void {
    const st = this.bulkStart().trim();
    const en = this.bulkEnd().trim();
    if (!isValidTimeRange(st, en)) {
      this.showToast('Please choose a valid bulk time range.');
      return;
    }
    this.bulkBusy.set(true);
    this.service
      .bulkSetDoctorWeeklySchedules({ start_time: st, end_time: en })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.bulkBusy.set(false)),
        catchError((err) => {
          this.showToast(this.apiErrorMessage(err));
          return of(null);
        }),
      )
      .subscribe((res) => {
        if (!res?.schedules) return;
        // Merge returned schedules into current
        this.schedules.update((rows) => {
          const replacedDays = new Set(res.schedules.map((s) => s.day_of_week));
          const kept = rows.filter((r) => !replacedDays.has(r.day_of_week));
          return [...kept, ...res.schedules].sort((a, b) => a.day_of_week - b.day_of_week);
        });
        this.seedDrafts(this.schedules());
        this.showToast('Applied to all days except Friday');
      });
  }

  bulkDeleteExceptFriday(): void {
    this.bulkBusy.set(true);
    this.service
      .bulkDeleteDoctorWeeklySchedules()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.bulkBusy.set(false)),
        catchError((err) => {
          this.showToast(this.apiErrorMessage(err));
          return of(null);
        }),
      )
      .subscribe((res) => {
        // Server deletes all non-Friday schedules; easiest: refresh local state accordingly
        this.schedules.update((rows) => rows.filter((r) => r.day_of_week === 4));
        this.seedDrafts(this.schedules());
        this.showToast(res?.deleted_count ? `Deleted ${res.deleted_count} schedule(s)` : 'Schedules deleted');
      });
  }

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
      const errors = e['errors'] as Record<string, string[] | string> | undefined;
      const firstKey = errors ? Object.keys(errors)[0] : null;
      const firstVal = firstKey ? errors?.[firstKey] : null;
      if (Array.isArray(firstVal) && firstVal.length && typeof firstVal[0] === 'string') return firstVal[0];
      if (typeof firstVal === 'string') return firstVal;
    }

    if (status === 403) return 'You do not have permission to edit schedules.';
    if (status === 404) return 'Schedule not found.';
    if (status === 401) return 'Please sign in again.';
    if (status === 0) return 'Could not reach the server.';
    return 'Something went wrong. Try again.';
  }
}

