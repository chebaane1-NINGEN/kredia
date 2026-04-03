// Validation utilities for authentication forms
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Email validation with domain checking
export const validateEmail = (email: string): ValidationResult => {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: 'Email is required' };
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: 'Invalid email format' };
  }

  // Check for valid domains
  const validDomains = [
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com',
    'protonmail.com', 'tutanota.com', 'aol.com', 'mail.com',
    'example.com', 'test.com' // For testing
  ];

  const domain = email.trim().split('@')[1]?.toLowerCase();
  if (!domain || !validDomains.includes(domain)) {
    return { isValid: false, error: 'Unsupported email domain' };
  }

  return { isValid: true };
};

// Password validation with strength requirements
export const validatePassword = (password: string): ValidationResult => {
  if (!password || password.length === 0) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUpperCase) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!hasLowerCase) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!hasNumbers) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }

  // Special character is optional but recommended
  if (!hasSpecialChar) {
    return { isValid: false, error: 'Password must contain at least one special character' };
  }

  return { isValid: true };
};

// Password confirmation validation
export const validatePasswordConfirm = (password: string, confirmPassword: string): ValidationResult => {
  if (!confirmPassword || confirmPassword.length === 0) {
    return { isValid: false, error: 'Please confirm your password' };
  }

  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }

  return { isValid: true };
};

// Full name validation
export const validateFullName = (fullName: string): ValidationResult => {
  if (!fullName || fullName.trim().length === 0) {
    return { isValid: false, error: 'Full name is required' };
  }

  if (fullName.trim().length < 3) {
    return { isValid: false, error: 'Full name must be at least 3 characters' };
  }

  if (fullName.trim().length > 50) {
    return { isValid: false, error: 'Full name must be less than 50 characters' };
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(fullName.trim())) {
    return { isValid: false, error: 'Full name can only contain letters, spaces, hyphens, and apostrophes' };
  }

  return { isValid: true };
};

// Form validation state interface
export interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  general?: string;
}

// Password strength indicator
export const getPasswordStrength = (password: string): {
  score: number;
  label: string;
  color: string;
} => {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

  const strengthLevels = [
    { score: 0, label: 'Very Weak', color: 'rose' },
    { score: 2, label: 'Weak', color: 'orange' },
    { score: 4, label: 'Fair', color: 'yellow' },
    { score: 5, label: 'Good', color: 'blue' },
    { score: 6, label: 'Strong', color: 'emerald' }
  ];

  return strengthLevels.find(level => score <= level.score) || strengthLevels[4];
};

// API error handling
export const getAuthErrorMessage = (error: any, context: 'login' | 'register'): string => {
  if (!error) return '';

  // Handle specific error codes
  if (error.status) {
    switch (error.status) {
      case 400:
        return context === 'login' 
          ? 'Invalid email or password format' 
          : 'Invalid registration data';
      case 401:
        return context === 'login' 
          ? 'Incorrect email or password' 
          : 'Registration failed';
      case 409:
        return 'An account with this email already exists';
      case 422:
        return 'Invalid data provided';
      case 500:
        return 'Server error. Please try again later';
      default:
        return 'An unexpected error occurred';
    }
  }

  // Handle error messages
  if (error.message) {
    if (error.message.includes('User already exists')) {
      return 'An account with this email already exists';
    }
    if (error.message.includes('Invalid credentials')) {
      return 'Incorrect email or password';
    }
    if (error.message.includes('Network error')) {
      return 'Network error. Please check your connection';
    }
    return error.message;
  }

  return context === 'login' 
    ? 'Login failed. Please try again.' 
    : 'Registration failed. Please try again.';
};
