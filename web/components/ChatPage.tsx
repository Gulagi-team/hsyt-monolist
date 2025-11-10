import React, { useState, useRef, useEffect } from 'react';
import { getChatResponse } from '../services/geminiService';
import ChatLoadingPopup from './ChatLoadingPopup';
import MedicalRecordsSummary from './MedicalRecordsSummary';
import SuggestedQuestions from './SuggestedQuestions';
import type { MedicalRecord, UserProfile } from '../types';
import { UserCircleIcon, PlusCircleIcon, MicrophoneIcon } from './icons/Icons';

interface ChatPageProps {
  records: MedicalRecord[];
  profile: UserProfile;
}

interface Message {
    sender: 'user' | 'ai';
    text: string;
}

// Add type definitions for browser API
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
}

const ChatPage: React.FC<ChatPageProps> = ({ records, profile }) => {
    const [messages, setMessages] = useState<Message[]>([
        { 
            sender: 'ai', 
            text: `👋 Xin chào ${profile.name}! Tôi là Bác sĩ AI của bạn.

🩺 Tôi đã xem qua ${records.length} hồ sơ y tế của bạn và sẵn sàng trả lời các câu hỏi về:
• Kết quả xét nghiệm và ý nghĩa của các chỉ số
• Thuốc đang sử dụng và tác dụng phụ
• Xu hướng sức khỏe theo thời gian
• Lời khuyên cá nhân hóa dựa trên hồ sơ của bạn

💬 Hãy hỏi tôi bất cứ điều gì về sức khỏe của bạn!` 
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    // FIX: Renamed variable to avoid shadowing the global 'SpeechRecognition' type.
    const SpeechRecognitionApi = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [messages]);

    useEffect(() => {
        if (!SpeechRecognitionApi) {
            console.warn("API nhận dạng giọng nói không được hỗ trợ trên trình duyệt này.");
            return;
        }

        const recognition = new SpeechRecognitionApi();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'vi-VN';

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            const transcript = event.results[0][0].transcript;
            setInput(prevInput => (prevInput.trim() ? prevInput + ' ' : '') + transcript);
        };

        recognition.onstart = () => {
            setIsRecording(true);
        };

        recognition.onend = () => {
            setIsRecording(false);
        };

        recognition.onerror = (event: any) => {
            console.error('Lỗi nhận dạng giọng nói:', event.error);
             if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                alert('Vui lòng cấp quyền truy cập micro để sử dụng tính năng này.');
            }
            setIsRecording(false);
        };
        
        recognitionRef.current = recognition;

        return () => {
            recognitionRef.current?.abort();
        };
    }, [SpeechRecognitionApi]);

    const handleMicClick = () => {
        if (isRecording) {
            recognitionRef.current?.stop();
            return;
        }
        if (recognitionRef.current) {
            recognitionRef.current.start();
        }
    };

    const stopRecording = () => {
        recognitionRef.current?.stop();
    };

    const sendMessage = async (message: string) => {
        if (message.trim() === '' || isLoading) return;
        
        if (isRecording) {
            stopRecording();
        }

        const userMessage = message.trim();
        setCurrentQuestion(userMessage);
        setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
        setIsLoading(true);

        try {
            const response = await getChatResponse(records, profile, userMessage);
            setMessages(prev => [...prev, { sender: 'ai', text: response }]);
        } catch (error) {
            console.error('Error getting chat response:', error);
            const errorMessage = { sender: 'ai' as const, text: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            setCurrentQuestion('');
        }
    };

    const handleSend = async () => {
        if (input.trim() === '' || isLoading) return;
        const message = input.trim();
        setInput('');
        await sendMessage(message);
    };

    return (
        <div className="h-full flex flex-col max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Trò chuyện với Bác sĩ AI</h2>
            
            {/* Medical Records Summary */}
            <MedicalRecordsSummary records={records} profile={profile} />
            
            <div className="flex-grow bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 flex flex-col overflow-hidden">
                <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            {msg.sender === 'ai' && (
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                                    <PlusCircleIcon className="w-6 h-6 text-white" />
                                </div>
                            )}
                            <div className={`max-w-md p-3 rounded-2xl ${msg.sender === 'ai' ? 'bg-gray-100 dark:bg-gray-700' : 'bg-blue-500 text-white'}`}>
                                <p className="text-sm" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }} />
                            </div>
                             {msg.sender === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                                    <UserCircleIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                                <PlusCircleIcon className="w-6 h-6 text-white" />
                            </div>
                            <div className="max-w-md p-3 rounded-2xl bg-gray-100 dark:bg-gray-700">
                                <div className="flex items-center space-x-1">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-75"></span>
                                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150"></span>
                                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-300"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                    {/* Suggested Questions - only show when no messages from user yet */}
                    {messages.length === 1 && (
                        <SuggestedQuestions 
                            records={records} 
                            onQuestionSelect={(question) => {
                                setInput(question);
                                // Auto-send the question after setting input
                                setTimeout(() => {
                                    if (question.trim()) {
                                        sendMessage(question);
                                        setInput(''); // Clear input after sending
                                    }
                                }, 100);
                            }} 
                        />
                    )}
                    
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={isRecording ? "Đang lắng nghe..." : "Nhập câu hỏi của bạn..."}
                            className="w-full pl-4 pr-24 py-3 bg-gray-100 dark:bg-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isLoading}
                        />
                         <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                            {SpeechRecognitionApi && (
                                <button
                                    onClick={handleMicClick}
                                    disabled={isLoading}
                                    className={`p-2 rounded-full transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600'}`}
                                    aria-label={isRecording ? 'Dừng ghi âm' : 'Bắt đầu ghi âm'}
                                >
                                    <MicrophoneIcon className="w-5 h-5" />
                                </button>
                            )}
                            <button
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed ml-1"
                                aria-label="Gửi tin nhắn"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                    <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.949a.75.75 0 00.95.826L11.25 9.25v1.5L4.643 11.98a.75.75 0 00-.95.826l-1.414 4.949a.75.75 0 00.826.95l14.026-6.311a.75.75 0 000-1.362L3.105 2.289z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Chat Loading Popup */}
            <ChatLoadingPopup
                isVisible={isLoading}
                question={currentQuestion}
            />
        </div>
    );
};

export default ChatPage;