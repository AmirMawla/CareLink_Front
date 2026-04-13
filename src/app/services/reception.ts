import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Appointment, AppointmentStatus } from '../models/appointment.model';
import { ApiService } from './api.service';

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
}
