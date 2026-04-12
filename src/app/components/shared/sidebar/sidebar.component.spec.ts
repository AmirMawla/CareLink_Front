import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the sidebar element', () => {
    const el = fixture.nativeElement.querySelector('.cl-sidebar');
    expect(el).toBeTruthy();
  });

  it('should render the footer section', () => {
    const footer = fixture.nativeElement.querySelector('.cl-sidebar__footer');
    expect(footer).toBeTruthy();
  });

  it('should render the Sign Out button', () => {
    const btn = fixture.nativeElement.querySelector('.cl-sidebar__logout');
    expect(btn).toBeTruthy();
  });
});
