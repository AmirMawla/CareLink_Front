import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment.development';
import { Observable, finalize } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/dashboard/admin/users/`;

  // Global loading state to prevent UI lag
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  getUsers(params: any): Observable<any> {
    this.loading.set(true);
    this.error.set(null);
    
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key]) httpParams = httpParams.set(key, params[key]);
    });

    return this.http.get<any>(this.baseUrl, { params: httpParams }).pipe(
      finalize(() => this.loading.set(false))
    );
  }

  getUserById(id: number): Observable<any> {
    this.loading.set(true);
    return this.http.get<any>(`${this.baseUrl}${id}/`).pipe(
      finalize(() => this.loading.set(false))
    );
  }

  toggleUserStatus(id: number, isActive: boolean): Observable<any> {
    return this.http.patch(`${this.baseUrl}${id}/`, { is_active: isActive });
  }
}