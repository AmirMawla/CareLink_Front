import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { DoctorDashboardService } from './doctor-dashboard';
import { ApiService } from './api.service';
import { environment } from '../../environments/environment';

describe('DoctorDashboardService', () => {
  let service: DoctorDashboardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    environment.apiUrl = '';
    TestBed.configureTestingModule({
      providers: [DoctorDashboardService, ApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DoctorDashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getStats() calls GET /api/dashboard/doctor/stats/', () => {
    service.getStats().subscribe();
    const req = httpMock.expectOne('/api/dashboard/doctor/stats/');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it("getAppointmentsOverTime('7d') calls the correct endpoint with period=7d param", () => {
    service.getAppointmentsOverTime('7d').subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/dashboard/doctor/appointments-over-time/' && r.params.get('period') === '7d');
    expect(req.request.method).toBe('GET');
    req.flush({ period: '7d', points: [] });
  });

  it("getAppointmentsOverTime('30d') calls the correct endpoint with period=30d param", () => {
    service.getAppointmentsOverTime('30d').subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/dashboard/doctor/appointments-over-time/' && r.params.get('period') === '30d');
    expect(req.request.method).toBe('GET');
    req.flush({ period: '30d', points: [] });
  });

  it("confirmAppointment(5) calls PATCH /api/appointments/5/ with body { status: 'CONFIRMED' }", () => {
    service.confirmAppointment(5).subscribe();
    const req = httpMock.expectOne('/api/appointments/5/');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'CONFIRMED' });
    req.flush({});
  });

  it("rejectAppointment(5) calls PATCH /api/appointments/5/ with body { status: 'CANCELLED' }", () => {
    service.rejectAppointment(5).subscribe();
    const req = httpMock.expectOne('/api/appointments/5/');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'CANCELLED' });
    req.flush({});
  });

  it('getPendingRequests(doctorId) passes status=REQUESTED and doctor=doctorId as query params', () => {
    service.getPendingRequests(12).subscribe();
    const req = httpMock.expectOne(
      (r) =>
        r.url === '/api/dashboard/doctor/appointments' &&
        r.params.get('status') === 'REQUESTED' &&
        r.params.get('doctor') === '12' &&
        r.params.get('page_size') === '100',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ count: 0, page: 1, total_pages: 1, page_size: 100, appointments: [] });
  });

  it('getQueueToday() calls GET /api/dashboard/doctor/queue-today/', () => {
    service.getQueueToday().subscribe();
    const req = httpMock.expectOne('/api/dashboard/doctor/queue-today/');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [] });
  });
});
