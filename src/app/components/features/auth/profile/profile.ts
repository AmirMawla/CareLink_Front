

import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router'; 
import { environment } from '../../../../../environments/environment.development';
import {BaseProfile,DoctorProfile,PatientProfile,ReceptionistProfile,AdminProfile} from '../../../../models/users'

export type ProfileResponse = 
  | DoctorProfile 
  | PatientProfile 
  | ReceptionistProfile 
  | AdminProfile;

@Component({
  selector: 'app-profile',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {

  private httpClient = inject(HttpClient);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  profiledata!: ProfileResponse;
  isEditMode = false;
  formData: any = {};

  apiurl = environment.apiUrl;

  ngOnInit(): void {
    this.getProfile();
  }

  getProfile() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = new HttpHeaders({ Authorization: `Token ${token}` });

    this.httpClient.get<ProfileResponse>(`${this.apiurl}/api/accounts/profile/`, { headers })
      .subscribe({
        next: (response) => {
          this.profiledata = response;
          console.log(' Profile loaded:', response);
          this.cdr.detectChanges();
        },
        error: (err) => console.error(' Error loading profile:', err)
      });
  }

  // ==================== Edit Mode ====================
  toggleEdit() {
    this.isEditMode = !this.isEditMode;
    if (this.isEditMode) {
      this.formData = { ...this.profiledata };
    }
  }

  cancelEdit() {
    this.isEditMode = false;
    this.formData = {};
  }

  saveProfile() {
  const token = localStorage.getItem('token');
  if (!token) return;

  const headers = new HttpHeaders({ Authorization: `Token ${token}` });

  const allowedBase = ['first_name', 'last_name', 'username', 'email'];
  const allowedByRole: Record<string, string[]> = {
    'DOCTOR': ['specialty', 'session_duration', 'buffer_time', 'session_price'],
    'PATIENT': ['date_of_birth', 'phone_number', 'medical_history'],
    'RECEPTIONIST': ['doctor'],
    'ADMIN': []
  };

  const role = this.profiledata.role;
  const allowedFields = [...allowedBase, ...(allowedByRole[role] || [])];

  const payload: any = {};
  for (const field of allowedFields) {
    if (this.formData[field] !== undefined) {
      payload[field] = this.formData[field];
    }
  }

  this.httpClient.patch(`${this.apiurl}/api/accounts/profile/`, payload, { headers })
    .subscribe({
      next: (updated: any) => {
        this.profiledata = updated;
        this.isEditMode = false;
        this.formData = {};
        console.log(' Profile updated successfully');
        this.cdr.detectChanges();
        alert('تم حفظ التعديلات بنجاح');
      },
      error: (err) => {
        console.error(' Update failed:', err);
        this.cdr.detectChanges();
        alert('حدث خطأ أثناء الحفظ');
      }
    });
}
/*
  saveProfile() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = new HttpHeaders({ Authorization: `Token ${token}` });

    this.httpClient.patch(`${this.apiurl}/api/accounts/profile/`, this.formData, { headers })
      .subscribe({
        next: (updated: any) => {
          this.profiledata = updated;
          this.isEditMode = false;
          this.formData = {};
          console.log('✅ Profile updated successfully');
          this.cdr.detectChanges();
          alert('تم حفظ التعديلات بنجاح');
        },
        error: (err) => {
          console.error('❌ Update failed:', err);
          this.cdr.detectChanges();
          alert('حدث خطأ أثناء الحفظ');
        }
      });
  }
*/
  // ==================== Type-Safe Getters ====================
  get isDoctor() { return this.profiledata?.role === 'DOCTOR'; }
  get isPatient() { return this.profiledata?.role === 'PATIENT'; }
  get isReceptionist() { return this.profiledata?.role === 'RECEPTIONIST'; }
  get isAdmin() { return this.profiledata?.role === 'ADMIN'; }

  get doctorData(): DoctorProfile {
    return this.profiledata as DoctorProfile;
  }

  get patientData(): PatientProfile {
    return this.profiledata as PatientProfile;
  }

  get receptionistData(): ReceptionistProfile {
    return this.profiledata as ReceptionistProfile;
  }
}