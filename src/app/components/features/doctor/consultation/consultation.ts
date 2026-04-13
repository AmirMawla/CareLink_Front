import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PrescriptionItem, TestRequest } from '../../../../models/consultation';
import { ApiService } from '../../../../services/api.service';

interface ConsultationApiPayload {
  id?: number;
  diagnosis?: string;
  clinical_notes?: string;
  prescriptions?: Array<{ drug_name?: string; dose?: string; duration_days?: number }>;
  tests?: Array<{ test_name?: string }>;
}

@Component({
  selector: 'app-consultation',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './consultation.html',
  styleUrl: './consultation.css',
})
export class Consultation implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);

  appointmentId!: number;
  diagnosis = '';
  clinicalNotes = '';
  prescriptions: PrescriptionItem[] = [{ drug_name: '', dose: '', duration_days: 1 }];
  tests: TestRequest[] = [{ test_name: '' }];
  loading = false;
  pageLoading = true;
  error = '';
  success = '';
  isEditMode = false;

  ngOnInit(): void {
    this.appointmentId = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(this.appointmentId) || this.appointmentId <= 0) {
      this.pageLoading = false;
      this.error = 'Invalid appointment.';
      return;
    }
    this.loadExisting();
  }

  private baseUrl(): string {
    return this.api.resolve(`/api/medical/doctor/consultation/${this.appointmentId}/`);
  }

  private loadExisting(): void {
    this.http.get<ConsultationApiPayload>(this.baseUrl()).subscribe({
      next: (data) => {
        this.isEditMode = true;
        this.applyPayload(data);
        this.pageLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.isEditMode = false;
          this.pageLoading = false;
          return;
        }
        this.pageLoading = false;
        this.error = this.readSaveErrorMessage(err);
      },
    });
  }

  private applyPayload(data: ConsultationApiPayload): void {
    this.diagnosis = data.diagnosis ?? '';
    this.clinicalNotes = data.clinical_notes ?? '';
    const rx = data.prescriptions?.filter((p) => p && (p.drug_name || p.dose)) ?? [];
    this.prescriptions =
      rx.length > 0
        ? rx.map((p) => ({
            drug_name: p.drug_name ?? '',
            dose: p.dose ?? '',
            duration_days: Number(p.duration_days) > 0 ? Number(p.duration_days) : 1,
          }))
        : [{ drug_name: '', dose: '', duration_days: 1 }];
    const ts = data.tests?.filter((t) => t?.test_name) ?? [];
    this.tests = ts.length > 0 ? ts.map((t) => ({ test_name: t.test_name ?? '' })) : [{ test_name: '' }];
  }

  addPrescription(): void {
    this.prescriptions.push({ drug_name: '', dose: '', duration_days: 1 });
  }

  removePrescription(index: number): void {
    if (this.prescriptions.length <= 1) return;
    this.prescriptions.splice(index, 1);
  }

  addTest(): void {
    this.tests.push({ test_name: '' });
  }

  removeTest(index: number): void {
    if (this.tests.length <= 1) return;
    this.tests.splice(index, 1);
  }

  saveConsultation(): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Token ${token}` });

    const payload = {
      appointment: this.appointmentId,
      diagnosis: this.diagnosis,
      clinical_notes: this.clinicalNotes,
      prescriptions: this.prescriptions.filter((p) => p.drug_name?.trim()),
      tests: this.tests.filter((t) => t.test_name?.trim()),
    };

    this.error = '';
    this.loading = true;
    const url = this.isEditMode
      ? this.api.resolve(`/api/medical/doctor/consultation/${this.appointmentId}/edit/`)
      : this.api.resolve(`/api/medical/doctor/consultation/${this.appointmentId}/save/`);

    const req = this.isEditMode
      ? this.http.patch<unknown>(url, payload, { headers })
      : this.http.post<unknown>(url, payload, { headers });

    req.subscribe({
      next: () => {
        this.loading = false;
        this.success = this.isEditMode ? 'Consultation updated.' : 'Consultation saved successfully!';
        setTimeout(() => this.router.navigate(['/doctor/queue']), 1500);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.error = this.readSaveErrorMessage(err);
      },
    });
  }

  private readSaveErrorMessage(err: HttpErrorResponse): string {
    const body = err.error;
    if (typeof body === 'string' && body.trim()) return body.trim();
    if (body && typeof body === 'object') {
      const e = (body as Record<string, unknown>)['error'];
      if (typeof e === 'string' && e.trim()) return e.trim();
      const detail = (body as Record<string, unknown>)['detail'];
      if (typeof detail === 'string' && detail.trim()) return detail.trim();
    }
    if (err.status === 0) return 'Could not reach the server.';
    return 'Save failed. Please try again.';
  }
}
