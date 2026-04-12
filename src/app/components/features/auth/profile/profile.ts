import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router'; 
import { environment } from '../../../../../environments/environment.development';
//import {user,DoctorProfile,PatientProfile,ReceptionistProfile,AdminProfile} from '../../../../models/users'

export interface BaseProfile {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  role: string;
}

export interface DoctorProfile extends BaseProfile {
  specialty: string;
  session_duration: number;
  buffer_time: number;
  session_price: number;
}

export interface PatientProfile extends BaseProfile {
  date_of_birth: string;
  phone_number: string;
  medical_history: string;
}

export interface ReceptionistProfile extends BaseProfile {
  doctor: number;
  doctor_name: string;
}

export interface AdminProfile extends BaseProfile {}

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

  profiledata!: ProfileResponse;

  apiurl = environment.apiUrl;

  ngOnInit(): void {
    this.getProfile();
  }

  getProfile() {
    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Token ${token}`
    });

    this.httpClient
      .get<ProfileResponse>(`${this.apiurl}/api/accounts/profile/`, { headers })
      .subscribe({
        next: (response) => {
          console.log(response);
          this.profiledata = response;
        },
        error: (error) => {
          console.error(error);
        }
      });
  }
}