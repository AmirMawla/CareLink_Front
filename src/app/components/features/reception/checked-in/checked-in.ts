import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Reception } from '../../../../services/reception';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-checked-in',
imports: [CommonModule],
  standalone: true,
  templateUrl: './checked-in.html',
  styleUrls: ['./checked-in.css']
})
export class CheckedInComponent implements OnInit {
  private receptionService = inject(Reception);
private cdr = inject(ChangeDetectorRef);
  checkedInList: any[] = [];

  ngOnInit() {
    this.loadData();
this.cdr.detectChanges();
  }

  loadData() {
    this.receptionService.getTodayQueue().subscribe(data => {
      this.checkedInList = data.filter(a => a.status === 'CHECKED_IN');
this.cdr.detectChanges();
    });
  }

  calculateWaitTime(checkInTime: string): number {
    if (!checkInTime) return 0;
    const now = new Date();
    const arrival = new Date(checkInTime);
    const diffMs = now.getTime() - arrival.getTime();
    return Math.floor(diffMs / 60000);
  }
}
