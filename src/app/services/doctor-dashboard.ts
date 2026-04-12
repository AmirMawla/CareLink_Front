import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  AppointmentsOverTimeResponse,
  ChartPeriod,
  DoctorAppointmentsListResponse,
  DoctorDashboardStats,
  DoctorProfileMe,
  PendingAppointmentRow,
  PendingRequestsResponse,
  QueueTodayResponse,
  StatusBreakdownResponse,
} from '../models/doctor-dashboard.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class DoctorDashboardService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);

  getLoggedInDoctor(): Observable<DoctorProfileMe> {
    return this.http.get<DoctorProfileMe>(this.api.resolve('/api/dashboard/doctor/me'));
  }

  getStats(): Observable<DoctorDashboardStats> {
    return this.http.get<DoctorDashboardStats>(this.api.resolve('/api/dashboard/doctor/stats/'));
  }

  getAppointmentsOverTime(period: ChartPeriod): Observable<AppointmentsOverTimeResponse> {
    const params = new HttpParams().set('period', period);
    return this.http.get<AppointmentsOverTimeResponse>(
      this.api.resolve('/api/dashboard/doctor/appointments-over-time/'),
      { params },
    );
  }

  getStatusBreakdown(): Observable<StatusBreakdownResponse> {
    return this.http.get<StatusBreakdownResponse>(this.api.resolve('/api/dashboard/doctor/status-breakdown/'));
  }

  getPendingRequests(doctorId: number): Observable<PendingAppointmentRow[]> {
    const params = new HttpParams().set('status', 'REQUESTED').set('doctor', String(doctorId)).set('page_size', '100');
    return this.http
      .get<PendingRequestsResponse>(this.api.resolve('/api/dashboard/doctor/appointments'), { params })
      .pipe(map((r) => r.appointments ?? []));
  }

  getQueueToday(): Observable<QueueTodayResponse> {
    return this.http.get<QueueTodayResponse>(this.api.resolve('/api/dashboard/doctor/queue-today/'));
  }

  confirmAppointment(id: number): Observable<unknown> {
    return this.http.patch(this.api.resolve(`/api/appointments/${id}/`), { status: 'CONFIRMED' });
  }

  rejectAppointment(id: number): Observable<unknown> {
    return this.http.patch(this.api.resolve(`/api/appointments/${id}/`), { status: 'CANCELLED' });
  }

  getDoctorAppointmentsList(params: Record<string, string | number>): Observable<DoctorAppointmentsListResponse> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      httpParams = httpParams.set(key, String(value));
    }
    return this.http.get<DoctorAppointmentsListResponse>(
      this.api.resolve('/api/dashboard/doctor/appointments'),
      { params: httpParams },
    );
  }

  patchDashboardAppointmentStatus(id: number, status: string): Observable<unknown> {
    return this.http.patch(this.api.resolve(`/api/dashboard/doctor/appointments/${id}/status`), { status });
  }
}
