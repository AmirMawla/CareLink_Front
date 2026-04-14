import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MainNavbarComponent } from '../../shared/main-navbar/main-navbar.component';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MainNavbarComponent],
  templateUrl: './user-layout.html',
  styleUrl: './user-layout.css',
})
export class UserLayout {
  currentYear = new Date().getFullYear();

  footerSections = [
    {
      title: 'Services',
      links: [
        { label: 'Find a Doctor', path: '/doctors' },
        { label: 'Online Consultations', path: '/home' },
        { label: 'Emergency Care', path: '/contact' },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'FAQs', path: '/about' },
        { label: 'Privacy Policy', path: '/privacy' },
        { label: 'Terms of Service', path: '/terms' },
      ],
    },
  ];
}
