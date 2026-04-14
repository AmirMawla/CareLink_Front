import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HomeService } from '../../../../services/home-service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  homeService = inject(HomeService);
  private router = inject(Router);

  categories = [
    { name: 'Cardiology', icon: 'favorite', color: '#FFDAD6' },
    { name: 'Neurology', icon: 'psychology', color: '#E0F2FF' },
    { name: 'Pediatrics', icon: 'child_care', color: '#E6F6EF' },
    { name: 'Dermatology', icon: 'face', color: '#FFF4E0' },
    { name: 'Orthopedics', icon: 'personal_injury', color: '#EEF0F4' },
    { name: 'General', icon: 'medical_services', color: '#E8F1FB' },
  ];

  testimonials = [
    {
      name: 'Ahmed Khalid',
      text: 'The booking process was so smooth. Highly recommend!',
      role: 'Patient',
    },
    { name: 'Sara Ali', text: 'Found the best specialist in minutes. Great UI.', role: 'Patient' },
    { name: 'John Doe', text: 'Secure and professional. 5 stars!', role: 'Patient' },
    {
      name: 'Mona Mahmoud',
      text: 'The video consultation felt like being in the clinic.',
      role: 'Patient',
    },
  ];

  ngOnInit() {
    this.homeService.fetchHomeData();
  }

  navigateToDoctor(doc: { doctor_profile_id?: number | null }) {
    const pid = doc.doctor_profile_id;
    if (pid == null) {
      return;
    }
    void this.router.navigate(['/doctors', pid]);
  }
}
