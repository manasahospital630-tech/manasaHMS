import React, { useState, useEffect } from 'react';
import { Stethoscope, User, ShieldAlert, Award, DollarSign, Users, RefreshCw } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import api from '../../api/client';
import { formatCurrency } from '../../utils/formatters';

const DoctorConsultations: React.FC = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [department, setDepartment] = useState('');
  const [consultationFee, setConsultationFee] = useState('0');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [departmentsList, setDepartmentsList] = useState<string[]>([]);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const [profRes, deptRes] = await Promise.allSettled([
        api.get('/admin/doctor-profiles'),
        api.get('/departments')
      ]);
      if (profRes.status === 'fulfilled') setProfiles(profRes.value.data.data || []);
      if (deptRes.status === 'fulfilled' && deptRes.value.data?.data) {
        const names = deptRes.value.data.data.map((d: any) => d.departmentName);
        setDepartmentsList(names);
      }
      setErrorMsg('');
    } catch (err: any) {
      setErrorMsg('Failed to load doctor consultation profiles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId) {
      setErrorMsg('Please select a doctor.');
      return;
    }
    if (!department.trim()) {
      setErrorMsg('Please enter a department.');
      return;
    }
    const fee = parseFloat(consultationFee);
    if (isNaN(fee) || fee < 0) {
      setErrorMsg('Please enter a valid consultation fee.');
      return;
    }

    setSaveLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.post('/admin/doctor-profiles', {
        doctorId: selectedDoctorId,
        department: department.trim(),
        consultationFee: fee
      });
      setSuccessMsg('Doctor consultation profile saved successfully.');
      setSelectedDoctorId('');
      setDepartment('');
      setConsultationFee('0');
      fetchProfiles();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to save doctor consultation profile.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSelectDoctorForEdit = (row: any) => {
    setSelectedDoctorId(row.doctorId);
    setDepartment(row.department || '');
    setConsultationFee(String(row.consultationFee));
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Stats calculations
  const totalConsultations = profiles.reduce((acc, row) => acc + row.totalConsultations, 0);
  const totalAmount = profiles.reduce((acc, row) => acc + row.totalAmount, 0);
  const totalDoctors = profiles.length;

  return (
    <div>
      <div className="page-header">
        <h1>
          <Stethoscope size={28} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--accent-primary)' }} />
          Doctor Consultations
        </h1>
        <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={fetchProfiles} loading={loading}>
          Refresh
        </Button>
      </div>

      {/* Summary Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-md)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'rgba(14,165,233,0.1)', color: 'var(--accent-primary)' }}>
            <Award size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Active Doctors</div>
            <strong style={{ fontSize: '20px' }}>{totalDoctors}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-md)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'rgba(139,92,246,0.1)', color: 'var(--badge-purple-text, #a78bfa)' }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Total Consultations</div>
            <strong style={{ fontSize: '20px' }}>{totalConsultations}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-md)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'rgba(16,185,129,0.1)', color: 'var(--accent-success)' }}>
            <DollarSign size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Consultation Revenue</div>
            <strong style={{ fontSize: '20px', color: 'var(--accent-success)' }}>{formatCurrency(totalAmount)}</strong>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
        {/* Set Doctor Fee Form */}
        <Card title="Set / Edit Doctor Consultation Fee">
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
              {errorMsg && (
                <div style={{ color: 'var(--accent-danger)', fontSize: 'var(--font-sm)', padding: 'var(--space-sm)', background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-sm)' }}>
                  ⚠️ {errorMsg}
                </div>
              )}
              {successMsg && (
                <div style={{ color: 'var(--accent-success)', fontSize: 'var(--font-sm)', padding: 'var(--space-sm)', background: 'rgba(16,185,129,0.08)', borderRadius: 'var(--radius-sm)' }}>
                  ✅ {successMsg}
                </div>
              )}

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
                <Select
                  label="Select Doctor *"
                  value={selectedDoctorId}
                  onChange={(e) => {
                    const docId = e.target.value;
                    setSelectedDoctorId(docId);
                    const found = profiles.find(p => p.doctorId === docId);
                    if (found) {
                      setDepartment(found.department || '');
                      setConsultationFee(String(found.consultationFee));
                    } else {
                      setDepartment('');
                      setConsultationFee('0');
                    }
                  }}
                  options={[
                    { value: '', label: '-- Choose Doctor --' },
                    ...profiles.map(p => ({
                      value: p.doctorId,
                      label: `${p.doctorName} (${p.department || 'No Dept Set'})`
                    }))
                  ]}
                />
                <Select
                  label="Department *"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  options={[
                    { value: '', label: '-- Select Department --' },
                    ...departmentsList.map(d => ({ value: d, label: d })),
                    ...(department && !departmentsList.includes(department) ? [{ value: department, label: department }] : [])
                  ]}
                  required
                />
                <Input
                  label="Consultation Fee (₹) *"
                  type="number"
                  min="0"
                  placeholder="e.g. 500"
                  value={consultationFee}
                  onChange={e => setConsultationFee(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end', marginTop: 'var(--space-sm)' }}>
                {selectedDoctorId && (
                  <Button variant="secondary" type="button" onClick={() => {
                    setSelectedDoctorId('');
                    setDepartment('');
                    setConsultationFee('0');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}>
                    Clear
                  </Button>
                )}
                <Button variant="primary" type="submit" loading={saveLoading}>
                  Save Consultation Profile
                </Button>
              </div>
            </div>
          </form>
        </Card>

        {/* Doctor Consultation Summary Table */}
        <Card title="Doctor Profiles & Statistics">
          <Table
            columns={[
              {
                key: 'doctorName',
                label: 'Doctor Name',
                render: (v, row) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                      <User size={14} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{v}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{row.email}</div>
                    </div>
                  </div>
                )
              },
              {
                key: 'department',
                label: 'Department',
                render: (v) => v ? <Badge variant="info">{v}</Badge> : <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>Not Set</span>
              },
              {
                key: 'consultationFee',
                label: 'Consultation Fee',
                render: (v) => <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(v)}</strong>
              },
              {
                key: 'totalConsultations',
                label: 'Total Consultations',
                render: (v) => <span style={{ fontWeight: 600 }}>{v}</span>
              },
              {
                key: 'totalPatients',
                label: 'Unique Patients',
                render: (v) => <span style={{ color: 'var(--text-secondary)' }}>{v}</span>
              },
              {
                key: 'totalAmount',
                label: 'Total Amount',
                render: (v) => <strong style={{ color: 'var(--accent-success)' }}>{formatCurrency(v)}</strong>
              },
              {
                key: 'actions',
                label: 'Actions',
                render: (_, row) => (
                  <Button variant="secondary" size="sm" onClick={() => handleSelectDoctorForEdit(row)}>
                    Edit Fee / Dept
                  </Button>
                )
              }
            ]}
            data={profiles}
          />
        </Card>
      </div>
    </div>
  );
};

export default DoctorConsultations;
