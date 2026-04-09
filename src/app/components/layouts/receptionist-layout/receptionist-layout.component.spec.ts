import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReceptionistLayoutComponent } from './receptionist-layout.component';

describe('ReceptionistLayoutComponent', () => {
  let component: ReceptionistLayoutComponent;
  let fixture: ComponentFixture<ReceptionistLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceptionistLayoutComponent, RouterTestingModule],
    }).compileComponents();
    fixture = TestBed.createComponent(ReceptionistLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should contain app-navbar', () => {
    expect(fixture.nativeElement.querySelector('app-navbar')).toBeTruthy();
  });
  it('should contain app-sidebar', () => {
    expect(fixture.nativeElement.querySelector('app-sidebar')).toBeTruthy();
  });
  it('should contain router-outlet', () => {
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
  });
  it('should contain app-footer', () => {
    expect(fixture.nativeElement.querySelector('app-footer')).toBeTruthy();
  });
});
