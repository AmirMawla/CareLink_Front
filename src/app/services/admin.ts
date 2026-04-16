import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment.development';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/dashboard/admin`;

  loading = signal<boolean>(false);

  // --- User Management ---
  getUsers(params: any): Observable<any> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach((key) => {
      if (params[key]) httpParams = httpParams.set(key, params[key]);
    });
    return this.http.get(`${this.baseUrl}/users/`, { params: httpParams });
  }

  // FIXED: Added missing method
  getUserById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/users/${id}/`);
  }

  toggleUserStatus(id: number, isActive: boolean): Observable<any> {
    return this.http.patch(`${this.baseUrl}/users/${id}/`, { is_active: isActive });
  }

  // --- Analytics ---
  getOverview(): Observable<any> {
    return this.http.get(`${this.baseUrl}/analytics/overview/`);
  }
  getUserStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/analytics/users/`);
  }
  getDoctorStats(params?: any): Observable<any> {
    let p = new HttpParams();
    if (params?.doctor_id) p = p.set('doctor_id', params.doctor_id);
    if (params?.specialty) p = p.set('specialty', params.specialty);
    return this.http.get(`${this.baseUrl}/analytics/doctors/`, { params: p });
  }
  getPatientStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/analytics/patients/`);
  }
  getAppointmentStats(doctor_id?: number): Observable<any> {
    const params = doctor_id ? { params: new HttpParams().set('doctor_id', doctor_id) } : {};
    return this.http.get(`${this.baseUrl}/analytics/appointments/`, params);
  }
  getConsultationStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/analytics/consultations/`);
  }
  getSchedulingStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/analytics/scheduling/`);
  }
  getAuditTrail(): Observable<any> {
    return this.http.get(`${this.baseUrl}/analytics/audit_trail/`);
  }

  getAppointmentAuditLogs(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/api/appointments/admin/audit-logs/`);
  }

  downloadReport(endpoint: string, params: any): Observable<Blob> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach((key) => {
      if (params[key]) httpParams = httpParams.set(key, params[key]);
    });

    return this.http.get(`${this.baseUrl}/reports/${endpoint}/`, {
      params: httpParams,
      responseType: 'blob',
    });
  }
}
