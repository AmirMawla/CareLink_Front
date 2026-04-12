import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../../services/admin';


@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-details.html',
    styleUrls: ['./user-details.css', '../user-list/user-list.css']
})
export class UserDetails implements OnInit {
  @Input() user: any;
  @Output() onClose = new EventEmitter<void>();

  private AdminService = inject(AdminService);
  fullProfile = signal<any>(null);
  loading = signal(true);

  ngOnInit() {
    this.AdminService.getUserById(this.user.id).subscribe({
      next: (data) => {
        this.fullProfile.set(data);
        this.loading.set(false);
      }
    });
  }
}