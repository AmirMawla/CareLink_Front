import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Reception } from './reception';

describe('Reception', () => {
  let service: Reception;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        Reception,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(Reception);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
