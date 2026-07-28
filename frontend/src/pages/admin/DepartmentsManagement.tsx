import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit3, Users, Stethoscope, CheckCircle2, RefreshCw, Layers } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import api from '../../api/client';

export interface Department {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  description: string;
  isActive: boolean;
  memberCount: number;
  doctorCount: number;
}

const DepartmentsManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [departmentName, setDepartmentName] = useState<string>('');
  const [departmentCode, setDepartmentCode] = useState<string>('');
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
    setDescription('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dept: Department) => {
    setEditingDept(dept);
    setDepartmentName(dept.departmentName);
    setDepartmentCode(dept.departmentCode);
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
          description: description.trim()
        });
        setSuccessMsg('Department updated successfully.');
      } else {
        await api.post('/departments', {
          departmentName: departmentName.trim(),
          departmentCode: departmentCode.trim(),
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

  // Summary Metrics
  const totalDepartments = departments.length;
  const totalMembers = departments.reduce((acc, d) => acc + d.memberCount, 0);
  const totalDoctors = departments.reduce((acc, d) => acc + d.doctorCount, 0);

  return (
    <div style={{ padding: '24px', background: 'var(--bg-primary)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={28} color="var(--accent-primary)" />
            Hospital Departments Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px' }}>
            Configure and manage clinical & operational hospital departments and associate staff
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

      {/* Overview Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <Card style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '12px', background: 'rgba(37,99,235,0.1)', borderRadius: '10px', color: 'var(--accent-primary)' }}>
              <Building2 size={24} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Total Departments</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{totalDepartments}</div>
            </div>
          </div>
        </Card>

        <Card style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '12px', background: 'rgba(16,185,129,0.1)', borderRadius: '10px', color: '#10b981' }}>
              <Users size={24} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Total Associated Members</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{totalMembers}</div>
            </div>
          </div>
        </Card>

        <Card style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '12px', background: 'rgba(139,92,246,0.1)', borderRadius: '10px', color: '#8b5cf6' }}>
              <Stethoscope size={24} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Assigned Doctors</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{totalDoctors}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Departments Cards Grid */}
      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Layers size={20} color="var(--accent-primary)" />
        Active Hospital Department Cards
      </h2>

      {departments.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          <Building2 size={48} style={{ opacity: 0.4, marginBottom: '12px' }} />
          <p style={{ margin: 0, fontSize: '15px' }}>No departments created yet. Click "Add New Department" to create one.</p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {departments.map((dept) => (
            <Card key={dept.departmentId} style={{ 
              background: 'var(--bg-card)', 
              borderRadius: '12px', 
              border: '1px solid var(--border-primary)', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between',
              padding: '20px',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                      {dept.departmentName}
                    </h3>
                    {dept.departmentCode && (
                      <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(37,99,235,0.12)', color: 'var(--accent-primary)', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                        {dept.departmentCode}
                      </span>
                    )}
                  </div>
                  <Badge variant={dept.isActive ? 'success' : 'default'}>
                    {dept.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px 0', minHeight: '38px', lineHeight: '1.4' }}>
                  {dept.description || 'Standard hospital medical & consultation department.'}
                </p>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: '8px', marginBottom: '14px', border: '1px solid var(--border-primary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <Users size={16} color="var(--accent-primary)" />
                    <span>Members Count:</span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {dept.memberCount} Staff ({dept.doctorCount} Doctors)
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
          ))}
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

          <Input
            label="Department Name *"
            placeholder="e.g. Cardiology, Orthopedics, Pediatrics..."
            value={departmentName}
            onChange={(e) => setDepartmentName(e.target.value)}
            required
          />

          <Input
            label="Department Code (Optional)"
            placeholder="e.g. CARD, ORTHO, PED..."
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
              placeholder="Brief description of clinical services, staff duties and operations..."
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
