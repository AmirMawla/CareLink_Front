import { NgFor, NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Subject, of } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { DoctorProfileMe } from '../../../../models/doctor-dashboard.model';
import { DoctorDashboardService } from '../../../../services/doctor-dashboard';

function safeInt(value: string, fallback: number): number {
  const n = parseInt((value || '').trim(), 10);
  if (!Number.isFinite(n)) return fallback;
  return n;
}

type SpecialtyValue = 'CARDIOLOGY' | 'DERMATOLOGY' | 'NEUROLOGY' | 'PEDIATRICS' | 'ORTHOPEDICS' | 'GENERAL';

@Component({
  selector: 'app-doctor-profile',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './doctor-profile.html',
  styleUrls: ['./doctor-profile.css', '../doctor-appointment-detail/doctor-appointment-detail.css'],
})
export class DoctorProfile implements OnInit, OnDestroy {
  private readonly service = inject(DoctorDashboardService);
  private readonly destroy$ = new Subject<void>();
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  // Keep these in sync with backend `accounts/models.py` SPECIALTY_CHOICES and SESSION_CHOICES
  readonly specialtyOptions: ReadonlyArray<{ value: SpecialtyValue; label: string }> = [
    { value: 'CARDIOLOGY', label: 'Cardiology' },
    { value: 'DERMATOLOGY', label: 'Dermatology' },
    { value: 'NEUROLOGY', label: 'Neurology' },
    { value: 'PEDIATRICS', label: 'Pediatrics' },
    { value: 'ORTHOPEDICS', label: 'Orthopedics' },
    { value: 'GENERAL', label: 'General Practice' },
  ] as const;

  readonly sessionDurationOptions: ReadonlyArray<number> = [15, 30] as const;

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly toastVisible = signal(false);
  readonly toastMessage = signal('');

  readonly doctor = signal<DoctorProfileMe | null>(null);

  readonly specialty = signal('');
  readonly sessionDuration = signal(30);
  readonly bufferTime = signal(0);

  readonly initials = computed(() => {
    const u = (this.doctor()?.username || '').trim() || 'Dr';
    return u.slice(0, 2).toUpperCase();
  });

  readonly displayName = computed(() => (this.doctor()?.username || '').trim() || 'Doctor');

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
    this.formError.set(null);
    this.service
      .getLoggedInDoctor()
      .pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          this.error.set(this.apiErrorMessage(err));
          return of(null);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((doc) => {
        if (!doc) return;
        this.doctor.set(doc);
        this.specialty.set((doc.specialty || '').trim());
        this.sessionDuration.set(Number.isFinite(doc.session_duration as number) ? (doc.session_duration as number) : 30);
        this.bufferTime.set(Number.isFinite(doc.buffer_time as number) ? (doc.buffer_time as number) : 0);
      });
  }

  onSpecialty(value: string): void {
    this.specialty.set(value);
  }

  onSessionDuration(value: string): void {
    const n = safeInt(value, this.sessionDuration() || 30);
    this.sessionDuration.set(n);
  }

  onBufferTime(value: string): void {
    this.bufferTime.set(Math.min(Math.max(0, safeInt(value, this.bufferTime() || 0)), 120));
  }

  save(): void {
    this.formError.set(null);
    const session = this.sessionDuration();
    const buffer = this.bufferTime();
    if (buffer < 0) {
      this.formError.set('Buffer time must be 0 minutes or more.');
      return;
    }

    const specialty = (this.specialty() || '').trim();
    const allowedSpecialties = new Set(this.specialtyOptions.map((o) => o.value));
    if (!allowedSpecialties.has(specialty as SpecialtyValue)) {
      this.formError.set('Please choose a valid specialty.');
      return;
    }

    if (!this.sessionDurationOptions.includes(session)) {
      this.formError.set('Please choose a valid session duration.');
      return;
    }

    this.saving.set(true);
    this.service
      .updateLoggedInDoctor({
        specialty,
        session_duration: session,
        buffer_time: buffer,
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.saving.set(false)),
        catchError((err) => {
          this.formError.set(this.apiErrorMessage(err));
          return of(null);
        }),
      )
      .subscribe((res) => {
        if (!res?.doctor) return;
        this.doctor.set(res.doctor);
        this.showToast('Profile updated');
      });
  }

  reset(): void {
    const doc = this.doctor();
    if (!doc) return;
    this.formError.set(null);
    this.specialty.set((doc.specialty || '').trim());
    this.sessionDuration.set(Number.isFinite(doc.session_duration as number) ? (doc.session_duration as number) : 30);
    this.bufferTime.set(Number.isFinite(doc.buffer_time as number) ? (doc.buffer_time as number) : 0);
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
      const msg = e['message'];
      if (typeof msg === 'string') return msg;
      const detail = e['detail'];
      if (typeof detail === 'string') return detail;
      const errors = e['errors'] as Record<string, unknown> | undefined;
      if (errors && typeof errors === 'object') {
        const k = Object.keys(errors)[0];
        const v = (errors as Record<string, unknown>)[k];
        if (Array.isArray(v) && v.length && typeof v[0] === 'string') return v[0];
        if (typeof v === 'string') return v;
      }
    }

    if (status === 403) return 'Not allowed.';
    if (status === 401) return 'Please sign in again.';
    if (status === 0) return 'Could not reach the server.';
    return 'Something went wrong. Try again.';
  }
}

