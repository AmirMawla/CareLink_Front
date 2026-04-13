import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Consultationhistory } from './consultationhistory';

describe('Consultationhistory', () => {
  let component: Consultationhistory;
  let fixture: ComponentFixture<Consultationhistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Consultationhistory],
    }).compileComponents();

    fixture = TestBed.createComponent(Consultationhistory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
