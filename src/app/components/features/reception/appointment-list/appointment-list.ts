import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
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
private cdr = inject(ChangeDetectorRef);


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

  const activeParams: any = {};

  if (this.filters.search.trim()) {
    activeParams.search = this.filters.search;
  }


  if (this.filters.date) {
    activeParams.date = this.filters.date;
  }


  if (this.filters.status) {
    activeParams.status = this.filters.status;
  }

  this.receptionService.getAppointments(activeParams).subscribe({
    next: (data) => {
      this.appointments = data;
      this.loading = false;
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Search failed', err);
      this.loading = false;
      this.cdr.detectChanges();
    }
  });
}

  onFilterChange(): void {
    this.loadAppointments();
    this.cdr.detectChanges();
  }
}
