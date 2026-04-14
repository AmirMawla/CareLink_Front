import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router'; 
import { environment } from '../../../../../environments/environment.development';

@Component({
  selector: 'app-reset-password',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword {
  private httpClient = inject(HttpClient);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);

  apiurl = environment.apiUrl;

  email = '';
  newPassword = '';
  uid = '';
  token = '';
  step = 1;

  ngOnInit() {
    this.uid = this.route.snapshot.queryParams['uid'];
    this.token = this.route.snapshot.queryParams['token'];

    if (this.uid && this.token) {
      this.step = 2;
    }
  }
//api/accounts/
  requestReset() {
    this.httpClient.post(`${this.apiurl}/api/accounts/reset-password/`, { email: this.email })
      .subscribe({
        next: ()=> {
          alert('reset password link has been sent to your email');
          this.cdr.detectChanges();
        },
        error: (err) => alert(err.error.message)
      });
  }

  confirmReset() {
    const body = { uid: this.uid, token: this.token, new_password: this.newPassword };

    this.httpClient.post(`${this.apiurl}/api/accounts/reset-password/confirm/`, body)
      .subscribe({
        next: () => {
          alert('password reset successfully');
          this.router.navigate(['/auth/login']);
        },
        error: (err) => alert(err.error.message)
      });
  }

}
