import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router'; 
import { environment } from '../../../../../environments/environment.development';


export type APIResponse = {
  message: string
}

@Component({
  selector: 'app-change-password',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './change-password.html',
  styleUrl: './change-password.css',
})
export class ChangePassword {
  private httpClient = inject(HttpClient);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  apiurl = environment.apiUrl;
  errorAPI: string = '';
  
  
  formData: any = {
    oldPassword: '',
    newPassword: '',
    repeatNewPssword: ''
  };

  changePassword() {
     const token = localStorage.getItem('token');
    if (!token) return;
    if(this.formData.newPassword.length < 8){
      this.errorAPI = 'New password must be at least 8 characters long.';
      this.cdr.detectChanges();
      return;
    }
    if(this.formData.newPassword !== this.formData.repeatNewPssword){
      this.errorAPI = 'New password and confirm new password do not match.';
      this.cdr.detectChanges();
      return;
    }
    const headers = new HttpHeaders({ Authorization: `Token ${token}` });
    this.httpClient.post<APIResponse>(`${this.apiurl}/api/accounts/change-password/`, this.formData, { headers })
      .subscribe({
        next: (response) => {
          console.log(' Password changed successfully:', response);
          this.router.navigate(['/profile']);
        },
        error: (err) => {console.error(' Error changing password:', err)
        this.errorAPI = err.error.message || 'An error occurred while changing the password.';
        this.cdr.detectChanges();
      }});
  } 

}
