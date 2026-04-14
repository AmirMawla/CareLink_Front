import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Reception } from '../../../../services/reception';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-waiting-list',
imports: [CommonModule],
  standalone: true,
  templateUrl: './waiting-list.html',
  styleUrls: ['./waiting-list.css']
})
export class WaitingListComponent implements OnInit {
  private receptionService = inject(Reception);
  waitingList: any[] = [];
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.loadData();
this.cdr.detectChanges();
  }

  loadData() {
    this.receptionService.getTodayQueue().subscribe(data => {
      this.waitingList = data.filter(a => a.status === 'CONFIRMED');
this.cdr.detectChanges();
    });
  }
}
