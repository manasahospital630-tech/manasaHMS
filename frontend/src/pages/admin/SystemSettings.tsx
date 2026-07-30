import React, { useState, useEffect } from 'react';
import {
  Settings, Shield, Building2, Save, FileText, CheckCircle,
  Users, Layers, Lock, Search, RefreshCw, KeyRound, Server, Activity, Plus,
  Sliders, ShieldCheck, Database, Check, Eye, Edit, ChevronRight, ChevronLeft,
  X, UserPlus, Trash2, ArrowRight, UserCheck, ShieldAlert
} from 'lucide-react';
import { Table } from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import api from '../../api/client';
import { formatDateTime } from '../../utils/formatters';
import { getResolvedLogoUrl } from '../../utils/logoHelper';
import RoleMatrixManagement from './RoleMatrixManagement';

const CATEGORY_OPTIONS = [
  'Clinical',
  'Diagnostics',
  'Critical Care',
  'Administration',
  'Pharmacy',
  'Operations',
  'IT & Infrastructure'
];

const ROLE_OPTIONS = ['Doctor', 'Nurse', 'Receptionist', 'Pharmacist', 'Biller', 'Incharge', 'Admin', 'Management'];

const SECURITY_ROLES_INFO = [
  {
    role: 'Admin',
    description: 'System Administrator with unrestricted access to system configuration, user accounts, security roles, and financial records.',
    permissions: ['Full System Control', 'User Creation & Roles', 'Hospital Settings', 'Audit Logs Access', 'Financial Override'],
    color: '#ef4444',
    bg: '#fef2f2',
    userCount: 3
  },
  {
    role: 'Doctor',
    description: 'Physicians & Consultants with access to patient clinical records, OPD check-in, EMR consultation, prescriptions, and lab ordering.',
    permissions: ['OPD Consultation', 'EMR & Diagnosis', 'Prescription Creation', 'Lab Test Orders', 'Doctor Profile Dashboard'],
    color: '#0d9488',
    bg: '#f0fdf4',
    userCount: 14
  },
  {
    role: 'Nurse',
    description: 'Nursing staff responsible for patient triage, vitals capture, inpatient bed management, and assisting doctor consultations.',
    permissions: ['Triage Queue', 'Vitals Capture', 'IP Bed Management', 'Clinical Assistance', 'Patient History View'],
    color: '#0284c7',
    bg: '#f0f9ff',
    userCount: 22
  },
  {
    role: 'Receptionist',
    description: 'Front desk receptionists managing patient registration, appointment booking, OP check-in, and daily token queues.',
    permissions: ['Patient Registration', 'Appointment Booking', 'OP Check-in & Tokens', 'Patient Search', 'Queue Status'],
    color: '#8b5cf6',
    bg: '#f3e8ff',
    userCount: 9
  },
  {
    role: 'Pharmacist',
    description: 'Pharmacy staff managing medicine dispensing workstation, medicine sales, inventory stock adjustments, and reorder levels.',
    permissions: ['Dispense Workstation', 'Medicine Sales Billing', 'Inventory Management', 'Stock Reordering', 'Pharmacy Receipts'],
    color: '#d97706',
    bg: '#fffbeb',
    userCount: 8
  },
  {
    role: 'Biller',
    description: 'Accountants and billing staff generating diagnostic invoices, collecting patient payments, managing OPD/IPD bills and receipts.',
    permissions: ['Invoice Generator', 'Payment Processing', 'Diagnostics Billing', 'Receipt Printing', 'Revenue Split View'],
    color: '#059669',
    bg: '#ecfdf5',
    userCount: 6
  },
  {
    role: 'Incharge',
    description: 'Department Incharge overseeing daily department rosters, doctor consultations, queue operational flow, and unit stats.',
    permissions: ['Department Supervision', 'Consultation Tracking', 'Roster Management', 'Unit Analytics', 'Audit Log View'],
    color: '#6366f1',
    bg: '#eef2ff',
    userCount: 5
  },
  {
    role: 'Management',
    description: 'Executive management & directors viewing high-level HMS analytics, revenue charts, doctor performance metrics, and bed utilization.',
    permissions: ['Executive Dashboard', 'Revenue & Financial Analytics', 'OPD Performance Metrics', 'Bed Utilization', 'Hospital Reports'],
    color: '#475569',
    bg: '#f8fafc',
    userCount: 4
  }
];

const SystemSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'settings' | 'teams' | 'security' | 'audit'>('settings');
  
  // Real Backend State
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [resourceFilter, setResourceFilter] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const [teamCategoryFilter, setTeamCategoryFilter] = useState('');
  
  // Hospital Settings States
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalAddress, setHospitalAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [licenseInfo, setLicenseInfo] = useState('');
  const [hospitalLogo, setHospitalLogo] = useState('');
  const [theme, setTheme] = useState('dark');
  
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Team Create / Edit Modal State
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any | null>(null);
  const [teamForm, setTeamForm] = useState({
    teamId: '',
    teamName: '',
    category: 'Clinical',
    teamType: 'Owner',
    teamLeadId: '',
    status: 'Active',
    description: '',
    roles: [] as string[]
  });

  // Dual-List Member Allocation Drawer State
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [activeTeamForMembers, setActiveTeamForMembers] = useState<any | null>(null);
  const [assignedMembers, setAssignedMembers] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedSecurityRoles, setSelectedSecurityRoles] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState('');

  const fetchSettings = async () => {
    try {
      const res = await api.get('/admin/hospital-settings');
      if (res.data.success && res.data.data) {
        const s = res.data.data;
        setHospitalName(s.hospital_name || '');
        setHospitalAddress(s.hospital_address || '');
        setPhoneNumber(s.phone_number || '');
        setWebsite(s.website || '');
        setEmail(s.email || '');
        setGstin(s.gstin || '');
        setLicenseInfo(s.license_info || '');
        setHospitalLogo(s.hospital_logo || '');
        setTheme(s.theme || 'dark');
      }
    } catch (err) {
      console.error('Failed to fetch hospital settings');
    }
  };

  const fetchTeamsAndUsers = async () => {
    try {
      const teamsRes = await api.get('/admin/teams');
      if (teamsRes.data.success) {
        setTeams(teamsRes.data.data || []);
      }
      const usersRes = await api.get('/admin/users?limit=500');
      if (usersRes.data) {
        const uList = usersRes.data.data?.users || usersRes.data.data || usersRes.data.users || [];
        setUsers(Array.isArray(uList) ? uList : []);
      }
    } catch (err) {
      console.error('Failed to load teams and users:', err);
    }
  };

  const fetchLogs = () => {
    const params = resourceFilter ? `?resourceType=${resourceFilter}&limit=100` : '?limit=100';
    api.get(`/admin/audit-log${params}`).then(r => setLogs(r.data.data || [])).catch(() => {});
  };

  useEffect(() => {
    fetchSettings();
    fetchTeamsAndUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchLogs();
    }
  }, [resourceFilter, activeTab]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveSuccess(false);
    setErrorMsg('');
    try {
      const res = await api.put('/admin/hospital-settings', {
        hospitalName,
        hospitalAddress,
        phoneNumber,
        website,
        email,
        gstin,
        licenseInfo,
        hospitalLogo,
        theme
      });
      if (res.data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        fetchLogs();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to save hospital settings.');
    } finally {
      setSaveLoading(false);
    }
  };

  // Team Create / Edit Handlers
  const handleOpenCreateTeam = () => {
    setEditingTeam(null);
    setTeamForm({
      teamId: `TEAM-0${teams.length + 1}`,
      teamName: '',
      category: 'Clinical',
      teamType: 'Owner',
      teamLeadId: '',
      status: 'Active',
      description: '',
      roles: ['Doctor', 'Nurse']
    });
    setShowTeamModal(true);
  };

  const handleOpenEditTeam = (team: any) => {
    setEditingTeam(team);
    setTeamForm({
      teamId: team.teamId,
      teamName: team.teamName,
      category: team.category || 'Clinical',
      teamType: team.teamType || 'Owner',
      teamLeadId: team.teamLeadId || '',
      status: team.status || 'Active',
      description: team.description || '',
      roles: team.roles || []
    });
    setShowTeamModal(true);
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTeam) {
        await api.put(`/admin/teams/${editingTeam.teamId}`, teamForm);
      } else {
        await api.post('/admin/teams', teamForm);
      }
      setShowTeamModal(false);
      fetchTeamsAndUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save team.');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!window.confirm(`Are you sure you want to delete Team ${teamId}?`)) return;
    try {
      await api.delete(`/admin/teams/${teamId}`);
      fetchTeamsAndUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete team.');
    }
  };

  // Member Allocation Handlers
  const handleOpenMemberAllocation = async (team: any) => {
    setActiveTeamForMembers(team);
    try {
      const res = await api.get(`/admin/teams/${team.teamId}/members`);
      if (res.data.success) {
        setAssignedMembers(res.data.data.assignedMembers || []);
        setAvailableUsers(res.data.data.availableUsers || []);
        setSelectedSecurityRoles(res.data.data.securityRoles || team.roles || []);
      }
    } catch (err) {
      console.error('Failed to load team members:', err);
    }
    setShowMemberModal(true);
  };

  const handleAddMember = (user: any) => {
    setAvailableUsers(availableUsers.filter(u => u.user_id !== user.user_id));
    setAssignedMembers([...assignedMembers, user]);
  };

  const handleRemoveMember = (user: any) => {
    setAssignedMembers(assignedMembers.filter(u => u.user_id !== user.user_id));
    setAvailableUsers([...availableUsers, user]);
  };

  const handleAddAllMembers = () => {
    const filteredAvailable = availableUsers.filter(u => {
      const matchesSearch = !memberSearch || `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(memberSearch.toLowerCase());
      const matchesRole = !memberRoleFilter || u.role === memberRoleFilter;
      return matchesSearch && matchesRole;
    });
    setAssignedMembers([...assignedMembers, ...filteredAvailable]);
    setAvailableUsers(availableUsers.filter(u => !filteredAvailable.includes(u)));
  };

  const handleRemoveAllMembers = () => {
    setAvailableUsers([...availableUsers, ...assignedMembers]);
    setAssignedMembers([]);
  };

  const handleSaveTeamMembersAndRoles = async () => {
    if (!activeTeamForMembers) return;
    try {
      const memberUserIds = assignedMembers.map(m => m.user_id);
      await api.post(`/admin/teams/${activeTeamForMembers.teamId}/members`, { memberUserIds });
      await api.post(`/admin/teams/${activeTeamForMembers.teamId}/roles`, { roles: selectedSecurityRoles });
      setShowMemberModal(false);
      fetchTeamsAndUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update team members and roles.');
    }
  };

  const filteredTeams = teams.filter(t => {
    const matchesSearch = !teamSearch || `${t.teamId} ${t.teamName} ${t.teamLeadName}`.toLowerCase().includes(teamSearch.toLowerCase());
    const matchesCategory = !teamCategoryFilter || t.category === teamCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ color: 'var(--text-primary)', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings size={28} color="var(--accent-primary)" />
            System Administration & Settings
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px' }}>
            Manage hospital profile, functional teams, team heads, security roles, and audit log history
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------------- */}
      {/* TABS NAVIGATION BAR */}
      {/* ------------------------------------------------------------------------- */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-primary)', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { id: 'settings', label: 'System Settings', icon: Sliders },
          { id: 'teams', label: 'Hospital Users & Functional Teams', icon: Users },
          { id: 'security', label: 'Security Roles & RBAC Matrix', icon: ShieldCheck },
          { id: 'audit', label: 'System Audit Logs', icon: FileText }
        ].map(tab => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 700,
                background: isActive ? 'rgba(13,148,136,0.08)' : 'transparent',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                border: 'none',
                borderBottom: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                borderRadius: '8px 8px 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '-1px'
              }}
            >
              <IconComp size={18} color={isActive ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ------------------------------------------------------------------------- */}
      {/* TAB 1: SYSTEM SETTINGS */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === 'settings' && (
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
          {/* Hospital details card */}
          <Card title="Hospital Profile & Licensing" icon={<Building2 size={20} />}>
            <form onSubmit={handleSaveSettings}>
              <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                {errorMsg && (
                  <div style={{ color: 'var(--accent-danger)', fontSize: 'var(--font-sm)', padding: 'var(--space-sm)', background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-sm)' }}>
                    ⚠️ {errorMsg}
                  </div>
                )}
                {saveSuccess && (
                  <div style={{ color: 'var(--accent-success)', fontSize: 'var(--font-sm)', padding: 'var(--space-sm)', background: 'rgba(34,197,94,0.08)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle size={16} /> Hospital details saved successfully!
                  </div>
                )}

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                  <Input
                    label="Hospital Name *"
                    value={hospitalName}
                    onChange={e => setHospitalName(e.target.value)}
                    required
                  />
                  <Input
                    label="GSTIN / Tax ID *"
                    value={gstin}
                    onChange={e => setGstin(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gap: 'var(--space-xs)' }}>
                  <label style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--text-secondary)' }}>Hospital Address *</label>
                  <textarea
                    className="input"
                    style={{ minHeight: 80, resize: 'vertical', padding: '10px' }}
                    value={hospitalAddress}
                    onChange={e => setHospitalAddress(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                  <Input
                    label="Phone Number(s) *"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    required
                  />
                  <Input
                    label="Email Address *"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', alignItems: 'center' }}>
                  <Input
                    label="Website Link *"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                    required
                  />
                  <div style={{ display: 'grid', gap: 'var(--space-xs)' }}>
                    <label style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--text-secondary)' }}>Hospital Logo</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setHospitalLogo(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        style={{ fontSize: '12px' }}
                      />
                      {hospitalLogo && (
                        <img
                          src={getResolvedLogoUrl(hospitalLogo) || hospitalLogo}
                          alt="Logo Preview"
                          style={{ height: 44, maxWidth: 120, objectFit: 'contain', border: '1px solid var(--border-primary)', borderRadius: 6, background: '#fff', padding: '2px 4px' }}
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 'var(--space-xs)' }}>
                  <label style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--text-secondary)' }}>License & Legal Info</label>
                  <textarea
                    className="input"
                    style={{ minHeight: 60, resize: 'vertical', padding: '10px' }}
                    value={licenseInfo}
                    onChange={e => setLicenseInfo(e.target.value)}
                    placeholder="e.g. Pharmacy License No, Hospital Reg No, etc."
                  />
                </div>

                <div style={{ display: 'grid', gap: 'var(--space-xs)' }}>
                  <label style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--text-secondary)' }}>System Theme (Applies to all users) *</label>
                  <select
                    className="select"
                    value={theme}
                    onChange={e => {
                      const newTheme = e.target.value;
                      setTheme(newTheme);
                      const html = document.documentElement;
                      if (newTheme === 'light') {
                        html.classList.add('light-theme');
                      } else {
                        html.classList.remove('light-theme');
                      }
                    }}
                    required
                  >
                    <option value="dark">Dark Theme (Neon / Midnight)</option>
                    <option value="light">Light Theme (Clean / Slate)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-md)' }}>
                  <Button variant="primary" type="submit" icon={<Save size={16} />} loading={saveLoading}>
                    Save Hospital Profile
                  </Button>
                </div>
              </div>
            </form>
          </Card>

          {/* System info column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            <Card title="System Diagnostics" icon={<Settings size={20} />}>
              <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', display: 'grid', gap: 'var(--space-xs)' }}>
                <div><strong>Application Version:</strong> 1.0.0</div>
                <div><strong>Deployment Env:</strong> Production / Hostinger</div>
                <div><strong>API Server Status:</strong> 🟢 Online (Express Node.js)</div>
                <div><strong>Database:</strong> PostgreSQL 17 (Cloud Managed)</div>
                <div><strong>System Timezone:</strong> IST (+05:30) / Asia/Kolkata</div>
              </div>
            </Card>
            
            <Card title="Security & Access Shield" icon={<Shield size={20} />}>
              <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', display: 'grid', gap: 'var(--space-xs)' }}>
                <div><strong>Session Auth:</strong> JSON Web Tokens (JWT)</div>
                <div><strong>Password Hashing:</strong> bcryptjs (12 salt rounds)</div>
                <div><strong>RBAC Shielding:</strong> 8 Active Staff Roles</div>
                <div><strong>Security Auditing:</strong> Full audit logs enabled</div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* TAB 2: HOSPITAL USERS & FUNCTIONAL TEAMS */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === 'teams' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Header Controls & Filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={22} color="var(--accent-primary)" />
                Hospital Teams & Staff Allocations
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '2px 0 0 0' }}>
                Functional hospital teams, team lead incharge assignments, member allocations, and inherited security roles
              </p>
            </div>

            <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenCreateTeam}>
              + Create New Team
            </Button>
          </div>

          {/* Search & Filter Bar */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ width: '280px' }}>
              <Input 
                placeholder="Search Team Code, Name, or Team Head..." 
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
              />
            </div>
            <div style={{ width: '200px' }}>
              <select
                className="select"
                value={teamCategoryFilter}
                onChange={(e) => setTeamCategoryFilter(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)', borderRadius: '8px' }}
              >
                <option value="">All Categories</option>
                {CATEGORY_OPTIONS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginLeft: 'auto' }}>
              Showing {filteredTeams.length} Hospital Teams
            </span>
          </div>

          {/* Teams Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
            {filteredTeams.map((team: any) => (
              <div key={team.teamId} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                
                <div>
                  {/* Header: Team Code + Name + Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-primary)', background: 'rgba(13,148,136,0.1)', padding: '3px 8px', borderRadius: '6px', letterSpacing: '0.5px' }}>
                        {team.teamId}
                      </span>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '6px 0 2px 0', color: 'var(--text-primary)' }}>
                        {team.teamName}
                      </h3>
                      {team.description && (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                          {team.description}
                        </div>
                      )}
                    </div>
                    <Badge variant={team.status === 'Active' ? 'success' : 'danger'}>
                      {team.status}
                    </Badge>
                  </div>

                  {/* Metadata Grid */}
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, background: 'var(--bg-secondary)', padding: '12px', borderRadius: '10px', marginBottom: '14px' }}>
                    <div><strong>Category:</strong> <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{team.category}</span></div>
                    <div><strong>Team Head / Incharge:</strong> <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{team.teamLeadName}</span></div>
                    <div><strong>Team Type:</strong> <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{team.teamType} Team</span></div>
                    <div><strong>Active Staff Members:</strong> <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{team.memberCount} Members</span></div>
                  </div>

                  {/* Security Roles */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                      Inherited Security Roles:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {team.roles && team.roles.length > 0 ? (
                        team.roles.map((r: string) => (
                          <span key={r} style={{ fontSize: '11px', background: 'rgba(13,148,136,0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(13,148,136,0.2)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                            ✓ {r}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No security roles assigned</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Quick Actions */}
                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-primary)', paddingTop: '14px', marginTop: 'auto' }}>
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    icon={<Edit size={13} />} 
                    onClick={() => handleOpenEditTeam(team)}
                  >
                    Edit Team
                  </Button>
                  <Button 
                    size="sm" 
                    variant="primary" 
                    icon={<Users size={13} />} 
                    onClick={() => handleOpenMemberAllocation(team)}
                  >
                    Manage Members
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    icon={<Trash2 size={13} />} 
                    onClick={() => handleDeleteTeam(team.teamId)}
                    style={{ color: 'var(--accent-danger)' }}
                  />
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* TAB 3: SECURITY ROLES & RBAC MATRIX */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === 'security' && (
        <RoleMatrixManagement />
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* TAB 4: SYSTEM AUDIT LOGS */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === 'audit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={22} style={{ color: 'var(--accent-primary)' }} />
                Auditable System Log Trail
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '2px 0 0 0' }}>
                Real-time security log entries of system modifications, user creations, and setting updates
              </p>
            </div>

            <Button variant="secondary" icon={<RefreshCw size={14} />} onClick={fetchLogs}>
              Refresh Logs
            </Button>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <Input 
                placeholder="Filter by resource type (User, Doctor...)" 
                value={resourceFilter} 
                onChange={e => setResourceFilter(e.target.value)} 
              />
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Total Log Entries: {logs.length}
            </span>
          </div>

          <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px', overflow: 'hidden' }}>
            <Table columns={[
              { key: 'user_name', label: 'User Name', render: (v, row) => (
                <div>
                  <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{v || 'System'}</strong>
                  {row.user_email && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.user_email}</div>}
                </div>
              )},
              { key: 'action', label: 'Action', render: (v) => (
                <span style={{ fontWeight: 700, fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: v === 'CREATE' ? '#dcfce7' : v === 'UPDATE' ? '#e0f2fe' : '#fee2e2', color: v === 'CREATE' ? '#166534' : v === 'UPDATE' ? '#0369a1' : '#991b1b' }}>
                  {v}
                </span>
              )},
              { key: 'resource_type', label: 'Resource Type', render: (v) => <strong style={{ fontSize: '12px', color: 'var(--accent-primary)' }}>{v}</strong> },
              { key: 'resource_id', label: 'Resource ID', render: (v) => v ? <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{v.substring(0, 10)}...</span> : '—' },
              { key: 'ip_address', label: 'IP Address', render: (v) => v || '127.0.0.1' },
              { key: 'created_at', label: 'Timestamp', render: (v) => formatDateTime(v) },
            ]} data={logs} />
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* CREATE / EDIT TEAM MODAL */}
      {/* ------------------------------------------------------------------------- */}
      {showTeamModal && (
        <Modal
          isOpen={showTeamModal}
          onClose={() => setShowTeamModal(false)}
          title={editingTeam ? `Edit Team (${editingTeam.teamId})` : 'Create New Hospital Team'}
        >
          <form onSubmit={handleSaveTeam} style={{ display: 'grid', gap: '16px', padding: '8px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input
                label="Team Code *"
                value={teamForm.teamId}
                onChange={(e) => setTeamForm({ ...teamForm, teamId: e.target.value })}
                placeholder="e.g. TEAM-09"
                required
                disabled={!!editingTeam}
              />
              <Input
                label="Team Name *"
                value={teamForm.teamName}
                onChange={(e) => setTeamForm({ ...teamForm, teamName: e.target.value })}
                placeholder="e.g. Cardiology OPD Team"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Category *</label>
                <select
                  className="select"
                  value={teamForm.category}
                  onChange={(e) => setTeamForm({ ...teamForm, category: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)', borderRadius: '8px' }}
                  required
                >
                  {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Team Head / Lead Incharge *</label>
                <select
                  className="select"
                  value={teamForm.teamLeadId}
                  onChange={(e) => setTeamForm({ ...teamForm, teamLeadId: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)', borderRadius: '8px' }}
                >
                  <option value="">-- Select Team Head / Incharge User --</option>
                  {users.map(u => (
                    <option key={u.user_id} value={u.user_id}>
                      {u.first_name} {u.last_name} ({u.role} - {u.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Team Type *</label>
                <select
                  className="select"
                  value={teamForm.teamType}
                  onChange={(e) => setTeamForm({ ...teamForm, teamType: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)', borderRadius: '8px' }}
                >
                  <option value="Owner">Owner Team (Owns records & security roles)</option>
                  <option value="Access">Access Team (View sharing only)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Status</label>
                <select
                  className="select"
                  value={teamForm.status}
                  onChange={(e) => setTeamForm({ ...teamForm, status: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)', borderRadius: '8px' }}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Description</label>
              <textarea
                className="input"
                style={{ minHeight: 60, resize: 'vertical', padding: '10px' }}
                value={teamForm.description}
                onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                placeholder="Brief description of the team's operational scope..."
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Inherited Security Roles (Multiselect)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
                {ROLE_OPTIONS.map(r => (
                  <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={teamForm.roles.includes(r)}
                      onChange={(e) => {
                        if (e.target.checked) setTeamForm({ ...teamForm, roles: [...teamForm.roles, r] });
                        else setTeamForm({ ...teamForm, roles: teamForm.roles.filter(x => x !== r) });
                      }}
                    />
                    {r}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <Button type="button" variant="secondary" onClick={() => setShowTeamModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary" icon={<Save size={16} />}>
                {editingTeam ? 'Save Changes' : 'Create Team'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* DUAL-LIST MEMBER ALLOCATION & SECURITY ROLES MODAL */}
      {/* ------------------------------------------------------------------------- */}
      {showMemberModal && activeTeamForMembers && (
        <Modal
          isOpen={showMemberModal}
          onClose={() => setShowMemberModal(false)}
          title={`Team Member Allocation & Roles: ${activeTeamForMembers.teamName}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '8px 0', minWidth: '700px' }}>
            
            {/* Section A: Team Details & Security Roles */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Team Info & Inherited Security Roles
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', marginBottom: '12px' }}>
                <div><strong>Team ID:</strong> {activeTeamForMembers.teamId}</div>
                <div><strong>Team Head:</strong> {activeTeamForMembers.teamLeadName}</div>
                <div><strong>Team Type:</strong> {activeTeamForMembers.teamType} Team</div>
                <div><strong>Current Members:</strong> {assignedMembers.length} Staff</div>
              </div>

              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Inherited Security Roles for Team Members:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {ROLE_OPTIONS.map(roleName => {
                  const isChecked = selectedSecurityRoles.includes(roleName);
                  return (
                    <label key={roleName} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', background: isChecked ? 'rgba(13,148,136,0.1)' : 'var(--bg-card)', border: `1px solid ${isChecked ? 'var(--accent-primary)' : 'var(--border-primary)'}`, padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', color: isChecked ? 'var(--accent-primary)' : 'var(--text-primary)', fontWeight: isChecked ? 700 : 500 }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedSecurityRoles([...selectedSecurityRoles, roleName]);
                          else setSelectedSecurityRoles(selectedSecurityRoles.filter(x => x !== roleName));
                        }}
                      />
                      {roleName}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Section B: Member Allocation (Dual-List Component) */}
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
                Multi-Select Member Allocation (Dual-List)
              </div>

              {/* Filter Row */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <Input 
                    placeholder="Search staff users by name or email..." 
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                  />
                </div>
                <div style={{ width: '180px' }}>
                  <select
                    className="select"
                    value={memberRoleFilter}
                    onChange={(e) => setMemberRoleFilter(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)', borderRadius: '8px' }}
                  >
                    <option value="">All Roles</option>
                    {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              {/* Dual List Container */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1fr', gap: '12px', alignItems: 'center' }}>
                
                {/* Left Column: Available Users */}
                <div style={{ border: '1px solid var(--border-primary)', borderRadius: '10px', background: 'var(--bg-card)', overflow: 'hidden' }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: '8px 12px', borderBottom: '1px solid var(--border-primary)', fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)' }}>
                    Available Staff Users ({availableUsers.length})
                  </div>
                  <div style={{ height: '260px', overflowY: 'auto', padding: '6px' }}>
                    {availableUsers
                      .filter(u => {
                        const matchQ = !memberSearch || `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(memberSearch.toLowerCase());
                        const matchR = !memberRoleFilter || u.role === memberRoleFilter;
                        return matchQ && matchR;
                      })
                      .map(u => (
                        <div
                          key={u.user_id}
                          onClick={() => handleAddMember(u)}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '6px', marginBottom: '4px', cursor: 'pointer', background: 'var(--bg-secondary)', fontSize: '12px' }}
                        >
                          <div>
                            <strong style={{ color: 'var(--text-primary)' }}>{u.first_name} {u.last_name}</strong>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{u.role} • {u.email}</div>
                          </div>
                          <span style={{ color: 'var(--accent-primary)', fontWeight: 800 }}>+</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Center Control Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={handleAddAllMembers}
                    style={{ background: 'var(--accent-primary)', color: '#fff', border: 'none', width: '36px', height: '36px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
                    title="Add All"
                  >
                    &gt;&gt;
                  </button>
                  <button
                    onClick={handleRemoveAllMembers}
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', width: '36px', height: '36px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
                    title="Remove All"
                  >
                    &lt;&lt;
                  </button>
                </div>

                {/* Right Column: Assigned Members */}
                <div style={{ border: '1px solid var(--border-primary)', borderRadius: '10px', background: 'var(--bg-card)', overflow: 'hidden' }}>
                  <div style={{ background: 'rgba(13,148,136,0.08)', padding: '8px 12px', borderBottom: '1px solid var(--border-primary)', fontWeight: 700, fontSize: '12px', color: 'var(--accent-primary)' }}>
                    Assigned Team Members ({assignedMembers.length})
                  </div>
                  <div style={{ height: '260px', overflowY: 'auto', padding: '6px' }}>
                    {assignedMembers.map(u => (
                      <div
                        key={u.user_id}
                        onClick={() => handleRemoveMember(u)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '6px', marginBottom: '4px', cursor: 'pointer', background: 'rgba(13,148,136,0.05)', border: '1px solid rgba(13,148,136,0.2)', fontSize: '12px' }}
                      >
                        <div>
                          <strong style={{ color: 'var(--text-primary)' }}>{u.first_name} {u.last_name}</strong>
                          <div style={{ fontSize: '10px', color: 'var(--accent-primary)' }}>{u.role} • {u.email}</div>
                        </div>
                        <span style={{ color: 'var(--accent-danger)', fontWeight: 800 }}>✕</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <Button type="button" variant="secondary" onClick={() => setShowMemberModal(false)}>Cancel</Button>
              <Button type="button" variant="primary" icon={<Save size={16} />} onClick={handleSaveTeamMembersAndRoles}>
                Save Team Configuration
              </Button>
            </div>

          </div>
        </Modal>
      )}

    </div>
  );
};

export default SystemSettings;
