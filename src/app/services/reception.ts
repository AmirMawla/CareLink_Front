import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Appointment, AppointmentStatus } from '../models/appointment.model';
import { ApiService } from './api.service';

export type RescheduleRespondAction = 'APPROVE' | 'REJECT';

export interface PendingRescheduleRequestRow {
  id: number;
  appointment: number;
  patient_name: string;
  current_datetime: string;
  proposed_datetime: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class Reception {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);

  getTodayQueue(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(
      this.api.resolve('/api/appointments/reception/queue/')
    );
  }

  getAppointments(params: Record<string, string | number>): Observable<Appointment[]> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      httpParams = httpParams.set(key, String(value));
    }
    return this.http.get<Appointment[]>(
      this.api.resolve('/api/appointments/reception/appointments/'),
      { params: httpParams }
    );
  }

  updateStatus(id: number, status: AppointmentStatus): Observable<unknown> {
    return this.http.post(
      this.api.resolve(`/api/appointments/reception/appointment/${id}/status/`),
      { status }
    );
  }

  getPendingRescheduleRequests(): Observable<PendingRescheduleRequestRow[]> {
    return this.http.get<PendingRescheduleRequestRow[]>(
      this.api.resolve('/api/appointments/reception/reschedule-requests/pending/'),
    );
  }

  respondToRescheduleRequest(requestId: number, action: RescheduleRespondAction, note: string = ''): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      this.api.resolve(`/api/appointments/reschedule-request/${requestId}/respond/`),
      { action, note },
    );
  }
}
