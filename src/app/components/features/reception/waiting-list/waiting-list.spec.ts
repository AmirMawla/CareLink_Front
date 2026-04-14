import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WaitingListComponent } from './waiting-list';

describe('WaitingListComponent', () => {
  let component: WaitingListComponent;
  let fixture: ComponentFixture<WaitingListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WaitingListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WaitingListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
