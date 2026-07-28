import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit3, Users, Stethoscope, RefreshCw, Layers, Activity, Microscope, HeartPulse, Scissors, Pill, Briefcase } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import api from '../../api/client';

export interface Department {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  categoryName: string;
  description: string;
  isActive: boolean;
  memberCount: number;
  doctorCount: number;
}

export const CORE_FUNCTIONAL_CATEGORIES = [
  'Clinical Departments',
  'Diagnostic & Laboratory',
  'Nursing & Inpatient Care',
  'Surgical & Procedural',
  'Allied Health & Support',
  'Administrative & Operations'
];

const CATEGORY_ICONS: Record<string, any> = {
  'Clinical Departments': Stethoscope,
  'Diagnostic & Laboratory': Microscope,
  'Nursing & Inpatient Care': HeartPulse,
  'Surgical & Procedural': Scissors,
  'Allied Health & Support': Pill,
  'Administrative & Operations': Briefcase
};

const CATEGORY_COLORS: Record<string, string> = {
  'Clinical Departments': '#2563eb',
  'Diagnostic & Laboratory': '#8b5cf6',
  'Nursing & Inpatient Care': '#ec4899',
  'Surgical & Procedural': '#ef4444',
  'Allied Health & Support': '#10b981',
  'Administrative & Operations': '#f59e0b'
};

const DepartmentsManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [departmentName, setDepartmentName] = useState<string>('');
  const [departmentCode, setDepartmentCode] = useState<string>('');
  const [categoryName, setCategoryName] = useState<string>('Clinical Departments');
  const [description, setDescription] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/departments');
      if (res.data.success) {
        setDepartments(res.data.data || []);
      }
    } catch (err: any) {
      console.error('Failed to load departments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingDept(null);
    setDepartmentName('');
    setDepartmentCode('');
    setCategoryName('Clinical Departments');
    setDescription('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dept: Department) => {
    setEditingDept(dept);
    setDepartmentName(dept.departmentName);
    setDepartmentCode(dept.departmentCode);
    setCategoryName(dept.categoryName || 'Clinical Departments');
    setDescription(dept.description);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!departmentName.trim()) {
      setErrorMsg('Please enter a department name.');
      return;
    }

    setSaveLoading(true);
    setErrorMsg('');
    try {
      if (editingDept) {
        await api.put(`/departments/${editingDept.departmentId}`, {
          departmentName: departmentName.trim(),
          departmentCode: departmentCode.trim(),
          categoryName,
          description: description.trim()
        });
        setSuccessMsg('Department updated successfully.');
      } else {
        await api.post('/departments', {
          departmentName: departmentName.trim(),
          departmentCode: departmentCode.trim(),
          categoryName,
          description: description.trim()
        });
        setSuccessMsg('New department created successfully.');
      }
      setIsModalOpen(false);
      fetchDepartments();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to save department.');
    } finally {
      setSaveLoading(false);
    }
  };

  // Filtered departments
  const filteredDepartments = activeCategory === 'ALL'
    ? departments
    : departments.filter(d => d.categoryName === activeCategory);

  // Category counts
  const countByCategory = (cat: string) => departments.filter(d => d.categoryName === cat).length;
  const totalDepartments = departments.length;
  const totalMembers = departments.reduce((acc, d) => acc + d.memberCount, 0);

  return (
    <div style={{ padding: '24px', background: 'var(--bg-primary)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={28} color="var(--accent-primary)" />
            Hospital Functional Departments
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px' }}>
            Manage clinical, diagnostic, nursing, surgical, allied health & administrative departments across 6 core functional categories
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={fetchDepartments} loading={loading}>
            Refresh
          </Button>
          <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenCreateModal}>
            Add New Department
          </Button>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: '#10b981', marginBottom: '20px', fontWeight: 600, fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>✅ {successMsg}</span>
          <span style={{ cursor: 'pointer' }} onClick={() => setSuccessMsg('')}>✕</span>
        </div>
      )}

      {/* Top Functional Overview Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <Card style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-primary)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Total Departments</div>
          <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', color: 'var(--accent-primary)' }}>{totalDepartments}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{totalMembers} Staff Members</div>
        </Card>

        {CORE_FUNCTIONAL_CATEGORIES.map(cat => {
          const IconComponent = CATEGORY_ICONS[cat] || Building2;
          const color = CATEGORY_COLORS[cat] || 'var(--accent-primary)';
          const count = countByCategory(cat);
          return (
            <Card key={cat} style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-primary)', cursor: 'pointer' }} onClick={() => setActiveCategory(cat)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {cat.split(' ')[0]}
                </div>
                <IconComponent size={18} color={color} />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', color }}>{count}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>Departments</div>
            </Card>
          );
        })}
      </div>

      {/* Category Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border-primary)' }}>
        <button
          onClick={() => setActiveCategory('ALL')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            background: activeCategory === 'ALL' ? 'var(--accent-primary)' : 'var(--bg-card)',
            color: activeCategory === 'ALL' ? '#ffffff' : 'var(--text-secondary)',
            whiteSpace: 'nowrap'
          }}
        >
          🌐 All Categories ({totalDepartments})
        </button>
        {CORE_FUNCTIONAL_CATEGORIES.map(cat => {
          const isActive = activeCategory === cat;
          const color = CATEGORY_COLORS[cat];
          const count = countByCategory(cat);
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: isActive ? `1px solid ${color}` : '1px solid var(--border-primary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                background: isActive ? color : 'var(--bg-card)',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{cat}</span>
              <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '10px', background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--bg-primary)' }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Department Cards Grid */}
      {filteredDepartments.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          <Building2 size={48} style={{ opacity: 0.4, marginBottom: '12px' }} />
          <p style={{ margin: 0, fontSize: '15px' }}>No departments found in this category.</p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredDepartments.map((dept) => {
            const catColor = CATEGORY_COLORS[dept.categoryName] || 'var(--accent-primary)';
            const IconComp = CATEGORY_ICONS[dept.categoryName] || Building2;
            return (
              <Card key={dept.departmentId} style={{ 
                background: 'var(--bg-card)', 
                borderRadius: '12px', 
                border: '1px solid var(--border-primary)', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                padding: '20px',
                position: 'relative'
              }}>
                <div>
                  {/* Category Pill */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: 700, 
                      color: catColor, 
                      background: `${catColor}15`, 
                      border: `1px solid ${catColor}40`,
                      padding: '3px 10px', 
                      borderRadius: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <IconComp size={12} />
                      {dept.categoryName}
                    </span>
                    <Badge variant={dept.isActive ? 'success' : 'default'}>
                      {dept.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {/* Header Title & Code */}
                  <div style={{ marginBottom: '10px' }}>
                    <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                      {dept.departmentName}
                    </h3>
                    {dept.departmentCode && (
                      <span style={{ fontSize: '11px', fontWeight: 700, background: 'var(--bg-primary)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-primary)' }}>
                        CODE: {dept.departmentCode}
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px 0', minHeight: '40px', lineHeight: '1.4' }}>
                    {dept.description || 'Clinical & medical operations department.'}
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: '8px', marginBottom: '14px', border: '1px solid var(--border-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <Users size={16} color="var(--accent-primary)" />
                      <span>Associated Staff:</span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {dept.memberCount} Members ({dept.doctorCount} Doctors)
                    </span>
                  </div>

                  <Button 
                    variant="secondary" 
                    style={{ width: '100%', justifyContent: 'center' }} 
                    icon={<Edit3 size={15} />}
                    onClick={() => handleOpenEditModal(dept)}
                  >
                    Edit Department Details
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Department Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDept ? `Edit Department: ${editingDept.departmentName}` : 'Add New Department'}
      >
        <form onSubmit={handleSave} style={{ display: 'grid', gap: '16px' }}>
          {errorMsg && (
            <div style={{ color: 'var(--accent-danger)', fontSize: '13px', padding: '10px', background: 'rgba(239,68,68,0.1)', borderRadius: '6px' }}>
              ⚠️ {errorMsg}
            </div>
          )}

          <Select
            label="Functional Category *"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            options={CORE_FUNCTIONAL_CATEGORIES.map(c => ({ value: c, label: c }))}
            required
          />

          <Input
            label="Department Name *"
            placeholder="e.g. Oncology, ICU, Blood Bank..."
            value={departmentName}
            onChange={(e) => setDepartmentName(e.target.value)}
            required
          />

          <Input
            label="Department Code (Optional)"
            placeholder="e.g. ONCO, ICU, BLOOD..."
            value={departmentCode}
            onChange={(e) => setDepartmentCode(e.target.value)}
          />

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Department Description
            </label>
            <textarea
              className="input"
              rows={3}
              placeholder="Clinical scope, diagnostic capabilities, or operational responsibilities..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={saveLoading}>
              {editingDept ? 'Update Department' : 'Create Department'}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default DepartmentsManagement;
