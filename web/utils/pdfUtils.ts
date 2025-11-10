import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import React from 'react';
import { createRoot } from 'react-dom/client';
import type { MedicalRecord, UserProfile } from '../types';
import StructuredPDFTemplate from '../components/StructuredPDFTemplate';

/**
 * Generates a PDF report from a medical record analysis
 * @param element - The HTML element to capture
 * @param record - The medical record data
 * @param userProfile - The user profile data
 * @param filename - Optional filename for the PDF
 */
export async function generateMedicalReportPDF(
  element: HTMLElement,
  record: MedicalRecord,
  userProfile?: UserProfile | null,
  filename?: string
): Promise<void> {
  try {
    // Create canvas from HTML element with high quality settings
    const canvas = await html2canvas(element, {
      useCORS: true,
      scale: 2, // Higher scale for better quality
      logging: false,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: element.scrollWidth,
      height: element.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    
    // Create PDF with A4 size
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    // Calculate dimensions to fit A4 page
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const availableWidth = pageWidth - (2 * margin);
    const availableHeight = pageHeight - (2 * margin);

    // Calculate image dimensions maintaining aspect ratio
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(availableWidth / (imgWidth * 0.264583), availableHeight / (imgHeight * 0.264583));
    
    const scaledWidth = imgWidth * 0.264583 * ratio;
    const scaledHeight = imgHeight * 0.264583 * ratio;

    // Center the image on the page
    const x = (pageWidth - scaledWidth) / 2;
    const y = margin;

    // Add the image to PDF
    pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);

    // Add metadata
    pdf.setProperties({
      title: `Báo cáo Phân tích Y tế - ${record.recordName}`,
      subject: `Kết quả phân tích ${record.type === 'lab_result' ? 'xét nghiệm' : 'đơn thuốc'}`,
      author: userProfile?.name || 'Hệ thống Y tế',
      creator: 'Medical Profile System',
      keywords: 'medical, analysis, report, healthcare'
    });

    // Generate filename if not provided
    const defaultFilename = `bao-cao-${record.type}-${record.recordName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
    const finalFilename = filename || defaultFilename;

    // Save the PDF
    pdf.save(finalFilename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

/**
 * Generates a comprehensive PDF report with multiple pages if needed
 * @param element - The HTML element to capture
 * @param record - The medical record data
 * @param userProfile - The user profile data
 * @param filename - Optional filename for the PDF
 */
export async function generateComprehensiveMedicalPDF(
  element: HTMLElement,
  record: MedicalRecord,
  userProfile?: UserProfile | null,
  filename?: string
): Promise<void> {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;

    // Add header with user info and date
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('BÁO CÁO Y TẾ CHI TIẾT VỚI GỢI Ý CHẨN ĐOÁN', pageWidth / 2, margin + 10, { align: 'center' });

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    const currentDate = new Date().toLocaleDateString('vi-VN');
    pdf.text(`Ngày tạo: ${currentDate}`, margin, margin + 25);
    
    if (userProfile) {
      pdf.text(`Bệnh nhân: ${userProfile.name}`, margin, margin + 35);
      pdf.text(`Tuổi: ${userProfile.age}`, margin, margin + 45);
      pdf.text(`Nhóm máu: ${userProfile.bloodType}`, margin, margin + 55);
    }

    // Add record information
    pdf.setFont('helvetica', 'bold');
    pdf.text('THÔNG TIN HỒ SƠ:', margin, margin + 70);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Tên hồ sơ: ${record.recordName}`, margin, margin + 80);
    pdf.text(`Loại: ${record.type === 'lab_result' ? 'Kết quả xét nghiệm' : 'Đơn thuốc'}`, margin, margin + 90);
    pdf.text(`Ngày tạo: ${new Date(record.createdAt).toLocaleDateString('vi-VN')}`, margin, margin + 100);

    // Capture the analysis content
    const canvas = await html2canvas(element, {
      useCORS: true,
      scale: 1.5,
      logging: false,
      allowTaint: true,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png', 0.9);
    
    // Calculate available space for the analysis content
    const availableWidth = pageWidth - (2 * margin);
    const startY = margin + 120;
    const availableHeight = pageHeight - startY - margin;

    // Calculate image dimensions
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(availableWidth / (imgWidth * 0.264583), availableHeight / (imgHeight * 0.264583));
    
    const scaledWidth = imgWidth * 0.264583 * ratio;
    const scaledHeight = imgHeight * 0.264583 * ratio;

    // Check if we need multiple pages
    if (scaledHeight > availableHeight) {
      // Add new page for analysis content
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, margin, scaledWidth, scaledHeight);
    } else {
      pdf.addImage(imgData, 'PNG', margin, startY, scaledWidth, scaledHeight);
    }

    // Add metadata
    pdf.setProperties({
      title: `Báo cáo Chi tiết với Gợi ý Chẩn đoán - ${record.recordName}`,
      subject: `Phân tích y tế chi tiết với gợi ý chẩn đoán - ${record.type === 'lab_result' ? 'xét nghiệm' : 'đơn thuốc'}`,
      author: userProfile?.name || 'Hệ thống Y tế',
      creator: 'Medical Profile System',
      keywords: 'medical, analysis, report, healthcare, comprehensive, diagnostic suggestions'
    });

    // Generate filename
    const defaultFilename = `bao-cao-chi-tiet-goi-y-chan-doan-${record.recordName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
    const finalFilename = filename || defaultFilename;

    pdf.save(finalFilename);
  } catch (error) {
    console.error('Error generating comprehensive PDF:', error);
    throw new Error('Không thể tạo báo cáo PDF chi tiết. Vui lòng thử lại.');
  }
}

/**
 * Utility function to format Vietnamese text for PDF
 * @param text - The text to format
 * @returns Formatted text suitable for PDF
 */
export function formatVietnameseText(text: string): string {
  return text
    .replace(/\u00A0/g, ' ') // Replace non-breaking spaces
    .replace(/\u2013/g, '-') // Replace en-dash
    .replace(/\u2014/g, '--') // Replace em-dash
    .replace(/\u201C/g, '"') // Replace left double quotation mark
    .replace(/\u201D/g, '"') // Replace right double quotation mark
    .replace(/\u2018/g, "'") // Replace left single quotation mark
    .replace(/\u2019/g, "'"); // Replace right single quotation mark
}

/**
 * Creates a loading state for PDF generation
 * @returns Promise that resolves after a short delay to show loading state
 */
export function showPDFGenerationLoading(): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, 100);
  });
}

/**
 * Generates a structured PDF report with professional layout
 * @param record - The medical record data
 * @param userProfile - The user profile data
 * @param filename - Optional filename for the PDF
 */
export async function generateStructuredPDF(
  record: MedicalRecord,
  userProfile?: UserProfile | null,
  filename?: string
): Promise<void> {
  try {
    // Check if record has structured data
    if (!hasStructuredData(record)) {
      throw new Error('Không có dữ liệu có cấu trúc để tạo PDF');
    }

    // Create a temporary container for rendering
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '210mm'; // A4 width
    tempContainer.style.backgroundColor = 'white';
    tempContainer.style.padding = '20px';
    document.body.appendChild(tempContainer);

    // Create React root and render the structured template
    const root = createRoot(tempContainer);
    
    // Render the component and wait for it to complete
    await new Promise<void>((resolve) => {
      root.render(
        React.createElement(StructuredPDFTemplate, {
          record,
          userProfile,
        })
      );
      
      // Wait for rendering to complete
      setTimeout(resolve, 2000);
    });

    // Capture the rendered content with high quality
    const canvas = await html2canvas(tempContainer, {
      useCORS: true,
      scale: 2,
      logging: false,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: tempContainer.scrollWidth,
      height: tempContainer.scrollHeight,
    });

    // Clean up the temporary container
    root.unmount();
    document.body.removeChild(tempContainer);

    const imgData = canvas.toDataURL('image/png', 1.0);
    
    // Create PDF with A4 size
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    // Calculate dimensions for multiple pages if needed
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const availableWidth = pageWidth - (2 * margin);
    const availableHeight = pageHeight - (2 * margin);

    // Calculate image dimensions
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = availableWidth / (imgWidth * 0.264583); // Convert px to mm
    
    const scaledWidth = availableWidth;
    const scaledHeight = (imgHeight * 0.264583) * ratio;

    // Add pages as needed
    let yPosition = 0;
    let pageNumber = 1;

    while (yPosition < scaledHeight) {
      if (pageNumber > 1) {
        pdf.addPage();
      }

      // Calculate the portion of image to show on this page
      const remainingHeight = scaledHeight - yPosition;
      const pageContentHeight = Math.min(availableHeight, remainingHeight);
      
      // Calculate source coordinates for cropping
      const srcY = (yPosition / ratio) / 0.264583;
      const srcHeight = (pageContentHeight / ratio) / 0.264583;

      // Create a cropped canvas for this page
      const pageCanvas = document.createElement('canvas');
      const pageCtx = pageCanvas.getContext('2d');
      
      pageCanvas.width = imgWidth;
      pageCanvas.height = srcHeight;
      
      if (pageCtx) {
        pageCtx.drawImage(canvas, 0, srcY, imgWidth, srcHeight, 0, 0, imgWidth, srcHeight);
        const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
        
        pdf.addImage(pageImgData, 'PNG', margin, margin, scaledWidth, pageContentHeight);
      }

      yPosition += availableHeight;
      pageNumber++;
    }

    // Add metadata
    pdf.setProperties({
      title: `Báo cáo Y tế Có cấu trúc - ${record.recordName}`,
      subject: `Báo cáo phân tích y tế với gợi ý chẩn đoán - ${record.type === 'lab_result' ? 'xét nghiệm' : 'đơn thuốc'}`,
      author: userProfile?.name || 'Hệ thống Hồ Sơ Y Tế ',
      creator: 'Hồ Sơ Y Tế ',
      keywords: 'medical, analysis, report, healthcare, structured, diagnostic suggestions'
    });

    // Generate filename
    const defaultFilename = `bao-cao-co-cau-truc-goi-y-chan-doan-${record.recordName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Save the PDF
    pdf.save(filename || defaultFilename);
    
  } catch (error) {
    console.error('Error generating structured PDF:', error);
    throw error;
  }
}

/**
 * Check if a record has structured data for PDF generation
 */
export function hasStructuredData(record: MedicalRecord): boolean {
  try {
    const parsedAnalysis = JSON.parse(record.analysis);
    return parsedAnalysis.metadata && parsedAnalysis.report;
  } catch (error) {
    return false;
  }
}
