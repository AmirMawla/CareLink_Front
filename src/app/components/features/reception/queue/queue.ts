import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Reception } from '../../../../services/reception';
import { Appointment } from '../../../../models/appointment.model';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-queue',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './queue.html',
  styleUrls: ['./queue.css']
})
export class QueueComponent implements OnInit, OnDestroy {
  private readonly receptionService = inject(Reception);

  queue: Appointment[] = [];
  loading: boolean = false;
  private refreshSub?: Subscription;

  ngOnInit(): void {
    this.loadQueue();
    this.refreshSub = interval(60000).subscribe(() => this.loadQueue());
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
  }

  loadQueue(): void {
    this.loading = true;
    this.receptionService.getTodayQueue().subscribe({
      next: (data) => {
        this.queue = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Queue fetch failed:', err);
        this.loading = false;
      }
    });
  }

  updateStatus(id: number, status: 'CHECKED_IN' | 'NO_SHOW'): void {
    this.receptionService.updateStatus(id, status).subscribe({
      next: () => {
      // Show a professional success message
      alert(`Status updated to ${status.replace('_', ' ')} successfully.`);
      this.loadQueue(); // Refresh the list
    },
    error: (err) => {
      console.error('Update failed', err);
      alert('Could not update status. Please try again.');
    }
    });
  }
}
