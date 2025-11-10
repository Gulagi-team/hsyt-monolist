import { GoogleGenAI, Chat } from "@google/genai";
import type { MedicalRecord, UserProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedData = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
};

const runAnalysis = async (file: File, prompt: string): Promise<string> => {
    try {
        const model = 'gemini-2.5-flash';
        const imagePart = await fileToGenerativePart(file);
        const textPart = { text: prompt };

        const response = await ai.models.generateContent({
            model,
            contents: { parts: [imagePart, textPart] },
        });

        return response.text;
    } catch (error) {
        console.error("Error during AI analysis:", error);
        if (error instanceof Error) {
            return `Đã xảy ra lỗi trong quá trình phân tích: ${error.message}. Vui lòng thử lại.`;
        }
        return "Đã xảy ra lỗi không xác định trong quá trình phân tích. Vui lòng thử lại.";
    }
}

export const analyzeLabResult = async (file: File, userQuestion?: string): Promise<string> => {
  let prompt = `Bạn là một chuyên gia y tế AI. Phân tích hình ảnh kết quả xét nghiệm này. Trả lời bằng tiếng Việt.
  
  Yêu cầu đầu ra phải ở định dạng Markdown và bao gồm các phần sau:
  
  1.  **Bảng tóm tắt kết quả:** Trích xuất TẤT CẢ các chỉ số, giá trị đo được, đơn vị và khoảng tham chiếu vào một bảng. Thêm một cột "Phân loại" để ghi chú các chỉ số "Cao", "Thấp" hoặc "Bình thường".
  2.  **Diễn giải chi tiết:** Giải thích ý nghĩa của các chỉ số bất thường (Cao hoặc Thấp). Cho biết chúng có thể liên quan đến vấn đề sức khỏe nào.
  3.  **Phán đoán các bệnh có thể gặp:** Dựa trên tổng thể kết quả, đưa ra một kết luận ngắn gọn về các bệnh lý tiềm ẩn. Với mỗi bệnh được đề cập, hãy bọc tên bệnh trong dấu ngã (~), ví dụ: ~Tiểu đường tuýp 2~.
  4.  **Khuyến nghị:** Đưa ra lời khuyên về các bước tiếp theo, chẳng hạn như nên tham khảo ý kiến bác sĩ chuyên khoa nào hoặc cần làm thêm xét nghiệm gì.`;
  
  if (userQuestion && userQuestion.trim()) {
    prompt += `
  
  **CÂU HỎI CỤ THỂ CỦA NGƯỜI DÙNG:** "${userQuestion.trim()}"
  5.  **Trả lời câu hỏi cụ thể:** Dựa trên kết quả xét nghiệm đã phân tích, hãy trả lời trực tiếp và chi tiết câu hỏi của người dùng.`;
  }
  
  prompt += `
  
  QUAN TRỌNG: Luôn nhấn mạnh rằng đây chỉ là phân tích sơ bộ và người dùng PHẢI tham khảo ý kiến bác sĩ chuyên môn để có chẩn đoán chính xác.`;
  return runAnalysis(file, prompt);
};

export const analyzePrescription = async (file: File, userQuestion?: string): Promise<string> => {
    let prompt = `Bạn là một dược sĩ AI. Phân tích hình ảnh toa thuốc này. Trả lời bằng tiếng Việt.

    Yêu cầu đầu ra phải ở định dạng Markdown và bao gồm các phần sau:

    1.  **Danh sách thuốc:** Trích xuất tất cả các loại thuốc trong toa vào một bảng với các cột: Tên thuốc, Liều lượng, Cách dùng (ví dụ: "2 viên/ngày, sau bữa ăn").
    2.  **Chẩn đoán và Mục đích điều trị:** Phân tích và đưa ra chẩn đoán có thể dựa trên tổ hợp thuốc được kê. Giải thích mục đích điều trị chính của toa thuốc này.
    3.  **Tác dụng chính của từng thuốc:** Với mỗi loại thuốc, giải thích chi tiết:
       - Tác dụng chính đối với bệnh được chẩn đoán
       - Cơ chế hoạt động của thuốc
       - Vai trò của thuốc trong phác đồ điều trị tổng thể
    4.  **Công dụng và Lưu ý:** Với mỗi loại thuốc, đưa ra các lưu ý quan trọng khi sử dụng (tác dụng phụ thường gặp, không dùng chung với thuốc nào, thời gian tác dụng).
    5.  **Lưu ý chung:** Cung cấp các lời khuyên chung về việc sử dụng thuốc trong toa này và theo dõi hiệu quả điều trị.`;
    
    if (userQuestion && userQuestion.trim()) {
      prompt += `

    **CÂU HỎI CỤ THỂ CỦA NGƯỜI DÙNG:** "${userQuestion.trim()}"
    4.  **Trả lời câu hỏi cụ thể:** Dựa trên thông tin toa thuốc đã phân tích, hãy trả lời trực tiếp và chi tiết câu hỏi của người dùng.`;
    }
    
    prompt += `

    QUAN TRỌNG: Luôn nhấn mạnh rằng người dùng PHẢI tuân thủ chỉ định của bác sĩ và không tự ý thay đổi liều lượng.`;
    return runAnalysis(file, prompt);
}

const createSystemPrompt = (records: MedicalRecord[], profile: UserProfile): string => {
  let context = `Bạn là một bác sĩ AI chuyên nghiệp và thân thiện. Nhiệm vụ của bạn là trả lời các câu hỏi của bệnh nhân về sức khỏe dựa trên hồ sơ y tế chi tiết của họ. Hãy phân tích thông tin một cách toàn diện và đưa ra lời khuyên có căn cứ.

  **NGUYÊN TẮC QUAN TRỌNG:**
  - Luôn tham chiếu cụ thể đến kết quả xét nghiệm hoặc thuốc trong hồ sơ khi trả lời
  - So sánh các kết quả theo thời gian để đánh giá xu hướng sức khỏe
  - Đưa ra lời khuyên cá nhân hóa dựa trên tiền sử bệnh và dị ứng
  - Giải thích các thuật ngữ y tế một cách dễ hiểu
  - Luôn kết thúc bằng: "⚠️ Lưu ý: Thông tin này chỉ mang tính tham khảo và không thể thay thế cho chẩn đoán từ bác sĩ chuyên môn."

  **THÔNG TIN BỆNH NHÂN:**
  
  **👤 Hồ sơ cá nhân:**
  - Họ tên: ${profile.name}
  - Tuổi: ${profile.age} tuổi
  - Nhóm máu: ${profile.bloodType}
  - Dị ứng: ${profile.allergies || 'Không có'}
  - Tình trạng sức khỏe hiện tại: ${profile.currentConditions || 'Không có ghi nhận'}

  **📋 LỊCH SỬ HỒ SƠ Y TẾ CHI TIẾT:**
  `;

  if (records.length === 0) {
    context += "\n❌ Chưa có hồ sơ y tế nào được tải lên.\n";
  } else {
    context += `\n📊 Tổng số hồ sơ: ${records.length}\n`;
    
    // Sort records by date (newest first)
    const sortedRecords = records.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    sortedRecords.slice(0, 10).forEach((record, index) => {
      context += `\n🔸 **HỒ SƠ ${index + 1}: ${record.recordName}**\n`;
      context += `   📅 Ngày: ${new Date(record.createdAt).toLocaleDateString('vi-VN')}\n`;
      context += `   📋 Loại: ${getDocumentTypeDisplay(record.type)}\n`;
      
      // Add classification info if available
      if (record.classification) {
        context += `   🤖 AI phân loại: ${record.classification.documentType} (${Math.round(record.classification.confidence * 100)}% tin cậy)\n`;
      }

      // Extract structured data if available
      try {
        const parsedAnalysis = JSON.parse(record.analysis);
        if (parsedAnalysis.metadata && parsedAnalysis.report) {
          context += extractStructuredInfo(parsedAnalysis, record.type);
        } else {
          // Fallback to text analysis
          context += `   📝 Phân tích: ${record.analysis.substring(0, 500)}${record.analysis.length > 500 ? '...' : ''}\n`;
        }
      } catch (error) {
        // Fallback to text analysis
        context += `   📝 Phân tích: ${record.analysis.substring(0, 500)}${record.analysis.length > 500 ? '...' : ''}\n`;
      }

      // Add additional metadata if available
      if (record.diagnosis) {
        context += `   🩺 Chẩn đoán: ${record.diagnosis}\n`;
      }
      if (record.doctorName) {
        context += `   👨‍⚕️ Bác sĩ: ${record.doctorName}\n`;
      }
      if (record.clinicName) {
        context += `   🏥 Phòng khám: ${record.clinicName}\n`;
      }
      
      context += `   ---\n`;
    });

    if (records.length > 10) {
      context += `\n📝 Và ${records.length - 10} hồ sơ khác...\n`;
    }
  }

  context += `\n**HƯỚNG DẪN TRẢ LỜI:**
  - Khi được hỏi về chỉ số cụ thể, hãy tham chiếu đến kết quả gần nhất và so sánh với các lần trước (nếu có)
  - Khi được hỏi về thuốc, hãy giải thích tác dụng và lưu ý dựa trên thông tin trong toa thuốc
  - Đưa ra khuyến nghị cá nhân hóa dựa trên tiền sử dị ứng và tình trạng sức khỏe
  - Sử dụng emoji phù hợp để làm cho câu trả lời thân thiện hơn
  `;

  return context;
};

// Helper function to get document type display name
const getDocumentTypeDisplay = (type: string): string => {
  const typeMap: { [key: string]: string } = {
    'lab_result': '🧪 Kết quả xét nghiệm',
    'prescription': '💊 Toa thuốc',
    'diagnostic_imaging': '📷 Chẩn đoán hình ảnh',
    'ecg': '📈 Điện tim',
    'endoscopy': '🔍 Nội soi',
    'pathology': '🔬 Giải phẫu bệnh',
    'discharge_summary': '📋 Tóm tắt xuất viện',
    'medical_certificate': '📄 Giấy chứng nhận y tế',
    'vaccination': '💉 Tiêm chủng',
    'medical_document': '📋 Tài liệu y tế'
  };
  return typeMap[type] || `📋 ${type}`;
};

// Helper function to extract structured information
const extractStructuredInfo = (parsedAnalysis: any, recordType: string): string => {
  let info = '';
  
  try {
    const report = parsedAnalysis.report;
    
    if (recordType === 'lab_result' && report.reportType === 'LAB_RESULT') {
      // Extract lab results
      if (report.results && report.results.length > 0) {
        info += `   🧪 **Kết quả xét nghiệm:**\n`;
        report.results.slice(0, 5).forEach((result: any) => {
          const status = result.status === 'NORMAL' ? '✅' : 
                        result.status === 'HIGH' ? '🔴' : 
                        result.status === 'LOW' ? '🔵' : '⚠️';
          info += `      ${status} ${result.parameter}: ${result.value} ${result.unit || ''} (${result.status})\n`;
        });
        
        if (report.results.length > 5) {
          info += `      📝 Và ${report.results.length - 5} chỉ số khác...\n`;
        }
      }

      // Extract interpretation
      if (report.interpretation) {
        if (report.interpretation.summary) {
          info += `   📊 **Tóm tắt:** ${report.interpretation.summary}\n`;
        }
        if (report.interpretation.abnormalFindings && report.interpretation.abnormalFindings.length > 0) {
          info += `   ⚠️ **Bất thường:** ${report.interpretation.abnormalFindings.join(', ')}\n`;
        }
      }
    } 
    else if (recordType === 'prescription' && report.reportType === 'PRESCRIPTION') {
      // Extract prescription info
      if (report.treatmentAnalysis) {
        if (report.treatmentAnalysis.primaryDiagnosis) {
          info += `   🩺 **Chẩn đoán:** ${report.treatmentAnalysis.primaryDiagnosis}\n`;
        }
        if (report.treatmentAnalysis.treatmentGoals && report.treatmentAnalysis.treatmentGoals.length > 0) {
          info += `   🎯 **Mục tiêu điều trị:** ${report.treatmentAnalysis.treatmentGoals.join(', ')}\n`;
        }
      }

      if (report.medications && report.medications.length > 0) {
        info += `   💊 **Thuốc được kê:**\n`;
        report.medications.slice(0, 3).forEach((med: any) => {
          info += `      • ${med.name}: ${med.dosage} - ${med.frequency}\n`;
          if (med.primaryAction) {
            info += `        ➤ Tác dụng: ${med.primaryAction}\n`;
          }
        });
        
        if (report.medications.length > 3) {
          info += `      📝 Và ${report.medications.length - 3} thuốc khác...\n`;
        }
      }
    }
  } catch (error) {
    console.error('Error extracting structured info:', error);
  }
  
  return info;
};

let chat: Chat | null = null;

export const getChatResponse = async (
    history: MedicalRecord[], 
    profile: UserProfile,
    message: string
): Promise<string> => {
    try {
        // Create a new chat session for each conversation turn for simplicity
        // In a real app, you might want to manage the chat session state
        const model = 'gemini-2.5-flash';
        const systemInstruction = createSystemPrompt(history, profile);

        const chat = ai.chats.create({
            model,
            config: { systemInstruction },
        });

        const response = await chat.sendMessage({ message });
        return response.text;

    } catch (error) {
        console.error("Error getting chat response:", error);
        if (error instanceof Error) {
            return `Rất tiếc, đã có lỗi xảy ra: ${error.message}`;
        }
        return "Rất tiếc, đã có lỗi xảy ra. Vui lòng thử lại.";
    }
}