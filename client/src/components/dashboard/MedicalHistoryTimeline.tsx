import React from 'react';
import { motion } from 'framer-motion';

interface MedicalRecord {
  _id: string;
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

interface MedicalHistoryTimelineProps {
  records: MedicalRecord[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

const MedicalHistoryTimeline: React.FC<MedicalHistoryTimelineProps> = ({
  records,
  isLoading,
  error,
  onRetry
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getVitalSignsDisplay = (vitalSigns: any) => {
    const vitals = [];
    if (vitalSigns.bloodPressure) {
      vitals.push(`BP: ${vitalSigns.bloodPressure.systolic}/${vitalSigns.bloodPressure.diastolic} mmHg`);
    }
    if (vitalSigns.heartRate) {
      vitals.push(`HR: ${vitalSigns.heartRate} bpm`);
    }
    if (vitalSigns.temperature) {
      vitals.push(`Temp: ${vitalSigns.temperature}°F`);
    }
    if (vitalSigns.weight) {
      vitals.push(`Weight: ${vitalSigns.weight} kg`);
    }
    return vitals;
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card"
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="loading-dots mx-auto mb-4">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
            <p className="text-medical-600 font-medium">Loading medical history...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card"
      >
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-medical-900 mb-2">Failed to load medical history</h3>
          <p className="text-medical-600 mb-4">{error}</p>
          <button
            onClick={onRetry}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </motion.div>
    );
  }

  if (records.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card"
      >
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 bg-medical-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-medical-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-medical-900 mb-2">No Medical Records Found</h3>
          <p className="text-medical-600">Your medical history will appear here once you have visits recorded.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="card"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-medical-900">Medical History</h2>
        <div className="h-8 w-8 bg-secondary-100 rounded-full flex items-center justify-center">
          <svg className="h-4 w-4 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      </div>

      <div className="space-y-6">
        {records.map((record, index) => {
          const { date, time } = formatDate(record.visitDate);
          const vitalSigns = record.vitalSigns ? getVitalSignsDisplay(record.vitalSigns) : [];

          return (
            <motion.div
              key={record._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="timeline-item"
            >
              <div className="bg-white rounded-lg border border-medical-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-medical-900 mb-1">
                      {record.doctorName}
                    </h3>
                    {record.doctorSpecialty && (
                      <p className="text-sm text-medical-600">{record.doctorSpecialty}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-medical-900">{date}</p>
                    <p className="text-xs text-medical-500">{time}</p>
                  </div>
                </div>

                {/* Diagnosis */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-medical-800 mb-2 flex items-center">
                    <span className="mr-2">🔍</span>
                    Diagnosis
                  </h4>
                  <p className="text-sm text-medical-700 bg-medical-50 rounded-lg p-3">
                    {record.diagnosis}
                  </p>
                </div>

                {/* Symptoms */}
                {record.symptoms && record.symptoms.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-medical-800 mb-2 flex items-center">
                      <span className="mr-2">📋</span>
                      Symptoms
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {record.symptoms.map((symptom, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Treatment */}
                {record.treatment && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-medical-800 mb-2 flex items-center">
                      <span className="mr-2">💊</span>
                      Treatment
                    </h4>
                    <p className="text-sm text-medical-700 bg-green-50 rounded-lg p-3">
                      {record.treatment}
                    </p>
                  </div>
                )}

                {/* Medications */}
                {record.medications && record.medications.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-medical-800 mb-2 flex items-center">
                      <span className="mr-2">💉</span>
                      Medications
                    </h4>
                    <div className="space-y-2">
                      {record.medications.map((med, idx) => (
                        <div key={idx} className="bg-yellow-50 rounded-lg p-3">
                          <p className="text-sm font-medium text-yellow-900">{med.name}</p>
                          {med.dosage && (
                            <p className="text-xs text-yellow-700">Dosage: {med.dosage}</p>
                          )}
                          {med.frequency && (
                            <p className="text-xs text-yellow-700">Frequency: {med.frequency}</p>
                          )}
                          {med.duration && (
                            <p className="text-xs text-yellow-700">Duration: {med.duration}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vital Signs */}
                {vitalSigns.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-medical-800 mb-2 flex items-center">
                      <span className="mr-2">📊</span>
                      Vital Signs
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {vitalSigns.map((vital, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                        >
                          {vital}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lab Results */}
                {record.labResults && record.labResults.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-medical-800 mb-2 flex items-center">
                      <span className="mr-2">🧪</span>
                      Lab Results
                    </h4>
                    <div className="space-y-2">
                      {record.labResults.map((lab, idx) => (
                        <div key={idx} className="bg-indigo-50 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-indigo-900">{lab.testName}</p>
                              <p className="text-xs text-indigo-700">Result: {lab.result} {lab.unit}</p>
                              {lab.normalRange && (
                                <p className="text-xs text-indigo-600">Normal: {lab.normalRange}</p>
                              )}
                            </div>
                            <span className="text-xs text-indigo-500">
                              {new Date(lab.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {record.notes && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-medical-800 mb-2 flex items-center">
                      <span className="mr-2">📝</span>
                      Notes
                    </h4>
                    <p className="text-sm text-medical-700 bg-gray-50 rounded-lg p-3">
                      {record.notes}
                    </p>
                  </div>
                )}

                {/* Follow-up */}
                {record.followUpRequired && (
                  <div className="mt-4 pt-4 border-t border-medical-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="mr-2">📅</span>
                        <span className="text-sm font-medium text-medical-800">Follow-up Required</span>
                      </div>
                      {record.followUpDate && (
                        <span className="text-sm text-medical-600">
                          {new Date(record.followUpDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default MedicalHistoryTimeline;
