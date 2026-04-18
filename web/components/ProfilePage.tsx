import React, { useState, useEffect } from 'react';
import type { UserProfile } from '../types';
import { useDarkMode } from '../hooks/useDarkMode';
import { SunIcon, MoonIcon } from './icons/Icons';

interface ProfilePageProps {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ profile, setProfile }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<UserProfile>(profile);
    const { isDarkMode, toggleDarkMode } = useDarkMode();

    useEffect(() => {
        setFormData(profile);
    }, [profile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'age' ? parseInt(value) || 0 : value }));
    }

    const handleSave = () => {
        setProfile(formData);
        setIsEditing(false);
    }

    const handleCancel = () => {
        setFormData(profile);
        setIsEditing(false);
    }

    const ProfileField: React.FC<{ label: string; value: string | number; name: keyof UserProfile; type?: string; isEditing: boolean }> = ({ label, value, name, type = "text", isEditing }) => (
        <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">{label}</label>
            {isEditing ? (
                 type === 'textarea' ? (
                    <textarea 
                        name={name}
                        value={value}
                        onChange={handleInputChange}
                        rows={3}
                        className="mt-1 block w-full px-3 py-2 text-gray-900 placeholder-gray-500 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    />
                 ) : (
                    <input 
                        type={type}
                        name={name}
                        value={value}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 text-gray-900 placeholder-gray-500 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    />
                 )
            ) : (
                <p className="mt-1 text-md text-gray-900 dark:text-gray-100">{value}</p>
            )}
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Thông tin cá nhân</h2>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={toggleDarkMode}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title={isDarkMode ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
                    >
                        {isDarkMode ? (
                            <SunIcon className="w-5 h-5 text-yellow-500" />
                        ) : (
                            <MoonIcon className="w-5 h-5 text-blue-600" />
                        )}
                    </button>
                    {!isEditing && (
                        <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium">
                            Chỉnh sửa
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
                <ProfileField label="Tên" name="name" value={formData.name} isEditing={isEditing} />
                <ProfileField label="Tuổi" name="age" value={formData.age} type="number" isEditing={isEditing} />
                <ProfileField label="Nhóm máu" name="bloodType" value={formData.bloodType} isEditing={isEditing} />
                <ProfileField label="Tiền sử dị ứng" name="allergies" value={formData.allergies} type="textarea" isEditing={isEditing} />
                <ProfileField label="Tình trạng sức khỏe đã biết" name="currentConditions" value={formData.currentConditions} type="textarea" isEditing={isEditing} />
                
                {isEditing && (
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button onClick={handleCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors text-sm font-medium">
                            Hủy
                        </button>
                        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium">
                            Lưu thay đổi
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
