import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../services/admin';
import { UserDetails } from '../user-details/user-details';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, UserDetails],
  templateUrl: './user-list.html',
  styleUrls: ['./user-list.css']
})
export class UserList implements OnInit {
  private adminService = inject(AdminService);
  
  users = signal<any[]>([]);
  totalCount = signal(0);
  selectedUser = signal<any | null>(null);
  isLoading = this.adminService.loading;

  // Feedback State
  statusMessage = signal<{text: string, type: 'success' | 'error'} | null>(null);

  filters = {
    search: '',
    role: '',
    is_active: '',
    page: 1
  };

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.adminService.getUsers(this.filters).subscribe({
      next: (res) => {
        this.users.set(res.results);
        this.totalCount.set(res.count);
      },
      error: () => this.showFeedback('Failed to fetch users.', 'error')
    });
  }

  toggleStatus(user: any, event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const newState = checkbox.checked;
    
    this.adminService.toggleUserStatus(user.id, newState).subscribe({
      next: () => {
        user.is_active = newState;
        this.showFeedback(`User ${newState ? 'activated' : 'deactivated'} successfully.`, 'success');
      },
      error: () => {
        checkbox.checked = !newState; // Revert UI
        this.showFeedback('Failed to update user status.', 'error');
      }
    });
  }

  showFeedback(text: string, type: 'success' | 'error') {
    this.statusMessage.set({ text, type });
    setTimeout(() => this.statusMessage.set(null), 3000);
  }

  handleFilterChange() {
    this.filters.page = 1;
    this.loadUsers();
  }

  resetFilters() {
    this.filters = { search: '', role: '', is_active: '', page: 1 };
    this.loadUsers();
  }

  viewDetails(user: any) { this.selectedUser.set(user); }
  closeDetails() { this.selectedUser.set(null); }

  getRoleClass(role: string): string {
    const roles: Record<string, string> = {
      'DOCTOR': 'badge-doctor',
      'PATIENT': 'badge-patient',
      'RECEPTIONIST': 'badge-receptionist',
      'ADMIN': 'badge-admin'
    };
    return roles[role] || 'badge-info';
  }
}