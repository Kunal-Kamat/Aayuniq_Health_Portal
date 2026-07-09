import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorAPI } from '../../services/api';

interface MedicalRecordFormData {
  patientId: string;
  visitDate: string;
  diagnosis: string;
  treatment?: string;
  symptoms: string[];
  medications: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
  }>;
  vitalSigns?: {
    bloodPressure?: {
      systolic?: number;
      diastolic?: number;
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
}

const AddPatient: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [isPatientFound, setIsPatientFound] = useState(false);

  const [formData, setFormData] = useState<MedicalRecordFormData>({
    patientId: '',
    visitDate: new Date().toISOString().split('T')[0],
    diagnosis: '',
    treatment: '',
    symptoms: [],
    medications: [],
    vitalSigns: undefined, // Don't initialize with invalid values
    labResults: [],
    notes: '',
    followUpRequired: false,
    followUpDate: ''
  });

  const [newSymptom, setNewSymptom] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleVitalSignChange = (field: string, value: number | undefined) => {
    setFormData(prev => ({
      ...prev,
      vitalSigns: {
        ...prev.vitalSigns,
        [field]: value
      }
    }));
  };

  const handleBloodPressureChange = (field: 'systolic' | 'diastolic', value: number | undefined) => {
    setFormData(prev => ({
      ...prev,
      vitalSigns: {
        ...prev.vitalSigns,
        bloodPressure: {
          ...prev.vitalSigns?.bloodPressure,
          [field]: value
        }
      }
    }));
  };


  const addArrayItem = (field: string, defaultItem: any) => {
    setFormData(prev => {
      const currentArray = prev[field as keyof MedicalRecordFormData] as any[];
      return {
        ...prev,
        [field]: [...currentArray, defaultItem]
      };
    });
  };

  const removeArrayItem = (field: string, index: number) => {
    setFormData(prev => {
      const currentArray = prev[field as keyof MedicalRecordFormData] as any[];
      return {
        ...prev,
        [field]: currentArray.filter((_: any, i: number) => i !== index)
      };
    });
  };

  const handleAddSymptom = () => {
    if (newSymptom.trim()) {
      addArrayItem('symptoms', newSymptom.trim());
      setNewSymptom('');
    }
  };


  const handleLookupPatient = async () => {
    if (!formData.patientId.trim()) {
      setError('Please enter a Patient ID');
      return;
    }

    // Validate Patient ID format (PAT + 6 digits)
    const patientIdPattern = /^PAT[0-9]{6}$/;
    if (!patientIdPattern.test(formData.patientId)) {
      setError('Patient ID must be in format PAT123456 (PAT followed by 6 digits)');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await doctorAPI.searchPatient(formData.patientId);
      setPatientInfo(response.data.data.patient);
      setIsPatientFound(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Patient not found');
      setIsPatientFound(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPatientFound) {
      setError('Please lookup patient first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Clean up the form data before sending
      const cleanedData = {
        ...formData,
        // Only include vital signs if they have valid values
        vitalSigns: formData.vitalSigns && 
          ((formData.vitalSigns.bloodPressure?.systolic && formData.vitalSigns.bloodPressure.systolic > 0) || 
           (formData.vitalSigns.bloodPressure?.diastolic && formData.vitalSigns.bloodPressure.diastolic > 0) || 
           (formData.vitalSigns.heartRate && formData.vitalSigns.heartRate >= 30 && formData.vitalSigns.heartRate <= 200) || 
           (formData.vitalSigns.temperature && formData.vitalSigns.temperature >= 95 && formData.vitalSigns.temperature <= 110) || 
           (formData.vitalSigns.weight && formData.vitalSigns.weight >= 10 && formData.vitalSigns.weight <= 500) || 
           (formData.vitalSigns.height && formData.vitalSigns.height >= 50 && formData.vitalSigns.height <= 300))
            ? formData.vitalSigns
            : undefined,
        // Remove empty followUpDate if followUpRequired is false
        followUpDate: formData.followUpRequired && formData.followUpDate ? formData.followUpDate : undefined,
        // Ensure arrays are properly formatted
        symptoms: formData.symptoms || [],
        medications: formData.medications || [],
        labResults: formData.labResults || [],
        // Remove empty treatment and notes
        treatment: formData.treatment?.trim() || undefined,
        notes: formData.notes?.trim() || undefined
      };

      console.log('Sending medical record data:', cleanedData);
      
      await doctorAPI.addMedicalRecordForPatient(cleanedData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/doctor/patients');
      }, 2000);
    } catch (err: any) {
      console.error('Medical record submission error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to add medical record';
      const validationErrors = err.response?.data?.errors;
      
      if (validationErrors && Array.isArray(validationErrors)) {
        setError(`${errorMessage}: ${validationErrors.map((e: any) => e.msg).join(', ')}`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-green-600 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Medical Record Added Successfully!</h2>
          <p className="text-gray-600">Redirecting to patient list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-blue-600 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Add Medical Record</h1>
              <p className="text-white/90">Add medical record for existing patient</p>
            </div>
            <button
              onClick={() => navigate('/doctor/dashboard')}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient ID Lookup */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Lookup</h3>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patient ID *
                  </label>
                  <input
                    type="text"
                    name="patientId"
                    value={formData.patientId}
                    onChange={handleInputChange}
                    required
                    pattern="PAT[0-9]{6}"
                    title="Patient ID must be in format PAT123456 (6 digits)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter Patient ID (e.g., PAT123456)"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleLookupPatient}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg transition-colors duration-200"
                  >
                    {isLoading ? 'Looking up...' : 'Lookup Patient'}
                  </button>
                </div>
              </div>
            </div>

            {/* Patient Info Display */}
            {isPatientFound && patientInfo && (
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Found</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-gray-700">Name:</span> {patientInfo.name}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Email:</span> {patientInfo.email}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Phone:</span> {patientInfo.phone}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Age:</span> {patientInfo.age || 'N/A'} years
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Gender:</span> {patientInfo.gender}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Blood Group:</span> {patientInfo.bloodGroup || 'N/A'}
                  </div>
                </div>
              </div>
            )}

            {/* Medical Record Form */}
            {isPatientFound && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Visit Date *
                    </label>
                    <input
                      type="date"
                      name="visitDate"
                      value={formData.visitDate}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Diagnosis *
                    </label>
                    <input
                      type="text"
                      name="diagnosis"
                      value={formData.diagnosis}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter diagnosis"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Treatment
                  </label>
                  <textarea
                    name="treatment"
                    value={formData.treatment}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter treatment details"
                  />
                </div>

                {/* Symptoms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Symptoms
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newSymptom}
                      onChange={(e) => setNewSymptom(e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add a symptom"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSymptom())}
                    />
                    <button
                      type="button"
                      onClick={handleAddSymptom}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors duration-200"
                    >
                      Add
                    </button>
                  </div>
                  {formData.symptoms.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.symptoms.map((symptom, index) => (
                        <span
                          key={index}
                          className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                        >
                          {symptom}
                          <button
                            type="button"
                            onClick={() => removeArrayItem('symptoms', index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Vital Signs */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Vital Signs (Optional)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Blood Pressure (Systolic)
                      </label>
                      <input
                        type="number"
                        name="vitalSigns.bloodPressure.systolic"
                        value={formData.vitalSigns?.bloodPressure?.systolic || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value) : undefined;
                          handleBloodPressureChange('systolic', value);
                        }}
                        min="50"
                        max="250"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="120"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Blood Pressure (Diastolic)
                      </label>
                      <input
                        type="number"
                        name="vitalSigns.bloodPressure.diastolic"
                        value={formData.vitalSigns?.bloodPressure?.diastolic || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value) : undefined;
                          handleBloodPressureChange('diastolic', value);
                        }}
                        min="30"
                        max="150"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="80"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Heart Rate (bpm)
                      </label>
                      <input
                        type="number"
                        name="vitalSigns.heartRate"
                        value={formData.vitalSigns?.heartRate || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value) : undefined;
                          handleVitalSignChange('heartRate', value);
                        }}
                        min="30"
                        max="200"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="72"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Temperature (°F)
                      </label>
                      <input
                        type="number"
                        name="vitalSigns.temperature"
                        value={formData.vitalSigns?.temperature || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseFloat(e.target.value) : undefined;
                          handleVitalSignChange('temperature', value);
                        }}
                        min="95"
                        max="110"
                        step="0.1"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="98.6"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        name="vitalSigns.weight"
                        value={formData.vitalSigns?.weight || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseFloat(e.target.value) : undefined;
                          handleVitalSignChange('weight', value);
                        }}
                        min="10"
                        max="500"
                        step="0.1"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="70"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Height (cm)
                      </label>
                      <input
                        type="number"
                        name="vitalSigns.height"
                        value={formData.vitalSigns?.height || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseFloat(e.target.value) : undefined;
                          handleVitalSignChange('height', value);
                        }}
                        min="50"
                        max="300"
                        step="0.1"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="175"
                      />
                    </div>
                  </div>
                </div>

                {/* Follow-up */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="followUpRequired"
                      checked={formData.followUpRequired}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Follow-up required</span>
                  </label>
                  {formData.followUpRequired && (
                    <input
                      type="date"
                      name="followUpDate"
                      value={formData.followUpDate}
                      onChange={handleInputChange}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Additional notes"
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => navigate('/doctor/patients')}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-6 rounded-lg transition-colors duration-200"
                  >
                    {isLoading ? 'Adding Record...' : 'Add Medical Record'}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPatient;
