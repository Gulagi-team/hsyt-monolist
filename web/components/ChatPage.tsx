import React, { useState, useRef, useEffect } from 'react';
import { chatService } from '../services/chatService';
import ChatLoadingPopup from './ChatLoadingPopup';
import SuggestedQuestions from './SuggestedQuestions';
import type { MedicalRecord, UserProfile, ChatMessageItem, ChatSessionSummary } from '../types';
import { MicrophoneIcon } from './icons/Icons';

interface ChatPageProps {
  records: MedicalRecord[];
  profile: UserProfile;
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
    const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
    const [messages, setMessages] = useState<ChatMessageItem[]>([]);
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
    };

    useEffect(scrollToBottom, [messages]);

    useEffect(() => {
        const loadSessions = async () => {
            try {
                const response = await chatService.listSessions(50, 0);
                setSessions(response.sessions);

                if (response.sessions.length > 0) {
                    const latestSession = response.sessions[0];
                    setSelectedSessionId(latestSession.id);
                }
            } catch (error) {
                console.error('Không thể tải danh sách phiên chat:', error);
            }
        };

        loadSessions();
    }, []);

    useEffect(() => {
        const loadMessages = async () => {
            if (!selectedSessionId) {
                setMessages([]);
                return;
            }

            try {
                const response = await chatService.getSessionMessages(selectedSessionId, 200, 0);
                setMessages(response.messages);
            } catch (error) {
                console.error('Không thể tải tin nhắn của phiên chat:', error);
                setMessages([]);
            }
        };

        loadMessages();
    }, [selectedSessionId]);

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

        const optimisticUserMessage: ChatMessageItem = {
            id: Date.now(),
            sessionId: selectedSessionId ?? 0,
            sender: 'user',
            message: userMessage,
            createdAt: new Date().toISOString(),
        };

        setMessages(prev => [...prev, optimisticUserMessage]);
        setIsLoading(true);

        try {
            const response = await chatService.sendMessage({
                question: userMessage,
                sessionId: selectedSessionId ?? undefined,
            });

            // Update session list with new/updated session
            const updatedSessions = await chatService.listSessions(50, 0);
            setSessions(updatedSessions.sessions);
            setSelectedSessionId(response.sessionId);

            // Reload messages for the session
            const messageResponse = await chatService.getSessionMessages(response.sessionId, 200, 0);
            setMessages(messageResponse.messages);
        } catch (error) {
            console.error('Không thể gửi tin nhắn:', error);
            const errorMessage: ChatMessageItem = {
                id: Date.now() + 1,
                sessionId: selectedSessionId ?? 0,
                sender: 'ai',
                message: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.',
                createdAt: new Date().toISOString(),
            };
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
        <div className="flex flex-col md:flex-row max-w-6xl mx-auto px-4 py-6 gap-6 w-full min-h-[calc(100vh-120px)]">
            {/* Sessions list */}
            <aside className="md:w-64 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white/80 dark:bg-gray-900/70 backdrop-blur p-4 max-h-[70vh] md:max-h-none overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Phiên trò chuyện</h3>
                    <button
                        onClick={async () => {
                            try {
                                const response = await chatService.listSessions(50, 0);
                                setSessions(response.sessions);
                                if (response.sessions.length > 0) {
                                    setSelectedSessionId(response.sessions[0].id);
                                } else {
                                    setSelectedSessionId(null);
                                    setMessages([]);
                                }
                            } catch (error) {
                                console.error('Không thể tải danh sách phiên chat:', error);
                            }
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                        Làm mới
                    </button>
                </div>

                <div className="space-y-2">
                    {sessions.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Chưa có phiên chat nào. Hãy gửi câu hỏi đầu tiên để bắt đầu.
                        </p>
                    ) : (
                        sessions.map((session) => (
                            <button
                                key={session.id}
                                onClick={() => setSelectedSessionId(session.id)}
                                className={`w-full text-left p-3 rounded-xl border transition-colors ${
                                    selectedSessionId === session.id
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:border-blue-500'
                                }`}
                            >
                                <h4 className="font-medium text-sm truncate">
                                    {session.title || 'Cuộc trò chuyện mới'}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Bắt đầu: {new Date(session.startedAt).toLocaleString('vi-VN')}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Hoạt động gần nhất: {new Date(session.lastActivityAt).toLocaleString('vi-VN')}
                                </p>
                            </button>
                        ))
                    )}
                </div>
            </aside>

            {/* Chat area */}
            <div className="flex-1 flex flex-col rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/70 backdrop-blur h-[70vh] md:h-[80vh]">
                <header className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Trò chuyện với Bác sĩ AI</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {selectedSessionId ? 'Đang tiếp tục cuộc trò chuyện.' : 'Bắt đầu một cuộc trò chuyện mới bằng cách đặt câu hỏi.'}
                    </p>
                </header>

                <div className="flex-1 overflow-y-auto overscroll-y-contain scroll-smooth touch-pan-y px-4 py-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                            Chưa có tin nhắn. Hãy gửi câu hỏi để bắt đầu cuộc trò chuyện với bác sĩ AI.
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${msg.sender === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100'}`}
                                >
                                    {msg.sender === 'ai' ? (
                                        <div
                                            className="space-y-3"
                                            dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.message) }}
                                        />
                                    ) : (
                                        <p>{msg.message}</p>
                                    )}
                                    <p className="mt-2 text-xs opacity-70">
                                        {new Date(msg.createdAt).toLocaleString('vi-VN')}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/80 text-gray-500 dark:text-gray-300">
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
                    {!selectedSessionId && messages.length === 0 && (
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
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
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