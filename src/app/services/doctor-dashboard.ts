import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  AppointmentsOverTimeResponse,
  ChartPeriod,
  DoctorAppointmentDetailResponse,
  DoctorAppointmentsListResponse,
  DoctorDashboardStats,
  DoctorPatientDetailResponse,
  DoctorPatientsListResponse,
  DoctorProfileMe,
  DoctorProfileUpdateResponse,
  DoctorWeeklySchedule,
  DoctorWeeklyScheduleBulkDeleteResponse,
  DoctorWeeklyScheduleBulkSetResponse,
  DoctorWeeklyScheduleResponse,
  DoctorScheduleException,
  DoctorScheduleExceptionResponse,
  DoctorAvailableSlotsResponse,
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

  updateLoggedInDoctor(payload: Partial<{ specialty: string; session_duration: number | null; buffer_time: number | null }>): Observable<DoctorProfileUpdateResponse> {
    return this.http.put<DoctorProfileUpdateResponse>(this.api.resolve('/api/dashboard/doctor/me/update'), payload);
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

  patchDashboardAppointmentStatus(id: number, status: string): Observable<DoctorAppointmentDetailResponse> {
    return this.http.patch<DoctorAppointmentDetailResponse>(
      this.api.resolve(`/api/dashboard/doctor/appointments/${id}/status`),
      { status },
    );
  }

  getDoctorAppointmentDetail(id: number): Observable<DoctorAppointmentDetailResponse> {
    return this.http.get<DoctorAppointmentDetailResponse>(
      this.api.resolve(`/api/dashboard/doctor/appointments/${id}`),
    );
  }

  getDoctorPatientsList(params: Record<string, string | number>): Observable<DoctorPatientsListResponse> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      httpParams = httpParams.set(key, String(value));
    }
    return this.http.get<DoctorPatientsListResponse>(this.api.resolve('/api/dashboard/doctor/patients'), {
      params: httpParams,
    });
  }

  getDoctorPatientDetail(patientId: number): Observable<DoctorPatientDetailResponse> {
    return this.http.get<DoctorPatientDetailResponse>(
      this.api.resolve(`/api/dashboard/doctor/patients/${patientId}`),
    );
  }

  getDoctorWeeklySchedules(): Observable<DoctorWeeklySchedule[]> {
    return this.http.get<DoctorWeeklySchedule[]>(this.api.resolve('/api/dashboard/doctor/weekly-schedules'));
  }

  createDoctorWeeklySchedule(payload: {
    day_of_week: number;
    start_time: string;
    end_time: string;
  }): Observable<DoctorWeeklyScheduleResponse> {
    return this.http.post<DoctorWeeklyScheduleResponse>(
      this.api.resolve('/api/dashboard/doctor/weekly-schedules/create'),
      payload,
    );
  }

  updateDoctorWeeklySchedule(
    id: number,
    payload: Partial<{ day_of_week: number; start_time: string; end_time: string }>,
  ): Observable<DoctorWeeklyScheduleResponse> {
    return this.http.put<DoctorWeeklyScheduleResponse>(
      this.api.resolve(`/api/dashboard/doctor/weekly-schedules/update/${id}`),
      payload,
    );
  }

  deleteDoctorWeeklySchedule(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(this.api.resolve(`/api/dashboard/doctor/weekly-schedules/delete/${id}`));
  }

  bulkSetDoctorWeeklySchedules(payload: { start_time: string; end_time: string }): Observable<DoctorWeeklyScheduleBulkSetResponse> {
    return this.http.post<DoctorWeeklyScheduleBulkSetResponse>(
      this.api.resolve('/api/dashboard/doctor/weekly-schedules/bulk'),
      payload,
    );
  }

  bulkDeleteDoctorWeeklySchedules(): Observable<DoctorWeeklyScheduleBulkDeleteResponse> {
    return this.http.delete<DoctorWeeklyScheduleBulkDeleteResponse>(
      this.api.resolve('/api/dashboard/doctor/weekly-schedules/bulk-delete'),
    );
  }

  getDoctorScheduleExceptions(): Observable<DoctorScheduleException[]> {
    return this.http.get<DoctorScheduleException[]>(this.api.resolve('/api/dashboard/doctor/schedule-exceptions'));
  }

  createDoctorScheduleException(payload: {
    date: string;
    is_day_off: boolean;
    start_time?: string | null;
    end_time?: string | null;
  }): Observable<DoctorScheduleExceptionResponse> {
    return this.http.post<DoctorScheduleExceptionResponse>(
      this.api.resolve('/api/dashboard/doctor/schedule-exceptions/create'),
      payload,
    );
  }

  updateDoctorScheduleException(
    id: number,
    payload: Partial<{ date: string; is_day_off: boolean; start_time: string | null; end_time: string | null }>,
  ): Observable<DoctorScheduleExceptionResponse> {
    return this.http.put<DoctorScheduleExceptionResponse>(
      this.api.resolve(`/api/dashboard/doctor/schedule-exceptions/update/${id}`),
      payload,
    );
  }

  deleteDoctorScheduleException(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      this.api.resolve(`/api/dashboard/doctor/schedule-exceptions/delete/${id}`),
    );
  }

  getDoctorAvailableSlots(
    doctorId: number,
    params: Partial<{ date: string; range: 'all' | 'default'; days: number }> = {},
  ): Observable<DoctorAvailableSlotsResponse> {
    let httpParams = new HttpParams();
    if (params.date) httpParams = httpParams.set('date', params.date);
    if (params.range && params.range !== 'default') httpParams = httpParams.set('range', params.range);
    if (params.days) httpParams = httpParams.set('days', String(params.days));
    return this.http.get<DoctorAvailableSlotsResponse>(this.api.resolve(`/api/appointments/doctor/${doctorId}`), {
      params: httpParams,
    });
  }

  deleteDashboardAppointment(id: number): Observable<unknown> {
    return this.http.delete(this.api.resolve(`/api/dashboard/doctor/appointments/delete/${id}`));
  }
}
