import { DatePipe, DecimalPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LegendPosition, NgxChartsModule } from '@swimlane/ngx-charts';
import { Subject, interval } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import {
  ChartPeriod,
  DoctorDashboardStats,
  PendingAppointmentRow,
  QueueItem,
  StatusSegment,
} from '../../../../models/doctor-dashboard.model';
import { DoctorDashboardService } from '../../../../services/doctor-dashboard';

@Component({
  selector: 'app-doctor-dashboard',
  imports: [NgIf, NgFor, NgClass, DatePipe, DecimalPipe, RouterLink, NgxChartsModule],
  templateUrl: './doctor-dashboard.html',
  styleUrl: './doctor-dashboard.css',
})
export class DoctorDashboard implements OnInit, OnDestroy {
  private readonly service = inject(DoctorDashboardService);
  private readonly destroy$ = new Subject<void>();
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  readonly today = new Date();

  readonly statsLoading = signal(true);
  readonly statsError = signal(false);
  readonly stats = signal<DoctorDashboardStats | null>(null);

  readonly chartLoading = signal(true);
  readonly chartError = signal(false);
  readonly chartPeriod = signal<ChartPeriod>('7d');
  readonly chartPoints = signal<{ date: string; label: string; count: number; completed_count?: number; revenue?: number }[]>(
    [],
  );
  readonly chartSessionPrice = signal<number | null>(null);

  /** ngx-charts view [width, height] — updated on resize */
  readonly chartView = signal<[number, number]>([920, 300]);
  /** Donut chart view */
  readonly pieView = signal<[number, number]>([400, 400]);

  readonly breakdownLoading = signal(true);
  readonly breakdownError = signal(false);
  readonly breakdownSegments = signal<StatusSegment[]>([]);
  readonly breakdownTotal = signal(0);

  readonly pendingLoading = signal(true);
  readonly pendingError = signal(false);
  readonly pendingRequests = signal<PendingAppointmentRow[]>([]);
  readonly fadingIds = signal<Set<number>>(new Set());

  readonly queueLoading = signal(true);
  readonly queueError = signal(false);
  readonly queueItems = signal<QueueItem[]>([]);

  readonly doctorId = signal<number | null>(null);

  readonly actionInProgress = signal<number | null>(null);

  readonly toastVisible = signal(false);
  readonly toastMessage = signal('');

  /** ngx-charts built-in scheme names (typed as string for chart inputs) */
  readonly schemeVisits: string = 'ocean';
  readonly schemeRevenue: string = 'flame';
  readonly schemePie: string = 'vivid';

  readonly pieLegendPosition = LegendPosition.Below;

  readonly queuePreview = computed(() => this.queueItems().slice(0, 5));

  readonly appointmentsChartSeries = computed(() =>
    this.chartPoints().map((p) => ({ name: p.label, value: p.count })),
  );

  readonly revenueChartSeries = computed(() =>
    this.chartPoints().map((p) => ({ name: p.label, value: p.revenue ?? 0 })),
  );

  readonly statusPieSeries = computed(() =>
    this.breakdownSegments().map((s) => ({
      name: this.formatStatusLabel(s.status),
      value: s.count,
      extra: { percent: s.percent },
    })),
  );

  readonly chartHasAnyActivity = computed(() => {
    const pts = this.chartPoints();
    return pts.some((p) => p.count > 0 || (p.revenue ?? 0) > 0);
  });

  ngOnInit(): void {
    this.updateChartView();
    this.loadStats();
    this.loadChart();
    this.loadBreakdown();
    this.loadDoctorAndPending();
    this.loadQueue(true);
    this.startQueueRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer !== null) {
      clearTimeout(this.toastTimer);
    }
  }

  @HostListener('window:resize')
  onWinResize(): void {
    this.updateChartView();
  }

  private updateChartView(): void {
    if (typeof window === 'undefined') {
      return;
    }
    const w = Math.max(320, Math.min(1120, window.innerWidth - 64));
    const barH = Math.min(320, Math.max(240, Math.round(window.innerHeight * 0.28)));
    const pieSize = Math.min(440, Math.round(w * 0.42));
    this.chartView.set([w, barH]);
    this.pieView.set([pieSize, pieSize]);
  }

  loadStats(): void {
    this.statsLoading.set(true);
    this.statsError.set(false);
    this.service
      .getStats()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.statsLoading.set(false)),
      )
      .subscribe({
        next: (s) => this.stats.set(s),
        error: () => {
          this.statsError.set(true);
          this.stats.set(null);
        },
      });
  }

  loadChart(): void {
    this.chartLoading.set(true);
    this.chartError.set(false);
    const period = this.chartPeriod();
    this.service
      .getAppointmentsOverTime(period)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.chartLoading.set(false)),
      )
      .subscribe({
        next: (r) => {
          this.chartPoints.set(r.points ?? []);
          this.chartSessionPrice.set(r.session_price ?? null);
        },
        error: () => {
          this.chartError.set(true);
          this.chartPoints.set([]);
          this.chartSessionPrice.set(null);
        },
      });
  }

  setChartPeriod(p: ChartPeriod): void {
    this.chartPeriod.set(p);
    this.loadChart();
  }

  loadBreakdown(): void {
    this.breakdownLoading.set(true);
    this.breakdownError.set(false);
    this.service
      .getStatusBreakdown()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.breakdownLoading.set(false)),
      )
      .subscribe({
        next: (r) => {
          this.breakdownSegments.set(r.segments ?? []);
          this.breakdownTotal.set(r.total ?? 0);
        },
        error: () => {
          this.breakdownError.set(true);
          this.breakdownSegments.set([]);
          this.breakdownTotal.set(0);
        },
      });
  }

  loadDoctorAndPending(): void {
    this.pendingLoading.set(true);
    this.pendingError.set(false);
    this.service
      .getLoggedInDoctor()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (d) => {
          this.doctorId.set(d.id);
          this.loadPendingRequests();
        },
        error: () => {
          this.pendingError.set(true);
          this.pendingLoading.set(false);
          this.pendingRequests.set([]);
        },
      });
  }

  loadPendingRequests(): void {
    const id = this.doctorId();
    if (id == null) {
      return;
    }
    this.pendingLoading.set(true);
    this.pendingError.set(false);
    this.service
      .getPendingRequests(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.pendingLoading.set(false)),
      )
      .subscribe({
        next: (rows) => this.pendingRequests.set(rows),
        error: () => {
          this.pendingError.set(true);
          this.pendingRequests.set([]);
        },
      });
  }

  loadQueue(initial: boolean): void {
    if (initial) {
      this.queueLoading.set(true);
    }
    this.queueError.set(false);
    this.service
      .getQueueToday()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          if (initial) {
            this.queueLoading.set(false);
          }
        }),
      )
      .subscribe({
        next: (r) => this.queueItems.set(r.items ?? []),
        error: () => {
          this.queueError.set(true);
          if (initial) {
            this.queueItems.set([]);
          }
        },
      });
  }

  startQueueRefresh(): void {
    interval(30_000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadQueue(false));
  }

  /** ngx-charts Y-axis: integers for visit counts */
  readonly yAxisTicksInt = (value: number): string =>
    Number.isFinite(value) ? String(Math.round(value)) : '';

  /** Format revenue integers (backend uses same unit as session_price). */
  formatMoney(value: number): string {
    if (!Number.isFinite(value)) {
      return '';
    }
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(Math.round(value));
  }

  /**
   * Short line for MoM revenue (this month vs previous calendar month).
   */
  revenueMomText(s: DoctorDashboardStats): string {
    const cur = s.revenue_this_month ?? 0;
    const prev = s.revenue_last_month ?? 0;
    const pct = s.revenue_mom_change_percent;
    if (prev === 0 && cur === 0) {
      return `Same as last month (${this.formatMoney(0)})`;
    }
    if (prev === 0 && cur > 0) {
      return 'First revenue vs last month (was 0)';
    }
    if (pct === null || pct === undefined) {
      return `Last month ${this.formatMoney(prev)}`;
    }
    if (pct === 0) {
      return `Flat vs last month (${this.formatMoney(prev)})`;
    }
    const dir = pct > 0 ? '↑' : '↓';
    return `${dir} ${Math.abs(pct)}% vs last month (${this.formatMoney(prev)})`;
  }

  revenueMomUp(s: DoctorDashboardStats): boolean {
    const p = s.revenue_mom_change_percent;
    return p !== null && p !== undefined && p > 0;
  }

  revenueMomDown(s: DoctorDashboardStats): boolean {
    const p = s.revenue_mom_change_percent;
    return p !== null && p !== undefined && p < 0;
  }

  readonly formatMoneyAxis = (value: number): string => this.formatMoney(value);

  formatWait(minutes: number): string {
    if (minutes < 1) {
      return '< 1 min';
    }
    return `${minutes} min`;
  }

  waitClass(minutes: number): string {
    if (minutes < 15) {
      return 'wait-ok';
    }
    if (minutes <= 30) {
      return 'wait-warning';
    }
    return 'wait-critical';
  }

  patientDisplayName(row: PendingAppointmentRow): string {
    const fn = (row.patient_first_name || '').trim();
    const ln = (row.patient_last_name || '').trim();
    const combined = `${fn} ${ln}`.trim();
    return combined || row.patient_username || 'Patient';
  }

  patientInitials(row: PendingAppointmentRow): string {
    const fn = (row.patient_first_name || '').trim();
    const ln = (row.patient_last_name || '').trim();
    if (fn && ln) {
      return (fn[0] + ln[0]).toUpperCase();
    }
    const name = this.patientDisplayName(row);
    return name.slice(0, 2).toUpperCase();
  }

  statusSegmentClass(status: string): string {
    const map: Record<string, string> = {
      COMPLETED: 'seg-completed',
      CONFIRMED: 'seg-confirmed',
      CHECKED_IN: 'seg-checked-in',
      REQUESTED: 'seg-requested',
      NO_SHOW: 'seg-no-show',
      CANCELLED: 'seg-cancelled',
    };
    return map[status] || 'seg-default';
  }

  statusLegendClass(status: string): string {
    return `legend-dot ${this.statusSegmentClass(status)}`;
  }

  trackBySkeleton = (i: number) => i;

  trackByPoint = (_: number, p: { date: string }) => p.date;
  trackBySegment = (_: number, s: StatusSegment) => s.status;
  trackByPending = (_: number, r: PendingAppointmentRow) => r.id;
  trackByQueue = (_: number, q: QueueItem) => q.id;

  confirm(id: number): void {
    this.actionInProgress.set(id);
    this.service
      .confirmAppointment(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.actionInProgress.set(null);
          this.showToast('Appointment confirmed');
          this.beginRemovePendingRow(id);
          this.loadStats();
        },
        error: () => this.actionInProgress.set(null),
      });
  }

  reject(id: number): void {
    this.actionInProgress.set(id);
    this.service
      .rejectAppointment(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.actionInProgress.set(null);
          this.showToast('Request declined');
          this.beginRemovePendingRow(id);
          this.loadStats();
        },
        error: () => this.actionInProgress.set(null),
      });
  }

  private beginRemovePendingRow(id: number): void {
    this.fadingIds.update((s) => new Set(s).add(id));
    setTimeout(() => {
      this.pendingRequests.update((list) => list.filter((a) => a.id !== id));
      this.fadingIds.update((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }, 380);
  }

  private showToast(message: string): void {
    this.toastMessage.set(message);
    this.toastVisible.set(true);
    if (this.toastTimer !== null) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.toastVisible.set(false);
      this.toastTimer = null;
    }, 3500);
  }

  isFading(id: number): boolean {
    return this.fadingIds().has(id);
  }

  formatStatusLabel(status: string): string {
    return status
      .split('_')
      .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
      .join(' ');
  }

  refreshDashboard(): void {
    this.loadStats();
    this.loadChart();
    this.loadBreakdown();
    this.loadPendingRequests();
    this.loadQueue(false);
  }

  readonly skeletonChartBars = [1, 2, 3, 4, 5, 6, 7];
  readonly skeletonRows3 = [1, 2, 3];
  readonly skeletonQueueRows = [1, 2, 3, 4, 5];
}
