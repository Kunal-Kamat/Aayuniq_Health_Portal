const { jsPDF } = require('jspdf');

/**
 * Generate health report PDF for a patient
 * @param {Object} patient - Patient data
 * @param {Array} medicalRecords - Array of medical records
 * @returns {Buffer} - PDF buffer
 */
const generateHealthReportPDF = async (patient, medicalRecords) => {
  try {
    console.log('Starting PDF generation for patient:', patient.patientId);
    console.log('Medical records count:', medicalRecords ? medicalRecords.length : 0);
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Helper function to add text with word wrap
    const addText = (text, x, y, maxWidth, fontSize = 10, fontStyle = 'normal') => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + (lines.length * fontSize * 0.4);
    };

    // Helper function to add a new page if needed
    const checkNewPage = (requiredSpace) => {
      if (yPosition + requiredSpace > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
        return true;
      }
      return false;
    };

    // Header with enhanced design
    doc.setFillColor(41, 128, 185); // Blue color
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Aayuniq Health Portal', 20, 18);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Certified Healthcare Management System', 20, 25);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('OFFICIAL HEALTH REPORT', pageWidth - 80, 18);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 80, 25);
    doc.text(`Report ID: AHP-${Date.now()}`, pageWidth - 80, 30);

    yPosition = 40;

    // Patient Information Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Patient Information', 20, yPosition);
    yPosition += 10;

    // Patient details in a table format
    const patientDetails = [
      ['Patient ID', patient.patientId],
      ['Name', patient.name],
      ['Email', patient.email],
      ['Phone', patient.phone],
      ['Date of Birth', patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'],
      ['Age', patient.age ? `${patient.age} years` : 'N/A'],
      ['Gender', patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : 'N/A'],
      ['Height', patient.height ? `${patient.height} cm` : 'N/A'],
      ['Weight', patient.weight ? `${patient.weight} kg` : 'N/A'],
      ['Blood Group', patient.bloodGroup || 'N/A']
    ];

    // Calculate BMI if height and weight are available
    if (patient.height && patient.weight) {
      const heightInMeters = patient.height / 100;
      const bmi = (patient.weight / (heightInMeters * heightInMeters)).toFixed(1);
      patientDetails.push(['BMI', bmi]);
    }

    // Draw patient details table
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    patientDetails.forEach(([label, value]) => {
      checkNewPage(15);
      
      doc.setFont('helvetica', 'bold');
      doc.text(label + ':', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 80, yPosition);
      yPosition += 6;
    });

    yPosition += 10;

    // Allergies Section
    if (patient.allergies && patient.allergies.length > 0) {
      checkNewPage(20);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Allergies', 20, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      patient.allergies.forEach(allergy => {
        checkNewPage(8);
        doc.text('• ' + allergy, 25, yPosition);
        yPosition += 5;
      });
      yPosition += 5;
    }

    // Medical Issues Section
    if (patient.medicalIssues && patient.medicalIssues.length > 0) {
      checkNewPage(20);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Medical Issues', 20, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      patient.medicalIssues.forEach(issue => {
        checkNewPage(8);
        doc.text('• ' + issue, 25, yPosition);
        yPosition += 5;
      });
      yPosition += 10;
    }

    // Medical History Section
    if (medicalRecords && medicalRecords.length > 0) {
      checkNewPage(30);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Medical History', 20, yPosition);
      yPosition += 10;

      medicalRecords.forEach((record, index) => {
        checkNewPage(50);
        
        // Record header
        doc.setFillColor(240, 248, 255);
        doc.rect(15, yPosition - 5, pageWidth - 30, 8, 'F');
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Visit ${index + 1}`, 20, yPosition);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(new Date(record.visitDate).toLocaleDateString(), pageWidth - 60, yPosition);
        yPosition += 8;

        // Record details
        const recordDetails = [
          ['Doctor', record.doctorName],
          ['Specialty', record.doctorSpecialty || 'N/A'],
          ['Diagnosis', record.diagnosis]
        ];

        recordDetails.forEach(([label, value]) => {
          checkNewPage(8);
          doc.setFont('helvetica', 'bold');
          doc.text(label + ':', 20, yPosition);
          doc.setFont('helvetica', 'normal');
          yPosition = addText(value, 50, yPosition, pageWidth - 60);
          yPosition += 2;
        });

        // Symptoms
        if (record.symptoms && record.symptoms.length > 0) {
          checkNewPage(10);
          doc.setFont('helvetica', 'bold');
          doc.text('Symptoms:', 20, yPosition);
          yPosition += 5;
          doc.setFont('helvetica', 'normal');
          record.symptoms.forEach(symptom => {
            checkNewPage(6);
            doc.text('• ' + symptom, 25, yPosition);
            yPosition += 4;
          });
        }

        // Treatment
        if (record.treatment) {
          checkNewPage(10);
          doc.setFont('helvetica', 'bold');
          doc.text('Treatment:', 20, yPosition);
          yPosition += 5;
          doc.setFont('helvetica', 'normal');
          yPosition = addText(record.treatment, 20, yPosition, pageWidth - 40);
          yPosition += 5;
        }

        // Medications
        if (record.medications && record.medications.length > 0) {
          checkNewPage(15);
          doc.setFont('helvetica', 'bold');
          doc.text('Medications:', 20, yPosition);
          yPosition += 5;
          doc.setFont('helvetica', 'normal');
          record.medications.forEach(med => {
            checkNewPage(8);
            const medText = `${med.name}${med.dosage ? ' - ' + med.dosage : ''}${med.frequency ? ' (' + med.frequency + ')' : ''}`;
            doc.text('• ' + medText, 25, yPosition);
            yPosition += 4;
          });
        }

        // Vital Signs
        if (record.vitalSigns) {
          checkNewPage(15);
          doc.setFont('helvetica', 'bold');
          doc.text('Vital Signs:', 20, yPosition);
          yPosition += 5;
          doc.setFont('helvetica', 'normal');
          
          const vitalSigns = [];
          if (record.vitalSigns.bloodPressure) {
            vitalSigns.push(`BP: ${record.vitalSigns.bloodPressure.systolic}/${record.vitalSigns.bloodPressure.diastolic} mmHg`);
          }
          if (record.vitalSigns.heartRate) {
            vitalSigns.push(`HR: ${record.vitalSigns.heartRate} bpm`);
          }
          if (record.vitalSigns.temperature) {
            vitalSigns.push(`Temp: ${record.vitalSigns.temperature}°F`);
          }
          if (record.vitalSigns.weight) {
            vitalSigns.push(`Weight: ${record.vitalSigns.weight} kg`);
          }
          if (record.vitalSigns.height) {
            vitalSigns.push(`Height: ${record.vitalSigns.height} cm`);
          }

          vitalSigns.forEach(vital => {
            checkNewPage(6);
            doc.text('• ' + vital, 25, yPosition);
            yPosition += 4;
          });
        }

        // Notes
        if (record.notes) {
          checkNewPage(10);
          doc.setFont('helvetica', 'bold');
          doc.text('Notes:', 20, yPosition);
          yPosition += 5;
          doc.setFont('helvetica', 'normal');
          yPosition = addText(record.notes, 20, yPosition, pageWidth - 40);
          yPosition += 5;
        }

        yPosition += 10;
      });
    } else {
      checkNewPage(20);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Medical History', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('No medical records found.', 20, yPosition);
    }

    // Add certification page
    doc.addPage();
    yPosition = 20;
    
    // Certification Header
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, pageWidth, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFICATION & AUTHENTICATION', pageWidth/2 - 60, 15);
    
    yPosition = 40;
    doc.setTextColor(0, 0, 0);
    
    // Certification content
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Aayuniq Health Portal Certification', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const certificationText = [
      'This health report has been generated by the Aayuniq Health Portal system,',
      'a certified healthcare management platform that ensures data integrity,',
      'security, and compliance with healthcare standards.',
      '',
      'Report Authentication:',
      `• Report ID: AHP-${Date.now()}`,
      `• Patient ID: ${patient.patientId}`,
      `• Generated Date: ${new Date().toLocaleString()}`,
      `• System Version: 1.0.0`,
      '',
      'This report contains confidential medical information and is intended',
      'for authorized healthcare providers and the patient only.',
      '',
      'Aayuniq Health Portal is committed to maintaining the highest standards',
      'of data security and patient privacy in accordance with healthcare',
      'regulations and best practices.'
    ];
    
    certificationText.forEach(line => {
      if (line === '') {
        yPosition += 5;
      } else {
        doc.text(line, 20, yPosition);
        yPosition += 6;
      }
    });
    
    // Digital signature area
    yPosition += 20;
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPosition, pageWidth - 40, 40, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Digital Signature & Seal', 30, yPosition + 10);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Aayuniq Health Portal System', 30, yPosition + 20);
    doc.text('Certified Healthcare Management Platform', 30, yPosition + 28);
    doc.text('Generated Electronically - No Physical Signature Required', 30, yPosition + 36);
    
    // Footer
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
      doc.text('Aayuniq Health Portal - Certified Health Report', 20, pageHeight - 10);
    }

    const pdfBuffer = doc.output('arraybuffer');
    console.log('PDF generated successfully, size:', pdfBuffer.byteLength);
    
    // Convert ArrayBuffer to Buffer for proper handling
    const buffer = Buffer.from(pdfBuffer);
    console.log('PDF buffer created, size:', buffer.length);
    return buffer;

  } catch (error) {
    console.error('PDF generation error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      patientId: patient?.patientId
    });
    throw new Error(`Failed to generate health report PDF: ${error.message}`);
  }
};

module.exports = {
  generateHealthReportPDF
};
