/**
 * Utility functions for date formatting
 */

export const formatDate = (date: Date | string, locale: string = 'vi-VN'): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Ngày không hợp lệ';
    }
    
    return dateObj.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Ngày không hợp lệ';
  }
};

export const formatDateTime = (date: Date | string, locale: string = 'vi-VN'): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Ngày không hợp lệ';
    }
    
    return dateObj.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return 'Ngày không hợp lệ';
  }
};

export const formatDateLong = (date: Date | string, locale: string = 'vi-VN'): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Ngày không hợp lệ';
    }
    
    return dateObj.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date long:', error);
    return 'Ngày không hợp lệ';
  }
};

export const isValidDate = (date: Date | string): boolean => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return !isNaN(dateObj.getTime());
  } catch {
    return false;
  }
};
