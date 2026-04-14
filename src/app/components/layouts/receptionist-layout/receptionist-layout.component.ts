import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { Reception } from '../../../services/reception';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-receptionist-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    NavbarComponent,
    SidebarComponent,
  ],
  templateUrl: './receptionist-layout.component.html',
  styleUrls: ['./receptionist-layout.component.css'],
})
export class ReceptionistLayoutComponent implements OnInit {
  private receptionService = inject(Reception);
private cdr = inject(ChangeDetectorRef);
  todayQueueCount: number = 0;

  ngOnInit(): void {
    this.loadQueueCount();
    this.cdr.detectChanges();
  }

  loadQueueCount(): void {
    this.receptionService.getTodayQueue().subscribe({
      next: (data) => {
        this.todayQueueCount = data.length;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching count:', err);
        this.todayQueueCount = 0;
        this.cdr.detectChanges();
      }
    });
  }
}
