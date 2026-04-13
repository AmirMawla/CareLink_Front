import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent {
  private readonly router = inject(Router);
  signOut(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/auth/login']);
  }
}
