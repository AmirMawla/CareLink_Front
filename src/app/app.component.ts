import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { FooterComponent } from './components/shared/footer/footer.component';
import { MainNavbarComponent } from './components/shared/main-navbar/main-navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MainNavbarComponent, FooterComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  private readonly router = inject(Router);

  showMainChrome = true;

  constructor() {
    this.syncChromeVisibility(this.router.url);
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.syncChromeVisibility(e.urlAfterRedirects));
  }

  private syncChromeVisibility(url: string): void {
    const u = (url || '').toLowerCase();
    const isDashboard =
      u.startsWith('/admin') || u.startsWith('/doctor') || u.startsWith('/receptionist');
    this.showMainChrome = !isDashboard;
  }
}
