import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
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
private cdr = inject(ChangeDetectorRef);
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
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Queue fetch failed:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

}
