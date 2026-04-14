import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { Subject, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, finalize, switchMap, takeUntil, tap } from 'rxjs/operators';
import { DoctorAppointmentListRow } from '../../../../models/doctor-dashboard.model';
import { DoctorDashboardService } from '../../../../services/doctor-dashboard';

const DEFAULT_ORDERING = '-scheduled_datetime';
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
  selector: 'app-doctor-appointments',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, DatePipe, RouterLink],
  templateUrl: './doctor-appointments.html',
  styleUrl: './doctor-appointments.css',
})
export class DoctorAppointments implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(DoctorDashboardService);
  private readonly destroy$ = new Subject<void>();
  private readonly searchDebounced$ = new Subject<string>();
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  readonly pageSize = PAGE_SIZE;
  readonly defaultOrdering = DEFAULT_ORDERING;
  readonly statusPillOptions: StatusFilterValue[] = [...STATUS_FILTER_VALUES];

  readonly statusFilter = signal<StatusFilterValue>('');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly telemedicineFilter = signal<'all' | 'true' | 'false'>('all');
  readonly ordering = signal(DEFAULT_ORDERING);
  readonly page = signal(1);
  readonly searchInput = signal('');

  readonly searchDebounceBusy = signal(false);

  readonly isInitialLoad = signal(true);
  readonly isLoading = signal(false);
  readonly hasError = signal(false);

  readonly totalCount = signal(0);
  readonly totalPages = signal(1);
  readonly appointments = signal<DoctorAppointmentListRow[]>([]);

  readonly actionRowId = signal<number | null>(null);

  readonly toastVisible = signal(false);
  readonly toastMessage = signal('');

  readonly filtersPanelOpen = signal(false);

  readonly hasQueryFilters = computed(() => {
    if (this.statusFilter()) return true;
    if (this.dateFrom()) return true;
    if (this.dateTo()) return true;
    if (this.telemedicineFilter() !== 'all') return true;
    if ((this.searchInput() || '').trim()) return true;
    if (this.ordering() !== DEFAULT_ORDERING) return true;
    if (this.page() > 1) return true;
    return false;
  });

  readonly activeFilterChips = computed(() => {
    const chips: { id: string; label: string }[] = [];
    const st = this.statusFilter();
    if (st) {
      chips.push({ id: 'status', label: `Status: ${this.statusLabel(st)}` });
    }
    const df = this.dateFrom();
    if (df) {
      chips.push({ id: 'date_from', label: `From: ${this.formatChipDate(df)}` });
    }
    const dt = this.dateTo();
    if (dt) {
      chips.push({ id: 'date_to', label: `To: ${this.formatChipDate(dt)}` });
    }
    const tel = this.telemedicineFilter();
    if (tel === 'true') chips.push({ id: 'tel', label: 'Type: Telemedicine' });
    if (tel === 'false') chips.push({ id: 'tel', label: 'Type: In-Person' });
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

  readonly emptyNoAppointments = computed(
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
          return this.service.getDoctorAppointmentsList(this.buildApiParams()).pipe(
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
        this.appointments.set(res.appointments ?? []);
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
    if (this.toastTimer !== null) {
      clearTimeout(this.toastTimer);
    }
  }

  applyQueryParams(p: ParamMap): void {
    const rawSt = (p.get('status') || '').trim().toUpperCase();
    const st = STATUS_FILTER_VALUES.includes(rawSt as StatusFilterValue) ? (rawSt as StatusFilterValue) : '';
    this.statusFilter.set(st);

    this.dateFrom.set(p.get('date_from') || '');
    this.dateTo.set(p.get('date_to') || '');

    const tel = (p.get('is_telemedicine') || '').toLowerCase();
    if (tel === 'true' || tel === '1') this.telemedicineFilter.set('true');
    else if (tel === 'false' || tel === '0') this.telemedicineFilter.set('false');
    else this.telemedicineFilter.set('all');

    const ord = (p.get('ordering') || '').trim() || DEFAULT_ORDERING;
    this.ordering.set(ord);

    const pg = parseInt(p.get('page') || '1', 10);
    this.page.set(Number.isFinite(pg) && pg > 0 ? pg : 1);

    this.searchInput.set(p.get('search') || '');
  }

  loadAppointments(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.service
      .getDoctorAppointmentsList(this.buildApiParams())
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
        this.appointments.set(res.appointments ?? []);
      });
  }

  buildApiParams(): Record<string, string | number> {
    const q: Record<string, string | number> = {
      page: this.page(),
      page_size: PAGE_SIZE,
      ordering: this.ordering(),
    };
    const st = this.statusFilter();
    if (st) q['status'] = st;
    const df = this.dateFrom();
    if (df) q['date_from'] = df;
    const dt = this.dateTo();
    if (dt) q['date_to'] = dt;
    const tel = this.telemedicineFilter();
    if (tel === 'true') q['is_telemedicine'] = 'true';
    if (tel === 'false') q['is_telemedicine'] = 'false';
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

  setTelemedicineFilter(value: 'all' | 'true' | 'false'): void {
    const patch: Record<string, string | null> = { page: null };
    if (value === 'all') patch['is_telemedicine'] = null;
    else patch['is_telemedicine'] = value;
    this.mergeNavigate(patch);
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
    this.statusFilter.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.telemedicineFilter.set('all');
    this.ordering.set(DEFAULT_ORDERING);
    this.page.set(1);
    this.searchInput.set('');
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
      case 'tel':
        this.mergeNavigate({ is_telemedicine: null, page: null });
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

  confirm(id: number): void {
    this.patchRowStatus(id, 'CONFIRMED', 'Appointment confirmed');
  }

  reject(row: DoctorAppointmentListRow): void {
    const id = row?.id;
    if (!id) return;
    if (!this.canRejectStatus(row.status)) return;

    this.patchRowStatus(id, 'CANCELLED', 'Appointment cancelled — slot is available again');
  }

  completeAppointment(id: number): void {
    this.actionRowId.set(id);
    this.service
      .patchDashboardAppointmentStatus(id, 'COMPLETED')
      .pipe(takeUntil(this.destroy$), finalize(() => this.actionRowId.set(null)))
      .subscribe({
        next: (res) => {
          const nextStatus = res?.appointment?.status ?? 'COMPLETED';
          this.appointments.update((rows) =>
            rows.map((r) => (r.id === id ? { ...r, status: nextStatus } : r)),
          );
          this.showToast('Marked complete');
        },
        error: (err) => {
          if (this.isCompleteBlockedByConsultation(err)) {
            this.goToConsultationToComplete(id);
            return;
          }
          this.showToast(this.apiErrorMessage(err));
        },
      });
  }

  markNoShow(id: number): void {
    this.patchRowStatus(id, 'NO_SHOW', 'Marked as no-show');
  }

  revertToCheckedIn(id: number): void {
    this.patchRowStatus(id, 'CHECKED_IN', 'Status set to checked in');
  }

  canConfirmStatus(status: string): boolean {
    return status === 'REQUESTED';
  }

  canRejectStatus(status: string): boolean {
    return status !== 'COMPLETED' && status !== 'CANCELLED';
  }

  canNoShowStatus(status: string): boolean {
    return status !== 'REQUESTED' && status !== 'CANCELLED';
  }

  canCompleteStatus(status: string): boolean {
    return status !== 'REQUESTED' && status !== 'CANCELLED' && status !== 'COMPLETED';
  }

  canRevertToCheckedInStatus(status: string): boolean {
    return status !== 'REQUESTED' && status !== 'CANCELLED' && status !== 'CHECKED_IN';
  }

  canConsultationAction(row: DoctorAppointmentListRow): boolean {
    const st = row.status;
    const has = !!row.has_consultation;
    if (has) {
      return st === 'CHECKED_IN' || st === 'NO_SHOW' || st === 'COMPLETED';
    }
    return st === 'CHECKED_IN' || st === 'NO_SHOW';
  }

  consultationListLabel(row: DoctorAppointmentListRow): string {
    return row.has_consultation ? 'Edit consultation' : 'Add consultation';
  }

  rowActionLocked(rowId: number): boolean {
    return this.actionRowId() === rowId;
  }

  goConsultation(row: DoctorAppointmentListRow): void {
    if (!this.canConsultationAction(row)) return;
    void this.router.navigate(['/doctor/consultation', row.id]);
  }

  closeApptActionsMenu(event: Event): void {
    const el = (event.currentTarget as HTMLElement | null)?.closest('details.appt-actions-details');
    if (el) {
      el.removeAttribute('open');
    }
  }

  /** Tooltips for disabled menu rows — matches dashboard doctor status rules */
  tooltipConfirm(status: string): string {
    if (status === 'REQUESTED') return '';
    return 'Only when status is Requested. You cannot check in a patient from here—reception does that after you confirm.';
  }

  tooltipReject(status: string): string {
    if (status === 'COMPLETED') return 'Completed appointments cannot be rejected.';
    if (status === 'CANCELLED') return 'Already cancelled.';
    return 'Cancels the appointment and frees the time slot.';
  }

  tooltipConsultation(row: DoctorAppointmentListRow): string {
    if (this.canConsultationAction(row)) return '';
    return 'Add when checked in or no-show; edit when a consultation already exists.';
  }

  tooltipRevertCheckedIn(status: string): string {
    if (status === 'REQUESTED') return 'Confirm first.';
    if (status === 'CANCELLED') return 'Cannot check in a cancelled appointment.';
    if (status === 'CHECKED_IN') return 'Already checked in.';
    return 'Marks appointment as CHECKED_IN.';
  }

  tooltipComplete(status: string): string {
    if (status === 'COMPLETED') return 'Already completed.';
    if (status === 'REQUESTED') return 'Confirm first.';
    if (status === 'CANCELLED') return 'Cannot complete a cancelled appointment.';
    return 'Marks appointment as completed (requires consultation notes on the server).';
  }

  tooltipNoShow(status: string): string {
    if (status === 'NO_SHOW') return 'Already no-show.';
    if (status === 'REQUESTED') return 'Confirm first.';
    if (status === 'CANCELLED') return 'Cannot set no-show on a cancelled appointment.';
    return 'Marks appointment as no-show.';
  }

  private isCompleteBlockedByConsultation(err: unknown): boolean {
    const httpErr = err as HttpErrorResponse;
    const body = httpErr?.error;
    if (!body || typeof body !== 'object') return false;
    const statusArr = (body as { errors?: { status?: string[] } }).errors?.status;
    const msg = statusArr?.[0];
    return typeof msg === 'string' && msg.toLowerCase().includes('consultation');
  }

  /** Navigates to consultation without changing appointment status. */
  private goToConsultationToComplete(id: number): void {
    void this.router.navigate(['/doctor/consultation', id]);
  }

  private patchRowStatus(id: number, status: string, successMsg: string): void {
    this.actionRowId.set(id);
    this.service
      .patchDashboardAppointmentStatus(id, status)
      .pipe(takeUntil(this.destroy$), finalize(() => this.actionRowId.set(null)))
      .subscribe({
        next: (res) => {
          const nextStatus = res?.appointment?.status ?? status;
          this.appointments.update((rows) =>
            rows.map((r) => (r.id === id ? { ...r, status: nextStatus } : r)),
          );
          this.showToast(successMsg);
        },
        error: (err) => {
          this.showToast(this.apiErrorMessage(err));
        },
      });
  }

  private apiErrorMessage(err: unknown): string {
    const httpErr = err as HttpErrorResponse;
    const status = httpErr?.status;
    const body = httpErr?.error;

    if (typeof body === 'string' && body.trim()) {
      const t = body.replace(/<[^>]+>/g, '').trim();
      if (t.length) return t.length > 200 ? `${t.slice(0, 200)}…` : t;
    }

    if (body && typeof body === 'object') {
      const e = body as Record<string, unknown>;
      const detail = e['detail'];
      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail) && detail.length && typeof detail[0] === 'string') {
        return detail[0];
      }
      const msg = e['message'];
      if (typeof msg === 'string') return msg;
      const statusArr = e['errors'] as { status?: string[] } | undefined;
      if (statusArr?.status?.length) return statusArr.status[0];
    }

    if (status === 403) return 'You do not have permission to perform this action.';
    if (status === 404) return 'Appointment not found.';
    if (status === 401) return 'Please sign in again.';
    if (status === 0) return 'Could not reach the server.';

    return 'Action could not be completed. Try again.';
  }

  goDetail(event: MouseEvent, id: number): void {
    const t = event.target as HTMLElement | null;
    if (t?.closest('button, a')) return;
    void this.router.navigate(['/doctor/appointments', id]);
  }

  retryLoad(): void {
    this.loadAppointments();
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
    const el = document.getElementById('doctor-appts-table-anchor');
    el?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }

  statusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      REQUESTED: 'badge-requested',
      CONFIRMED: 'badge-confirmed',
      CHECKED_IN: 'badge-checked-in',
      COMPLETED: 'badge-completed',
      CANCELLED: 'badge-cancelled',
      NO_SHOW: 'badge-no-show',
    };
    return `badge ${map[status] || 'badge-info'}`;
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

  patientName(row: DoctorAppointmentListRow): string {
    const fn = (row.patient_first_name || '').trim();
    const ln = (row.patient_last_name || '').trim();
    const combined = `${fn} ${ln}`.trim();
    return combined || row.patient_username || 'Patient';
  }

  patientInitials(row: DoctorAppointmentListRow): string {
    const fn = (row.patient_first_name || '').trim();
    const ln = (row.patient_last_name || '').trim();
    if (fn && ln) return (fn[0] + ln[0]).toUpperCase();
    const name = this.patientName(row);
    return name.slice(0, 2).toUpperCase();
  }

  isPast(dateIso: string): boolean {
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

  rowAccentClass(row: DoctorAppointmentListRow): string {
    const parts: string[] = [];
    if (row.is_telemedicine) parts.push('row-tel');
    if (row.status === 'COMPLETED') parts.push('row-done');
    if (row.status === 'CANCELLED') parts.push('row-cancelled');
    if (row.status === 'NO_SHOW') parts.push('row-noshow');
    return parts.join(' ');
  }

  trackByAppt = (_: number, r: DoctorAppointmentListRow) => r.id;
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

  private orderingToPreset(ord: string): string {
    switch (ord) {
      case '-scheduled_datetime':
        return 'date_desc';
      case 'scheduled_datetime':
        return 'date_asc';
      case 'patient__user__last_name':
        return 'patient_asc';
      case '-patient__user__last_name':
        return 'patient_desc';
      case 'status':
      case '-status':
        return 'status';
      case 'check_in_time':
      case '-check_in_time':
        return 'wait';
      default:
        return 'date_desc';
    }
  }

  private sortPresetLabel(): string {
    const map: Record<string, string> = {
      date_desc: 'Date (newest first)',
      date_asc: 'Date (oldest first)',
      patient_asc: 'Patient A→Z',
      patient_desc: 'Patient Z→A',
      status: 'Status',
      wait: 'Wait time',
    };
    return map[this.orderingToPreset(this.ordering())] || 'Custom';
  }

  private formatChipDate(iso: string): string {
    const d = new Date(iso + 'T12:00:00');
    if (!Number.isFinite(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  private showToast(msg: string): void {
    if (this.toastTimer !== null) clearTimeout(this.toastTimer);
    this.toastMessage.set(msg);
    this.toastVisible.set(true);
    this.toastTimer = setTimeout(() => {
      this.toastVisible.set(false);
      this.toastTimer = null;
    }, 2800);
  }
}
