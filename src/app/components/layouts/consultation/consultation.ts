import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Prescription {
  drug_name: string;
  dose: string;
  duration_days: number;
}

interface Test {
  test_name: string;
}
@Component({
  selector: 'app-consultation',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './consultation.html',
  styleUrl: './consultation.css',
})
export class Consultation implements OnInit {
  appointmentId!: number;
  diagnosis = '';
  clinicalNotes = '';
  prescriptions: Prescription[] = [{ drug_name: '', dose: '', duration_days: 1 }];
  tests: Test[] = [{ test_name: '' }];
  loading = false;
  error = '';
  success = '';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.appointmentId = Number(this.route.snapshot.paramMap.get('id'));
  }

  addPrescription() {
    this.prescriptions.push({ drug_name: '', dose: '', duration_days: 1 });
  }

  removePrescription(index: number) {
    this.prescriptions.splice(index, 1);
  }

  addTest() {
    this.tests.push({ test_name: '' });
  }

  removeTest(index: number) {
    this.tests.splice(index, 1);
  }

  saveConsultation() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Token ${token}` });

    const payload = {
      appointment: this.appointmentId,
      diagnosis: this.diagnosis,
      clinical_notes: this.clinicalNotes,
      prescriptions: this.prescriptions.filter(p => p.drug_name),
      tests: this.tests.filter(t => t.test_name)
    };

    this.loading = true;
    this.http.post(
      `http://127.0.0.1:8000/api/medical/doctor/consultation/${this.appointmentId}/save/`,
      payload,
      { headers }
    ).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'Consultation saved successfully!';
        setTimeout(() => this.router.navigate(['/doctor/queue']), 1500);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || 'Failed to save consultation';
      }
    });
  }
}