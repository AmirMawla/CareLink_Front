import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChangeDetectorRef, Component ,inject,Inject} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LogoutResponse } from '../../layouts/login/login';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-main-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './main-navbar.component.html',
  styleUrls: ['./main-navbar.component.css'],
})
export class MainNavbarComponent {
  isMobileMenuOpen = false;
  private httpClient = inject(HttpClient);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  apiurl = environment.apiUrl;
  
  get token() {
    return localStorage.getItem('token');
  }

  logout():void{
    let token = localStorage.getItem('token');
    const headers = new HttpHeaders({
    'Authorization': 'Token ' + token
  });
    this.httpClient.post<LogoutResponse>(`${this.apiurl}/api/accounts/logout/`,{},{headers:headers}).subscribe({
      next: (response) => {
        localStorage.removeItem('token');
        this.cdr.detectChanges();
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        console.error(error);
      }
    });
  }
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }
}

