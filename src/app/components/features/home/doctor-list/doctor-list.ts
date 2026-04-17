import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
  private route = inject(ActivatedRoute);

  searchQuery = signal<string>('');
  specialty = signal<string>('');
  currentPage = signal<number>(1);

  constructor() {
    effect(
      () => {
        this.homeService.fetchDoctors(this.currentPage(), this.searchQuery(), this.specialty()).subscribe();
      },
      { allowSignalWrites: true },
    );
  }

  ngOnInit() {
    this.route.queryParamMap.subscribe((p) => {
      const s = (p.get('specialty') || '').trim();
      this.specialty.set(s);
      this.currentPage.set(1);
    });
  }

  onSearch(query: string) {
    this.currentPage.set(1);
    this.searchQuery.set(query);
  }

  clearSpecialty(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { specialty: null },
      queryParamsHandling: 'merge',
    });
  }

  changePage(delta: number) {
    const next = this.currentPage() + delta;
    if (next > 0) this.currentPage.set(next);
  }

  navigateToDoctor(doc: any) {
    // Uses the main ID from the new serializer format
    const pid = doc.id;
    if (pid == null) {
      return;
    }
    void this.router.navigate(['/doctors', pid]);
  }
}
