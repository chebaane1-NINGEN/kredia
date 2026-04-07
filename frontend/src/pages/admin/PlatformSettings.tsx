import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Shield, 
  Database, 
  Bell, 
  Mail, 
  Globe, 
  Lock,
  RefreshCw,
  Save,
  AlertTriangle,
  CheckCircle2,
  Users,
  Activity,
  Clock,
  BarChart3
} from 'lucide-react';

const PlatformSettings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // Settings state
  const [settings, setSettings] = useState({
    // General Settings
    platformName: 'KREDIA',
    platformVersion: '2.0.0',
    maintenanceMode: false,
    
    // Security Settings
    passwordMinLength: 8,
    sessionTimeout: 24, // hours
    maxLoginAttempts: 5,
    twoFactorAuth: false,
    
    // Email Settings
    emailNotifications: true,
    emailVerification: true,
    welcomeEmail: true,
    
    // System Settings
    logLevel: 'INFO',
    backupFrequency: 'daily',
    dataRetention: 365, // days
  });

  const handleSave = async () => {
    setLoading(true);
    setSaveStatus('saving');
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1500);
  };

  const handleReset = () => {
    setSettings({
      platformName: 'KREDIA',
      platformVersion: '2.0.0',
      maintenanceMode: false,
      passwordMinLength: 8,
      sessionTimeout: 24,
      maxLoginAttempts: 5,
      twoFactorAuth: false,
      emailNotifications: true,
      emailVerification: true,
      welcomeEmail: true,
      logLevel: 'INFO',
      backupFrequency: 'daily',
      dataRetention: 365,
    });
  };

  const systemStats = {
    totalUsers: 1250,
    activeUsers: 980,
    systemUptime: '99.9%',
    lastBackup: '2024-01-15 02:00 AM',
    storageUsed: '2.4 GB / 10 GB',
    apiCalls: '45,230 / day',
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Platform Settings</h1>
          <p className="text-slate-500 mt-1">Configure platform-wide settings and system preferences</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
          >
            <RefreshCw size={18} />
            Reset
          </button>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Save Status */}
      {saveStatus === 'saved' && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
          <CheckCircle2 size={18} />
          <span className="font-medium">Settings saved successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* General Settings */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="text-indigo-600" size={20} />
              <h2 className="text-xl font-bold text-slate-900">General Settings</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Platform Name</label>
                <input 
                  type="text" 
                  value={settings.platformName}
                  onChange={(e) => setSettings({...settings, platformName: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Version</label>
                <input 
                  type="text" 
                  value={settings.platformVersion}
                  onChange={(e) => setSettings({...settings, platformVersion: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Maintenance Mode</label>
                  <p className="text-xs text-slate-500">Temporarily disable user access</p>
                </div>
                <button
                  onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.maintenanceMode ? 'bg-rose-600' : 'bg-slate-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="text-indigo-600" size={20} />
              <h2 className="text-xl font-bold text-slate-900">Security Settings</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Minimum Password Length</label>
                <input 
                  type="number" 
                  value={settings.passwordMinLength}
                  onChange={(e) => setSettings({...settings, passwordMinLength: parseInt(e.target.value)})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Session Timeout (hours)</label>
                <input 
                  type="number" 
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Max Login Attempts</label>
                <input 
                  type="number" 
                  value={settings.maxLoginAttempts}
                  onChange={(e) => setSettings({...settings, maxLoginAttempts: parseInt(e.target.value)})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Two-Factor Authentication</label>
                  <p className="text-xs text-slate-500">Require 2FA for all users</p>
                </div>
                <button
                  onClick={() => setSettings({...settings, twoFactorAuth: !settings.twoFactorAuth})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.twoFactorAuth ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Email Settings */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Mail className="text-indigo-600" size={20} />
              <h2 className="text-xl font-bold text-slate-900">Email Settings</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Email Notifications</label>
                  <p className="text-xs text-slate-500">Send system notifications</p>
                </div>
                <button
                  onClick={() => setSettings({...settings, emailNotifications: !settings.emailNotifications})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.emailNotifications ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Email Verification</label>
                  <p className="text-xs text-slate-500">Require email verification</p>
                </div>
                <button
                  onClick={() => setSettings({...settings, emailVerification: !settings.emailVerification})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.emailVerification ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.emailVerification ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Welcome Email</label>
                  <p className="text-xs text-slate-500">Send welcome email to new users</p>
                </div>
                <button
                  onClick={() => setSettings({...settings, welcomeEmail: !settings.welcomeEmail})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.welcomeEmail ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.welcomeEmail ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* System Stats */}
        <div className="space-y-6">
          
          {/* System Overview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="text-indigo-600" size={20} />
              <h2 className="text-xl font-bold text-slate-900">System Overview</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Total Users</span>
                <span className="text-sm font-bold text-slate-900">{systemStats.totalUsers.toLocaleString()}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Active Users</span>
                <span className="text-sm font-bold text-emerald-600">{systemStats.activeUsers.toLocaleString()}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">System Uptime</span>
                <span className="text-sm font-bold text-emerald-600">{systemStats.systemUptime}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">API Calls / Day</span>
                <span className="text-sm font-bold text-slate-900">{systemStats.apiCalls}</span>
              </div>
            </div>
          </div>

          {/* Storage & Backup */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Database className="text-indigo-600" size={20} />
              <h2 className="text-xl font-bold text-slate-900">Storage & Backup</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Storage Used</span>
                  <span className="text-sm font-bold text-slate-900">{systemStats.storageUsed}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{width: '24%'}}></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Last Backup</span>
                <span className="text-sm font-bold text-slate-900">{systemStats.lastBackup}</span>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Backup Frequency</label>
                <select 
                  value={settings.backupFrequency}
                  onChange={(e) => setSettings({...settings, backupFrequency: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Data Retention (days)</label>
                <input 
                  type="number" 
                  value={settings.dataRetention}
                  onChange={(e) => setSettings({...settings, dataRetention: parseInt(e.target.value)})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl border border-emerald-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="text-emerald-600" size={20} />
              <h2 className="text-xl font-bold text-emerald-900">System Health</h2>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                <span className="text-sm text-emerald-800">All systems operational</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                <span className="text-sm text-emerald-800">Database connected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                <span className="text-sm text-emerald-800">Email service active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                <span className="text-sm text-emerald-800">Backup schedule running</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformSettings;
