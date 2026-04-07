import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Save,
  X,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Ban,
  FileText,
  Settings,
  Activity,
  Lock,
  Unlock,
  Key,
  Eye,
  EyeOff,
  Download,
  Upload,
  MessageSquare,
  Tag,
  TrendingUp,
  TrendingDown,
  Zap,
  UserCheck,
  UserX
} from 'lucide-react';
import { UserResponseDTO, UserRole, UserStatus } from '../../types/user.types';
import { userApi } from '../../api/userApi';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmModal } from '../../components/ConfirmModal';

interface TimelineEvent {
  id: string;
  type: 'CREATION' | 'ROLE_CHANGE' | 'STATUS_CHANGE' | 'LOGIN' | 'PASSWORD_CHANGE' | 'SECURITY_EVENT' | 'PROFILE_UPDATE' | 'ASSIGNMENT_CHANGE';
  title: string;
  description: string;
  timestamp: string;
  actor?: string;
  metadata?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high';
}

interface UserNote {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
  type: 'internal' | 'risk' | 'performance';
}

interface UserDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  url: string;
}

const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [user, setUser] = useState<UserResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserResponseDTO>>({});
  
  // Timeline
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  
  // Notes
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'internal' | 'risk' | 'performance'>('internal');
  
  // Documents
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  
  // Modals
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: string;
    target?: string;
  }>({ isOpen: false, action: '' });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (id) {
      fetchUserDetails();
      fetchUserTimeline();
      fetchUserNotes();
      fetchUserDocuments();
    }
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const userData = await userApi.getById(Number(id));
      setUser(userData);
      setEditForm(userData);
    } catch (error) {
      addToast('Failed to fetch user details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTimeline = async () => {
    try {
      setLoadingTimeline(true);
      // Mock timeline data - replace with actual API call
      const mockTimeline: TimelineEvent[] = [
        {
          id: '1',
          type: 'CREATION',
          title: 'Account Created',
          description: 'User account was created successfully',
          timestamp: user?.createdAt || new Date().toISOString(),
          actor: 'System',
          severity: 'low'
        },
        {
          id: '2',
          type: 'LOGIN',
          title: 'Successful Login',
          description: 'User logged in from IP 192.168.1.100',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          actor: user?.email,
          severity: 'low'
        },
        {
          id: '3',
          type: 'STATUS_CHANGE',
          title: 'Status Changed',
          description: 'Status changed from PENDING_VERIFICATION to ACTIVE',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          actor: 'admin@kredia.com',
          severity: 'medium'
        }
      ];
      setTimeline(mockTimeline);
    } catch (error) {
      console.error('Failed to fetch timeline:', error);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const fetchUserNotes = async () => {
    try {
      // Mock notes data - replace with actual API call
      const mockNotes: UserNote[] = [
        {
          id: '1',
          content: 'Client has excellent credit history. Fast approval recommended.',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: 'agent1@kredia.com',
          type: 'internal'
        },
        {
          id: '2',
          content: 'Flagged for unusual activity pattern. Monitor closely.',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: 'system@kredia.com',
          type: 'risk'
        }
      ];
      setNotes(mockNotes);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    }
  };

  const fetchUserDocuments = async () => {
    try {
      // Mock documents data - replace with actual API call
      const mockDocuments: UserDocument[] = [
        {
          id: '1',
          name: 'ID_Card_Front.pdf',
          type: 'application/pdf',
          size: 2048576,
          uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          uploadedBy: user?.email || '',
          url: '/documents/id_card_front.pdf'
        }
      ];
      setDocuments(mockDocuments);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  const handleSave = async () => {
    if (!user || !id) return;

    try {
      await userApi.update(Number(id), editForm);
      setUser({ ...user, ...editForm });
      setEditing(false);
      addToast('User updated successfully', 'success');
    } catch (error) {
      addToast('Failed to update user', 'error');
    }
  };

  const handleStatusChange = async (newStatus: UserStatus) => {
    if (!user || !id) return;

    try {
      await userApi.update(Number(id), { ...user, status: newStatus });
      setUser({ ...user, status: newStatus });
      addToast(`Status changed to ${newStatus}`, 'success');
      fetchUserTimeline(); // Refresh timeline
    } catch (error) {
      addToast('Failed to change status', 'error');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      const note: UserNote = {
        id: Date.now().toString(),
        content: newNote,
        createdAt: new Date().toISOString(),
        createdBy: 'current_user@kredia.com',
        type: noteType
      };
      setNotes([note, ...notes]);
      setNewNote('');
      addToast('Note added successfully', 'success');
    } catch (error) {
      addToast('Failed to add note', 'error');
    }
  };

  const getTimelineIcon = (type: TimelineEvent['type']): any => {
    switch (type) {
      case 'CREATION': return <UserCheck className="w-4 h-4 text-green-500" />;
      case 'ROLE_CHANGE': return <Shield className="w-4 h-4 text-blue-500" />;
      case 'STATUS_CHANGE': return <Activity className="w-4 h-4 text-yellow-500" />;
      case 'LOGIN': return <Lock className="w-4 h-4 text-gray-500" />;
      case 'PASSWORD_CHANGE': return <Key className="w-4 h-4 text-purple-500" />;
      case 'SECURITY_EVENT': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'PROFILE_UPDATE': return <Edit2 className="w-4 h-4 text-indigo-500" />;
      case 'ASSIGNMENT_CHANGE': return <UserCheck className="w-4 h-4 text-orange-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRiskScore = () => {
    if (!user) return 'LOW';
    if (user.status === UserStatus.BLOCKED) return 'HIGH';
    if (user.status === UserStatus.SUSPENDED) return 'MEDIUM';
    return 'LOW';
  };

  const getRiskBadge = (score: string) => {
    const colors = {
      LOW: 'bg-green-100 text-green-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-red-100 text-red-800'
    };
    return colors[score as keyof typeof colors] || colors.LOW;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">User not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link
            to="/admin/users"
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
            <p className="text-gray-600">Complete user profile and activity timeline</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <X size={16} className="mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Save size={16} className="mr-2" />
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit2 size={16} className="mr-2" />
                Edit Profile
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-bold text-xl">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-xl font-bold text-gray-900">
                      {user.firstName} {user.lastName}
                    </h2>
                    <p className="text-gray-600">{user.email}</p>
                    <div className="flex items-center mt-2 space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-800' :
                        user.role === UserRole.AGENT ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskBadge(getRiskScore())}`}>
                        Risk: {getRiskScore()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="inline w-4 h-4 mr-1" />
                    Email Address
                  </label>
                  {editing ? (
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{user.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="inline w-4 h-4 mr-1" />
                    Phone Number
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      value={editForm.phoneNumber}
                      onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{user.phoneNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Shield className="inline w-4 h-4 mr-1" />
                    Status
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.status === UserStatus.ACTIVE ? 'bg-green-100 text-green-800' :
                      user.status === UserStatus.INACTIVE ? 'bg-gray-100 text-gray-800' :
                      user.status === UserStatus.SUSPENDED ? 'bg-yellow-100 text-yellow-800' :
                      user.status === UserStatus.BLOCKED ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {user.status}
                    </span>
                    {!editing && (
                      <div className="flex space-x-1">
                        {user.status !== UserStatus.ACTIVE && (
                          <button
                            onClick={() => handleStatusChange(UserStatus.ACTIVE)}
                            className="text-green-600 hover:text-green-900"
                            title="Activate"
                          >
                            <Unlock size={14} />
                          </button>
                        )}
                        {user.status !== UserStatus.SUSPENDED && (
                          <button
                            onClick={() => handleStatusChange(UserStatus.SUSPENDED)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Suspend"
                          >
                            <Clock size={14} />
                          </button>
                        )}
                        {user.status !== UserStatus.BLOCKED && (
                          <button
                            onClick={() => handleStatusChange(UserStatus.BLOCKED)}
                            className="text-red-600 hover:text-red-900"
                            title="Block"
                          >
                            <Ban size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    Member Since
                  </label>
                  <p className="text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h3>
              
              {loadingTimeline ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {timeline.map((event, index) => (
                    <div key={event.id} className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          {getTimelineIcon(event.type)}
                        </div>
                        {index < timeline.length - 1 && (
                          <div className="w-0.5 h-16 bg-gray-200 ml-4 mt-2"></div>
                        )}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{event.title}</p>
                            <p className="text-sm text-gray-600">{event.description}</p>
                            {event.actor && (
                              <p className="text-xs text-gray-500">by {event.actor}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              {new Date(event.timestamp).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(event.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Risk Score</span>
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getRiskBadge(getRiskScore())}`}>
                  {getRiskScore()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Account Age</span>
                <span className="text-sm font-medium">
                  {Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                  user.status === UserStatus.ACTIVE ? 'bg-green-100 text-green-800' :
                  user.status === UserStatus.INACTIVE ? 'bg-gray-100 text-gray-800' :
                  user.status === UserStatus.SUSPENDED ? 'bg-yellow-100 text-yellow-800' :
                  user.status === UserStatus.BLOCKED ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {user.status}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Internal Notes</h3>
            
            {/* Add Note */}
            <div className="mb-4">
              <select
                value={noteType}
                onChange={(e) => setNoteType(e.target.value as any)}
                className="w-full mb-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="internal">Internal Note</option>
                <option value="risk">Risk Assessment</option>
                <option value="performance">Performance Note</option>
              </select>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                className="mt-2 w-full px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Add Note
              </button>
            </div>

            {/* Notes List */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {notes.map((note) => (
                <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      note.type === 'risk' ? 'bg-red-100 text-red-800' :
                      note.type === 'performance' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {note.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{note.content}</p>
                  <p className="text-xs text-gray-500 mt-1">by {note.createdBy}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
            
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 text-gray-500 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                      <p className="text-xs text-gray-500">
                        {(doc.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => window.open(doc.url, '_blank')}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    <Download size={16} />
                  </button>
                </div>
              ))}
            </div>

            <button className="mt-3 w-full px-3 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 flex items-center justify-center">
              <Upload size={16} className="mr-2" />
              Upload Document
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {confirmModal.isOpen && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={`Confirm ${confirmModal.action}`}
          message={`Are you sure you want to ${confirmModal.action.toLowerCase()} this user?`}
          onConfirm={() => {
            console.log(`Confirmed ${confirmModal.action}`);
            setConfirmModal({ isOpen: false, action: '' });
          }}
          onCancel={() => setConfirmModal({ isOpen: false, action: '' })}
        />
      )}
    </div>
  );
};

export default UserDetail;
