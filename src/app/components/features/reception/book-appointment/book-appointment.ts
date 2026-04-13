import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../../environments/environment.development';

@Component({
  selector: 'app-book-appointment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './book-appointment.html',
  styleUrl: './book-appointment.css'
})
export class BookAppointment implements OnInit {
  // بيانات الفورم
  selectedDoctorId: string = '';
  selectedPatientId: string = '';
  selectedDate: string = '';
  isTelemedicine: boolean = false;

  // داتا للعرض
  doctors: any[] = []; // هتيجي من الـ API
  availableSlots: string[] = []; // هتيجي من شغل زميلك

  isLoading = false;
  errorMessage = '';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loadDoctors();
  }

  loadDoctors() {
    this.http.get<any[]>(`${environment.apiUrl}/api/accounts/doctors/`).subscribe(res => {
      this.doctors = res;
    });
  }

  // "Call" لشغل زميلك: أول ما يختار دكتور وتاريخ، نجيب المواعيد الفاضية
  onDoctorOrDateChange() {
    if (this.selectedDoctorId && this.selectedDate) {
      this.http.get<any>(`${environment.apiUrl}/api/appointments/slots/?doctor=${this.selectedDoctorId}&date=${this.selectedDate}`)
        .subscribe(res => {
          this.availableSlots = res.available_slots;
        });
    }
  }

  confirmBooking(slot: string) {
    this.isLoading = true;
    const payload = {
      scheduled_datetime: slot,
      is_telemedicine: this.isTelemedicine,
      patient_id: this.selectedPatientId
    };

    this.http.post(`${environment.apiUrl}/api/appointments/book/${this.selectedDoctorId}/`, payload)
      .subscribe({
        next: () => {
          this.router.navigate(['/receptionist/queue']);
        },
        error: (err) => {
          this.errorMessage = "This slot is no longer available.";
          this.isLoading = false;
        }
      });
  }
}
