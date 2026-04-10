import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';

@Component({
  selector: 'app-receptionist-layout',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    NavbarComponent,
    SidebarComponent,
  ],
  templateUrl: './receptionist-layout.component.html',
  styleUrls: ['./receptionist-layout.component.css'],
})
export class ReceptionistLayoutComponent {}
