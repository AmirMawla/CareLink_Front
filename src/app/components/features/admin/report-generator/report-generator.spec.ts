import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportGenerator } from './report-generator';

describe('ReportGenerator', () => {
  let component: ReportGenerator;
  let fixture: ComponentFixture<ReportGenerator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportGenerator],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportGenerator);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
