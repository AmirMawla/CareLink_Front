import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from './navbar.component';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display userInitials', () => {
    const el = fixture.nativeElement.querySelector('.avatar');
    expect(el.textContent.trim()).toBe('JD');
  });

  it('should display userName', () => {
    const el = fixture.nativeElement.querySelector('.cl-topbar__user-name');
    expect(el.textContent.trim()).toBe('John Doe');
  });

  it('should display userRole', () => {
    const el = fixture.nativeElement.querySelector('.cl-topbar__user-role');
    expect(el.textContent.trim()).toBe('Doctor');
  });
});
