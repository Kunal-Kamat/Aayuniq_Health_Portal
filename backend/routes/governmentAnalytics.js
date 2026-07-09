const express = require('express');
const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const governmentAuth = require('../middleware/governmentAuth');
const XLSX = require('xlsx');
const ExcelJS = require('exceljs');
const XlsxPopulate = require('xlsx-populate');
const excel = require('excel4node');

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Server is working!' });
});

// Test dashboard without auth
router.get('/test-dashboard', async (req, res) => {
  try {
    console.log('Test dashboard request received...');
    
    const totalPatients = await Patient.countDocuments({ isVerified: true });
    const totalDoctors = await Doctor.countDocuments({});
    const totalMedicalRecords = await MedicalRecord.countDocuments({});
    
    res.json({
      success: true,
      data: {
        overview: {
          totalPatients,
          totalDoctors,
          totalMedicalRecords
        }
      }
    });
  } catch (error) {
    console.error('Test dashboard error:', error);
    res.status(500).json({
      success: false,
      message: `Test dashboard error: ${error.message}`
    });
  }
});

// @route   GET /api/government/analytics/dashboard
// @desc    Get government dashboard analytics
// @access  Private (Government)
router.get('/dashboard', async (req, res) => {
  try {
    console.log('Dashboard request received...');
    
    // Get total counts first
    console.log('Fetching total counts...');
    const totalPatients = await Patient.countDocuments({ isVerified: true });
    const totalDoctors = await Doctor.countDocuments({});
    const totalMedicalRecords = await MedicalRecord.countDocuments({});
    
    console.log(`Counts: Patients: ${totalPatients}, Doctors: ${totalDoctors}, Records: ${totalMedicalRecords}`);

    // Run remaining queries in parallel
    const [
      diseaseStats,
      ageGroupStats,
      genderStats,
      monthlyTrends,
      specializationStats,
      treatmentOutcomes
    ] = await Promise.all([
      // Disease categorization - optimized
      MedicalRecord.aggregate([
        {
          $group: {
            _id: '$diagnosis',
            count: { $sum: 1 },
            patients: { $addToSet: '$patientId' }
          }
        },
        {
          $project: {
            disease: '$_id',
            count: 1,
            uniquePatients: { $size: '$patients' },
            percentage: { $multiply: [{ $divide: ['$count', totalMedicalRecords] }, 100] }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),

      // Age group analysis - optimized
      Patient.aggregate([
        { $match: { isVerified: true } },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $lt: ['$age', 18] }, then: '0-17' },
                  { case: { $lt: ['$age', 30] }, then: '18-29' },
                  { case: { $lt: ['$age', 45] }, then: '30-44' },
                  { case: { $lt: ['$age', 60] }, then: '45-59' },
                  { case: { $gte: ['$age', 60] }, then: '60+' }
                ],
                default: 'Unknown'
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Gender distribution - optimized
      Patient.aggregate([
        { $match: { isVerified: true } },
        {
          $group: {
            _id: '$gender',
            count: { $sum: 1 }
          }
        }
      ]),

      // Monthly disease trends (last 12 months) - optimized
      MedicalRecord.aggregate([
        {
          $match: {
            visitDate: {
              $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1))
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$visitDate' },
              month: { $month: '$visitDate' },
              diagnosis: '$diagnosis'
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: {
              year: '$_id.year',
              month: '$_id.month'
            },
            diseases: {
              $push: {
                diagnosis: '$_id.diagnosis',
                count: '$count'
              }
            },
            totalRecords: { $sum: '$count' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
      ]),

      // Doctor specialization distribution - optimized
      Doctor.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$specialization',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),

      // Treatment outcomes - optimized
      MedicalRecord.aggregate([
        {
          $group: {
            _id: '$followUpRequired',
            count: { $sum: 1 }
          }
        }
      ])
    ]);


    res.json({
      success: true,
      data: {
        overview: {
          totalPatients,
          totalDoctors,
          totalMedicalRecords
        },
        diseaseDistribution: diseaseStats,
        ageGroupDistribution: ageGroupStats,
        genderDistribution: genderStats,
        monthlyTrends,
        specializationDistribution: specializationStats,
        treatmentOutcomes
      }
    });

  } catch (error) {
    console.error('Government dashboard analytics error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({
      success: false,
      message: `Dashboard error: ${error.message}`,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   GET /api/government/analytics/diseases
// @desc    Get detailed disease analytics
// @access  Private (Government)
router.get('/diseases', governmentAuth, async (req, res) => {
  try {
    const { disease, timeRange = '12' } = req.query;
    
    let matchQuery = {};
    
    // Filter by specific disease if provided
    if (disease) {
      matchQuery.diagnosis = new RegExp(disease, 'i');
    }
    
    // Filter by time range
    if (timeRange !== 'all') {
      const months = parseInt(timeRange);
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      matchQuery.visitDate = { $gte: startDate };
    }

    const diseaseAnalytics = await MedicalRecord.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$diagnosis',
          totalCases: { $sum: 1 },
          uniquePatients: { $addToSet: '$patientId' },
          avgAge: { $avg: '$patientAge' },
          treatments: { $addToSet: '$treatment' },
          medications: { $push: '$medications' }
        }
      },
      {
        $project: {
          disease: '$_id',
          totalCases: 1,
          uniquePatients: { $size: '$uniquePatients' },
          avgAge: { $round: ['$avgAge', 1] },
          commonTreatments: {
            $slice: [
              {
                $reduce: {
                  input: '$treatments',
                  initialValue: [],
                  in: { $concatArrays: ['$$value', { $ifNull: ['$$this', []] }] }
                }
              },
              5
            ]
          }
        }
      },
      { $sort: { totalCases: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        diseaseAnalytics,
        timeRange: timeRange === 'all' ? 'All time' : `Last ${timeRange} months`
      }
    });

  } catch (error) {
    console.error('Disease analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching disease analytics'
    });
  }
});

// @route   GET /api/government/analytics/export
// @desc    Export analytics data for ministry use
// @access  Private (Government)
router.get('/export', governmentAuth, async (req, res) => {
  try {
    const { format = 'json', type = 'summary' } = req.query;
    
    if (req.government.accessLevel === 'View Only') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions for data export'
      });
    }

    let exportData = {};

    if (type === 'summary') {
      // Export summary data
      const summary = await MedicalRecord.aggregate([
        {
          $group: {
            _id: null,
            totalRecords: { $sum: 1 },
            uniquePatients: { $addToSet: '$patientId' },
            diseases: { $addToSet: '$diagnosis' },
            avgAge: { $avg: '$patientAge' }
          }
        },
        {
          $project: {
            totalRecords: 1,
            uniquePatients: { $size: '$uniquePatients' },
            totalDiseases: { $size: '$diseases' },
            avgAge: { $round: ['$avgAge', 1] }
          }
        }
      ]);

      exportData = {
        exportDate: new Date(),
        exportedBy: req.government.name,
        department: req.government.department,
        data: summary[0] || {}
      };
    }

    if (format === 'json') {
      res.json({
        success: true,
        data: exportData
      });
    } else {
      // For CSV or other formats, you would implement specific formatting
      res.json({
        success: true,
        message: 'Export format not yet implemented',
        data: exportData
      });
    }

  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while exporting data'
    });
  }
});

// @route   GET /api/government/analytics/export-excel
// @desc    Export patient records with diseases to Excel with charts
// @access  Private (Government)
router.get('/export-excel', async (req, res) => {
  try {
    console.log('Excel export started...');
    
    // Skip access level check for testing
    // if (req.government.accessLevel === 'View Only') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Insufficient permissions for data export'
    //   });
    // }

    // Get all medical records with patient details
    console.log('Fetching medical records...');
    const medicalRecords = await MedicalRecord.find({ isActive: true })
      .sort({ visitDate: -1 })
      .limit(100); // Limit for testing

    console.log(`Found ${medicalRecords.length} medical records`);

    // Check if we have data
    if (!medicalRecords || medicalRecords.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No medical records found to export'
      });
    }

    // Get patient and doctor details separately
    const patientIds = [...new Set(medicalRecords.map(record => record.patientId))];
    const doctorIds = [...new Set(medicalRecords.map(record => record.doctorId))];
    
    console.log('Fetching patient and doctor details...');
    const patients = await Patient.find({ patientId: { $in: patientIds } }).lean();
    const doctors = await Doctor.find({ doctorId: { $in: doctorIds } }).lean();
    
    // Create lookup maps
    const patientMap = {};
    const doctorMap = {};
    patients.forEach(patient => patientMap[patient.patientId] = patient);
    doctors.forEach(doctor => doctorMap[doctor.doctorId] = doctor);
    
    // Attach patient and doctor data to records
    const recordsWithDetails = medicalRecords.map(record => ({
      ...record.toObject(),
      patientId: patientMap[record.patientId] || null,
      doctorId: doctorMap[record.doctorId] || null
    }));

    console.log('Creating Excel workbook...');
    // Create Excel workbook with excel4node
    const workbook = new excel.Workbook();

    // Prepare data for Excel with error handling
    const excelData = recordsWithDetails.map(record => {
      try {
      const patient = record.patientId;
      const doctor = record.doctorId;
      
      // Get age from patient data
      const age = patient && patient.age ? patient.age : 'N/A';

      // Calculate BMI from vital signs or patient data
      let bmi = 'N/A';
      let weight = 'N/A';
      let height = 'N/A';
      
      // Try to get weight and height from vital signs first, then from patient data
      const recordWeight = record.vitalSigns?.weight;
      const recordHeight = record.vitalSigns?.height;
      const patientWeight = patient?.weight;
      const patientHeight = patient?.height;
      
      weight = recordWeight || patientWeight || 'N/A';
      height = recordHeight || patientHeight || 'N/A';
      
      if (weight !== 'N/A' && height !== 'N/A') {
        const heightInMeters = height / 100;
        bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
      }

      return {
        'Patient ID': patient?.patientId || 'N/A',
        'Patient Name': patient?.name || 'N/A',
        'Email': patient?.email || 'N/A',
        'Phone': patient?.phone || 'N/A',
        'Age': age,
        'Gender': patient?.gender || 'N/A',
        'Visit Date': new Date(record.visitDate).toLocaleDateString(),
        'Doctor Name': doctor?.name || record.doctorName || 'N/A',
        'Doctor Specialty': doctor?.specialization || record.doctorSpecialty || 'N/A',
        'Diagnosis': record.diagnosis || 'N/A',
        'Symptoms': record.symptoms ? record.symptoms.join(', ') : 'N/A',
        'Treatment': record.treatment || 'N/A',
        'Medications': record.medications ? record.medications.map(med => 
          `${med.name}${med.dosage ? ` (${med.dosage})` : ''}${med.frequency ? ` - ${med.frequency}` : ''}`
        ).join('; ') : 'N/A',
        'Blood Pressure': record.vitalSigns?.bloodPressure ? 
          `${record.vitalSigns.bloodPressure.systolic}/${record.vitalSigns.bloodPressure.diastolic}` : 'N/A',
        'Heart Rate (BPM)': record.vitalSigns?.heartRate || 'N/A',
        'Temperature (°F)': record.vitalSigns?.temperature || 'N/A',
        'Weight (kg)': weight,
        'Height (cm)': height,
        'BMI': bmi,
        'Follow Up Required': record.followUpRequired ? 'Yes' : 'No',
        'Notes': record.notes || 'N/A'
      };
      } catch (error) {
        console.error('Error processing record:', error, record);
        return {
          'Patient ID': 'Error',
          'Patient Name': 'Error',
          'Email': 'Error',
          'Phone': 'Error',
          'Age': 'Error',
          'Gender': 'Error',
          'Visit Date': 'Error',
          'Doctor Name': 'Error',
          'Doctor Specialty': 'Error',
          'Diagnosis': 'Error',
          'Symptoms': 'Error',
          'Treatment': 'Error',
          'Medications': 'Error',
          'Blood Pressure': 'Error',
          'Heart Rate (BPM)': 'Error',
          'Temperature (°F)': 'Error',
          'Weight (kg)': 'Error',
          'Height (cm)': 'Error',
          'BMI': 'Error',
          'Follow Up Required': 'Error',
          'Notes': 'Error'
        };
      }
    });

    // Create Patient Records worksheet
    const patientSheet = workbook.addWorksheet('Patient Records');
    
    // Add headers
    const headers = Object.keys(excelData[0] || {});
    headers.forEach((header, index) => {
      patientSheet.cell(1, index + 1).string(header);
    });
    
    // Style headers
    const headerStyle = workbook.createStyle({
      font: {
        bold: true,
        color: 'FFFFFF'
      },
      fill: {
        type: 'pattern',
        patternType: 'solid',
        fgColor: '2980B9'
      }
    });
    
    // Apply header style
    headers.forEach((_, index) => {
      patientSheet.cell(1, index + 1).style(headerStyle);
    });
    
    // Add data rows
    excelData.forEach((row, rowIndex) => {
      Object.values(row).forEach((value, colIndex) => {
        // Convert string numbers to actual numbers
        if (typeof value === 'string' && !isNaN(value) && value !== 'N/A' && value !== '') {
          patientSheet.cell(rowIndex + 2, colIndex + 1).number(parseFloat(value));
        } else if (typeof value === 'number') {
          patientSheet.cell(rowIndex + 2, colIndex + 1).number(value);
        } else {
          patientSheet.cell(rowIndex + 2, colIndex + 1).string(String(value));
        }
      });
    });
    
    // Auto-fit columns
    headers.forEach((_, index) => {
      patientSheet.column(index + 1).setWidth(15);
    });

    // Create Disease Summary worksheet
    const diseaseSummary = await MedicalRecord.aggregate([
      {
        $group: {
          _id: '$diagnosis',
          count: { $sum: 1 },
          patients: { $addToSet: '$patientId' }
        }
      },
      {
        $project: {
          disease: '$_id',
          totalCases: '$count',
          uniquePatients: { $size: '$patients' }
        }
      },
      { $sort: { totalCases: -1 } }
    ]);

    const diseaseSheet = workbook.addWorksheet('Disease Summary');
    
    // Add headers
    diseaseSheet.cell(1, 1).string('Disease');
    diseaseSheet.cell(1, 2).string('Total Cases');
    diseaseSheet.cell(1, 3).string('Unique Patients');
    
    // Style disease headers
    const diseaseHeaderStyle = workbook.createStyle({
      font: {
        bold: true,
        color: 'FFFFFF'
      },
      fill: {
        type: 'pattern',
        patternType: 'solid',
        fgColor: 'E74C3C'
      }
    });
    
    diseaseSheet.cell(1, 1).style(diseaseHeaderStyle);
    diseaseSheet.cell(1, 2).style(diseaseHeaderStyle);
    diseaseSheet.cell(1, 3).style(diseaseHeaderStyle);
    
    // Add data
    diseaseSummary.forEach((item, index) => {
      diseaseSheet.cell(index + 2, 1).string(item.disease);
      diseaseSheet.cell(index + 2, 2).number(item.totalCases);
      diseaseSheet.cell(index + 2, 3).number(item.uniquePatients);
    });

    // Note: Charts will be added in a future update
    // For now, we'll include the data in a structured format

    // Create BMI Analysis worksheet
    const bmiData = recordsWithDetails
      .filter(record => {
        const weight = record.vitalSigns?.weight || record.patientId?.weight;
        const height = record.vitalSigns?.height || record.patientId?.height;
        return weight && height;
      })
      .map(record => {
        const patient = record.patientId;
        const weight = record.vitalSigns?.weight || patient?.weight;
        const height = record.vitalSigns?.height || patient?.height;
        const heightInMeters = height / 100;
        const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
        
        return {
          'Patient ID': patient?.patientId || 'N/A',
          'Patient Name': patient?.name || 'N/A',
          'Age': patient && patient.dateOfBirth 
            ? Math.floor((new Date() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
            : 'N/A',
          'Gender': patient?.gender || 'N/A',
          'Weight (kg)': weight,
          'Height (cm)': height,
          'BMI': parseFloat(bmi),
          'BMI Category': bmi < 18.5 ? 'Underweight' : 
                        bmi < 25 ? 'Normal' : 
                        bmi < 30 ? 'Overweight' : 'Obese',
          'Visit Date': new Date(record.visitDate).toLocaleDateString()
        };
      });

    const bmiSheet = workbook.addWorksheet('BMI Analysis');
    if (bmiData.length > 0) {
      const bmiHeaders = Object.keys(bmiData[0]);
      bmiHeaders.forEach((header, index) => {
        bmiSheet.cell(1, index + 1).string(header);
      });
      
      // Style BMI headers
      const bmiHeaderStyle = workbook.createStyle({
        font: {
          bold: true,
          color: 'FFFFFF'
        },
        fill: {
          type: 'pattern',
          patternType: 'solid',
          fgColor: '27AE60'
        }
      });
      
      bmiHeaders.forEach((_, index) => {
        bmiSheet.cell(1, index + 1).style(bmiHeaderStyle);
      });
      
      bmiData.forEach((row, rowIndex) => {
        Object.values(row).forEach((value, colIndex) => {
          // Convert string numbers to actual numbers
          if (typeof value === 'string' && !isNaN(value) && value !== 'N/A' && value !== '') {
            bmiSheet.cell(rowIndex + 2, colIndex + 1).number(parseFloat(value));
          } else if (typeof value === 'number') {
            bmiSheet.cell(rowIndex + 2, colIndex + 1).number(value);
          } else {
            bmiSheet.cell(rowIndex + 2, colIndex + 1).string(String(value));
          }
        });
      });

      // Add BMI distribution chart
      const bmiCategories = bmiData.reduce((acc, record) => {
        const category = record['BMI Category'];
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});

      const bmiChartData = Object.entries(bmiCategories).map(([category, count]) => ({
        category,
        count
      }));

      // Add BMI chart data
      const chartDataStartRow = bmiData.length + 3;
      bmiSheet.cell(chartDataStartRow, 1).string('BMI Category');
      bmiSheet.cell(chartDataStartRow, 2).string('Count');
      
      bmiChartData.forEach((item, index) => {
        bmiSheet.cell(chartDataStartRow + index + 1, 1).string(item.category);
        bmiSheet.cell(chartDataStartRow + index + 1, 2).number(item.count);
      });

      // Note: Charts will be added in a future update
      // For now, we'll include the data in a structured format
    }

    // Create Age Distribution worksheet
    const ageData = recordsWithDetails.map(record => {
      const patient = record.patientId;
      const age = patient && patient.dateOfBirth 
        ? Math.floor((new Date() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
        : null;
      
      return {
        'Patient ID': patient?.patientId || 'N/A',
        'Patient Name': patient?.name || 'N/A',
        'Age': age,
        'Gender': patient?.gender || 'N/A',
        'Age Group': age ? 
          (age < 18 ? '0-17' : 
           age < 30 ? '18-29' : 
           age < 45 ? '30-44' : 
           age < 60 ? '45-59' : '60+') : 'Unknown',
        'Visit Date': new Date(record.visitDate).toLocaleDateString(),
        'Diagnosis': record.diagnosis || 'N/A'
      };
    });

    const ageSheet = workbook.addWorksheet('Age Distribution');
    const ageHeaders = Object.keys(ageData[0] || {});
    ageHeaders.forEach((header, index) => {
      ageSheet.cell(1, index + 1).string(header);
    });
    
    // Style age headers
    const ageHeaderStyle = workbook.createStyle({
      font: {
        bold: true,
        color: 'FFFFFF'
      },
      fill: {
        type: 'pattern',
        patternType: 'solid',
        fgColor: '9B59B6'
      }
    });
    
    ageHeaders.forEach((_, index) => {
      ageSheet.cell(1, index + 1).style(ageHeaderStyle);
    });
    
    ageData.forEach((row, rowIndex) => {
      Object.values(row).forEach((value, colIndex) => {
        // Convert string numbers to actual numbers
        if (typeof value === 'string' && !isNaN(value) && value !== 'N/A' && value !== '') {
          ageSheet.cell(rowIndex + 2, colIndex + 1).number(parseFloat(value));
        } else if (typeof value === 'number') {
          ageSheet.cell(rowIndex + 2, colIndex + 1).number(value);
        } else {
          ageSheet.cell(rowIndex + 2, colIndex + 1).string(String(value));
        }
      });
    });

    // Add age group distribution chart
    const ageGroups = ageData.reduce((acc, record) => {
      const group = record['Age Group'];
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {});

    const ageChartData = Object.entries(ageGroups).map(([group, count]) => ({
      group,
      count
    }));

    // Add age chart data
    const ageChartDataStartRow = ageData.length + 3;
    ageSheet.cell(ageChartDataStartRow, 1).string('Age Group');
    ageSheet.cell(ageChartDataStartRow, 2).string('Count');
    
    ageChartData.forEach((item, index) => {
      ageSheet.cell(ageChartDataStartRow + index + 1, 1).string(item.group);
      ageSheet.cell(ageChartDataStartRow + index + 1, 2).number(item.count);
    });

    // Note: Charts will be added in a future update
    // For now, we'll include the data in a structured format

    // Create Doctor Details worksheet
    const doctorDetails = doctors.map(doctor => {
      // Count patients treated by this doctor
      const patientsTreated = medicalRecords.filter(record => record.doctorId === doctor.doctorId).length;
      
      // Get unique patients treated
      const uniquePatients = new Set(medicalRecords
        .filter(record => record.doctorId === doctor.doctorId)
        .map(record => record.patientId)
      ).size;

      // Get recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentActivity = medicalRecords.filter(record => 
        record.doctorId === doctor.doctorId && 
        new Date(record.visitDate) >= thirtyDaysAgo
      ).length;

      return {
        'Doctor ID': doctor.doctorId,
        'Name': doctor.name,
        'Email': doctor.email,
        'Phone': doctor.phone,
        'Specialization': doctor.specialization,
        'License Number': doctor.licenseNumber,
        'Hospital': doctor.hospital,
        'Experience (Years)': doctor.experience,
        'Qualifications': doctor.qualifications ? doctor.qualifications.join(', ') : 'N/A',
        'Verification Status': doctor.isVerified ? 'Verified' : 'Pending',
        'Account Status': doctor.isActive ? 'Active' : 'Inactive',
        'Total Records': patientsTreated,
        'Unique Patients': uniquePatients,
        'Recent Activity (30 days)': recentActivity,
        'Last Login': doctor.lastLogin ? new Date(doctor.lastLogin).toLocaleDateString() : 'Never',
        'Registration Date': new Date(doctor.createdAt).toLocaleDateString()
      };
    });

    const doctorSheet = workbook.addWorksheet('Doctor Details');
    
    // Add headers
    const doctorHeaders = Object.keys(doctorDetails[0] || {});
    doctorHeaders.forEach((header, index) => {
      doctorSheet.cell(1, index + 1).string(header);
    });
    
    // Style doctor headers
    const doctorHeaderStyle = workbook.createStyle({
      font: {
        bold: true,
        color: 'FFFFFF'
      },
      fill: {
        type: 'pattern',
        patternType: 'solid',
        fgColor: '8E44AD'
      }
    });
    
    doctorHeaders.forEach((_, index) => {
      doctorSheet.cell(1, index + 1).style(doctorHeaderStyle);
    });
    
    // Add data rows
    doctorDetails.forEach((row, rowIndex) => {
      Object.values(row).forEach((value, colIndex) => {
        // Convert string numbers to actual numbers
        if (typeof value === 'string' && !isNaN(value) && value !== 'N/A' && value !== '') {
          doctorSheet.cell(rowIndex + 2, colIndex + 1).number(parseFloat(value));
        } else if (typeof value === 'number') {
          doctorSheet.cell(rowIndex + 2, colIndex + 1).number(value);
        } else {
          doctorSheet.cell(rowIndex + 2, colIndex + 1).string(String(value));
        }
      });
    });

    // Auto-fit doctor columns
    doctorHeaders.forEach((_, index) => {
      doctorSheet.column(index + 1).setWidth(20);
    });

    // Create Doctor Analytics worksheet
    const doctorAnalytics = await Doctor.aggregate([
      {
        $lookup: {
          from: 'medicalrecords',
          localField: 'doctorId',
          foreignField: 'doctorId',
          as: 'records'
        }
      },
      {
        $project: {
          specialization: 1,
          experience: 1,
          isVerified: 1,
          isActive: 1,
          totalRecords: { $size: '$records' },
          uniquePatients: { $size: { $setUnion: '$records.patientId' } },
          recentRecords: {
            $size: {
              $filter: {
                input: '$records',
                cond: { $gte: ['$$this.visitDate', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] }
              }
            }
          }
        }
      }
    ]);

    const analyticsSheet = workbook.addWorksheet('Doctor Analytics');
    
    // Add headers
    analyticsSheet.cell(1, 1).string('Specialization');
    analyticsSheet.cell(1, 2).string('Total Doctors');
    analyticsSheet.cell(1, 3).string('Verified Doctors');
    analyticsSheet.cell(1, 4).string('Active Doctors');
    analyticsSheet.cell(1, 5).string('Total Records');
    analyticsSheet.cell(1, 6).string('Avg Records/Doctor');
    analyticsSheet.cell(1, 7).string('Total Unique Patients');
    analyticsSheet.cell(1, 8).string('Recent Activity (30 days)');
    
    // Style analytics headers
    const analyticsHeaderStyle = workbook.createStyle({
      font: {
        bold: true,
        color: 'FFFFFF'
      },
      fill: {
        type: 'pattern',
        patternType: 'solid',
        fgColor: 'E67E22'
      }
    });
    
    for (let i = 1; i <= 8; i++) {
      analyticsSheet.cell(1, i).style(analyticsHeaderStyle);
    }
    
    // Group by specialization
    const specializationGroups = doctorAnalytics.reduce((acc, doctor) => {
      const spec = doctor.specialization;
      if (!acc[spec]) {
        acc[spec] = {
          totalDoctors: 0,
          verifiedDoctors: 0,
          activeDoctors: 0,
          totalRecords: 0,
          totalUniquePatients: 0,
          recentActivity: 0
        };
      }
      
      acc[spec].totalDoctors++;
      if (doctor.isVerified) acc[spec].verifiedDoctors++;
      if (doctor.isActive) acc[spec].activeDoctors++;
      acc[spec].totalRecords += doctor.totalRecords;
      acc[spec].totalUniquePatients += doctor.uniquePatients;
      acc[spec].recentActivity += doctor.recentRecords;
      
      return acc;
    }, {});

    // Add analytics data
    let rowIndex = 2;
    Object.entries(specializationGroups).forEach(([specialization, data]) => {
      analyticsSheet.cell(rowIndex, 1).string(specialization);
      analyticsSheet.cell(rowIndex, 2).number(data.totalDoctors);
      analyticsSheet.cell(rowIndex, 3).number(data.verifiedDoctors);
      analyticsSheet.cell(rowIndex, 4).number(data.activeDoctors);
      analyticsSheet.cell(rowIndex, 5).number(data.totalRecords);
      analyticsSheet.cell(rowIndex, 6).number(data.totalDoctors > 0 ? parseFloat((data.totalRecords / data.totalDoctors).toFixed(1)) : 0);
      analyticsSheet.cell(rowIndex, 7).number(data.totalUniquePatients);
      analyticsSheet.cell(rowIndex, 8).number(data.recentActivity);
      rowIndex++;
    });

    // Add experience analysis
    const experienceAnalysis = doctorAnalytics.reduce((acc, doctor) => {
      const expRange = doctor.experience < 5 ? '0-4 years' :
                      doctor.experience < 10 ? '5-9 years' :
                      doctor.experience < 20 ? '10-19 years' : '20+ years';
      
      if (!acc[expRange]) {
        acc[expRange] = { count: 0, totalRecords: 0 };
      }
      
      acc[expRange].count++;
      acc[expRange].totalRecords += doctor.totalRecords;
      
      return acc;
    }, {});

    // Add experience analysis section
    const expStartRow = rowIndex + 2;
    analyticsSheet.cell(expStartRow, 1).string('Experience Range');
    analyticsSheet.cell(expStartRow, 2).string('Doctor Count');
    analyticsSheet.cell(expStartRow, 3).string('Total Records');
    analyticsSheet.cell(expStartRow, 4).string('Avg Records/Doctor');
    
    // Style experience headers
    for (let i = 1; i <= 4; i++) {
      analyticsSheet.cell(expStartRow, i).style(analyticsHeaderStyle);
    }
    
    let expRowIndex = expStartRow + 1;
    Object.entries(experienceAnalysis).forEach(([range, data]) => {
      analyticsSheet.cell(expRowIndex, 1).string(range);
      analyticsSheet.cell(expRowIndex, 2).number(data.count);
      analyticsSheet.cell(expRowIndex, 3).number(data.totalRecords);
      analyticsSheet.cell(expRowIndex, 4).number(data.count > 0 ? parseFloat((data.totalRecords / data.count).toFixed(1)) : 0);
      expRowIndex++;
    });

    // Auto-fit analytics columns
    for (let i = 1; i <= 8; i++) {
      analyticsSheet.column(i).setWidth(18);
    }

    console.log('Generating Excel buffer...');
    // Generate Excel buffer
    const buffer = await workbook.writeToBuffer();
    console.log(`Excel buffer generated, size: ${buffer.length} bytes`);

    // Set response headers
    const fileName = `patient-records-export-${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-cache');

    console.log('Sending Excel file...');
    res.end(buffer);
    console.log('Excel export completed successfully');

  } catch (error) {
    console.error('Excel export error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Return JSON error response
    res.status(500).json({
      success: false,
      message: `Excel export failed: ${error.message}`,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   GET /api/government/analytics/patients
// @desc    Get detailed patient records for government dashboard
// @access  Private (Government)
router.get('/patients', governmentAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', disease = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let matchQuery = { isActive: true };

    // Add disease filter if provided
    if (disease) {
      matchQuery.diagnosis = new RegExp(disease, 'i');
    }

    // Use aggregation pipeline for better performance
    const recordsWithDetails = await MedicalRecord.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'patients',
          localField: 'patientId',
          foreignField: 'patientId',
          as: 'patient'
        }
      },
      {
        $lookup: {
          from: 'doctors',
          localField: 'doctorId',
          foreignField: 'doctorId',
          as: 'doctor'
        }
      },
      {
        $addFields: {
          patient: { $arrayElemAt: ['$patient', 0] },
          doctor: { $arrayElemAt: ['$doctor', 0] }
        }
      },
      { $sort: { visitDate: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);

    // Filter by search term if provided
    let filteredRecords = recordsWithDetails;
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filteredRecords = recordsWithDetails.filter(record => {
        const patient = record.patient;
        return (
          (patient?.name && searchRegex.test(patient.name)) ||
          (patient?.email && searchRegex.test(patient.email)) ||
          (patient?.patientId && searchRegex.test(patient.patientId)) ||
          (record.diagnosis && searchRegex.test(record.diagnosis)) ||
          (record.doctorName && searchRegex.test(record.doctorName))
        );
      });
    }

    // Get total count for pagination
    const totalRecords = await MedicalRecord.countDocuments(matchQuery);

    // Format the data for frontend
    const formattedRecords = filteredRecords.map(record => {
      const patient = record.patient;
      const doctor = record.doctor;
      
      // Calculate age
      const age = patient && patient.dateOfBirth 
        ? Math.floor((new Date() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
        : null;

      return {
        _id: record._id,
        patientId: patient?.patientId || 'N/A',
        patientName: patient?.name || 'N/A',
        patientEmail: patient?.email || 'N/A',
        patientPhone: patient?.phone || 'N/A',
        patientAge: age,
        patientGender: patient?.gender || 'N/A',
        patientBloodGroup: patient?.bloodGroup || 'N/A',
        visitDate: record.visitDate ? new Date(record.visitDate) : null,
        doctorName: doctor?.name || record.doctorName || 'N/A',
        doctorSpecialty: doctor?.specialization || record.doctorSpecialty || 'N/A',
        diagnosis: record.diagnosis || 'N/A',
        symptoms: record.symptoms || [],
        treatment: record.treatment || 'N/A',
        medications: record.medications || [],
        vitalSigns: record.vitalSigns,
        followUpRequired: record.followUpRequired || false,
        followUpDate: record.followUpDate ? new Date(record.followUpDate) : null,
        notes: record.notes || 'N/A'
      };
    });

    res.json({
      success: true,
      data: {
        records: formattedRecords,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalRecords / parseInt(limit)),
          totalRecords,
          hasNextPage: skip + parseInt(limit) < totalRecords,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching patient records'
    });
  }
});

module.exports = router;
