import React, { useState, useRef, useEffect } from 'react';
import { getChatResponse } from '../services/geminiService';
import ChatLoadingPopup from './ChatLoadingPopup';
import SuggestedQuestions from './SuggestedQuestions';
import type { MedicalRecord, UserProfile } from '../types';
import { MicrophoneIcon } from './icons/Icons';

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

const formatMarkdown = (text: string) => {
    let html = text.replace(/\r\n/g, '\n');

    // Headings
    html = html
        .replace(/^###### (.*$)/gim, '<h6 class="font-semibold text-sm mt-3 mb-1 text-gray-600 dark:text-gray-300">$1</h6>')
        .replace(/^##### (.*$)/gim, '<h5 class="font-semibold text-base mt-3 mb-1 text-gray-700 dark:text-gray-200">$1</h5>')
        .replace(/^#### (.*$)/gim, '<h4 class="font-semibold text-base mt-4 mb-1 text-gray-700 dark:text-gray-200">$1</h4>')
        .replace(/^### (.*$)/gim, '<h3 class="font-semibold text-lg mt-5 mb-2 text-gray-800 dark:text-gray-100">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="font-semibold text-xl mt-6 mb-3 text-gray-900 dark:text-white">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="font-semibold text-2xl mt-6 mb-3 text-gray-900 dark:text-white">$1</h1>');

    // Bold, italic, code
    html = html
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs font-mono text-gray-800 dark:text-gray-200">$1</code>');

    // Ordered lists
    html = html.replace(/^(\d+)\. (.*)/gm, '<li class="list-decimal ml-5">$2</li>');
    html = html.replace(/(<li class="list-decimal.*"><\/li>\n?)+/g, match => `<ol>${match}</ol>`);

    // Unordered lists
    html = html.replace(/^[-•] (.*)/gm, '<li class="list-disc ml-5">$1</li>');
    html = html.replace(/(<li class="list-disc.*"><\/li>\n?)+/g, match => `<ul>${match}</ul>`);

    // Tables (GitHub flavoured)
    html = html.replace(
        /^\|(.+)\|\s*\n\|( *:?[-]+:? *\|)+\s*\n((?:\|.*\|\s*\n?)*)/gm,
        (match, headerLine, _separatorLine, bodyLines) => {
            const headers = headerLine.split('|').map(h => h.trim()).filter(Boolean);
            const rows = bodyLines.split('\n').filter(r => r.trim());

            const headerHtml = headers
                .map(header => `<th class="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-200">${header}</th>`)
                .join('');

            const bodyHtml = rows
                .map(rowLine => {
                    const cells = rowLine.split('|').slice(1, -1).map(c => c.trim());
                    if (!cells.length) return '';
                    const cellHtml = cells
                        .map(cell => `<td class="px-3 py-2 border-t border-gray-200 dark:border-gray-700">${cell}</td>`)
                        .join('');
                    return `<tr>${cellHtml}</tr>`;
                })
                .join('');

            return `<div class="overflow-x-auto my-3"><table class="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg">` +
                `<thead class="bg-gray-100 dark:bg-gray-800">${headerHtml}</thead>` +
                `<tbody class="bg-white dark:bg-gray-900">${bodyHtml}</tbody>` +
                `</table></div>`;
        }
    );

    // Paragraph breaks
    html = html
        .replace(/\n{2,}/g, '</p><p>')
        .replace(/\n/g, '<br />');

    return `<p>${html}</p>`
        .replace(/<p><\/p>/g, '')
        .replace(/<p><ul>/g, '<ul>')
        .replace(/<\/ul><\/p>/g, '</ul>')
        .replace(/<p><ol>/g, '<ol>')
        .replace(/<\/ol><\/p>/g, '</ol>');
};

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
        <div className="h-full flex flex-col max-w-3xl mx-auto px-4 py-6">
            <header className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Trò chuyện với Bác sĩ AI</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Đặt câu hỏi để nhận tư vấn dựa trên hồ sơ y tế của bạn.
                </p>
            </header>

            <div className="flex flex-col flex-grow rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/70 backdrop-blur">
                <div className="flex-grow overflow-y-auto px-4 py-4 space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div
                                className={`max-w-xl rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${msg.sender === 'user'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100'}`}
                            >
                                {msg.sender === 'ai' ? (
                                    <div
                                        className="space-y-3"
                                        dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.text) }}
                                    />
                                ) : (
                                    <p>{msg.text}</p>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="max-w-xl rounded-2xl px-4 py-3 text-sm leading-relaxed border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/80 text-gray-500 dark:text-gray-300">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse [animation-delay:0.15s]"></span>
                                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse [animation-delay:0.3s]"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-3 space-y-4">
                    {/* Suggested Questions - only show when no messages from user yet */}
                    {messages.length === 1 && (
                        <SuggestedQuestions
                            records={records}
                            onQuestionSelect={(question) => {
                                setInput(question);
                                setTimeout(() => {
                                    if (question.trim()) {
                                        sendMessage(question);
                                        setInput('');
                                    }
                                }, 100);
                            }}
                        />
                    )}

                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={isRecording ? "Đang lắng nghe..." : "Nhập câu hỏi của bạn..."}
                            className="flex-grow rounded-full border border-gray-300 dark:border-gray-700 bg-transparent px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
                            disabled={isLoading}
                        />
                        {SpeechRecognitionApi && (
                            <button
                                onClick={handleMicClick}
                                disabled={isLoading}
                                className={`p-2 rounded-full border border-transparent transition-colors ${isRecording
                                    ? 'bg-red-500 text-white animate-pulse'
                                    : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
                                aria-label={isRecording ? 'Dừng ghi âm' : 'Bắt đầu ghi âm'}
                            >
                                <MicrophoneIcon className="w-5 h-5" />
                            </button>
                        )}
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
                            aria-label="Gửi tin nhắn"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.949a.75.75 0 00.95.826L11.25 9.25v1.5L4.643 11.98a.75.75 0 00-.95.826l-1.414 4.949a.75.75 0 00.826.95l14.026-6.311a.75.75 0 000-1.362L3.105 2.289z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <ChatLoadingPopup
                isVisible={isLoading}
                question={currentQuestion}
            />
        </div>
    );
};

export default ChatPage;