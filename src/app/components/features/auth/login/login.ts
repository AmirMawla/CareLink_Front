import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { environment } from '../../../../../environments/environment.development';

type ProfileRole = 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT' | string;
type ProfileResponse = { role?: ProfileRole } & Record<string, unknown>;

export interface LoginResponse {
  token: string;
}

export interface LogoutResponse {
  message: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit{
  private httpClient = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  username = '';
  password = '';
  errorMessage = ''; 
  isLoading = false; 

  apiurl = environment.apiUrl;

  ngOnInit() {
   // this.logout();
  }
/*
  logout():void{
    let token = localStorage.getItem('token');
    const headers = new HttpHeaders({
    'Authorization': 'Token ' + token
  });
    this.httpClient.post<LogoutResponse>(`${this.apiurl}/api/accounts/logout/`,{},{headers:headers}).subscribe({
      next: (response) => {
        localStorage.removeItem('token');
      },
      error: (error) => {
        console.error(error);
        this.isLoading = false;
      }
    });
    
  }
*/
  login(): void {
    if (!this.username || !this.password) {
      this.errorMessage = 'please enter username and password';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
     
    if(localStorage.getItem('token')){
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      this.cdr.detectChanges();
    }
    
    this.httpClient.post<LoginResponse>(`${this.apiurl}/api/accounts/login/`, {
      username: this.username,
      password: this.password
    }).subscribe({
      next: (response) => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('username',this.username); 
        this.isLoading = false;
        console.log("logged in successfully");
        this.cdr.detectChanges();

        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        if (returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//')) {
          void this.router.navigateByUrl(returnUrl);
          return;
        }

        const headers = new HttpHeaders({ Authorization: `Token ${response.token}` });
        this.httpClient.get<ProfileResponse>(`${this.apiurl}/api/accounts/profile/`, { headers }).subscribe({
          next: (p) => {
            const role = String(p?.role || '').toUpperCase();
            if (role === 'ADMIN') {
              void this.router.navigate(['/admin/dashboard']);
            } else if (role === 'DOCTOR') {
              void this.router.navigate(['/doctor/dashboard']);
            } else if (role === 'RECEPTIONIST') {
              void this.router.navigate(['/receptionist/queue']);
            } else {
              void this.router.navigate(['/']);
            }
          },
          error: () => {
            void this.router.navigate(['/']);
          },
        });
      },
      error: (error) => {
        console.error(error);
        this.isLoading = false;
        this.errorMessage = 'wrong user name or password';
        this.cdr.detectChanges();
      }
    });
  }
}