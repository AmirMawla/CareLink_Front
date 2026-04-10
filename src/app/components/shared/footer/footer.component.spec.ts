import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('currentYear should equal the actual current year', () => {
    expect(component.currentYear).toBe(new Date().getFullYear());
  });

  it('should render the current year in the template', () => {
    const text = fixture.nativeElement.querySelector('.cl-footer__bottom')?.textContent ?? '';
    expect(text).toContain(String(new Date().getFullYear()));
  });
});
