import { DatePipe, NgFor, NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Subject, of } from 'rxjs';
import { catchError, finalize, switchMap, takeUntil } from 'rxjs/operators';
import { DoctorAvailableSlotsResponse } from '../../../../models/doctor-dashboard.model';
import { DoctorDashboardService } from '../../../../services/doctor-dashboard';

type RangeMode = '14d' | 'all' | 'date';

function todayIsoDate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeDateInput(value: string): string {
  return (value || '').trim();
}

function groupSlotsByDay(slots: string[]): { date: string; slots: string[] }[] {
  const map = new Map<string, string[]>();
  for (const iso of slots || []) {
    const d = String(iso).slice(0, 10);
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(iso);
  }
  const out = [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, items]) => ({ date, slots: items.sort() }));
  return out;
}

function slotTimeLabel(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
}

@Component({
  selector: 'app-available-slots',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe],
  templateUrl: './available-slots.html',
  styleUrls: ['./available-slots.css', '../doctor-appointments/doctor-appointments.css'],
})
export class AvailableSlots implements OnInit, OnDestroy {
  private readonly service = inject(DoctorDashboardService);
  private readonly destroy$ = new Subject<void>();
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly data = signal<DoctorAvailableSlotsResponse | null>(null);
  readonly doctorId = signal<number | null>(null);

  readonly rangeMode = signal<RangeMode>('14d');
  readonly selectedDate = signal(todayIsoDate());
  readonly days = signal(14);

  readonly toastVisible = signal(false);
  readonly toastMessage = signal('');

  readonly slotsCount = computed(() => this.data()?.available_slots?.length ?? 0);
  readonly grouped = computed(() => groupSlotsByDay(this.data()?.available_slots ?? []));

  readonly headerSubtitle = computed(() => {
    const m = this.rangeMode();
    if (m === 'date') return `Showing slots for ${this.selectedDate()}`;
    if (m === 'all') return `Showing future slots (up to 90 days)`;
    return `Showing next ${this.days()} day(s)`;
  });

  ngOnInit(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service
      .getLoggedInDoctor()
      .pipe(
        takeUntil(this.destroy$),
        switchMap((doc) => {
          this.doctorId.set(doc?.id ?? null);
          const id = doc?.id;
          if (!id) {
            this.error.set('Could not determine your doctor profile.');
            return of(null);
          }
          return this.fetch(id);
        }),
      )
      .subscribe((res) => {
        if (res) this.data.set(res);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  private fetch(id: number) {
    this.loading.set(true);
    this.error.set(null);
    this.data.set(null);

    const mode = this.rangeMode();
    const params: Partial<{ date: string; range: 'all' | 'default'; days: number }> = {};
    if (mode === 'date') {
      params.date = this.selectedDate();
    } else if (mode === 'all') {
      params.range = 'all';
    } else {
      params.days = this.days();
    }

    return this.service.getDoctorAvailableSlots(id, params).pipe(
      finalize(() => this.loading.set(false)),
      catchError((err) => {
        this.error.set(this.apiErrorMessage(err));
        return of(null);
      }),
    );
  }

  reload(): void {
    const id = this.doctorId();
    if (!id) return;
    this.fetch(id).pipe(takeUntil(this.destroy$)).subscribe((res) => res && this.data.set(res));
  }

  setMode(mode: RangeMode): void {
    this.rangeMode.set(mode);
    this.reload();
  }

  onSelectedDate(value: string): void {
    this.selectedDate.set(normalizeDateInput(value));
  }

  applyDate(): void {
    this.rangeMode.set('date');
    this.reload();
  }

  onDays(value: string): void {
    const n = parseInt(value || '14', 10);
    const next = Number.isFinite(n) ? Math.min(Math.max(1, n), 365) : 14;
    this.days.set(next);
  }

  applyDays(): void {
    this.rangeMode.set('14d');
    this.reload();
  }

  daySummary(dateIso: string, count: number): string {
    if (count === 0) return '';
    const d = new Date(dateIso + 'T00:00:00');
    const label = Number.isFinite(d.getTime())
      ? d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
      : dateIso;
    return `${label} · ${count} slot${count === 1 ? '' : 's'}`;
  }

  slotLabel(iso: string): string {
    return slotTimeLabel(iso);
  }

  async copyDay(dateIso: string, slots: string[]): Promise<void> {
    const lines = (slots || []).map((s) => `${dateIso} ${this.slotLabel(s)}`);
    const txt = lines.join('\\n');
    try {
      await navigator.clipboard.writeText(txt);
      this.showToast('Copied day slots to clipboard');
    } catch {
      this.showToast('Could not copy (clipboard blocked).');
    }
  }

  trackByDay = (_: number, d: { date: string }) => d.date;
  trackBySlot = (_: number, s: string) => s;

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

    if (body && typeof body === 'object') {
      const e = body as Record<string, unknown>;
      const msg = e['message'];
      if (typeof msg === 'string') return msg;
      const errors = e['errors'] as Record<string, unknown> | undefined;
      if (errors) {
        const k = Object.keys(errors)[0];
        const v = (errors as Record<string, unknown>)[k];
        if (Array.isArray(v) && v.length && typeof v[0] === 'string') return v[0];
        if (typeof v === 'string') return v;
      }
    }

    if (status === 403) return 'Not allowed.';
    if (status === 404) return 'Doctor not found.';
    if (status === 401) return 'Please sign in again.';
    if (status === 0) return 'Could not reach the server.';
    return 'Could not load available slots.';
  }
}

