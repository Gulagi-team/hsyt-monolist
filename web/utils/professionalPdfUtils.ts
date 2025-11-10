import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { ProfessionalMedicalReport, StructuredLabReport, StructuredPrescriptionReport } from '../types/reportTypes';
import { formatDateTime, formatDate } from './dateUtils';

// Configure jsPDF for Vietnamese support
const configureJsPDF = (pdf: jsPDF) => {
  // Add Vietnamese font support if available
  try {
    pdf.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
    pdf.setFont('NotoSans');
  } catch {
    // Fallback to default font
    pdf.setFont('helvetica');
  }
};

export const generateProfessionalMedicalReportPDF = async (
  report: ProfessionalMedicalReport,
  includeCharts: boolean = false
): Promise<void> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  configureJsPDF(pdf);
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let currentY = margin;

  // Helper function to add new page if needed
  const checkPageBreak = (requiredHeight: number) => {
    if (currentY + requiredHeight > pageHeight - margin) {
      pdf.addPage();
      currentY = margin;
      return true;
    }
    return false;
  };

  // Helper function to add text with word wrap
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, x, y);
    return y + (lines.length * fontSize * 0.35);
  };

  // Header
  pdf.setFillColor(41, 128, 185);
  pdf.rect(0, 0, pageWidth, 40, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('BÁO CÁO Y TẾ CHUYÊN NGHIỆP', pageWidth / 2, 20, { align: 'center' });
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  const reportTypeText = report.report.reportType === 'LAB_RESULT' ? 'KẾT QUẢ XÉT NGHIỆM' : 'PHÂN TÍCH TOA THUỐC';
  pdf.text(reportTypeText, pageWidth / 2, 30, { align: 'center' });

  currentY = 50;
  pdf.setTextColor(0, 0, 0);

  // Report metadata
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Mã báo cáo: ${report.metadata.reportId}`, margin, currentY);
  pdf.text(`Ngày tạo: ${formatDateTime(report.metadata.generatedAt)}`, pageWidth - margin - 60, currentY);
  currentY += 15;

  // Add separator line
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;

  if (report.report.reportType === 'LAB_RESULT') {
    await generateLabReportPDF(pdf, report.report as StructuredLabReport, margin, contentWidth, currentY, checkPageBreak, addWrappedText);
  } else {
    await generatePrescriptionReportPDF(pdf, report.report as StructuredPrescriptionReport, margin, contentWidth, currentY, checkPageBreak, addWrappedText);
  }

  // Footer
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(`Trang ${i}/${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    pdf.text(`Được tạo bởi ${report.metadata.generatedBy}`, margin, pageHeight - 10);
  }

  // Save the PDF
  const fileName = `BaoCaoYTe_${report.metadata.reportId}_${formatDate(new Date()).replace(/\//g, '-')}.pdf`;
  pdf.save(fileName);
};

const generateLabReportPDF = async (
  pdf: jsPDF,
  labReport: StructuredLabReport,
  margin: number,
  contentWidth: number,
  startY: number,
  checkPageBreak: (height: number) => boolean,
  addWrappedText: (text: string, x: number, y: number, maxWidth: number, fontSize?: number) => number
) => {
  let currentY = startY;

  // Test Information
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('THÔNG TIN XÉT NGHIỆM', margin, currentY);
  currentY += 10;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  currentY = addWrappedText(`Tên xét nghiệm: ${labReport.testInfo.testName}`, margin, currentY, contentWidth);
  currentY = addWrappedText(`Ngày xét nghiệm: ${labReport.testInfo.testDate || 'Không xác định'}`, margin, currentY, contentWidth);
  currentY = addWrappedText(`Loại mẫu: ${labReport.testInfo.sampleType || 'Không xác định'}`, margin, currentY, contentWidth);
  currentY += 10;

  // Patient Information (if available)
  if (labReport.patientInfo.name || labReport.patientInfo.age) {
    checkPageBreak(30);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('THÔNG TIN BỆNH NHÂN', margin, currentY);
    currentY += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    if (labReport.patientInfo.name) {
      currentY = addWrappedText(`Họ tên: ${labReport.patientInfo.name}`, margin, currentY, contentWidth);
    }
    if (labReport.patientInfo.age) {
      currentY = addWrappedText(`Tuổi: ${labReport.patientInfo.age}`, margin, currentY, contentWidth);
    }
    currentY += 10;
  }

  // Test Results Table
  checkPageBreak(50);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('KẾT QUẢ XÉT NGHIỆM', margin, currentY);
  currentY += 15;

  // Table headers
  const colWidths = [50, 30, 20, 40, 30];
  const colPositions = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], 
                       margin + colWidths[0] + colWidths[1] + colWidths[2], 
                       margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3]];

  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, currentY - 5, contentWidth, 10, 'F');
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Chỉ số', colPositions[0] + 2, currentY);
  pdf.text('Kết quả', colPositions[1] + 2, currentY);
  pdf.text('Đơn vị', colPositions[2] + 2, currentY);
  pdf.text('Tham chiếu', colPositions[3] + 2, currentY);
  pdf.text('Trạng thái', colPositions[4] + 2, currentY);
  currentY += 10;

  // Table rows
  pdf.setFont('helvetica', 'normal');
  labReport.results.forEach((result, index) => {
    checkPageBreak(15);
    
    const rowY = currentY;
    pdf.text(result.parameter, colPositions[0] + 2, rowY);
    pdf.text(result.value, colPositions[1] + 2, rowY);
    pdf.text(result.unit, colPositions[2] + 2, rowY);
    pdf.text(result.referenceRange, colPositions[3] + 2, rowY);
    
    const statusText = result.status === 'NORMAL' ? 'Bình thường' :
                      result.status === 'HIGH' ? 'Cao' :
                      result.status === 'LOW' ? 'Thấp' : 'Nguy hiểm';
    pdf.text(statusText, colPositions[4] + 2, rowY);
    
    // Add row separator
    pdf.setDrawColor(220, 220, 220);
    pdf.line(margin, currentY + 5, margin + contentWidth, currentY + 5);
    currentY += 10;
  });

  currentY += 10;

  // Interpretation
  checkPageBreak(40);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DIỄN GIẢI KẾT QUẢ', margin, currentY);
  currentY += 15;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  currentY = addWrappedText(`Tóm tắt: ${labReport.interpretation.summary}`, margin, currentY, contentWidth);
  currentY += 5;
  currentY = addWrappedText(`Ý nghĩa lâm sàng: ${labReport.interpretation.clinicalSignificance}`, margin, currentY, contentWidth);
  currentY += 10;

  // Recommendations
  if (labReport.interpretation.recommendations.length > 0) {
    checkPageBreak(30);
    pdf.setFont('helvetica', 'bold');
    pdf.text('KHUYẾN NGHỊ:', margin, currentY);
    currentY += 8;
    
    pdf.setFont('helvetica', 'normal');
    labReport.interpretation.recommendations.forEach((recommendation, index) => {
      currentY = addWrappedText(`• ${recommendation}`, margin + 5, currentY, contentWidth - 5);
      currentY += 2;
    });
  }

  // Follow-up
  if (labReport.followUp.nextSteps.length > 0) {
    checkPageBreak(30);
    currentY += 10;
    pdf.setFont('helvetica', 'bold');
    pdf.text('CÁC BƯỚC TIẾP THEO:', margin, currentY);
    currentY += 8;
    
    pdf.setFont('helvetica', 'normal');
    labReport.followUp.nextSteps.forEach((step) => {
      currentY = addWrappedText(`• ${step}`, margin + 5, currentY, contentWidth - 5);
      currentY += 2;
    });
  }

  // Disclaimer
  checkPageBreak(20);
  currentY += 15;
  pdf.setFillColor(255, 248, 220);
  pdf.rect(margin, currentY - 5, contentWidth, 20, 'F');
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'italic');
  currentY = addWrappedText(labReport.disclaimer, margin + 5, currentY, contentWidth - 10, 9);
};

const generatePrescriptionReportPDF = async (
  pdf: jsPDF,
  prescriptionReport: StructuredPrescriptionReport,
  margin: number,
  contentWidth: number,
  startY: number,
  checkPageBreak: (height: number) => boolean,
  addWrappedText: (text: string, x: number, y: number, maxWidth: number, fontSize?: number) => number
) => {
  let currentY = startY;

  // Prescription Information
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('THÔNG TIN TOA THUỐC', margin, currentY);
  currentY += 10;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  currentY = addWrappedText(`Ngày kê đơn: ${prescriptionReport.prescriptionInfo.prescriptionDate || 'Không xác định'}`, margin, currentY, contentWidth);
  currentY = addWrappedText(`Bác sĩ kê đơn: ${prescriptionReport.prescriptionInfo.prescribingPhysician || 'Không xác định'}`, margin, currentY, contentWidth);
  currentY = addWrappedText(`Phòng khám: ${prescriptionReport.prescriptionInfo.clinicName || 'Không xác định'}`, margin, currentY, contentWidth);
  if (prescriptionReport.prescriptionInfo.diagnosis) {
    currentY = addWrappedText(`Chẩn đoán: ${prescriptionReport.prescriptionInfo.diagnosis}`, margin, currentY, contentWidth);
  }
  currentY += 10;

  // Patient Information (if available)
  if (prescriptionReport.patientInfo.name || prescriptionReport.patientInfo.age) {
    checkPageBreak(30);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('THÔNG TIN BỆNH NHÂN', margin, currentY);
    currentY += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    if (prescriptionReport.patientInfo.name) {
      currentY = addWrappedText(`Họ tên: ${prescriptionReport.patientInfo.name}`, margin, currentY, contentWidth);
    }
    if (prescriptionReport.patientInfo.age) {
      currentY = addWrappedText(`Tuổi: ${prescriptionReport.patientInfo.age}`, margin, currentY, contentWidth);
    }
    currentY += 10;
  }

  // Medications
  checkPageBreak(40);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DANH SÁCH THUỐC', margin, currentY);
  currentY += 15;

  prescriptionReport.medications.forEach((medication, index) => {
    checkPageBreak(40);
    
    // Medication header
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, currentY - 5, contentWidth, 8, 'F');
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${index + 1}. ${medication.name}`, margin + 2, currentY);
    currentY += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    if (medication.genericName) {
      currentY = addWrappedText(`Hoạt chất: ${medication.genericName}`, margin + 5, currentY, contentWidth - 5);
    }
    currentY = addWrappedText(`Liều lượng: ${medication.dosage}`, margin + 5, currentY, contentWidth - 5);
    currentY = addWrappedText(`Tần suất: ${medication.frequency}`, margin + 5, currentY, contentWidth - 5);
    if (medication.duration) {
      currentY = addWrappedText(`Thời gian: ${medication.duration}`, margin + 5, currentY, contentWidth - 5);
    }
    currentY = addWrappedText(`Hướng dẫn: ${medication.instructions}`, margin + 5, currentY, contentWidth - 5);
    currentY += 8;
  });

  // General Instructions
  checkPageBreak(40);
  currentY += 10;
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('HƯỚNG DẪN CHUNG', margin, currentY);
  currentY += 15;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Hướng dẫn liều lượng:', margin, currentY);
  currentY += 8;
  pdf.setFont('helvetica', 'normal');
  prescriptionReport.generalInstructions.dosageInstructions.forEach((instruction) => {
    currentY = addWrappedText(`• ${instruction}`, margin + 5, currentY, contentWidth - 5);
    currentY += 2;
  });

  currentY += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Bảo quản thuốc:', margin, currentY);
  currentY += 8;
  pdf.setFont('helvetica', 'normal');
  prescriptionReport.generalInstructions.storageInstructions.forEach((instruction) => {
    currentY = addWrappedText(`• ${instruction}`, margin + 5, currentY, contentWidth - 5);
    currentY += 2;
  });

  // Disclaimer
  checkPageBreak(20);
  currentY += 15;
  pdf.setFillColor(255, 248, 220);
  pdf.rect(margin, currentY - 5, contentWidth, 20, 'F');
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'italic');
  currentY = addWrappedText(prescriptionReport.disclaimer, margin + 5, currentY, contentWidth - 10, 9);
};

export const generateReportFromElement = async (
  elementId: string,
  fileName: string
): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with ID ${elementId} not found`);
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth - 20; // 10mm margin on each side
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10; // 10mm top margin

    // Add first page
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight - 20; // Account for margins

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight + 10;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight - 20;
    }

    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
};
