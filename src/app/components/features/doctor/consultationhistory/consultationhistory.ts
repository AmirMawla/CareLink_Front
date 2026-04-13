import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Prescription {
  id: number;
  drug_name: string;
  dose: string;
  duration_days: number;
}

interface Test {
  id: number;
  test_name: string;
}

interface Consultation {
  id: number;
  appointment: {
    id: number;
    patient: {
      user: {
        first_name: string;
        last_name: string;
      };
    };
    scheduled_datetime: string;
  };
  diagnosis: string;
  clinical_notes: string;
  prescriptions: Prescription[];
  tests: Test[];
  created_at: string;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Consultation[];
}
@Component({
  selector: 'app-consultationhistory',
  imports: [CommonModule, RouterModule],
  templateUrl: './consultationhistory.html',
  styleUrl: './consultationhistory.css',
})
export class Consultationhistory implements OnInit {
  consultations: Consultation[] = [];
  loading = true;
  error = '';
  count = 0;
  nextPage: string | null = null;
  prevPage: string | null = null;
  searchQuery = '';
  expandedId: number | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory(url?: string) {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Token ${token}` });

    let apiUrl = url || 'http://127.0.0.1:8000/api/medical/doctor/consultations/';

    if (!url && this.searchQuery) {
      apiUrl += `?search=${this.searchQuery}`;
    }

    this.loading = true;
    this.http.get<PaginatedResponse>(apiUrl, { headers })
      .subscribe({
        next: (data) => {
          this.consultations = data.results;
          this.count = data.count;
          this.nextPage = data.next;
          this.prevPage = data.previous;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load consultation history';
          this.loading = false;
        }
      });
  }

  onSearch(event: Event) {
    this.searchQuery = (event.target as HTMLInputElement).value;
    this.loadHistory();
  }

  toggleExpand(id: number) {
    this.expandedId = this.expandedId === id ? null : id;
  }

  goToNext() {
    if (this.nextPage) this.loadHistory(this.nextPage);
  }

  goToPrev() {
    if (this.prevPage) this.loadHistory(this.prevPage);
  }
}