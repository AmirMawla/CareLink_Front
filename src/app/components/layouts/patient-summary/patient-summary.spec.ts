import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientSummary } from './patient-summary';

describe('PatientSummary', () => {
  let component: PatientSummary;
  let fixture: ComponentFixture<PatientSummary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientSummary]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientSummary);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
