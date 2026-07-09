import React from 'react';
import { motion } from 'framer-motion';

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

interface PatientInfoCardProps {
  patient: Patient;
}

const PatientInfoCard: React.FC<PatientInfoCardProps> = ({ patient }) => {
  // Safety check for patient object
  if (!patient) {
    return (
      <div className="card-hover-lift">
        <div className="text-center py-8">
          <p className="text-medical-500">No patient data available</p>
        </div>
      </div>
    );
  }

  const calculateBMI = () => {
    if (patient.height && patient.weight) {
      const heightInMeters = patient.height / 100;
      return (patient.weight / (heightInMeters * heightInMeters)).toFixed(1);
    }
    return null;
  };

  const getBMIStatus = (bmi: number) => {
    if (bmi < 18.5) return { status: 'Underweight', color: 'text-blue-600' };
    if (bmi < 25) return { status: 'Normal', color: 'text-green-600' };
    if (bmi < 30) return { status: 'Overweight', color: 'text-yellow-600' };
    return { status: 'Obese', color: 'text-red-600' };
  };

  const bmi = calculateBMI();
  const bmiStatus = bmi ? getBMIStatus(parseFloat(bmi)) : null;

  const infoItems = [
    { label: 'Name', value: patient.name || 'N/A', icon: '👤' },
    { label: 'Email', value: patient.email || 'N/A', icon: '📧' },
    { label: 'Phone', value: patient.phone || 'N/A', icon: '📱' },
    { label: 'Age', value: patient.age ? `${patient.age} years` : 'N/A', icon: '🎂' },
    { label: 'Gender', value: patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : 'N/A', icon: '⚥' },
    { label: 'Height', value: patient.height ? `${patient.height} cm` : 'N/A', icon: '📏' },
    { label: 'Weight', value: patient.weight ? `${patient.weight} kg` : 'N/A', icon: '⚖️' },
    { label: 'Blood Group', value: patient.bloodGroup || 'N/A', icon: '🩸' },
  ];

  if (bmi) {
    infoItems.push({ 
      label: 'BMI', 
      value: `${bmi} (${bmiStatus?.status})`, 
      icon: '📊' 
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="card-hover-lift"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-medical-900">Patient Information</h2>
        <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
          <svg className="h-4 w-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      </div>

      {/* Patient ID Badge */}
      <div className="mb-6">
        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
          </svg>
          {patient.patientId}
        </div>
      </div>

      {/* Patient Details Grid */}
      <div className="grid grid-cols-1 gap-4">
        {infoItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="flex items-center justify-between py-2 border-b border-medical-100 last:border-b-0"
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm font-medium text-medical-700">{item.label}</span>
            </div>
            <span className={`text-sm font-medium ${item.label === 'BMI' && bmiStatus ? bmiStatus.color : 'text-medical-900'}`}>
              {item.value}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Allergies Section */}
      {patient.allergies && Array.isArray(patient.allergies) && patient.allergies.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 pt-6 border-t border-medical-200"
        >
          <h3 className="text-sm font-semibold text-medical-900 mb-3 flex items-center">
            <span className="mr-2">⚠️</span>
            Allergies
          </h3>
          <div className="flex flex-wrap gap-2">
            {patient.allergies.map((allergy, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
              >
                {allergy}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Medical Issues Section */}
      {patient.medicalIssues && Array.isArray(patient.medicalIssues) && patient.medicalIssues.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-4"
        >
          <h3 className="text-sm font-semibold text-medical-900 mb-3 flex items-center">
            <span className="mr-2">🏥</span>
            Medical Issues
          </h3>
          <div className="flex flex-wrap gap-2">
            {patient.medicalIssues.map((issue, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
              >
                {issue}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Emergency Contact */}
      {patient.emergencyContact && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 pt-6 border-t border-medical-200"
        >
          <h3 className="text-sm font-semibold text-medical-900 mb-3 flex items-center">
            <span className="mr-2">🚨</span>
            Emergency Contact
          </h3>
          <div className="bg-red-50 rounded-lg p-3">
            <p className="text-sm font-medium text-red-900">{patient.emergencyContact.name}</p>
            <p className="text-xs text-red-700">{patient.emergencyContact.relationship}</p>
            <p className="text-xs text-red-600">{patient.emergencyContact.phone}</p>
          </div>
        </motion.div>
      )}

      {/* Last Login */}
      {patient.lastLogin && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-4 pt-4 border-t border-medical-200"
        >
          <p className="text-xs text-medical-500">
            Last login: {new Date(patient.lastLogin).toLocaleString()}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PatientInfoCard;
