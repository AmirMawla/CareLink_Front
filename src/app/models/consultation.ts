export interface PrescriptionItem {
  id?: number;
  drug_name: string;
  dose: string;
  duration_days: number;
  
}

export interface TestRequest {
  id?: number;
  test_name: string;
}
export interface Consultation {
  id: number;
  appointment: number;
  diagnosis: string;
  clinical_notes: string;
  prescriptions: PrescriptionItem[];
  tests: TestRequest[];
  created_at: string;
}
