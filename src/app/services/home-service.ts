import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment.development';
import { finalize, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HomeService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/dashboard/admin`;

  loading = signal<boolean>(false);

  // 1. General Analytics (Total users, appointments)
  stats = signal<any>(null);

  // 2. Doctor Analytics (Counts by specialty)
  doctorStats = signal<any>(null);

  // 3. Real User Data (For the Carousel)
  homeDoctors = signal<any[]>([]);

  fetchHomeData() {
    this.loading.set(true);

    // Request 1: Overview
    this.http
      .get(`${this.baseUrl}/analytics/overview/`)
      .pipe(
        tap((data) => this.stats.set(data)),
        finalize(() => this.checkLoading()),
      )
      .subscribe();

    // Request 2: Doctor Specific Analytics (By Specialty)
    this.http
      .get(`${this.baseUrl}/analytics/doctors/`)
      .pipe(
        tap((data) => this.doctorStats.set(data)),
        finalize(() => this.checkLoading()),
      )
      .subscribe();

    // Request 3: Active Doctors List (The new one for the carousel)
    const params = new HttpParams().set('role', 'DOCTOR').set('is_active', 'true').set('page', '1');

    this.http
      .get(`${this.baseUrl}/users/`, { params })
      .pipe(
        tap((res: any) => this.homeDoctors.set(res.results)),
        finalize(() => this.checkLoading()),
      )
      .subscribe();
  }

  private checkLoading() {
    // Only stop loading if all signals have data or we handle it via counter
    this.loading.set(false);
  }
}
