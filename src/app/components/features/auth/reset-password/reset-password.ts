import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router'; 
import { environment } from '../../../../../environments/environment.development';

@Component({
  selector: 'app-reset-password',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword {
  private httpClient = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);

  apiurl = environment.apiUrl;

  email = '';
  newPassword = '';
  uid = '';
  token = '';
  step = 1;
  loading = false;
  errorMessage = '';

  ngOnInit() {
    this.uid = this.route.snapshot.queryParams['uid'];
    this.token = this.route.snapshot.queryParams['token'];

    if (this.uid && this.token) {
      this.step = 2;
    }
  }
//api/accounts/
  requestReset() {
    this.loading = true;
    this.errorMessage = '';

    this.httpClient.post(`${this.apiurl}/api/accounts/reset-password/`, { email: this.email })
      .subscribe({
        next: ()=> {
          this.step = 3;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to send reset link. Please try again.';
          this.loading = false;
        }
      });
  }

  confirmReset() {
    const body = { uid: this.uid, token: this.token, new_password: this.newPassword };

    this.loading = true;
    this.errorMessage = '';

    this.httpClient.post(`${this.apiurl}/api/accounts/reset-password/confirm/`, body)
      .subscribe({
        next: () => {
          this.step = 4;
          this.loading = false;
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to reset password. Please try again.';
          this.loading = false;
        }
      });
  }

}
