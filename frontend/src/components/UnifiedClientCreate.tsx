import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  X,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  Eye,
  EyeOff,
  AlertCircle,
  Upload,
  FileText,
  Shield,
  CheckCircle2
} from 'lucide-react';
import { UserStatus, UserRole } from '../types/user.types';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

interface ClientFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  address: string;
  status: UserStatus;
  occupation?: string;
  monthlyIncome?: string;
  idDocument?: File;
  proofOfAddress?: File;
  bankStatement?: File;
}

interface UnifiedClientCreateProps {
  isAgent?: boolean;
  redirectPath?: string;
  title?: string;
  subtitle?: string;
}

const UnifiedClientCreate: React.FC<UnifiedClientCreateProps> = ({
  isAgent = false,
  redirectPath,
  title,
  subtitle
}) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { currentUser } = useAuth();
  
  const [formData, setFormData] = useState<ClientFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    address: '',
    status: UserStatus.ACTIVE,
    occupation: '',
    monthlyIncome: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const pageTitle = title || (isAgent ? 'Add New Client' : 'Create New Client');
  const pageSubtitle = subtitle || (isAgent ? 'Create a new client account' : 'Create a new client account');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\+?[\d\s-()]+$/;
    return phoneRegex.test(phone) && phone.length >= 8;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!validatePhone(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    // Additional validation for agents
    if (isAgent) {
      if (!formData.occupation?.trim()) {
        newErrors.occupation = 'Occupation is required';
      }
      if (!formData.monthlyIncome?.trim()) {
        newErrors.monthlyIncome = 'Monthly income is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = async (fileType: string, file: File) => {
    try {
      setUploadProgress(prev => ({ ...prev, [fileType]: 0 }));
      
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(prev => ({ ...prev, [fileType]: i }));
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setUploadedFiles(prev => ({ ...prev, [fileType]: file }));
      addToast(`${fileType.replace(/_/g, ' ')} uploaded successfully`, 'success');
    } catch (error) {
      addToast(`Failed to upload ${fileType.replace(/_/g, ' ')}`, 'error');
    } finally {
      setUploadProgress(prev => ({ ...prev, [fileType]: 0 }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Prepare data for API
      const submitData = {
        ...formData,
        role: UserRole.CLIENT,
        assignedAgentId: isAgent ? currentUser?.id : undefined,
        documents: uploadedFiles
      };

      console.log('Creating client with data:', submitData);
      
      // API call to create client
      const response = await fetch('http://localhost:8086/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'X-Actor-Id': localStorage.getItem('userId') || '1'
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      addToast('Client created successfully', 'success');
      
      // Redirect based on context
      if (redirectPath) {
        navigate(redirectPath);
      } else if (isAgent) {
        navigate('/agent/clients');
      } else {
        navigate('/admin/users');
      }
    } catch (error: any) {
      console.error('Error creating client:', error);
      const errorMessage = error?.message || 'Failed to create client';
      addToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ClientFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
            <p className="text-gray-600">{pageSubtitle}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <UserPlus className="w-5 h-5 mr-2" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.firstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter first name"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.firstName}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.lastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter last name"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.lastName}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline w-4 h-4 mr-1" />
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="client@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="inline w-4 h-4 mr-1" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+21620000000"
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.phoneNumber}
                  </p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.dateOfBirth}
                  </p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Briefcase className="inline w-4 h-4 mr-1" />
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value={UserStatus.ACTIVE}>Active</option>
                  <option value={UserStatus.INACTIVE}>Inactive</option>
                  <option value={UserStatus.PENDING_VERIFICATION}>Pending Verification</option>
                </select>
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Address *
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter full address"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.address}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Financial Information (Agent specific) */}
          {isAgent && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Briefcase className="w-5 h-5 mr-2" />
                Financial Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Occupation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Occupation *
                  </label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => handleInputChange('occupation', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.occupation ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g. Software Engineer"
                  />
                  {errors.occupation && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.occupation}
                    </p>
                  )}
                </div>

                {/* Monthly Income */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Income *
                  </label>
                  <input
                    type="text"
                    value={formData.monthlyIncome}
                    onChange={(e) => handleInputChange('monthlyIncome', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.monthlyIncome ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g. 5000"
                  />
                  {errors.monthlyIncome && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.monthlyIncome}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Document Upload */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Required Documents
            </h3>
            <div className="space-y-4">
              {/* ID Document */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="w-8 h-8 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">ID Document</p>
                      <p className="text-xs text-gray-500">PDF, JPG, PNG (Max 5MB)</p>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload('idDocument', e.target.files[0])}
                    className="hidden"
                    id="idDocument"
                  />
                  <label
                    htmlFor="idDocument"
                    className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 cursor-pointer"
                  >
                    Choose File
                  </label>
                </div>
                {uploadedFiles.idDocument && (
                  <div className="mt-2 flex items-center text-sm text-green-600">
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    {uploadedFiles.idDocument.name}
                  </div>
                )}
                {uploadProgress.idDocument > 0 && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress.idDocument}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Proof of Address */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="w-8 h-8 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Proof of Address</p>
                      <p className="text-xs text-gray-500">Utility bill, bank statement (Max 5MB)</p>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload('proofOfAddress', e.target.files[0])}
                    className="hidden"
                    id="proofOfAddress"
                  />
                  <label
                    htmlFor="proofOfAddress"
                    className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 cursor-pointer"
                  >
                    Choose File
                  </label>
                </div>
                {uploadedFiles.proofOfAddress && (
                  <div className="mt-2 flex items-center text-sm text-green-600">
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    {uploadedFiles.proofOfAddress.name}
                  </div>
                )}
                {uploadProgress.proofOfAddress > 0 && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress.proofOfAddress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bank Statement */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="w-8 h-8 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Bank Statement</p>
                      <p className="text-xs text-gray-500">Recent bank statement (Max 5MB)</p>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload('bankStatement', e.target.files[0])}
                    className="hidden"
                    id="bankStatement"
                  />
                  <label
                    htmlFor="bankStatement"
                    className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 cursor-pointer"
                  >
                    Choose File
                  </label>
                </div>
                {uploadedFiles.bankStatement && (
                  <div className="mt-2 flex items-center text-sm text-green-600">
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    {uploadedFiles.bankStatement.name}
                  </div>
                )}
                {uploadProgress.bankStatement > 0 && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress.bankStatement}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                if (redirectPath) {
                  navigate(redirectPath);
                } else if (isAgent) {
                  navigate('/agent/clients');
                } else {
                  navigate('/admin/users');
                }
              }}
              className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <X size={16} className="mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Client...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Create Client
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UnifiedClientCreate;
