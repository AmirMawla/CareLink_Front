import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subject, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { LogoutResponse } from '../../../components/features/auth/login/login';
import { ApiService } from '../../../services/api.service';
import { BaseProfile } from '../../../models/users';

@Component({
  selector: 'app-main-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './main-navbar.component.html',
  styleUrls: ['./main-navbar.component.css'],
})
export class MainNavbarComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly api = inject(ApiService);
  private readonly destroy$ = new Subject<void>();

  readonly menuOpen = signal(false);
  readonly userName = signal('');
  readonly userInitials = signal('—');
  readonly profileUrl = signal('/profile');
  readonly authProfile = signal('/auth/profile');
  isMobileMenuOpen = false;

  get token(): string | null {
    return localStorage.getItem('token');
  }

  ngOnInit(): void {
    if (!this.token) {
      return;
    }
    this.http
      .get<BaseProfile>(this.api.resolve('/api/accounts/profile/'))
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => of(null)),
      )
      .subscribe((p) => {
        if (p) {
          this.userName.set(this.displayName(p));
          this.userInitials.set(this.initialsFromProfile(p));
          this.profileUrl.set(this.profilePathForRole(p.role));
        } else {
          this.userName.set('Account');
          this.userInitials.set('?');
        }
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleUserMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeUserMenu(): void {
    this.menuOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.menuOpen()) return;
    const t = event.target as HTMLElement | null;
    if (t && !t.closest('.cl-mainnav__user')) {
      this.menuOpen.set(false);
    }
  }

  logout(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      this.afterLogoutUi();
      void this.router.navigate(['/auth/login']);
      return;
    }
    const headers = new HttpHeaders({ Authorization: `Token ${token}` });
    this.http.post<LogoutResponse>(this.api.resolve('/api/accounts/logout/'), {}, { headers }).subscribe({
      next: () => {
        this.afterLogoutUi();
        void this.router.navigate(['/auth/login']);
      },
      error: () => {
        localStorage.removeItem('token');
        this.afterLogoutUi();
        void this.router.navigate(['/auth/login']);
      },
    });
  }

  private afterLogoutUi(): void {
    localStorage.removeItem('token');
    this.closeUserMenu();
    this.userName.set('');
    this.userInitials.set('—');
    this.profileUrl.set('/profile');
    this.cdr.detectChanges();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
    this.closeUserMenu();
  }

  private displayName(p: BaseProfile): string {
    const full = `${(p.first_name || '').trim()} ${(p.last_name || '').trim()}`.trim();
    if (full) return full;
    const u = (p.username || '').trim();
    if (u) return u;
    return (p.email || '').trim() || 'User';
  }

  private initialsFromProfile(p: BaseProfile): string {
    const fn = (p.first_name || '').trim();
    const ln = (p.last_name || '').trim();
    if (fn && ln) return (fn.charAt(0) + ln.charAt(0)).toUpperCase();
    return this.initialsFromName(this.displayName(p));
  }

  private initialsFromName(name: string): string {
    const parts = name
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length >= 2) return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    const s = (name || '').trim();
    return (s.slice(0, 2) || '—').toUpperCase();
  }

  private profilePathForRole(role: string): string {
    const r = (role || '').toString().toUpperCase();
    if (r === 'DOCTOR') return '/doctor/profile';
    return '/profile';
  }
}
