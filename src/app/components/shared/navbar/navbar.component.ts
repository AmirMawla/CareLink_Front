import { Component, HostListener, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { NgIf } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { BaseProfile } from '../../../models/users';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [NgIf,RouterLink],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly destroy$ = new Subject<void>();

  readonly userInitials = signal('—');
  readonly userName = signal('—');
  readonly userRole = signal('—');
  readonly menuOpen = signal(false);

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      this.userInitials.set('—');
      this.userName.set('Guest');
      this.userRole.set('Not signed in');
      return;
    }


    this.http
      .get<BaseProfile>(this.api.resolve('/api/accounts/profile/'))
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => of(null)),
      )
      .subscribe((p) => {
        const username = (p?.username || '').trim();
        const email = (p?.email || '').trim();
        const name = username || email || 'User';
        this.userName.set(name);
        this.userInitials.set(this.initialsFromName(name));
        const roleRaw = (p?.role || '').toString().toUpperCase();
        this.userRole.set(this.prettyRole(roleRaw));
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  signOut(): void {
    localStorage.removeItem('token');
    this.closeMenu();
    this.userInitials.set('—');
    this.userName.set('Guest');
    this.userRole.set('Not signed in');
    this.router.navigate(['/auth/login']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.menuOpen()) return;
    const target = event.target as HTMLElement | null;
    if (!target) return;
    // Close when clicking outside the user menu
    if (!target.closest('.cl-user-menu')) {
      this.menuOpen.set(false);
    }
  }

  private initialsFromName(name: string): string {
    const parts = name
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    const s = (name || '').trim();
    return (s.slice(0, 2) || '—').toUpperCase();
  }

  private prettyRole(role: string): string {
    const map: Record<string, string> = {
      DOCTOR: 'Doctor',
      ADMIN: 'Admin',
      RECEPTIONIST: 'Receptionist',
      PATIENT: 'Patient',
    };
    return map[role] || role;
  }
}
