import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment.development';
import { finalize, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HomeService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/dashboard/admin`;

  loading = signal<boolean>(false);

  // 1. General Stats
  stats = signal<any>(null);
  doctorStats = signal<any>(null);

  // 2. Home Carousel
  homeDoctors = signal<any[]>([]);

  // 3. Search Page List
  doctorList = signal<any[]>([]);
  totalDoctors = signal<number>(0);

  fetchHomeData() {
    this.loading.set(true);

    // Stats
    this.http.get(`${this.baseUrl}/analytics/overview/`).subscribe((data) => this.stats.set(data));
    this.http
      .get(`${this.baseUrl}/analytics/doctors/`)
      .subscribe((data) => this.doctorStats.set(data));

    // Homepage Carousel Fetch (Updated to use the new /doctors/ endpoint)
    const params = new HttpParams().set('page', '1');

    this.http
      .get(`${this.baseUrl}/doctors/`, { params })
      .pipe(
        tap((res: any) => this.homeDoctors.set(res.results)),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  fetchDoctors(page: number, search: string = '', specialty: string = '') {
    this.loading.set(true);

    let params = new HttpParams().set('page', page.toString());

    if (search) params = params.set('search', search);
    if (specialty) params = params.set('specialty', specialty);

    return this.http.get(`${this.baseUrl}/doctors/`, { params }).pipe(
      tap((res: any) => {
        this.doctorList.set(res.results);
        this.totalDoctors.set(res.count);
      }),
      finalize(() => this.loading.set(false)),
    );
  }
}
