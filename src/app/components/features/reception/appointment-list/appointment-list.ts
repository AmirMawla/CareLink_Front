import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Reception } from '../../../../services/reception';
import { Appointment } from '../../../../models/appointment.model';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './appointment-list.html',
  styleUrls: ['./appointment-list.css']
})
export class AppointmentListComponent implements OnInit {
  private readonly receptionService = inject(Reception);

  appointments: Appointment[] = [];
  loading: boolean = false;

  filters = {
    search: '',
    date: '',
    status: ''
  };

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.loading = true;
    this.receptionService.getAppointments(this.filters).subscribe({
      next: (data) => {
        this.appointments = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Search failed', err);
        this.loading = false;
      }
    });
  }

  onFilterChange(): void {
    this.loadAppointments();
  }
}
