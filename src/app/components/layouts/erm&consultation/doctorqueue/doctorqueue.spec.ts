import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Doctorqueue } from './doctorqueue';

describe('Doctorqueue', () => {
  let component: Doctorqueue;
  let fixture: ComponentFixture<Doctorqueue>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Doctorqueue]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Doctorqueue);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
