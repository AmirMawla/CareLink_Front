import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router'; 
import { environment } from '../../../../environments/environment';

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

    this.httpClient.post<LoginResponse>(`${this.apiurl}/api/accounts/login/`, {
      username: this.username,
      password: this.password
    }).subscribe({
      next: (response) => {
        localStorage.setItem('token', response.token); 
        this.isLoading = false;
        console.log("logged in successfully");
        this.router.navigate(['/']); 
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