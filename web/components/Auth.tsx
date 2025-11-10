import React, { useEffect, useState } from 'react';
import {
  LockClosedIcon,
  ArrowRightOnRectangleIcon,
  DocumentMagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  PillIcon,
  ClipboardDocumentListIcon,
  CheckIcon
} from './icons/Icons';
import Logo from './Logo';
import AuthService, { authService, type LoginRequest } from '../services/authService';
import type { UserProfile } from '../types';

interface AuthProps {
  onLogin: (user: UserProfile & { email: string; id: number }) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const featureSlides = [
    {
      title: 'Lưu hỗ trợ bệnh án',
      description: 'Lưu trữ và quản lý toàn bộ hồ sơ bệnh án của bạn trong một không gian an toàn đạt chuẩn bệnh viện.',
      highlights: ['Tự động đồng bộ tài liệu', 'Mã hóa bảo vệ dữ liệu y tế'],
      icon: ClipboardDocumentListIcon
    },
    {
      title: 'Giải thích tài liệu bệnh án',
      description: 'AI phân tích và diễn giải chi tiết từng chỉ số, giúp bạn hiểu rõ ý nghĩa của kết quả khám chữa bệnh.',
      highlights: ['Giải thích chỉ số dễ hiểu', 'Gợi ý hành động tiếp theo'],
      icon: DocumentMagnifyingGlassIcon
    },
    {
      title: 'Trò chuyện với Bác Sĩ AI',
      description: 'Trao đổi trực tiếp với trợ lý y tế ảo để nhận tư vấn cá nhân hóa dựa trên hồ sơ thực tế.',
      highlights: ['Tư vấn tức thì 24/7', 'Theo dõi lịch sử trò chuyện'],
      icon: ChatBubbleLeftRightIcon
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % featureSlides.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [featureSlides.length]);

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    if (!AuthService.validateEmail(email)) {
      errors.email = 'Email không hợp lệ';
    }

    const passwordValidation = AuthService.validatePassword(password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.message!;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const loginData: LoginRequest = { email, password };
      const response = await authService.login(loginData);
      onLogin({
        id: response.user.id,
        name: response.user.name,
        age: response.user.age,
        bloodType: response.user.bloodType,
        allergies: response.user.allergies,
        currentConditions: response.user.currentConditions,
        email: response.user.email
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex flex-col min-h-screen lg:flex-row">
        <div className="relative flex-col hidden w-full overflow-hidden text-white lg:flex lg:w-1/2 bg-blue-900">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.25),transparent_60%)]" aria-hidden="true" />
          <div className="relative z-10 flex flex-col h-full px-12 py-14">
            
            <div className="flex items-center mb-6 space-x-2 text-sm uppercase tracking-wider text-blue-100">
              <span className="inline-flex items-center justify-center w-8 h-8 border border-blue-100/60 rounded-full">
                <LockClosedIcon className="w-4 h-4" />
              </span>
              <span>An toàn & bảo mật dữ liệu y tế</span>
            </div>

            <div className="relative flex-1">
              {featureSlides.map((slide, index) => {
                const IconComponent = slide.icon;
                const isActive = index === activeSlideIndex;

                return (
                  <div
                    key={slide.title}
                    className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                      isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
                    }`}
                    aria-hidden={!isActive}
                  >
                    <div className="flex items-center justify-center w-12 h-12 mb-6 rounded-2xl bg-white/15 backdrop-blur">
                      <IconComponent className="w-7 h-7" />
                    </div>
                    <h2 className="text-3xl font-semibold leading-tight text-white lg:text-4xl">
                      {slide.title}
                    </h2>
                    <p className="mt-4 text-base leading-relaxed text-blue-100/90">
                      {slide.description}
                    </p>
                    <div className="mt-8 space-y-3">
                      {slide.highlights.map((highlight) => (
                        <div key={highlight} className="flex items-center text-sm font-medium text-blue-50/90">
                          <span className="inline-flex items-center justify-center flex-shrink-0 w-6 h-6 mr-3 rounded-full bg-white/15">
                            <CheckIcon className="w-4 h-4" />
                          </span>
                          {highlight}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="relative mt-10 flex items-center space-x-2">
              {featureSlides.map((slide, index) => (
                <button
                  key={slide.title}
                  type="button"
                  onClick={() => setActiveSlideIndex(index)}
                  className={`h-2 rounded-full transition-all duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/70 focus-visible:ring-offset-blue-900 ${
                    index === activeSlideIndex ? 'w-10 bg-white' : 'w-4 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Chuyển đến slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center w-full px-6 py-10 bg-white shadow-none lg:px-16 dark:bg-gray-900 lg:w-1/2">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 text-center lg:text-left">
              <div className="flex justify-center mb-6 lg:justify-start">
                <Logo size="md" variant="full" />
              </div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Chào mừng trở lại 👋
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Đăng nhập để quản lý hồ sơ y tế và nhận phân tích cá nhân hóa từ AI.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="relative">
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (validationErrors.email) {
                      setValidationErrors(prev => ({ ...prev, email: '' }));
                    }
                  }}
                  className={`block w-full px-4 py-3 text-gray-900 placeholder-gray-500 bg-gray-100 border rounded-md appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white ${
                    validationErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Địa chỉ email"
                />
                {validationErrors.email && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.email}</p>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (validationErrors.password) {
                      setValidationErrors(prev => ({ ...prev, password: '' }));
                    }
                  }}
                  className={`block w-full px-4 py-3 text-gray-900 placeholder-gray-500 bg-gray-100 border rounded-md appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white ${
                    validationErrors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Mật khẩu"
                />
                {validationErrors.password && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.password}</p>
                )}
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative flex justify-center w-full px-4 py-3 text-sm font-semibold text-white transition-all duration-200 border border-transparent rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:bg-blue-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white rounded-full animate-spin border-opacity-30 border-t-white"></div>
                    ) : (
                      <ArrowRightOnRectangleIcon className="w-5 h-5 text-blue-200 group-hover:text-white" />
                    )}
                  </span>
                  {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
                </button>
              </div>
            </form>

            <p className="mt-6 text-sm text-gray-600 text-center lg:text-left dark:text-gray-400">
              Chưa có tài khoản?{' '}
              <a
                href="https://www.facebook.com/hosoyteonline"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                Đăng ký liên hệ
              </a>
            </p>

            <div className="mt-8 space-y-6 lg:hidden">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Tính năng nổi bật
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {featureSlides.map((slide) => {
                  const IconComponent = slide.icon;
                  return (
                    <div key={slide.title} className="p-4 transition-shadow duration-200 bg-gray-50 border border-gray-200 rounded-xl shadow-sm dark:bg-gray-800/60 dark:border-gray-700">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-700 text-white">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
                        {slide.title}
                      </h3>
                      <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                        {slide.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;