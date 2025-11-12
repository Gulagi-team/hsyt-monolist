import React from 'react';
import type { MedicalRecord, UserProfile } from '../types';

interface PDFReportTemplateProps {
  record: MedicalRecord;
  userProfile?: UserProfile | null;
  includeOriginalImage?: boolean;
}

const formatAnalysisForPDF = (text: string) => {
  let html = text;

  // Remove special highlighting for PDF (keep content but remove styling)
  html = html.replace(/~([^~]+)~/g, '<span style="background-color: #fee2e2; color: #991b1b; font-weight: 600; padding: 2px 6px; border-radius: 4px;">$1</span>');
  
  // Tables with PDF-friendly styling
  html = html.replace(
    /^\|(.+)\|\s*\n\|( *:?-+:? *\|)+\s*\n((?:\|.*\|\s*\n?)*)/gm,
    (match, headerLine, separatorLine, bodyLines) => {
      const headers = headerLine.split('|').map(h => h.trim()).filter(Boolean);
      const rows = bodyLines.split('\n').filter(r => r.trim());

      let tableHtml = '<div style="margin: 16px 0; border: 1px solid #d1d5db; border-radius: 8px; overflow: hidden;"><table style="width: 100%; border-collapse: collapse; font-size: 14px;"><thead><tr style="background-color: #f3f4f6;">';
      headers.forEach(header => {
        tableHtml += `<th style="padding: 12px; text-align: left; font-weight: 600; border-bottom: 1px solid #d1d5db;">${header}</th>`;
      });
      tableHtml += '</tr></thead><tbody>';

      rows.forEach((rowLine, index) => {
        const cells = rowLine.split('|').slice(1, -1).map(c => c.trim());
        if (cells.length > 0) {
          const bgColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
          tableHtml += `<tr style="background-color: ${bgColor};">`;
          cells.forEach(cell => {
            tableHtml += `<td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${cell}</td>`;
          });
          tableHtml += '</tr>';
        }
      });

      tableHtml += '</tbody></table></div>';
      return tableHtml;
    }
  );

  // PDF-friendly markdown formatting
  html = html
    .replace(/^#### (.*$)/gim, '<h4 style="font-size: 16px; font-weight: 600; margin: 16px 0 8px 0; color: #374151;">$1</h4>')
    .replace(/^### (.*$)/gim, '<h3 style="font-size: 18px; font-weight: 700; margin: 20px 0 12px 0; color: #111827;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="font-size: 20px; font-weight: 700; margin: 24px 0 16px 0; color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="font-size: 24px; font-weight: 700; margin: 24px 0 20px 0; color: #111827;">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600;">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background-color: #f3f4f6; border-radius: 4px; padding: 2px 4px; font-size: 13px; font-family: monospace;">$1</code>')
    .replace(/^- (.*)/gm, '<li style="margin-left: 20px; list-style-type: disc; margin-bottom: 4px;">$1</li>')
    .replace(/(<\/li>\n<li>)/g, '</li><li>')
    .replace(/((<li>.*<\/li>)+)/g, '<ul style="margin: 12px 0; padding-left: 0;">$1</ul>')
    .replace(/\n/g, '<br />')
    .replace(/<br \/><ul>/g, '<ul>')
    .replace(/<\/ul><br \/>/g, '</ul>')
    .replace(/<\/div><br \/>/g, '</div>')
    .replace(/<\/table><br \/>/g, '</table>');
  
  return html;
};

const PDFReportTemplate: React.FC<PDFReportTemplateProps> = ({ 
  record, 
  userProfile, 
  includeOriginalImage = false 
}) => {
  const currentDate = new Date().toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const recordDate = new Date(record.createdAt).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div 
      style={{
        fontFamily: 'Arial, sans-serif',
        lineHeight: '1.6',
        color: '#111827',
        backgroundColor: '#ffffff',
        padding: '40px',
        maxWidth: '800px',
        margin: '0 auto'
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '3px solid #3b82f6', paddingBottom: '20px' }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '700', 
          color: '#1e40af', 
          margin: '0 0 10px 0' 
        }}>
          BÁO CÁO PHÂN TÍCH Y TẾ
        </h1>
        <p style={{ 
          fontSize: '16px', 
          color: '#6b7280', 
          margin: '0',
          fontWeight: '500'
        }}>
          {record.type === 'lab_result' ? 'Kết quả Xét nghiệm' : 'Phân tích Đơn thuốc'}
        </p>
      </div>

      {/* Patient Information */}
      {userProfile && (
        <div style={{ 
          backgroundColor: '#f8fafc', 
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '30px',
          border: '1px solid #e2e8f0'
        }}>
          
          {userProfile.currentConditions && (
            <div style={{ marginTop: '15px' }}>
              <strong>Tình trạng hiện tại:</strong> {userProfile.currentConditions}
            </div>
          )}
        </div>
      )}

      {/* Record Information */}
      <div style={{ 
        backgroundColor: '#fefefe', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '30px',
        border: '1px solid #d1d5db'
      }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: '#1e40af', 
          margin: '0 0 15px 0' 
        }}>
          Thông tin Hồ sơ
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <strong>Tên hồ sơ:</strong> {record.recordName}
          </div>
          <div>
            <strong>Loại:</strong> {record.type === 'lab_result' ? 'Kết quả xét nghiệm' : 'Đơn thuốc'}
          </div>
          <div>
            <strong>Ngày tạo hồ sơ:</strong> {recordDate}
          </div>
          <div>
            <strong>Ngày tạo báo cáo:</strong> {currentDate}
          </div>
        </div>
      </div>

      {/* Analysis Content */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: '700', 
          color: '#1e40af', 
          margin: '0 0 20px 0',
          borderBottom: '2px solid #3b82f6',
          paddingBottom: '10px'
        }}>
          Kết quả Phân tích
        </h2>
        <div 
          style={{ 
            fontSize: '14px', 
            lineHeight: '1.7',
            color: '#374151'
          }}
          dangerouslySetInnerHTML={{ __html: formatAnalysisForPDF(record.analysis) }}
        />
      </div>

      {/* Original Image */}
      {includeOriginalImage && record.fileUrl && (
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#1e40af', 
            margin: '0 0 15px 0' 
          }}>
            Tài liệu Gốc
          </h2>
          <div style={{ 
            textAlign: 'center', 
            padding: '20px', 
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <img
              src={record.fileUrl}
              alt={record.recordName}
              style={{ 
                maxWidth: '100%', 
                height: 'auto', 
                borderRadius: '4px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ 
        marginTop: '40px', 
        paddingTop: '20px', 
        borderTop: '1px solid #e5e7eb',
        textAlign: 'center',
        fontSize: '12px',
        color: '#6b7280'
      }}>
        <p style={{ margin: '0 0 5px 0' }}>
          Báo cáo được tạo bởi Hệ thống Quản lý Hồ sơ Y tế
        </p>
        <p style={{ margin: '0' }}>
          Ngày tạo: {currentDate}
        </p>
        <div style={{ marginTop: '15px', fontSize: '11px', fontStyle: 'italic' }}>
          <p style={{ margin: '0' }}>
            ⚠️ Lưu ý: Báo cáo này được tạo tự động bằng AI và chỉ mang tính chất tham khảo.
          </p>
          <p style={{ margin: '5px 0 0 0' }}>
            Vui lòng tham khảo ý kiến bác sĩ chuyên khoa để có chẩn đoán chính xác.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PDFReportTemplate;
