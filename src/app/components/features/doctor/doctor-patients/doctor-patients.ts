import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { Subject, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, finalize, switchMap, takeUntil, tap } from 'rxjs/operators';
import { DoctorPatientListRow } from '../../../../models/doctor-dashboard.model';
import { DoctorDashboardService } from '../../../../services/doctor-dashboard';

const DEFAULT_ORDERING = 'username';
const PAGE_SIZE = 10;

const STATUS_FILTER_VALUES = [
  '',
  'REQUESTED',
  'CONFIRMED',
  'CHECKED_IN',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
] as const;

type StatusFilterValue = (typeof STATUS_FILTER_VALUES)[number];

function queryParamMapFingerprint(p: ParamMap): string {
  return [...p.keys]
    .sort()
    .map((k) => `${k}=${p.get(k) ?? ''}`)
    .join('&');
}

@Component({
  selector: 'app-doctor-patients',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, DatePipe, RouterLink],
  templateUrl: './doctor-patients.html',
  styleUrls: ['./doctor-patients.css', '../doctor-appointments/doctor-appointments.css'],
})
export class DoctorPatients implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(DoctorDashboardService);
  private readonly destroy$ = new Subject<void>();
  private readonly searchDebounced$ = new Subject<string>();

  readonly pageSize = PAGE_SIZE;
  readonly defaultOrdering = DEFAULT_ORDERING;
  readonly statusPillOptions: StatusFilterValue[] = [...STATUS_FILTER_VALUES];

  readonly statusFilter = signal<StatusFilterValue>('');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly upcomingOnly = signal(false);
  readonly ordering = signal(DEFAULT_ORDERING);
  readonly page = signal(1);
  readonly searchInput = signal('');

  readonly searchDebounceBusy = signal(false);

  readonly isInitialLoad = signal(true);
  readonly isLoading = signal(false);
  readonly hasError = signal(false);

  readonly totalCount = signal(0);
  readonly totalPages = signal(1);
  readonly patients = signal<DoctorPatientListRow[]>([]);

  readonly filtersPanelOpen = signal(false);

  readonly hasQueryFilters = computed(() => {
    if (this.statusFilter()) return true;
    if (this.dateFrom()) return true;
    if (this.dateTo()) return true;
    if (this.upcomingOnly()) return true;
    if ((this.searchInput() || '').trim()) return true;
    if (this.ordering() !== DEFAULT_ORDERING) return true;
    if (this.page() > 1) return true;
    return false;
  });

  readonly activeFilterChips = computed(() => {
    const chips: { id: string; label: string }[] = [];
    const st = this.statusFilter();
    if (st) {
      chips.push({ id: 'status', label: `Appointment status: ${this.statusLabel(st)}` });
    }
    const df = this.dateFrom();
    if (df) {
      chips.push({ id: 'date_from', label: `Appt from: ${this.formatChipDate(df)}` });
    }
    const dt = this.dateTo();
    if (dt) {
      chips.push({ id: 'date_to', label: `Appt to: ${this.formatChipDate(dt)}` });
    }
    if (this.upcomingOnly()) {
      chips.push({ id: 'upcoming', label: 'Upcoming appointments only' });
    }
    const q = (this.searchInput() || '').trim();
    if (q) chips.push({ id: 'search', label: `Search: ${q}` });
    if (this.ordering() !== DEFAULT_ORDERING) {
      chips.push({ id: 'ordering', label: `Sort: ${this.sortPresetLabel()}` });
    }
    if (this.page() > 1) {
      chips.push({ id: 'page', label: `Page: ${this.page()}` });
    }
    return chips;
  });

  readonly searchSpinner = computed(
    () => this.searchDebounceBusy() || (this.isLoading() && !!(this.searchInput() || '').trim()),
  );

  readonly emptyNoPatients = computed(
    () =>
      !this.isInitialLoad() &&
      !this.hasError() &&
      !this.isLoading() &&
      this.totalCount() === 0 &&
      !this.hasQueryFilters(),
  );

  readonly emptyFiltered = computed(
    () =>
      !this.isInitialLoad() &&
      !this.hasError() &&
      !this.isLoading() &&
      this.totalCount() === 0 &&
      this.hasQueryFilters() &&
      !(this.searchInput() || '').trim(),
  );

  readonly emptySearchOnly = computed(
    () =>
      !this.isInitialLoad() &&
      !this.hasError() &&
      !this.isLoading() &&
      this.totalCount() === 0 &&
      !!(this.searchInput() || '').trim(),
  );

  readonly showOverlayBar = computed(() => this.isLoading() && !this.isInitialLoad());

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(
        distinctUntilChanged((a, b) => queryParamMapFingerprint(a) === queryParamMapFingerprint(b)),
        tap((params) => this.applyQueryParams(params)),
        switchMap(() => {
          this.isLoading.set(true);
          this.hasError.set(false);
          return this.service.getDoctorPatientsList(this.buildApiParams()).pipe(
            finalize(() => {
              this.isLoading.set(false);
              if (this.isInitialLoad()) {
                this.isInitialLoad.set(false);
              }
            }),
            catchError(() => {
              this.hasError.set(true);
              return of(null);
            }),
          );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((res) => {
        if (!res) {
          return;
        }
        this.totalCount.set(res.count ?? 0);
        this.totalPages.set(res.total_pages ?? 1);
        this.patients.set(res.patients ?? []);
      });

    this.searchDebounced$
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((raw) => {
        this.searchDebounceBusy.set(false);
        const term = (raw || '').trim();
        this.mergeNavigate({
          search: term || null,
          page: null,
        });
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyQueryParams(p: ParamMap): void {
    const rawSt = (p.get('status') || '').trim().toUpperCase();
    const st = STATUS_FILTER_VALUES.includes(rawSt as StatusFilterValue) ? (rawSt as StatusFilterValue) : '';
    this.statusFilter.set(st);

    this.dateFrom.set(p.get('date_from') || '');
    this.dateTo.set(p.get('date_to') || '');

    const up = (p.get('upcoming') || '').toLowerCase();
    this.upcomingOnly.set(up === '1' || up === 'true');

    const ord = (p.get('ordering') || '').trim() || DEFAULT_ORDERING;
    this.ordering.set(ord);

    const pg = parseInt(p.get('page') || '1', 10);
    this.page.set(Number.isFinite(pg) && pg > 0 ? pg : 1);

    this.searchInput.set(p.get('search') || '');
  }

  loadPatients(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.service
      .getDoctorPatientsList(this.buildApiParams())
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading.set(false);
          if (this.isInitialLoad()) {
            this.isInitialLoad.set(false);
          }
        }),
        catchError(() => {
          this.hasError.set(true);
          return of(null);
        }),
      )
      .subscribe((res) => {
        if (!res) {
          return;
        }
        this.totalCount.set(res.count ?? 0);
        this.totalPages.set(res.total_pages ?? 1);
        this.patients.set(res.patients ?? []);
      });
  }

  buildApiParams(): Record<string, string | number> {
    const q: Record<string, string | number> = {
      page: this.page(),
      page_size: PAGE_SIZE,
      ordering: this.ordering(),
    };
    const st = this.statusFilter();
    if (st) q['appointment_status'] = st;
    const df = this.dateFrom();
    if (df) q['appointment_from'] = df;
    const dt = this.dateTo();
    if (dt) q['appointment_to'] = dt;
    if (this.upcomingOnly()) q['upcoming'] = '1';
    const s = (this.searchInput() || '').trim();
    if (s) q['search'] = s;
    return q;
  }

  onSearchInput(value: string): void {
    this.searchInput.set(value);
    this.searchDebounceBusy.set(true);
    this.searchDebounced$.next(value);
  }

  clearSearchInput(): void {
    this.searchInput.set('');
    this.searchDebounceBusy.set(false);
    this.mergeNavigate({ search: null, page: null });
  }

  setStatusFilter(value: StatusFilterValue): void {
    this.mergeNavigate({ status: value || null, page: null });
  }

  onDateFromChange(value: string): void {
    const to = this.dateTo();
    let nextTo = to;
    if (value && to && value > to) {
      nextTo = value;
    }
    const patch: Record<string, string | null> = { date_from: value || null, page: null };
    if (nextTo !== to) patch['date_to'] = nextTo || null;
    this.mergeNavigate(patch);
  }

  onDateToChange(value: string): void {
    this.mergeNavigate({ date_to: value || null, page: null });
  }

  setUpcomingOnly(value: boolean): void {
    this.mergeNavigate({ upcoming: value ? '1' : null, page: null });
  }

  sortBy(field: string): void {
    const cur = this.ordering();
    if (cur === field) {
      this.mergeNavigate({ ordering: `-${field}`, page: null });
    } else if (cur === `-${field}`) {
      this.mergeNavigate({ ordering: field, page: null });
    } else {
      this.mergeNavigate({ ordering: field, page: null });
    }
  }

  clearFilters(): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  removeChip(id: string): void {
    switch (id) {
      case 'status':
        this.mergeNavigate({ status: null, page: null });
        break;
      case 'date_from':
        this.mergeNavigate({ date_from: null, page: null });
        break;
      case 'date_to':
        this.mergeNavigate({ date_to: null, page: null });
        break;
      case 'upcoming':
        this.mergeNavigate({ upcoming: null, page: null });
        break;
      case 'search':
        this.mergeNavigate({ search: null, page: null });
        break;
      case 'ordering':
        this.mergeNavigate({ ordering: null, page: null });
        break;
      case 'page':
        this.mergeNavigate({ page: null });
        break;
    }
  }

  goToPage(n: number): void {
    const tp = this.totalPages();
    const next = Math.min(Math.max(1, n), Math.max(1, tp));
    const patch: Record<string, string | null> = {};
    patch['page'] = next <= 1 ? null : String(next);
    this.mergeNavigate(patch);
    this.scrollTableTop();
  }

  goDetail(event: MouseEvent, id: number): void {
    const t = event.target as HTMLElement | null;
    if (t?.closest('button, a')) return;
    void this.router.navigate(['/doctor/patients', id]);
  }

  retryLoad(): void {
    this.loadPatients();
  }

  toggleFiltersPanel(): void {
    this.filtersPanelOpen.update((v) => !v);
  }

  paginationSummary(): string {
    const count = this.totalCount();
    if (count === 0) return '';
    const start = (this.page() - 1) * PAGE_SIZE + 1;
    const end = Math.min(this.page() * PAGE_SIZE, count);
    const tp = Math.max(1, this.totalPages());
    const cur = this.page();
    return `${start}–${end} of ${count} · Page ${cur}/${tp} · ${PAGE_SIZE}/page`;
  }

  pageNumbers(): (number | 'ellipsis')[] {
    const total = Math.max(1, this.totalPages());
    const cur = this.page();
    const window = 2;
    const pages = new Set<number>();
    pages.add(1);
    pages.add(total);
    for (let i = cur - window; i <= cur + window; i++) {
      if (i >= 1 && i <= total) pages.add(i);
    }
    const sorted = [...pages].sort((a, b) => a - b);
    const out: (number | 'ellipsis')[] = [];
    let prev = 0;
    for (const p of sorted) {
      if (prev && p - prev > 1) out.push('ellipsis');
      out.push(p);
      prev = p;
    }
    return out;
  }

  scrollTableTop(): void {
    const el = document.getElementById('doctor-patients-table-anchor');
    el?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      REQUESTED: 'Requested',
      CONFIRMED: 'Confirmed',
      CHECKED_IN: 'Checked In',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
      NO_SHOW: 'No-Show',
    };
    return map[status] || status;
  }

  statusPillClass(value: string): string[] {
    if (!value) return ['appt-pill', 'appt-pill-all'];
    const map: Record<string, string> = {
      REQUESTED: 'appt-pill-requested',
      CONFIRMED: 'appt-pill-confirmed',
      CHECKED_IN: 'appt-pill-checked-in',
      COMPLETED: 'appt-pill-completed',
      CANCELLED: 'appt-pill-cancelled',
      NO_SHOW: 'appt-pill-no-show',
    };
    return ['appt-pill', map[value] || ''];
  }

  patientDisplayName(row: DoctorPatientListRow): string {
    return (row.username || '').trim() || `Patient #${row.id}`;
  }

  patientInitials(row: DoctorPatientListRow): string {
    const u = this.patientDisplayName(row);
    return u.slice(0, 2).toUpperCase();
  }

  isPast(dateIso: string | null | undefined): boolean {
    if (!dateIso) return false;
    const d = new Date(dateIso);
    return d.getTime() < Date.now();
  }

  sortFieldActive(field: string): boolean {
    const o = this.ordering();
    return o === field || o === `-${field}`;
  }

  sortIndicator(field: string): string {
    if (!this.sortFieldActive(field)) return '⇅';
    return this.ordering().startsWith('-') ? '↓' : '↑';
  }

  thSortClass(field: string): string {
    return this.sortFieldActive(field) ? 'th-sort-active' : '';
  }

  trackByPatient = (_: number, r: DoctorPatientListRow) => r.id;
  trackByChip = (_: number, c: { id: string }) => c.id;
  trackBySkeleton = (i: number) => i;
  trackByPageBtn = (_: number, p: number | 'ellipsis') => p;
  trackByStatusPill = (_: number, o: StatusFilterValue) => o || 'ALL';

  private mergeNavigate(patch: Record<string, string | null>): void {
    const cur = this.route.snapshot.queryParamMap;
    const next: Record<string, string> = {};
    cur.keys.forEach((k) => {
      const v = cur.get(k);
      if (v !== null && v !== undefined) next[k] = v;
    });
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === undefined || v === '') {
        delete next[k];
      } else {
        next[k] = v;
      }
    }
    void this.router.navigate([], { relativeTo: this.route, queryParams: next });
  }

  private sortPresetLabel(): string {
    const o = this.ordering();
    const map: Record<string, string> = {
      username: 'Username A→Z',
      '-username': 'Username Z→A',
      email: 'Email A→Z',
      '-email': 'Email Z→A',
      id: 'Patient ID (low→high)',
      '-id': 'Patient ID (high→low)',
      date_of_birth: 'Date of birth (oldest first)',
      '-date_of_birth': 'Date of birth (youngest first)',
    };
    return map[o] || 'Custom';
  }

  private formatChipDate(iso: string): string {
    const d = new Date(iso + 'T12:00:00');
    if (!Number.isFinite(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
}
