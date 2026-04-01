import React, { useEffect, useState } from 'react';
import { UserResponseDTO, UserRequestDTO } from '../../types/user.types';
import { userApi } from '../../api/userApi';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const ClientProfile: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const [profile, setProfile] = useState<UserResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', phoneNumber: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    userApi.getClientProfile(currentUser.id)
      .then((data: UserResponseDTO) => {
        setProfile(data);
        setFormData({
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber || ''
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentUser]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setSaving(true);
    try {
      const updated = await userApi.update(profile.id, formData as unknown as UserRequestDTO);
      setProfile(updated);
      setIsEditing(false);
      addToast('Profile updated successfully', 'success');
    } catch(err: any) {
      addToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading profile...</p>
    </div>
  );
  if (!profile) return <div className="error-message empty-state">Profile not found.</div>;

  return (
    <div className="client-profile card">
      <div className="flex-between">
        <h2>My Personal Information</h2>
        {!isEditing && (
          <button className="btn btn-outline" onClick={() => setIsEditing(true)}>Edit Profile</button>
        )}
      </div>

      <div className="profile-status-banner">
        Current Account Status: <strong>{profile.status}</strong> 
        {profile.kycVerified ? ' (Verified)' : ' (Action Required)'}
      </div>

      {isEditing ? (
        <form onSubmit={handleUpdate} className="profile-form">
          <div className="form-group">
            <label>First Name</label>
            <input 
              value={formData.firstName} 
              onChange={e => setFormData({...formData, firstName: e.target.value})} 
              required
            />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input 
              value={formData.lastName} 
              onChange={e => setFormData({...formData, lastName: e.target.value})} 
              required
            />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input 
              value={formData.phoneNumber} 
              onChange={e => setFormData({...formData, phoneNumber: e.target.value})} 
            />
          </div>
          <div className="form-actions mt-3">
            <button type="button" className="btn btn-outline" onClick={() => setIsEditing(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : (
        <div className="detail-grid mt-3">
          <div className="info-group">
            <strong>Email:</strong> <span>{profile.email}</span>
          </div>
          <div className="info-group">
            <strong>Full Name:</strong> <span>{profile.firstName} {profile.lastName}</span>
          </div>
          <div className="info-group">
            <strong>Phone Number:</strong> <span>{profile.phoneNumber || 'Not provided'}</span>
          </div>
          <div className="info-group">
            <strong>Joined Date:</strong> <span>{new Date(profile.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientProfile;
