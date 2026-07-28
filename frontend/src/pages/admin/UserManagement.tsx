import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Edit, Search, CheckCircle, AlertCircle, Building2, Lock, ShieldCheck, Stethoscope, Eye, Trash2, Microscope, HeartPulse, Pill, Briefcase } from 'lucide-react';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { RoleBadge } from '../../components/shared/RoleBadge';
import { Badge } from '../../components/ui/Badge';
import api from '../../api/client';
import { formatCurrency } from '../../utils/formatters';

const CORE_CATEGORIES = [
  'Clinical Departments',
  'Diagnostic & Laboratory',
  'Nursing & Inpatient Care',
  'Surgical & Procedural',
  'Allied Health & Support',
  'Administrative & Operations'
];

const DEFAULT_ROLE_FOR_CATEGORY: Record<string, string> = {
  'Clinical Departments': 'Doctor',
  'Diagnostic & Laboratory': 'Lab Technician',
  'Nursing & Inpatient Care': 'Nurse',
  'Surgical & Procedural': 'Doctor',
  'Allied Health & Support': 'Pharmacist',
  'Administrative & Operations': 'Billing'
};

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

  // Raw departments fetched from GET /departments
  const [rawDepartments, setRawDepartments] = useState<any[]>([]);
  const [dynamicRoles, setDynamicRoles] = useState<any[]>([]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  // Delete Confirm Modal State
  const [deletingUser, setDeletingUser] = useState<any | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    category: 'Clinical Departments',
    department: 'General Medicine',
    role: 'Doctor',
    specialization: '',
    designation: '',
    licenseNumber: '',
    consultationFee: '500',
    nursingLicense: '',
    labCertId: '',
    pharmacyLicense: '',
    employeeId: '',
    isActive: true,
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
        setRawDepartments(deptRes.data.data);
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

  // Extract categories dynamically
  const categoriesList = Array.from(new Set(rawDepartments.map(d => d.categoryName))).filter(Boolean);
  const availableCategories = categoriesList.length > 0 ? categoriesList : CORE_CATEGORIES;

  // Filter departments for selected category
  const categoryDepartments = rawDepartments.filter(d => d.categoryName === form.category);
  const departmentOptions = categoryDepartments.length > 0
    ? categoryDepartments.map(d => d.departmentName)
    : ['General Medicine', 'Cardiology', 'Pediatrics', 'Orthopedics', 'Other'];

  const handleCategoryChange = (newCategory: string) => {
    const deptsInCat = rawDepartments.filter(d => d.categoryName === newCategory);
    const defaultDept = deptsInCat[0]?.departmentName || 'General Medicine';
    const defaultRole = DEFAULT_ROLE_FOR_CATEGORY[newCategory] || 'Doctor';

    setForm(prev => ({
      ...prev,
      category: newCategory,
      department: defaultDept,
      role: defaultRole
    }));
  };

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

  const handleOpenCreate = () => {
    setEditingUser(null);
    const defaultCat = availableCategories[0] || 'Clinical Departments';
    const deptsInCat = rawDepartments.filter(d => d.categoryName === defaultCat);
    const defaultDept = deptsInCat[0]?.departmentName || 'General Medicine';

    setForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      category: defaultCat,
      department: defaultDept,
      role: 'Doctor',
      specialization: '',
      designation: '',
      licenseNumber: '',
      consultationFee: '500',
      nursingLicense: '',
      labCertId: '',
      pharmacyLicense: '',
      employeeId: '',
      isActive: true,
    });
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    const userDept = user.department || user.employee_department || '';
    const deptObj = rawDepartments.find(d => d.departmentName.toLowerCase() === userDept.toLowerCase());
    const userCat = deptObj?.categoryName || 'Clinical Departments';

    setForm({
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '', // Keep blank if unchanged
      category: userCat,
      department: userDept || 'General Medicine',
      role: user.role || 'Doctor',
      specialization: user.employee_specialization || '',
      designation: '',
      licenseNumber: user.license_number || '',
      consultationFee: parseFloat(user.consultation_fee || '0').toString(),
      nursingLicense: user.license_number || '',
      labCertId: user.license_number || '',
      pharmacyLicense: user.license_number || '',
      employeeId: user.license_number || '',
      isActive: user.is_active !== undefined ? (user.is_active === true || user.is_active === 1 || user.is_active === '1' || user.is_active === 'true') : true,
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validations based on Category / Role
    const isClinical = form.category === 'Clinical Departments' || form.category.includes('Clinical') || form.role === 'Doctor';
    
    if (isClinical) {
      if (!form.licenseNumber.trim()) {
        setError('Doctor License Number is mandatory for Clinical / Doctor category.');
        return;
      }
      if (!form.consultationFee || parseFloat(form.consultationFee) < 0) {
        setError('OPD Consultation Fee (₹) is mandatory for Clinical / Doctor category.');
        return;
      }
    }

    setSaveLoading(true);

    try {
      // Formulate final specialization & license number based on category
      let finalLicense = form.licenseNumber;
      if (form.category.includes('Nursing')) finalLicense = form.nursingLicense || form.licenseNumber;
      else if (form.category.includes('Laboratory') || form.category.includes('Diagnostic')) finalLicense = form.labCertId || form.licenseNumber;
      else if (form.category.includes('Allied') || form.category.includes('Pharmacy')) finalLicense = form.pharmacyLicense || form.licenseNumber;
      else if (form.category.includes('Administrative')) finalLicense = form.employeeId || form.licenseNumber;

      let finalSpec = form.specialization;
      if (form.designation) {
        finalSpec = `${form.designation}${form.specialization ? ' - ' + form.specialization : ''}`;
      }

      const payload: any = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        role: form.role,
        department: form.department,
        specialization: finalSpec,
        licenseNumber: finalLicense,
        consultationFee: isClinical ? parseFloat(form.consultationFee || '0') : 0,
        isActive: form.isActive,
      };

      if (form.password) {
        payload.password = form.password;
      }

      if (editingUser) {
        await api.patch(`/admin/users/${editingUser.user_id}`, payload);
        setSuccess(`User ${form.firstName} ${form.lastName} updated successfully.`);
      } else {
        if (!form.password) {
          setError('Password is required for new user.');
          setSaveLoading(false);
          return;
        }
        await api.post('/admin/users', payload);
        setSuccess(`User ${form.firstName} ${form.lastName} created successfully.`);
      }

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save user.');
    } finally {
      setSaveLoading(false);
    }
  };

  const toggleActive = async (user: any) => {
    try {
      await api.patch(`/admin/users/${user.user_id}`, {
        isActive: !user.is_active,
      });
      fetchData();
    } catch (err: any) {
      setError('Failed to update status.');
    }
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter && u.role !== roleFilter) return false;
    return true;
  });

  const isClinicalCategory = form.category === 'Clinical Departments' || form.category.includes('Clinical') || form.role === 'Doctor';
  const isNursingCategory = form.category.includes('Nursing') || form.role === 'Nurse';
  const isLabCategory = form.category.includes('Laboratory') || form.category.includes('Diagnostic') || form.role === 'Lab Technician';
  const isPharmacyCategory = form.category.includes('Allied') || form.category.includes('Pharmacy') || form.role === 'Pharmacist';
  const isAdminCategory = form.category.includes('Administrative') || form.role === 'Billing' || form.role === 'Admin' || form.role === 'Receptionist';

  return (
    <div className="space-y-6" style={{ padding: '24px', background: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={28} color="var(--accent-primary)" />
            Hospital Staff & User Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px' }}>
            Create and edit hospital doctors, staff members, department assignments, and login credentials
          </p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenCreate}>
          Create New Hospital User
        </Button>
      </div>

      {/* Messages */}
      {success && (
        <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: '#10b981', fontWeight: 600, fontSize: '14px' }}>
          ✅ {success}
        </div>
      )}

      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-primary)' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            className="input"
            placeholder="Search by name, email, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '38px', width: '100%', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
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
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{row.email}</div>
                  {row.phone && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>📱 {row.phone}</div>}
                  {row.license_number && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Reg: {row.license_number}</div>
                  )}
                </div>
              ),
            },
            {
              key: 'role_department',
              label: 'System Role / Department & Specialization',
              render: (_, row) => {
                const dept = row.department || row.employee_department || '—';
                const spec = row.employee_specialization;
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div>
                      <RoleBadge role={row.role} />
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      🏢 {dept}
                    </div>
                    {spec && (
                      <div style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                        🩺 {spec}
                      </div>
                    )}
                  </div>
                );
              },
            },
            {
              key: 'consultation_fee',
              label: 'Consulting Fee',
              render: (v, row) => (row.role === 'Doctor' ? (
                <span style={{ fontWeight: 700, color: '#16a34a', background: 'rgba(22,163,74,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                  {formatCurrency(v || 0)}
                </span>
              ) : '—'),
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
                    title="View role-based staff profile & delete account"
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
                </div>
              ),
            },
          ]}
          data={filteredUsers}
          emptyMessage="No staff members or users found."
        />
      </div>

      {/* Dynamic Condition-Based User Registration & Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '12px', width: '100%', maxWidth: '640px', padding: '24px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {editingUser ? <Edit size={20} color="var(--accent-primary)" /> : <Plus size={20} color="var(--accent-primary)" />}
              {editingUser ? `Edit Staff Member: ${editingUser.first_name} ${editingUser.last_name}` : 'Create New Hospital User / Staff'}
            </h2>

            {error && (
              <div style={{ color: 'var(--accent-danger)', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* 1. Common Fields: Username / Name */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <Input
                    label="First Name / Username *"
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

                {/* Common Fields: Email & Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <Input
                    label="Email Address *"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    placeholder="staff@manasahospital.com"
                  />
                  <Input
                    label="Phone Number *"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                    placeholder="+91 9876543210"
                  />
                </div>

                {/* 2. Dynamic API Fetching & Cascade Filtering Logic */}
                <div style={{ background: 'var(--bg-primary)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-primary)', display: 'grid', gap: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building2 size={15} /> Category & Department Assignment (Fetched from API)
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {/* Category Dropdown */}
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                        Category *
                      </label>
                      <select
                        className="select"
                        value={form.category}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        required
                        style={{ width: '100%', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                      >
                        {availableCategories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Department Dropdown (Filtered dynamically by Category) */}
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                        Department (Filtered by Category) *
                      </label>
                      <select
                        className="select"
                        value={form.department}
                        onChange={(e) => setForm({ ...form, department: e.target.value })}
                        required
                        style={{ width: '100%', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                      >
                        {departmentOptions.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* System Role Dropdown (Auto-populated/Configurable) */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      System Role (Auto-mapped for {form.category}) *
                    </label>
                    <select
                      className="select"
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      required
                      style={{ width: '100%', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                    >
                      {(dynamicRoles.length > 0
                        ? dynamicRoles.map((r: any) => ({ value: r.role_name, label: `${r.role_name}${r.is_system_role ? '' : ' (Custom Security Role)'}` }))
                        : ROLE_OPTIONS
                      ).map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. Automatic Conditional Field Mapping */}
                {/* Scenario 1: Clinical Category (Doctor) */}
                {isClinicalCategory && (
                  <div style={{ background: 'rgba(37,99,235,0.04)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(37,99,235,0.2)', display: 'grid', gap: '12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Stethoscope size={15} /> Clinical Doctor Specific Fields
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <Input
                        label="Specialization"
                        value={form.specialization}
                        onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                        placeholder="e.g. Cardiologist, Orthopedic Surgeon"
                      />
                      <Input
                        label="Designation"
                        value={form.designation}
                        onChange={(e) => setForm({ ...form, designation: e.target.value })}
                        placeholder="e.g. Senior Consultant, Junior Resident"
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <Input
                        label="Doctor License Number *"
                        value={form.licenseNumber}
                        onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                        required={isClinicalCategory}
                        placeholder="e.g. MCI-2026-8841"
                      />
                      <Input
                        label="OPD Consultation Fees (₹) *"
                        type="number"
                        min="0"
                        step="50"
                        value={form.consultationFee}
                        onChange={(e) => setForm({ ...form, consultationFee: e.target.value })}
                        required={isClinicalCategory}
                        placeholder="e.g. 500"
                      />
                    </div>
                  </div>
                )}

                {/* Scenario 2: Nursing Category */}
                {isNursingCategory && (
                  <div style={{ background: 'rgba(236,72,153,0.04)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(236,72,153,0.2)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#ec4899', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <HeartPulse size={15} /> Nursing Specific Fields
                    </div>
                    <Input
                      label="Nursing Registration License No."
                      value={form.nursingLicense}
                      onChange={(e) => setForm({ ...form, nursingLicense: e.target.value, licenseNumber: e.target.value })}
                      placeholder="e.g. RN-NUR-2026-9912"
                    />
                  </div>
                )}

                {/* Scenario 3: Diagnostic / Laboratory Category */}
                {isLabCategory && (
                  <div style={{ background: 'rgba(139,92,246,0.04)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(139,92,246,0.2)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#8b5cf6', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Microscope size={15} /> Laboratory & Pathology Specific Fields
                    </div>
                    <Input
                      label="Lab Certification ID"
                      value={form.labCertId}
                      onChange={(e) => setForm({ ...form, labCertId: e.target.value, licenseNumber: e.target.value })}
                      placeholder="e.g. LAB-CERT-2026-4410"
                    />
                  </div>
                )}

                {/* Scenario 4: Pharmacy Category */}
                {isPharmacyCategory && (
                  <div style={{ background: 'rgba(16,185,129,0.04)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Pill size={15} /> Pharmacy Specific Fields
                    </div>
                    <Input
                      label="Pharmacy License No."
                      value={form.pharmacyLicense}
                      onChange={(e) => setForm({ ...form, pharmacyLicense: e.target.value, licenseNumber: e.target.value })}
                      placeholder="e.g. PHARM-LIC-2026-8821"
                    />
                  </div>
                )}

                {/* Scenario 5: Administration Category */}
                {isAdminCategory && (
                  <div style={{ background: 'rgba(245,158,11,0.04)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Briefcase size={15} /> Administrative Staff Fields
                    </div>
                    <Input
                      label="Employee ID"
                      value={form.employeeId}
                      onChange={(e) => setForm({ ...form, employeeId: e.target.value, licenseNumber: e.target.value })}
                      placeholder="e.g. EMP-2026-004"
                    />
                  </div>
                )}

                {/* Password Input */}
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
