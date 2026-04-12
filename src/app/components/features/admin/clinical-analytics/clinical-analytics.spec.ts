import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClinicalAnalytics } from './clinical-analytics';

describe('ClinicalAnalytics', () => {
  let component: ClinicalAnalytics;
  let fixture: ComponentFixture<ClinicalAnalytics>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClinicalAnalytics],
    }).compileComponents();

    fixture = TestBed.createComponent(ClinicalAnalytics);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
