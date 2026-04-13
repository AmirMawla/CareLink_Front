import { DatePipe, NgFor, NgIf } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subject, of } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../../services/api.service';

interface Prescription {
  id: number;
  drug_name: string;
  dose: string;
  duration_days: number;
}

interface Test {
  id: number;
  test_name: string;
}

interface Consultation {
  id: number;
  appointment: {
    id: number;
    patient: {
      user: {
        first_name: string;
        last_name: string;
        username?: string;
      };
    };
    scheduled_datetime: string;
  };
  diagnosis: string;
  clinical_notes: string;
  prescriptions: Prescription[];
  tests: Test[];
  created_at: string;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Consultation[];
}
@Component({
  selector: 'app-consultationhistory',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, RouterLink],
  templateUrl: './consultationhistory.html',
  styleUrls: ['./consultationhistory.css', '../doctor-appointments/doctor-appointments.css'],
})
export class Consultationhistory implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly destroy$ = new Subject<void>();

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly count = signal(0);
  readonly nextPageUrl = signal<string | null>(null);
  readonly prevPageUrl = signal<string | null>(null);

  readonly query = signal('');
  readonly expandedId = signal<number | null>(null);

  readonly consultations = signal<Consultation[]>([]);

  readonly subtitle = computed(() => {
    const n = this.count();
    return `${n} consultation${n === 1 ? '' : 's'} total`;
  });

  readonly empty = computed(() => !this.loading() && !this.error() && this.consultations().length === 0);

  ngOnInit(): void {
    this.reload();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(value: string): void {
    this.query.set((value || '').trim());
    this.reload();
  }

  toggleExpand(id: number): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  reload(): void {
    this.fetch(undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => this.applyResponse(data));
  }

  goToNext(): void {
    const url = this.nextPageUrl();
    if (!url) return;
    this.fetch(url)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => this.applyResponse(data));
  }

  goToPrev(): void {
    const url = this.prevPageUrl();
    if (!url) return;
    this.fetch(url)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => this.applyResponse(data));
  }

  patientName(c: Consultation): string {
    const u = c?.appointment?.patient?.user;
    const fn = (u?.first_name || '').trim();
    const ln = (u?.last_name || '').trim();
    return `${fn} ${ln}`.trim() || u?.username || 'Patient';
  }

  rxSummary(c: Consultation): string {
    const n = c?.prescriptions?.length ?? 0;
    return n ? `${n} prescription${n === 1 ? '' : 's'}` : 'No prescriptions';
  }

  testsSummary(c: Consultation): string {
    const n = c?.tests?.length ?? 0;
    return n ? `${n} test${n === 1 ? '' : 's'}` : 'No tests';
  }

  private baseUrl(): string {
    return this.api.resolve('/api/medical/doctor/consultations/');
  }

  private extractPage(url: string): string | null {
    try {
      const u = new URL(url, 'http://x.invalid');
      return u.searchParams.get('page');
    } catch {
      const m = String(url).match(/[?&]page=(\d+)/);
      return m ? m[1] : null;
    }
  }

  private fetch(nextOrPrevUrl?: string) {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams();
    const q = this.query();
    if (q) params = params.set('search', q);

    const page = nextOrPrevUrl ? this.extractPage(nextOrPrevUrl) : null;
    if (page) params = params.set('page', page);

    return this.http.get<PaginatedResponse>(this.baseUrl(), { params }).pipe(
      finalize(() => this.loading.set(false)),
      catchError((err) => {
        this.error.set(this.apiErrorMessage(err));
        this.consultations.set([]);
        this.count.set(0);
        this.nextPageUrl.set(null);
        this.prevPageUrl.set(null);
        return of(null);
      }),
    );
  }

  private applyResponse(data: PaginatedResponse | null): void {
    if (!data) return;
    this.consultations.set(data.results ?? []);
    this.count.set(data.count ?? 0);
    this.nextPageUrl.set(data.next ?? null);
    this.prevPageUrl.set(data.previous ?? null);
  }

  private apiErrorMessage(err: unknown): string {
    const httpErr = err as HttpErrorResponse;
    const status = httpErr?.status;
    const body = httpErr?.error;
    if (body && typeof body === 'object') {
      const e = body as Record<string, unknown>;
      const msg = e['message'] ?? e['detail'] ?? e['error'];
      if (typeof msg === 'string') return msg;
    }
    if (status === 403) return 'Not allowed.';
    if (status === 401) return 'Please sign in again.';
    if (status === 0) return 'Could not reach the server.';
    return 'Failed to load consultation history.';
  }
}