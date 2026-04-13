import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HomeService } from '../../../../services/home-service';

@Component({
  selector: 'app-doctor-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doctor-list.html',
  styleUrl: './doctor-list.css',
})
export class DoctorList implements OnInit {
  homeService = inject(HomeService);
  private router = inject(Router);

  searchQuery = signal<string>('');
  currentPage = signal<number>(1);

  constructor() {
    effect(
      () => {
        this.homeService.fetchDoctors(this.currentPage(), this.searchQuery()).subscribe();
      },
      { allowSignalWrites: true },
    );
  }

  ngOnInit() {}

  onSearch(query: string) {
    this.currentPage.set(1);
    this.searchQuery.set(query);
  }

  changePage(delta: number) {
    const next = this.currentPage() + delta;
    if (next > 0) this.currentPage.set(next);
  }

  navigateToDoctor(id: number) {
    this.router.navigate(['/doctors', id]);
  }
}
