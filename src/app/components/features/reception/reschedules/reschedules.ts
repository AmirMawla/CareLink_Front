import { CommonModule, DatePipe, NgFor, NgIf } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import {
  PendingRescheduleRequestRow,
  Reception,
  RescheduleRespondAction,
} from '../../../../services/reception';

@Component({
  selector: 'app-reschedules',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIf, NgFor, DatePipe],
  templateUrl: './reschedules.html',
  styleUrls: ['./reschedules.css', '../appointment-list/appointment-list.css'],
})
export class ReschedulesComponent implements OnInit, OnDestroy {
  private readonly reception = inject(Reception);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  loading = false;
  error = '';
  toast = '';

  items: PendingRescheduleRequestRow[] = [];
  searchQuery = '';
  proposedDate = '';
  sortBy: 'newest' | 'oldest' | 'proposed_soonest' | 'proposed_latest' = 'newest';
  responseNoteByRequestId: Record<number, string> = {};
  busyRequestId: number | null = null;

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.toast = '';
    this.cdr.detectChanges();

    this.reception
      .getPendingRescheduleRequests()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (data) => {
          this.items = (data || []).filter((x) => String(x.status).toUpperCase() === 'PENDING');
          // Keep notes for existing rows; remove notes for rows that disappeared
          const keep = new Set(this.items.map((x) => x.id));
          for (const k of Object.keys(this.responseNoteByRequestId)) {
            const id = parseInt(k, 10);
            if (!keep.has(id)) delete this.responseNoteByRequestId[id];
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = err?.error?.message || 'Could not load reschedule requests.';
          this.cdr.detectChanges();
        },
      });
  }

  noteFor(r: PendingRescheduleRequestRow): string {
    return this.responseNoteByRequestId[r.id] ?? '';
  }

  setNote(r: PendingRescheduleRequestRow, value: string): void {
    this.responseNoteByRequestId[r.id] = value;
  }

  filteredItems(): PendingRescheduleRequestRow[] {
    const q = (this.searchQuery || '').trim().toLowerCase();
    const dateFilter = (this.proposedDate || '').trim(); // YYYY-MM-DD
    let out = this.items;

    if (dateFilter) {
      out = out.filter((r) => String(r.proposed_datetime || '').slice(0, 10) === dateFilter);
    }

    if (q) {
      out = out.filter((r) => {
      const hay = [
        String(r.id),
        String(r.appointment),
        String(r.patient_name || ''),
        String(r.reason || ''),
        String(r.current_datetime || ''),
        String(r.proposed_datetime || ''),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
      });
    }

    const sort = this.sortBy;
    const parse = (iso: string) => {
      const d = new Date(iso);
      const t = d.getTime();
      return Number.isFinite(t) ? t : 0;
    };
    const sorted = [...out].sort((a, b) => {
      if (sort === 'oldest') return parse(a.created_at) - parse(b.created_at);
      if (sort === 'proposed_soonest') return parse(a.proposed_datetime) - parse(b.proposed_datetime);
      if (sort === 'proposed_latest') return parse(b.proposed_datetime) - parse(a.proposed_datetime);
      // newest
      return parse(b.created_at) - parse(a.created_at);
    });
    return sorted;
  }

  respond(r: PendingRescheduleRequestRow, action: RescheduleRespondAction): void {
    if (this.busyRequestId !== null) return;
    this.busyRequestId = r.id;
    this.toast = '';
    this.error = '';
    this.cdr.detectChanges();

    const note = (this.noteFor(r) || '').trim();
    this.reception
      .respondToRescheduleRequest(r.id, action, note)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.busyRequestId = null;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (res) => {
          this.toast = res?.message || (action === 'APPROVE' ? 'Reschedule approved.' : 'Reschedule rejected.');
          this.items = this.items.filter((x) => x.id !== r.id);
          delete this.responseNoteByRequestId[r.id];
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = err?.error?.message || 'Action failed. Please try again.';
          this.cdr.detectChanges();
        },
      });
  }

  formatLocal(iso: string): string {
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'UTC',
    });
  }

  initials(name: string): string {
    const t = String(name || '').trim();
    if (!t) return 'PT';
    const parts = t.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return t.slice(0, 2).toUpperCase();
  }

  trackByRequestId = (_: number, r: PendingRescheduleRequestRow) => r.id;
}

