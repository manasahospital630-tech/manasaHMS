import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList, HeartPulse, Stethoscope, Printer, RefreshCw, CheckCircle,
  X, Activity, ArrowRight, User, AlertCircle
} from 'lucide-react';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import api from '../../api/client';
import { formatDateTime } from '../../utils/formatters';

export const CheckInQueue: React.FC = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  // Actions Dropdown Active Row State
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  // Triage Vitals Modal State
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [savingVitals, setSavingVitals] = useState(false);

  // Vitals & Clinical Notes Form State
  const [vitalsForm, setVitalsForm] = useState({
    weight: '165',
    temperature: '99.4',
    systolicBp: '120',
    diastolicBp: '80',
    heartRate: '140',
    spo2: '94',
    glucoseLevel: '110',
    glucoseType: 'Random',
    notes: 'Patient mentions mild fatigue after morning activity.',
    doctorNotes: 'Advised rest and mild electrolyte intake.'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all checked-in / scheduled appointments
      const res = await api.get('/appointments?limit=200');
      const list = res.data.data?.appointments || res.data.data || [];
      setAppointments(list);
    } catch (err: any) {
      console.warn('Queue fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenVitalsModal = (appt: any) => {
    setSelectedAppt(appt);
    const existingVitals = appt.vitals || {};
    setVitalsForm({
      weight: existingVitals.weight?.toString() || '165',
      temperature: existingVitals.temperature?.toString() || '99.4',
      systolicBp: existingVitals.bloodPressure?.systolic?.toString() || '120',
      diastolicBp: existingVitals.bloodPressure?.diastolic?.toString() || '80',
      heartRate: existingVitals.heartRate?.toString() || '140',
      spo2: existingVitals.oxygenSaturation?.toString() || '94',
      glucoseLevel: existingVitals.glucoseLevel?.toString() || '110',
      glucoseType: existingVitals.glucoseType || 'Random',
      notes: existingVitals.notes || appt.symptoms_brief || 'Patient mentions mild fatigue after morning activity.',
      doctorNotes: existingVitals.doctorNotes || appt.doctor_notes || 'Advised rest and mild electrolyte intake.'
    });
    setIsVitalsModalOpen(true);
    setActiveActionId(null);
  };

  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt) return;
    setSavingVitals(true);
    try {
      const payload = {
        bookingId: selectedAppt.appointment_id,
        appointmentId: selectedAppt.appointment_id,
        patientId: selectedAppt.patient_id,
        weight: vitalsForm.weight,
        temperature: vitalsForm.temperature,
        heartRate: vitalsForm.heartRate,
        oxygenSaturation: vitalsForm.spo2,
        bloodPressureSystolic: vitalsForm.systolicBp,
        bloodPressureDiastolic: vitalsForm.diastolicBp,
        glucoseLevel: vitalsForm.glucoseLevel,
        glucoseType: vitalsForm.glucoseType,
        notes: vitalsForm.notes,
        doctorNotes: vitalsForm.doctorNotes,
        clinicalNotes: vitalsForm.doctorNotes
      };

      await api.post('/v1/queue/record-vitals', payload);
      alert('✅ Clinical notes & vitals recorded successfully and auto-synced to Patient OP Consultation History!');
      setIsVitalsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save clinical notes');
    } finally {
      setSavingVitals(false);
    }
  };

  const handleSendToDoctor = async (apptId: string) => {
    try {
      await api.patch(`/appointments/${apptId}/status`, { status: 'InConsultation' });
      alert('👨‍⚕️ Patient sequence moved to In-Consultation Queue!');
      setActiveActionId(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update consultation status');
    }
  };

  const handlePrintOpSlip = (appt: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>OP Slip - ${appt.patient_name || 'Patient'}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
            .token { font-size: 32px; font-weight: bold; color: #2563eb; margin: 10px 0; }
            .field { margin-bottom: 8px; }
            .footer { margin-top: 30px; font-size: 12px; text-align: center; border-top: 1px solid #ccc; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>MANASA HOSPITAL</h2>
            <p>Outpatient Consultation Token Slip</p>
          </div>
          <div style="text-align: center;">
            <div class="token">TOKEN #${appt.token_no || 1}</div>
            <p><strong>OP NO:</strong> ${appt.op_no || 'OP-1014'}</p>
          </div>
          <hr />
          <div class="field"><strong>Patient Name:</strong> ${appt.patient_name || 'N/A'}</div>
          <div class="field"><strong>MRN:</strong> ${appt.medical_record_number || 'N/A'}</div>
          <div class="field"><strong>Consulting Doctor:</strong> Dr. ${appt.doctor_name || 'N/A'}</div>
          <div class="field"><strong>Date/Time:</strong> ${formatDateTime(appt.appointment_date)}</div>
          <div class="field"><strong>Symptoms:</strong> ${appt.symptoms_brief || 'OPD Consultation'}</div>
          <div class="footer">
            <p>Please wait for your token number to be called outside the consultation room.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    setActiveActionId(null);
  };

  const filtered = filter === 'all' 
    ? appointments 
    : appointments.filter(a => a.status === filter);

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '24px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
          <ClipboardList size={28} color="#2563eb" />
          Check-in Queue
        </h1>
        <Button variant="secondary" onClick={fetchData} loading={loading} icon={<RefreshCw size={16} />}>
          Refresh Queue
        </Button>
      </div>

      {/* Queue Tabs */}
      <div className="tabs" style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: '#f1f5f9', padding: '4px', borderRadius: '12px', width: 'fit-content' }}>
        {[
          { id: 'all', label: 'All' },
          { id: 'Scheduled', label: 'Scheduled' },
          { id: 'CheckedIn', label: 'CheckedIn' },
          { id: 'InConsultation', label: 'InConsultation' },
          { id: 'Completed', label: 'Completed' }
        ].map(s => (
          <button
            key={s.id}
            className={`tab ${filter === s.id ? 'active' : ''}`}
            onClick={() => setFilter(s.id)}
            style={{
              padding: '6px 16px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              background: filter === s.id ? '#2563eb' : 'transparent',
              color: filter === s.id ? '#ffffff' : '#64748b',
              transition: 'all 0.2s ease'
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Queue Table */}
      <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        <Table
          columns={[
            {
              key: 'token_no',
              label: 'TOKEN NO',
              render: (v: any, row: any) => (
                <span style={{ 
                  background: '#eff6ff', 
                  color: '#1d4ed8', 
                  fontWeight: 800, 
                  fontSize: '14px', 
                  padding: '4px 10px', 
                  borderRadius: '20px',
                  display: 'inline-block'
                }}>
                  #{v || row.tokenNo || 1}
                </span>
              )
            },
            { key: 'patient_name', label: 'PATIENT', render: (v: any) => <strong>{v}</strong> },
            { key: 'medical_record_number', label: 'MRN' },
            { key: 'doctor_name', label: 'DOCTOR', render: (v: any) => `Dr ${v}` },
            { key: 'appointment_date', label: 'TIME', render: (v: any) => formatDateTime(v) },
            { key: 'symptoms_brief', label: 'SYMPTOMS', render: (v: any) => v || 'OPD Consultation Check-in' },
            { key: 'status', label: 'STATUS', render: (v: any) => <StatusBadge status={v} /> },
            {
              key: 'actions',
              label: 'ACTIONS ▾',
              render: (_: any, row: any) => (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setActiveActionId(activeActionId === row.appointment_id ? null : row.appointment_id)}
                    style={{ fontWeight: 700 }}
                  >
                    Actions ▾
                  </Button>

                  {/* Dropdown Menu */}
                  {activeActionId === row.appointment_id && (
                    <div style={{
                      position: 'absolute',
                      right: 0,
                      top: '100%',
                      marginTop: '4px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      zIndex: 100,
                      minWidth: '220px',
                      overflow: 'hidden',
                      padding: '4px'
                    }}>
                      <button
                        onClick={() => handleOpenVitalsModal(row)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '9px 12px',
                          background: 'none',
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#2563eb',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          borderRadius: '8px'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        <HeartPulse size={15} color="#2563eb" />
                        🩺 Add / Edit Vitals
                      </button>

                      <button
                        onClick={() => navigate(`/patient/profile/${row.patient_id}`)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '9px 12px',
                          background: 'none',
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#7c3aed',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          borderRadius: '8px'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f5f3ff'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        <User size={15} color="#7c3aed" />
                        👤 View Profile
                      </button>

                      <button
                        onClick={() => handleSendToDoctor(row.appointment_id)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '9px 12px',
                          background: 'none',
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#059669',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          borderRadius: '8px'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#ecfdf5'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        <Stethoscope size={15} color="#059669" />
                        👨‍⚕️ Move to In-Consultation
                      </button>

                      <button
                        onClick={async () => {
                          try {
                            await api.patch(`/appointments/${row.appointment_id}/status`, { status: 'Completed' });
                            alert('✅ Consultation marked as Completed!');
                            setActiveActionId(null);
                            fetchData();
                          } catch (err: any) {
                            alert(err.response?.data?.error || 'Failed to update status');
                          }
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '9px 12px',
                          background: 'none',
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#16a34a',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          borderRadius: '8px'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        <CheckCircle size={15} color="#16a34a" />
                        ✅ Mark as Completed
                      </button>

                      <button
                        onClick={() => handlePrintOpSlip(row)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '9px 12px',
                          background: 'none',
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#475569',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          borderRadius: '8px'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        <Printer size={15} color="#64748b" />
                        📄 Print OP Slip
                      </button>
                    </div>
                  )}
                </div>
              )
            }
          ]}
          data={filtered}
        />
      </div>

      {/* ------------------------------------------------------------------------- */}
      {/* TRIAGE VITALS FORM MODAL (POP-UP WINDOW) */}
      {/* ------------------------------------------------------------------------- */}
      {isVitalsModalOpen && selectedAppt && (
        <Modal
          isOpen={isVitalsModalOpen}
          onClose={() => setIsVitalsModalOpen(false)}
          title={`RECORD TRIAGE VITALS - ${selectedAppt.patient_name} (${selectedAppt.medical_record_number || 'MRN-2026-10050'}) | Token #${selectedAppt.token_no || 1}`}
        >
          <form onSubmit={handleSaveVitals} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px', fontSize: '13px', color: '#334155', fontWeight: 600 }}>
              🩺 Pre-consultation vitals will be saved to this OP record and auto-synced to the patient's master <strong>Health Metrics Timeline</strong>.
            </div>

            {/* 2-Column Form Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input
                label="Weight (lbs / kg)"
                type="number"
                step="0.1"
                value={vitalsForm.weight}
                onChange={e => setVitalsForm({ ...vitalsForm, weight: e.target.value })}
                required
              />

              <Input
                label="Temperature (°F)"
                type="number"
                step="0.1"
                value={vitalsForm.temperature}
                onChange={e => setVitalsForm({ ...vitalsForm, temperature: e.target.value })}
                required
              />

              <Input
                label="Systolic BP (mmHg)"
                type="number"
                value={vitalsForm.systolicBp}
                onChange={e => setVitalsForm({ ...vitalsForm, systolicBp: e.target.value })}
                required
              />

              <Input
                label="Diastolic BP (mmHg)"
                type="number"
                value={vitalsForm.diastolicBp}
                onChange={e => setVitalsForm({ ...vitalsForm, diastolicBp: e.target.value })}
                required
              />

              <Input
                label="Heart Rate (bpm)"
                type="number"
                value={vitalsForm.heartRate}
                onChange={e => setVitalsForm({ ...vitalsForm, heartRate: e.target.value })}
                required
              />

              <Input
                label="SpO2 Oxygen (%)"
                type="number"
                value={vitalsForm.spo2}
                onChange={e => setVitalsForm({ ...vitalsForm, spo2: e.target.value })}
                required
              />

              <Input
                label="Glucose Level (mg/dL)"
                type="number"
                value={vitalsForm.glucoseLevel}
                onChange={e => setVitalsForm({ ...vitalsForm, glucoseLevel: e.target.value })}
              />

              <Select
                label="Glucose Type"
                value={vitalsForm.glucoseType}
                onChange={e => setVitalsForm({ ...vitalsForm, glucoseType: e.target.value })}
                options={[
                  { value: 'Random', label: 'Random ▾' },
                  { value: 'Fasting', label: 'Fasting ▾' },
                  { value: 'Post-Prandial', label: 'Post-Prandial ▾' }
                ]}
              />
            </div>

            {/* Chief Complaints / Triage Notes Textarea */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Chief Complaints / Triage Notes
              </label>
              <textarea
                value={vitalsForm.notes}
                onChange={e => setVitalsForm({ ...vitalsForm, notes: e.target.value })}
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Doctor Clinical Notes Textarea */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#6b21a8', marginBottom: '6px' }}>
                👨‍⚕️ Doctor Clinical Notes
              </label>
              <textarea
                value={vitalsForm.doctorNotes}
                onChange={e => setVitalsForm({ ...vitalsForm, doctorNotes: e.target.value })}
                placeholder="Enter clinical observations, diagnosis, and prescription notes for this OP ID..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1.5px solid #c084fc',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  background: '#faf5ff'
                }}
              />
            </div>

            {/* Modal Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
              <Button type="button" variant="secondary" onClick={() => setIsVitalsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={savingVitals} icon={<CheckCircle size={16} />}>
                Save & Sync to Profile
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default CheckInQueue;
