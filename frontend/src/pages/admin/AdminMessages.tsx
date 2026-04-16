import React, { useState, useEffect } from 'react';
import { MessageDTO, UserResponseDTO, UserRole } from '../../types/user.types';
import { userApi } from '../../api/userApi';
import { useToast } from '../../contexts/ToastContext';
import { 
  Send, 
  MessageSquare, 
  Search, 
  Loader2
} from 'lucide-react';

const AdminMessages: React.FC = () => {
  const [users, setUsers] = useState<UserResponseDTO[]>([]);
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResponseDTO | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToast } = useToast();
  const currentUserId = Number(localStorage.getItem('kredia_actor_id') || '1');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userApi.search({ role: UserRole.AGENT, size: 50 });
      setUsers(response.content || []);
    } catch (error) {
      addToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId: number) => {
    try {
      setLoading(true);
      const response = await userApi.getConversation(userId, { size: 100 });
      setMessages(response.content || []);
    } catch (error) {
      console.error(error);
      addToast('Failed to load messages', 'error');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedUser || !newMessage.trim()) return;

    try {
      setLoading(true);
      const message = await userApi.sendMessage(selectedUser.id, newMessage.trim());
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      addToast('Message sent successfully', 'success');
    } catch (error) {
      console.error(error);
      addToast('Failed to send message', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-messages wow fadeInUp">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Secure Messages Workspace</h2>
          <p className="text-muted">Direct, encrypted communication with internal staff and agents</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Users Sidebar */}
        <div className="section-card lg:col-span-1 p-0">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <Loader2 className="animate-spin mx-auto" size={24} />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-muted text-sm">
                No users found
              </div>
            ) : (
              filteredUsers.map(user => (
                <div
                  key={user.id}
                  onClick={() => {
                    setSelectedUser(user);
                    fetchMessages(user.id);
                  }}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    selectedUser?.id === user.id ? 'bg-indigo-50 border-indigo-200' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-indigo-600 font-medium text-sm">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{user.firstName} {user.lastName}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      user.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="section-card lg:col-span-3 flex flex-col min-h-[500px]">
          {selectedUser ? (
            <>
              {/* Header */}
              <div className="p-4 border-b">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-indigo-600 font-medium">
                      {selectedUser.firstName.charAt(0)}{selectedUser.lastName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</h3>
                    <p className="text-sm text-gray-500">{selectedUser.role} • {selectedUser.status}</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto max-h-96">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageSquare className="mx-auto mb-2" size={32} />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map(message => (
                    <div key={message.id} className={`mb-4 flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId === currentUserId
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <span className="text-xs uppercase tracking-wide text-slate-200">{message.senderId === currentUserId ? 'You' : message.senderName || 'Sender'}</span>
                          {message.isRead ? (
                            <span className="text-[10px] text-emerald-200">Read</span>
                          ) : (
                            <span className="text-[10px] text-amber-200">Unread</span>
                          )}
                        </div>
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${message.senderId === currentUserId ? 'text-indigo-200' : 'text-gray-500'}`}>
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    disabled={loading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || loading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 min-h-[500px]">
              <div className="empty-state">
                <div className="empty-icon text-5xl mb-4 wow scaleUp">💬</div>
                <h3 className="text-xl font-bold mb-2">Select a user to start messaging</h3>
                <p className="text-muted max-w-md mx-auto">
                  Choose a user from the sidebar to begin a secure conversation.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMessages;
