import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Edit, Search, CheckCircle, AlertCircle, Building2, Lock, ShieldCheck, Stethoscope, Eye, Trash2 } from 'lucide-react';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { RoleBadge } from '../../components/shared/RoleBadge';
import { Badge } from '../../components/ui/Badge';
import api from '../../api/client';
import { formatCurrency } from '../../utils/formatters';

const DEPARTMENT_OPTIONS = [
  'General Medicine',
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Gynecology & Obstetrics',
  'Dermatology',
  'Ophthalmology',
  'ENT (Otolaryngology)',
  'Radiology',
  'Laboratory / Pathology',
  'Surgery / OT',
  'Emergency / ICU',
  'Inpatient (IP)',
  'Outpatient (OPD)',
  'Pharmacy',
  'Billing & Finance',
  'Administration',
  'Other'
];

const ROLE_OPTIONS = [
  { value: 'Doctor', label: 'Doctor / Physician' },
  { value: 'Nurse', label: 'Nurse / Nursing Staff' },
  { value: 'Receptionist', label: 'Receptionist / Front Desk' },
  { value: 'Pharmacist', label: 'Pharmacist' },
  { value: 'Biller', label: 'Biller / Accountant' },
  { value: 'Incharge', label: 'Department Incharge' },
  { value: 'Management', label: 'Hospital Management' },
  { value: 'Admin', label: 'System Administrator' },
];

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [customDept, setCustomDept] = useState('');

  // Delete Confirm Modal State
  const [deletingUser, setDeletingUser] = useState<any | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setDeleteLoading(true);
    setError('');
    try {
      await api.delete(`/admin/users/${deletingUser.user_id}`);
      setSuccess(`Staff member "${deletingUser.first_name} ${deletingUser.last_name}" deleted successfully.`);
      setDeleteModalOpen(false);
      setDeletingUser(null);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete user.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'Doctor',
    department: 'General Medicine',
    specialization: '',
    licenseNumber: '',
    consultationFee: '0',
    isActive: true,
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [dynamicRoles, setDynamicRoles] = useState<any[]>([]);

  const [departmentOptionsList, setDepartmentOptionsList] = useState<string[]>(DEPARTMENT_OPTIONS);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [userRes, rolesRes, deptRes] = await Promise.all([
        api.get(`/admin/users?search=${encodeURIComponent(search)}&limit=200`),
        api.get('/admin/roles').catch(() => ({ data: { data: [] } })),
        api.get('/departments').catch(() => ({ data: { data: [] } }))
      ]);
      setUsers(userRes.data.data?.users || []);
      if (rolesRes.data.data && rolesRes.data.data.length > 0) {
        setDynamicRoles(rolesRes.data.data);
      }
      if (deptRes.data?.data && deptRes.data.data.length > 0) {
        const fetched = deptRes.data.data.map((d: any) => d.departmentName);
        const combined = Array.from(new Set([...fetched, ...DEPARTMENT_OPTIONS]));
        setDepartmentOptionsList(combined);
      }
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      role: 'Doctor',
      department: 'General Medicine',
      specialization: '',
      licenseNumber: '',
      consultationFee: '500',
      isActive: true,
    });
    setCustomDept('');
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    const dept = user.department || user.employee_department || '';
    const isCustom = dept && !DEPARTMENT_OPTIONS.includes(dept);

    setForm({
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '', // Blank means keep unchanged
      role: user.role || 'Doctor',
      department: isCustom ? 'Other' : (dept || 'General Medicine'),
      specialization: user.employee_specialization || '',
      licenseNumber: user.license_number || '',
      consultationFee: parseFloat(user.consultation_fee || '0').toString(),
      isActive: user.is_active !== undefined ? user.is_active : true,
    });

    if (isCustom) {
      setCustomDept(dept);
    } else {
      setCustomDept('');
    }

    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaveLoading(true);

    try {
      const finalDept = form.department === 'Other' ? customDept : form.department;

      const payload: any = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        role: form.role,
        department: finalDept,
        specialization: form.specialization,
        licenseNumber: form.licenseNumber,
        consultationFee: parseFloat(form.consultationFee || '0'),
        isActive: form.isActive,
      };

      if (editingUser) {
        if (form.password && form.password.trim().length > 0) {
          payload.password = form.password;
        }
        await api.patch(`/admin/users/${editingUser.user_id}`, payload);
        setSuccess('User details updated successfully!');
      } else {
        if (!form.password || form.password.length < 6) {
          setError('Password must be at least 6 characters.');
          setSaveLoading(false);
          return;
        }
        payload.password = form.password;
        await api.post('/admin/users', payload);
        setSuccess('New user created successfully!');
      }

      setShowModal(false);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Operation failed.');
    } finally {
      setSaveLoading(false);
    }
  };

  const toggleActive = async (user: any) => {
    try {
      await api.patch(`/admin/users/${user.user_id}`, { isActive: !user.is_active });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to toggle status');
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!roleFilter) return true;
    return u.role === roleFilter;
  });

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={28} color="var(--accent-primary)" />
            User Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px' }}>
            Create and edit hospital doctors, staff members, department assignments, and login credentials
          </p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenCreate}>
          Create New User
        </Button>
      </div>

      {success && (
        <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--accent-success)', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', minWidth: '280px' }}>
          <Input
            placeholder="Search by name, email, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ width: '200px' }}>
          <select
            className="select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ width: '100%', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)', padding: '8px 12px', borderRadius: '8px' }}
          >
            <option value="">All Staff Roles</option>
            {(dynamicRoles.length > 0
              ? dynamicRoles.map((r: any) => ({ value: r.role_name, label: `${r.role_name}${r.is_system_role ? '' : ' (Custom)'}` }))
              : ROLE_OPTIONS
            ).map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: 'auto', fontWeight: 600 }}>
          Total Users: {filteredUsers.length}
        </span>
      </div>

      {/* Users Table */}
      <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px', overflow: 'hidden' }}>
        <Table
          columns={[
            {
              key: 'name',
              label: 'Staff Member Name',
              render: (_, row) => (
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>
                    {row.first_name} {row.last_name}
                  </div>
                  {row.license_number && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Reg: {row.license_number}</div>
                  )}
                </div>
              ),
            },
            {
              key: 'email',
              label: 'Contact Info',
              render: (_, row) => (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{row.email}</div>
                  {row.phone && <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{row.phone}</div>}
                </div>
              ),
            },
            {
              key: 'role',
              label: 'System Role',
              render: (v) => <RoleBadge role={v} />,
            },
            {
              key: 'department',
              label: 'Department & Specialization',
              render: (_, row) => {
                const dept = row.department || row.employee_department || '—';
                const spec = row.employee_specialization;
                return (
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                      {dept}
                    </span>
                    {spec && <div style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 500 }}>{spec}</div>}
                  </div>
                );
              },
            },
            {
              key: 'consultation_fee',
              label: 'Consulting Fee',
              render: (v, row) => (row.role === 'Doctor' ? formatCurrency(v || 0) : '—'),
            },
            {
              key: 'is_active',
              label: 'Status',
              render: (v) => (
                <Badge variant={v ? 'success' : 'danger'}>
                  {v ? 'Active' : 'Inactive'}
                </Badge>
              ),
            },
            {
              key: 'actions',
              label: 'Actions',
              render: (_, row) => (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<Eye size={14} />}
                    onClick={() => navigate(`/staff/profile/${row.user_id}`)}
                    title="View role-based staff or doctor profile"
                    style={{ background: '#0d9488', borderColor: '#0d9488' }}
                  >
                    View Profile
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Edit size={14} />}
                    onClick={() => handleOpenEdit(row)}
                    title="Edit user details and department"
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant={row.is_active ? 'secondary' : 'success'}
                    onClick={() => toggleActive(row)}
                  >
                    {row.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    icon={<Trash2 size={14} />}
                    onClick={() => {
                      setDeletingUser(row);
                      setDeleteModalOpen(true);
                    }}
                    title="Delete staff member account"
                    style={{ background: '#ef4444', borderColor: '#dc2626' }}
                  >
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
          data={filteredUsers}
        />
      </div>

      {/* User Create / Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '12px', width: '100%', maxWidth: '580px', padding: '24px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {editingUser ? <Edit size={20} color="var(--accent-primary)" /> : <Plus size={20} color="var(--accent-primary)" />}
              {editingUser ? `Edit User: ${editingUser.first_name} ${editingUser.last_name}` : 'Create New Hospital User'}
            </h2>

            {error && (
              <div style={{ color: 'var(--accent-danger)', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <Input
                    label="First Name *"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    required
                    placeholder="First Name"
                  />
                  <Input
                    label="Last Name *"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    required
                    placeholder="Last Name"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <Input
                    label="Email Address *"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    placeholder="doctor@hospital.com"
                  />
                  <Input
                    label="Phone Number"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 9876543210"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      System Role *
                    </label>
                    <select
                      className="select"
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      required
                      style={{ width: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    >
                      {(dynamicRoles.length > 0
                        ? dynamicRoles.map((r: any) => ({ value: r.role_name, label: `${r.role_name}${r.is_system_role ? '' : ' (Custom Security Role)'}` }))
                        : ROLE_OPTIONS
                      ).map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Department *
                    </label>
                    <select
                      className="select"
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      required
                      style={{ width: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    >
                      {departmentOptionsList.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {form.department === 'Other' && (
                  <div>
                    <Input
                      label="Specify Custom Department Name *"
                      value={customDept}
                      onChange={(e) => setCustomDept(e.target.value)}
                      required
                      placeholder="e.g. Oncology, Nephrology, etc."
                    />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <Input
                    label="Specialization / Designation"
                    value={form.specialization}
                    onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                    placeholder="e.g. Senior Cardiologist, MD"
                  />
                  <Input
                    label="License / Reg. Number"
                    value={form.licenseNumber}
                    onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                    placeholder="e.g. MCI-2024-8841"
                  />
                </div>

                {form.role === 'Doctor' && (
                  <div>
                    <Input
                      label="OPD Consultation Fee (₹)"
                      type="number"
                      min="0"
                      step="50"
                      value={form.consultationFee}
                      onChange={(e) => setForm({ ...form, consultationFee: e.target.value })}
                      placeholder="e.g. 500"
                    />
                  </div>
                )}

                <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-primary)' }}>
                  <Input
                    label={editingUser ? "Reset Password (Leave blank to keep current password)" : "Password *"}
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required={!editingUser}
                    placeholder={editingUser ? "Enter new password if resetting..." : "At least 6 characters"}
                  />
                </div>

                {editingUser && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      />
                      Account Active Status
                    </label>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px', borderTop: '1px solid var(--border-primary)', paddingTop: '16px' }}>
                  <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" loading={saveLoading}>
                    {editingUser ? 'Update User Details' : 'Create User'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm User Account Deletion"
      >
        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={{ padding: '14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '14px' }}>
            ⚠️ <strong>Warning:</strong> You are about to delete staff user <strong>{deletingUser?.first_name} {deletingUser?.last_name}</strong> ({deletingUser?.email} - {deletingUser?.role}). This action will revoke their login access immediately.
          </div>

          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
            Are you sure you want to delete this staff member? If they have linked medical records or appointments, their account status will be deactivated safely.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleConfirmDelete} 
              loading={deleteLoading}
              style={{ background: '#ef4444', borderColor: '#dc2626' }}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;
