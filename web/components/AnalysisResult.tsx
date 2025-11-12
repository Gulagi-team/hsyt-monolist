import React, { useRef, useState } from 'react';
import type { MedicalRecord, UserProfile } from '../types';
import { ArrowLeftIcon, DocumentArrowDownIcon } from './icons/Icons';
import { generateMedicalReportPDF, generateComprehensiveMedicalPDF, generateStructuredPDF, hasStructuredData } from '../utils/pdfUtils';
import PDFReportTemplate from './PDFReportTemplate';
import StructuredAnalysisResult from './StructuredAnalysisResult';

interface AnalysisResultProps {
  record: MedicalRecord;
  onBack: () => void;
  userProfile?: UserProfile | null;
}

const formatAnalysisText = (text: string) => {
    let html = text;

    // Highlight potential diseases
    html = html.replace(/~([^~]+)~/g, '<span class="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 font-semibold px-2 py-1 rounded">$1</span>');
    
    // Tables
    html = html.replace(
        /^\|(.+)\|\s*\n\|( *:?-+:? *\|)+\s*\n((?:\|.*\|\s*\n?)*)/gm,
        (match, headerLine, separatorLine, bodyLines) => {
            const headers = headerLine.split('|').map(h => h.trim()).filter(Boolean);
            const rows = bodyLines.split('\n').filter(r => r.trim());

            let tableHtml = '<div class="overflow-x-auto my-4 rounded-lg border border-gray-200 dark:border-gray-700"><table class="w-full text-sm"><thead><tr class="bg-gray-100 dark:bg-gray-700">';
            headers.forEach(header => {
                tableHtml += `<th class="p-3 text-left font-semibold">${header}</th>`;
            });
            tableHtml += '</tr></thead><tbody>';

            rows.forEach(rowLine => {
                const cells = rowLine.split('|').slice(1, -1).map(c => c.trim());
                if (cells.length > 0) {
                    tableHtml += '<tr class="dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">';
                    cells.forEach(cell => {
                        tableHtml += `<td class="p-3">${cell}</td>`;
                    });
                    tableHtml += '</tr>';
                }
            });

            tableHtml += '</tbody></table></div>';
            return tableHtml;
        }
    );
    
    // Sections for detailed interpretation
    const sections = html.split('###').slice(1);
    if(sections.length > 0 && !html.includes('<table')) { // Avoid re-wrapping if markdown is complex
        // This is a heuristic, may need refinement
    }

    // General markdown
    html = html
        .replace(/^#### (.*$)/gim, '<h4 class="text-md font-semibold mt-4 mb-1">$1</h4>')
        .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-5 mb-2">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3 border-b pb-2 border-gray-200 dark:border-gray-700">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-gray-200 dark:bg-gray-700 rounded px-1 py-0.5 text-sm">$1</code>')
        .replace(/^- (.*)/gm, '<li class="ml-5 list-disc">$1</li>')
        .replace(/(<\/li>\n<li>)/g, '</li><li>')
        .replace(/((<li>.*<\/li>)+)/g, '<ul>$1</ul>')
        .replace(/\n/g, '<br />')
        .replace(/<br \/><ul>/g, '<ul>')
        .replace(/<\/ul><br \/>/g, '</ul>')
        .replace(/<\/div><br \/>/g, '</div>')
        .replace(/<\/table><br \/>/g, '</table>');
    
    return html;
};

const AnalysisResult: React.FC<AnalysisResultProps> = ({ record, onBack, userProfile }) => {
  const analysisRef = useRef<HTMLDivElement>(null);
  const pdfTemplateRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Check if record has structured report
  const hasStructuredReport = () => {
    try {
      const parsedAnalysis = JSON.parse(record.analysis);
      return parsedAnalysis.metadata && parsedAnalysis.report;
    } catch {
      return false;
    }
  };

  // Set default view mode based on whether structured report is available
  const [viewMode, setViewMode] = useState<'structured' | 'legacy'>(
    hasStructuredReport() ? 'structured' : 'legacy'
  );

  const handleQuickPDFExport = async () => {
    if (!analysisRef.current) return;
    
    setIsGeneratingPDF(true);
    try {
      await generateMedicalReportPDF(
        analysisRef.current,
        record,
        userProfile
      );
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Không thể xuất file PDF. Vui lòng thử lại.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleStructuredPDFExport = async () => {
    setIsGeneratingPDF(true);
    try {
      await generateStructuredPDF(
        record,
        userProfile
      );
    } catch (error) {
      console.error('Structured PDF export error:', error);
      alert('Không thể xuất báo cáo PDF có cấu trúc. Vui lòng thử lại.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleComprehensivePDFExport = async () => {
    if (!pdfTemplateRef.current) return;
    
    setIsGeneratingPDF(true);
    try {
      await generateComprehensiveMedicalPDF(
        pdfTemplateRef.current,
        record,
        userProfile
      );
    } catch (error) {
      console.error('Comprehensive PDF export error:', error);
      alert('Không thể xuất báo cáo PDF chi tiết. Vui lòng thử lại.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };
  return (
    <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
            <button 
                onClick={onBack}
                className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
            >
                <ArrowLeftIcon className="w-4 h-4" />
                <span>Quay lại</span>
            </button>
            
            <div className="flex items-center space-x-3">
                {hasStructuredReport() && (
                    <div className="flex items-center space-x-2 mr-4">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Hiển thị:</span>
                        <button
                            onClick={() => setViewMode('structured')}
                            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                                viewMode === 'structured'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            Có cấu trúc
                        </button>
                        <button
                            onClick={() => setViewMode('legacy')}
                            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                                viewMode === 'legacy'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            Văn bản
                        </button>
                    </div>
                )}
                
                {/* <button
                    onClick={handleQuickPDFExport}
                    disabled={isGeneratingPDF}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors text-sm font-medium"
                >
                    <DocumentArrowDownIcon className="w-4 h-4" />
                    <span>{isGeneratingPDF ? 'Đang tạo...' : 'Xuất PDF'}</span>
                </button> */}
                
                {hasStructuredData(record) && (
                    <button
                        onClick={handleStructuredPDFExport}
                        disabled={isGeneratingPDF}
                        className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-md transition-colors text-sm font-medium"
                    >
                        <DocumentArrowDownIcon className="w-4 h-4" />
                        <span>{isGeneratingPDF ? 'Đang tạo...' : 'PDF'}</span>
                    </button>
                )}
                
                {/* <button
                    onClick={handleComprehensivePDFExport}
                    disabled={isGeneratingPDF}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-md transition-colors text-sm font-medium"
                >

                    <span>{isGeneratingPDF ? 'Đang tạo...' : 'Báo cáo Có Gợi ý'}</span>
                </button> */}
            </div>
        </div>

        {/* Conditional Content Rendering */}
        {hasStructuredReport() && viewMode === 'structured' ? (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <div className="xl:col-span-3">
                    <StructuredAnalysisResult record={record} userProfile={userProfile} />
                </div>
                
                <div className="xl:col-span-1">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sticky top-24">
                        <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-200">Tài liệu gốc</h3>
                        <div className="max-h-[70vh] overflow-auto rounded-lg border dark:border-gray-700">
                            <img
                                src={record.fileUrl}
                                alt={record.recordName}
                                className="w-full h-auto object-contain"
                            />
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            <>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Kết quả phân tích</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Hồ sơ: <span className="font-medium">{record.recordName}</span>
                    </p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6" ref={analysisRef}>
                            <div 
                                className="prose prose-blue dark:prose-invert max-w-none prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-white prose-headings:text-gray-900 dark:prose-headings:text-white"
                                dangerouslySetInnerHTML={{ __html: formatAnalysisText(record.analysis) }}
                            />
                        </div>
                    </div>
                    
                    <div className="xl:col-span-1">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sticky top-24">
                            <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-200">Tài liệu gốc</h3>
                            <div className="max-h-[70vh] overflow-auto rounded-lg border dark:border-gray-700">
                                <img
                                    src={record.fileUrl}
                                    alt={record.recordName}
                                    className="w-full h-auto object-contain"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </>
        )}
        
        {/* Hidden PDF Template for comprehensive export */}
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
            <div ref={pdfTemplateRef}>
                <PDFReportTemplate 
                    record={record} 
                    userProfile={userProfile}
                    includeOriginalImage={true}
                />
            </div>
        </div>
    </div>
  );
};

export default AnalysisResult;
