import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';

interface PrescriptionItem {
  id: number;
  drug_name: string;
  dose: string;
  duration_days: number;
}

interface TestRequest {
  id: number;
  test_name: string;
}

interface Consultation {
  id: number;
  appointment: number;
  diagnosis: string;
  clinical_notes: string;
  prescriptions: PrescriptionItem[];
  tests: TestRequest[];
  created_at: string;
}

@Component({
  selector: 'app-patient-summary',
  imports: [CommonModule, RouterModule],
  templateUrl: './patient-summary.html',
  styleUrl: './patient-summary.css',
})
export class PatientSummary implements OnInit {
  appointmentId!: number;
  consultation!: Consultation;
  loading = true;
  error = '';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.appointmentId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadSummary();
  }

  loadSummary() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Token ${token}` });

    this.http.get<Consultation>(
      `http://127.0.0.1:8000/api/medical/patient/history/${this.appointmentId}/`,
      { headers }
    ).subscribe({
      next: (data) => {
        this.consultation = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to load consultation summary';
        this.loading = false;
      }
    });
  }
}