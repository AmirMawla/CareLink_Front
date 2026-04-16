import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HomeService } from '../../../../services/home-service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  homeService = inject(HomeService);
  private router = inject(Router);

  categories = [
    { name: 'Cardiology', icon: 'favorite', color: '#ffebee' },
    { name: 'Neurology', icon: 'psychology', color: '#f3e5f5' },
    { name: 'Pediatrics', icon: 'child_care', color: '#e0f7fa' },
    { name: 'Orthopedics', icon: 'fitness_center', color: '#e8f5e9' },
    { name: 'Dermatology', icon: 'healing', color: '#fff3e0' },
    { name: 'General', icon: 'medical_services', color: '#e3f2fd' },
  ];

  testimonials = [
    {
      name: 'Sarah M.',
      role: 'Patient',
      text: 'The telehealth feature saved me hours of waiting. The doctor was incredibly professional.',
    },
    {
      name: 'Ahmed K.',
      role: 'Patient',
      text: 'Finding a specialist and booking an appointment took less than 2 minutes.',
    },
    {
      name: 'Dr. Rania',
      role: 'Cardiologist',
      text: 'The platform helps me manage my schedule and connect with patients seamlessly.',
    },
  ];

  ngOnInit() {
    this.homeService.fetchHomeData();
  }

  // Uses the new navigation function from the doctor-list logic
  navigateToDoctor(doc: any) {
    const pid = doc.id;
    if (pid == null) {
      return;
    }
    void this.router.navigate(['/doctors', pid]);
  }
}
