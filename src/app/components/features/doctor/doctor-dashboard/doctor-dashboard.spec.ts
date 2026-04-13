import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { DoctorDashboard } from './doctor-dashboard';
import { DoctorDashboardService } from '../../../../services/doctor-dashboard';
import { DoctorDashboardStats, PendingAppointmentRow } from '../../../../models/doctor-dashboard.model';

describe('DoctorDashboard', () => {
  let component: DoctorDashboard;
  let fixture: ComponentFixture<DoctorDashboard>;
  let serviceMock: {
    getStats: ReturnType<typeof vi.fn>;
    getAppointmentsOverTime: ReturnType<typeof vi.fn>;
    getStatusBreakdown: ReturnType<typeof vi.fn>;
    getLoggedInDoctor: ReturnType<typeof vi.fn>;
    getPendingRequests: ReturnType<typeof vi.fn>;
    getQueueToday: ReturnType<typeof vi.fn>;
    confirmAppointment: ReturnType<typeof vi.fn>;
    rejectAppointment: ReturnType<typeof vi.fn>;
  };

  const statsPayload: DoctorDashboardStats = {
    total_appointments: 10,
    appointments_new_this_month: 2,
    total_patients: 5,
    patients_new_this_month: 1,
    completed_total: 8,
    completed_today: 1,
    no_show_total: 1,
    no_show_rate: 11.1,
    avg_wait_minutes_today: 12,
    checked_in_today: 3,
    pending_requests: 2,
    confirmed_today: 4,
    currently_waiting: 3,
    session_price: 50,
    revenue_total: 400,
    revenue_this_month: 200,
    revenue_today: 50,
    revenue_last_month: 100,
    revenue_mom_change_percent: 100.0,
    completed_this_month: 4,
    completed_last_month: 2,
    completion_rate: 88.0,
  };

  const pendingRow = (id: number): PendingAppointmentRow => ({
    id,
    scheduled_datetime: '2026-04-11T10:00:00Z',
    status: 'REQUESTED',
    is_telemedicine: false,
    patient_id: 1,
    patient_username: 'pat',
    patient_first_name: 'A',
    patient_last_name: 'B',
  });

  beforeEach(async () => {
    serviceMock = {
      getStats: vi.fn(() => of(statsPayload)),
      getAppointmentsOverTime: vi.fn(() =>
        of({
          period: '7d',
          session_price: 50,
          points: [{ date: '2026-04-11', label: 'Sat', count: 3, completed_count: 2, revenue: 100 }],
        }),
      ),
      getStatusBreakdown: vi.fn(() => of({ segments: [{ status: 'COMPLETED', count: 2, percent: 100 }], total: 2 })),
      getLoggedInDoctor: vi.fn(() => of({ id: 99 })),
      getPendingRequests: vi.fn(() => of([pendingRow(1)])),
      getQueueToday: vi.fn(() => of({ items: [] })),
      confirmAppointment: vi.fn(() => of({})),
      rejectAppointment: vi.fn(() => of({})),
    };

    await TestBed.configureTestingModule({
      imports: [DoctorDashboard],
      providers: [{ provide: DoctorDashboardService, useValue: serviceMock }, provideRouter([]), provideAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(DoctorDashboard);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit calls loadStats(), loadChart(), loadBreakdown(), loadPendingRequests()', () => {
    const loadStats = vi.spyOn(component, 'loadStats').mockImplementation(() => {
      component.statsLoading.set(false);
    });
    const loadChart = vi.spyOn(component, 'loadChart').mockImplementation(() => {
      component.chartLoading.set(false);
    });
    const loadBreakdown = vi.spyOn(component, 'loadBreakdown').mockImplementation(() => {
      component.breakdownLoading.set(false);
    });
    const loadPendingRequests = vi.spyOn(component, 'loadPendingRequests').mockImplementation(() => {
      component.pendingLoading.set(false);
    });
    fixture.detectChanges();
    expect(loadStats).toHaveBeenCalled();
    expect(loadChart).toHaveBeenCalled();
    expect(loadBreakdown).toHaveBeenCalled();
    expect(serviceMock.getLoggedInDoctor).toHaveBeenCalled();
    expect(loadPendingRequests).toHaveBeenCalled();
  });

  it('loadStats() sets statsLoading to false after success', () => {
    component.statsLoading.set(true);
    component.loadStats();
    expect(component.statsLoading()).toBe(false);
    expect(component.statsError()).toBe(false);
    expect(component.stats()).toEqual(statsPayload);
  });

  it('statsError is set to true when the stats API call fails', () => {
    serviceMock.getStats.mockReturnValue(throwError(() => new Error('fail')));
    component.loadStats();
    expect(component.statsError()).toBe(true);
    expect(component.statsLoading()).toBe(false);
  });

  it('confirm(id) calls service.confirmAppointment(id)', () => {
    fixture.detectChanges();
    component.confirm(5);
    expect(serviceMock.confirmAppointment).toHaveBeenCalledWith(5);
  });

  it('reject(id) calls service.rejectAppointment(id)', () => {
    fixture.detectChanges();
    component.reject(5);
    expect(serviceMock.rejectAppointment).toHaveBeenCalledWith(5);
  });

  it('after confirm(id) succeeds, the appointment is removed from pendingRequests()', () => {
    vi.useFakeTimers();
    try {
      component.doctorId.set(1);
      component.pendingRequests.set([pendingRow(7), pendingRow(8)]);
      serviceMock.confirmAppointment.mockReturnValue(of({}));
      component.confirm(7);
      expect(component.actionInProgress()).toBe(null);
      vi.advanceTimersByTime(400);
      expect(component.pendingRequests().some((p) => p.id === 7)).toBe(false);
      expect(component.pendingRequests().some((p) => p.id === 8)).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('after reject(id) succeeds, the appointment is removed from pendingRequests()', () => {
    vi.useFakeTimers();
    try {
      component.doctorId.set(1);
      component.pendingRequests.set([pendingRow(9)]);
      serviceMock.rejectAppointment.mockReturnValue(of({}));
      component.reject(9);
      vi.advanceTimersByTime(400);
      expect(component.pendingRequests().length).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("formatWait(0) returns '< 1 min'", () => {
    expect(component.formatWait(0)).toBe('< 1 min');
  });

  it("formatWait(45) returns '45 min'", () => {
    expect(component.formatWait(45)).toBe('45 min');
  });

  it('waitClass(10) returns wait-ok', () => {
    expect(component.waitClass(10)).toBe('wait-ok');
  });

  it('waitClass(20) returns wait-warning', () => {
    expect(component.waitClass(20)).toBe('wait-warning');
  });

  it('waitClass(40) returns wait-critical', () => {
    expect(component.waitClass(40)).toBe('wait-critical');
  });

  it('Confirm button is disabled while actionInProgress is non-null', () => {
    component.pendingRequests.set([pendingRow(20)]);
    component.pendingLoading.set(false);
    component.pendingError.set(false);
    component.actionInProgress.set(20);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.btn-success') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('KPI cards show loading skeleton when statsLoading is true', () => {
    fixture.detectChanges();
    component.statsLoading.set(true);
    fixture.detectChanges();
    const skeletons = fixture.nativeElement.querySelectorAll('.kpi-grid .skeleton-stat');
    expect(skeletons.length).toBe(8);
  });

  it('Empty state is shown when pendingRequests is an empty array', () => {
    serviceMock.getPendingRequests.mockReturnValue(of([]));
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('All clear');
  });
});
