import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';

@Component({
  selector: 'app-doctor-layout',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    NavbarComponent,
    SidebarComponent,
  ],
  templateUrl: './doctor-layout.component.html',
  styleUrls: ['./doctor-layout.component.css'],
})
export class DoctorLayoutComponent {}
