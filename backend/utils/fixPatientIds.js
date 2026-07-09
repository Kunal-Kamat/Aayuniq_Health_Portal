const mongoose = require('mongoose');
const Patient = require('../models/Patient');
const MedicalRecord = require('../models/MedicalRecord');

const fixPatientIds = async () => {
  try {
    console.log('Fixing patient IDs to be unique and realistic...');
    
    // Get all patients
    const patients = await Patient.find({});
    console.log(`Found ${patients.length} patients to update`);
    
    // Generate unique patient IDs
    const usedIds = new Set();
    const generateUniqueId = () => {
      let id;
      do {
        // Generate a more realistic patient ID format: PAT + 6 random digits
        id = 'PAT' + Math.floor(100000 + Math.random() * 900000);
      } while (usedIds.has(id));
      usedIds.add(id);
      return id;
    };
    
    // Update each patient with a unique ID
    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i];
      const oldId = patient.patientId;
      const newId = generateUniqueId();
      
      console.log(`Updating ${patient.name}: ${oldId} -> ${newId}`);
      
      // Update patient ID
      patient.patientId = newId;
      await patient.save();
      
      // Update all medical records that reference this patient
      await MedicalRecord.updateMany(
        { patientId: oldId },
        { patientId: newId }
      );
      
      console.log(`✅ Updated patient ${patient.name} and their medical records`);
    }
    
    console.log('✅ All patient IDs have been updated to be unique!');
    
    // Show final patient list
    const updatedPatients = await Patient.find({}, 'patientId name');
    console.log('\nUpdated patient list:');
    updatedPatients.forEach(patient => {
      console.log(`- ${patient.patientId} (${patient.name})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing patient IDs:', error);
    process.exit(1);
  }
};

// Connect to MongoDB and run the script
mongoose.connect('mongodb://localhost:27017/aayuniq-health-portal').then(() => {
  console.log('Connected to MongoDB');
  fixPatientIds();
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});












