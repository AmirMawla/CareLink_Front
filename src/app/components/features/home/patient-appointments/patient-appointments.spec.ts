import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientAppointments } from './patient-appointments';

describe('PatientAppointments', () => {
  let component: PatientAppointments;
  let fixture: ComponentFixture<PatientAppointments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientAppointments],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientAppointments);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
