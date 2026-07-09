import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const doctorToken = localStorage.getItem('doctorToken');
    const governmentToken = localStorage.getItem('governmentToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (doctorToken) {
      config.headers.Authorization = `Bearer ${doctorToken}`;
    } else if (governmentToken) {
      config.headers.Authorization = `Bearer ${governmentToken}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const doctorToken = localStorage.getItem('doctorToken');
      const patientToken = localStorage.getItem('token');
      const governmentToken = localStorage.getItem('governmentToken');
      
      localStorage.removeItem('token');
      localStorage.removeItem('doctorToken');
      localStorage.removeItem('governmentToken');
      
      // Only redirect if we're not already on a login page
      if (doctorToken && !window.location.pathname.includes('/doctor/login')) {
        window.location.href = '/doctor/login';
      } else if (patientToken && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      } else if (governmentToken && !window.location.pathname.includes('/government/login')) {
        window.location.href = '/government/login';
      } else if (!doctorToken && !patientToken && !governmentToken && !window.location.pathname.includes('/login')) {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// Types
interface LoginRequest {
  patientId: string;
  phone: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  height?: number;
  weight?: number;
  bloodGroup?: string;
  allergies?: string[];
  medicalIssues?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

interface VerifyOTPRequest {
  patientId: string;
  otp: string;
}

interface DoctorLoginRequest {
  email: string;
  password: string;
}

interface Doctor {
  doctorId: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  licenseNumber: string;
  hospital: string;
  experience: number;
  qualifications: string[];
  isVerified: boolean;
  isActive: boolean;
  lastLogin?: string;
}

interface Patient {
  patientId: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  height?: number;
  weight?: number;
  bloodGroup?: string;
  allergies: string[];
  medicalIssues: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  age?: number;
  lastLogin?: string;
}

interface MedicalRecord {
  _id: string;
  patientId: string;
  visitDate: string;
  doctorName: string;
  doctorSpecialty?: string;
  diagnosis: string;
  symptoms: string[];
  treatment?: string;
  medications: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
  }>;
  vitalSigns?: {
    bloodPressure?: {
      systolic: number;
      diastolic: number;
    };
    heartRate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
  };
  labResults: Array<{
    testName: string;
    result: string;
    normalRange?: string;
    unit?: string;
    date: string;
  }>;
  notes?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  bmi?: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Auth API
export const authAPI = {
  login: (data: LoginRequest): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.post('/auth/login', data),

  verifyLoginOTP: (data: VerifyOTPRequest): Promise<AxiosResponse<ApiResponse<{ token: string; patient: Patient }>>> =>
    api.post('/auth/verify-login-otp', data),

  register: (data: RegisterRequest): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.post('/auth/register', data),

  verifyOTP: (data: VerifyOTPRequest): Promise<AxiosResponse<ApiResponse<{ token: string; patient: Patient }>>> =>
    api.post('/auth/verify-otp', data),

  getProfile: (): Promise<AxiosResponse<ApiResponse<{ patient: Patient }>>> =>
    api.get('/auth/me'),

  logout: (): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.post('/auth/logout'),
};

// Patient API
export const patientAPI = {
  getProfile: (): Promise<AxiosResponse<ApiResponse<{ patient: Patient }>>> =>
    api.get('/patients/profile'),

  updateProfile: (data: Partial<Patient>): Promise<AxiosResponse<ApiResponse<{ patient: Patient }>>> =>
    api.put('/patients/profile', data),

  getMedicalRecords: (page = 1, limit = 10): Promise<AxiosResponse<ApiResponse<{ medicalRecords: MedicalRecord[]; pagination: any }>>> =>
    api.get(`/patients/medical-records?page=${page}&limit=${limit}`),

  getMedicalRecord: (recordId: string): Promise<AxiosResponse<ApiResponse<{ medicalRecord: MedicalRecord }>>> =>
    api.get(`/patients/medical-records/${recordId}`),

  getHealthSummary: (): Promise<AxiosResponse<ApiResponse<{ patient: Patient; summary: any }>>> =>
    api.get('/patients/health-summary'),

  downloadReport: (): Promise<AxiosResponse<Blob>> =>
    api.get('/patients/download-report', { responseType: 'blob' }),
};

// Medical Records API
export const medicalRecordsAPI = {
  getRecords: (params?: {
    page?: number;
    limit?: number;
    patientId?: string;
    doctorName?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AxiosResponse<ApiResponse<{ medicalRecords: MedicalRecord[]; pagination: any }>>> =>
    api.get('/medical-records', { params }),

  getRecord: (recordId: string): Promise<AxiosResponse<ApiResponse<{ medicalRecord: MedicalRecord }>>> =>
    api.get(`/medical-records/${recordId}`),

  createRecord: (data: Partial<MedicalRecord>): Promise<AxiosResponse<ApiResponse<{ medicalRecord: MedicalRecord }>>> =>
    api.post('/medical-records', data),

  updateRecord: (recordId: string, data: Partial<MedicalRecord>): Promise<AxiosResponse<ApiResponse<{ medicalRecord: MedicalRecord }>>> =>
    api.put(`/medical-records/${recordId}`, data),

  deleteRecord: (recordId: string): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.delete(`/medical-records/${recordId}`),

  getPatientRecords: (patientId: string, page = 1, limit = 10): Promise<AxiosResponse<ApiResponse<{ patient: any; medicalRecords: MedicalRecord[]; pagination: any }>>> =>
    api.get(`/medical-records/patient/${patientId}?page=${page}&limit=${limit}`),
};

// Doctor API
export const doctorAPI = {
  login: (data: DoctorLoginRequest): Promise<AxiosResponse<ApiResponse<{ token: string; doctor: Doctor }>>> =>
    api.post('/auth/doctor/login', data),

  getProfile: (): Promise<AxiosResponse<ApiResponse<{ doctor: Doctor }>>> =>
    api.get('/doctors/profile'),

  updateProfile: (data: Partial<Doctor>): Promise<AxiosResponse<ApiResponse<{ doctor: Doctor }>>> =>
    api.put('/doctors/profile', data),

  getPatients: (page = 1, limit = 10): Promise<AxiosResponse<ApiResponse<{ patients: Patient[]; pagination: any }>>> =>
    api.get(`/doctors/patients?page=${page}&limit=${limit}`),

  getPatient: (patientId: string): Promise<AxiosResponse<ApiResponse<{ patient: Patient; medicalRecords: MedicalRecord[] }>>> =>
    api.get(`/doctors/patients/${patientId}`),

  searchPatient: (patientId: string): Promise<AxiosResponse<ApiResponse<{ patient: Patient }>>> =>
    api.get(`/doctors/patients/search?patientId=${patientId}`),

  addMedicalRecord: (patientId: string, data: any): Promise<AxiosResponse<ApiResponse<{ medicalRecord: MedicalRecord }>>> =>
    api.post(`/doctors/patients/${patientId}/medical-records`, data),

  addMedicalRecordForPatient: (data: any): Promise<AxiosResponse<ApiResponse<{ patient: Patient; medicalRecord: MedicalRecord }>>> =>
    api.post('/doctors/patients', data),

  getPatientMedicalRecords: (patientId: string, page = 1, limit = 10): Promise<AxiosResponse<ApiResponse<{ medicalRecords: MedicalRecord[]; pagination: any }>>> =>
    api.get(`/doctors/patients/${patientId}/medical-records?page=${page}&limit=${limit}`),

  getDashboard: (): Promise<AxiosResponse<ApiResponse<{ doctor: any; statistics: any; recentRecords: MedicalRecord[] }>>> =>
    api.get('/doctors/dashboard'),

  logout: (): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.post('/auth/doctor/logout'),
};

// Government API
export const governmentAPI = {
  login: (data: { email: string; password: string }): Promise<AxiosResponse<ApiResponse<{ government: any; token: string }>>> =>
    api.post('/government/login', data),

  register: (data: { name: string; email: string; password: string; department: string; designation: string; accessLevel?: string }): Promise<AxiosResponse<ApiResponse<{ government: any; token: string }>>> =>
    api.post('/government/register', data),

  getProfile: (): Promise<AxiosResponse<ApiResponse<{ government: any }>>> =>
    api.get('/government/profile'),

  updateProfile: (data: { name?: string; designation?: string }): Promise<AxiosResponse<ApiResponse<{ government: any }>>> =>
    api.put('/government/profile', data),

  getDashboard: (): Promise<AxiosResponse<ApiResponse<{ overview: any; diseaseDistribution: any[]; ageGroupDistribution: any[]; genderDistribution: any[]; monthlyTrends: any[]; specializationDistribution: any[]; treatmentOutcomes: any[]; geographicDistribution: any[] }>>> =>
    api.get('/government/analytics/dashboard'),

  getDiseaseAnalytics: (params?: { disease?: string; timeRange?: string }): Promise<AxiosResponse<ApiResponse<{ diseaseAnalytics: any[]; timeRange: string }>>> =>
    api.get('/government/analytics/diseases', { params }),

  exportData: (params?: { format?: string; type?: string }): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.get('/government/analytics/export', { params }),

  exportExcel: (): Promise<AxiosResponse<Blob>> =>
    api.get('/government/analytics/export-excel', { responseType: 'blob' }),

  getPatients: (params?: { page?: number; limit?: number; search?: string; disease?: string }): Promise<AxiosResponse<ApiResponse<{ records: any[]; pagination: any }>>> =>
    api.get('/government/analytics/patients', { params }),

  logout: (): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.post('/government/logout'),
};

export default api;
