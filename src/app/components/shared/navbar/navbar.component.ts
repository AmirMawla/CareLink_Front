import { Component } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent {
  readonly userInitials = 'JD';
  readonly userName = 'John Doe';
  readonly userRole = 'Doctor';
}
