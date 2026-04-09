import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoaderComponent } from './loader.component';

describe('LoaderComponent', () => {
  let component: LoaderComponent;
  let fixture: ComponentFixture<LoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoaderComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(LoaderComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isLoading', false);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should NOT render overlay when isLoading is false', () => {
    fixture.componentRef.setInput('isLoading', false);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.cl-loader');
    expect(el).toBeNull();
  });

  it('should render overlay when isLoading is true', () => {
    fixture.componentRef.setInput('isLoading', true);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.cl-loader');
    expect(el).toBeTruthy();
  });

  it('should render custom message', () => {
    fixture.componentRef.setInput('isLoading', true);
    fixture.componentRef.setInput('message', 'Saving data…');
    fixture.detectChanges();
    const text = fixture.nativeElement.querySelector('.cl-loader__text').textContent;
    expect(text.trim()).toBe('Saving data…');
  });

  it('should have default message of "Loading…"', () => {
    expect(component.message).toBe('Loading…');
  });
});
