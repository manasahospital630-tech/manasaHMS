import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Plus, RefreshCw, X, Heart, AlertTriangle, FileText, CheckCircle, 
  UserPlus, UserCheck, ShieldAlert, Award, FileSpreadsheet, Play, RotateCcw, Check, Printer 
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/client';

export const EmergencyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePatient, setActivePatient] = useState<any>(null);

  // Vitals & Orders
  const [vitalsHistory, setVitalsHistory] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [newOrderText, setNewOrderText] = useState('');
  const [selectedOrderType, setSelectedOrderType] = useState<'MEDICATION' | 'IV_FLUIDS' | 'BLOOD_BANK' | 'RADIOLOGY'>('MEDICATION');

  // Modal States
  const [intakeModalOpen, setIntakeModalOpen] = useState(false);
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [selectedConsentType, setSelectedConsentType] = useState<string>('HIGH_RISK');
  const [signatoryName, setSignatoryName] = useState('');
  const [signatoryRelation, setSignatoryRelation] = useState('');
  const [consentsList, setConsentsList] = useState<any[]>([]);

  // Police Intimation Modal
  const [policeModalOpen, setPoliceModalOpen] = useState(false);
  const [policeForm, setPoliceForm] = useState({ officerName: '', badgeNumber: '', policeStation: '' });
  const [activePoliceNotice, setActivePoliceNotice] = useState<any>(null);

  // Status Change Modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<'IP_TRANSFERRED' | 'DISCHARGED' | 'MORTUARY'>('DISCHARGED');
  const [targetBedId, setTargetBedId] = useState('');

  // Vitals capture state
  const [vitalForm, setVitalForm] = useState({
    bpSys: '', bpDia: '', pulse: '', spo2: '', respiratoryRate: '', gcsScore: '15'
  });

  // Intake Form State
  const [isUnknown, setIsUnknown] = useState(false);
  const [intakeForm, setIntakeForm] = useState({
    patientName: '',
    estimatedAge: '',
    gender: 'Male',
    physicalMarks: '',
    belongingsInventory: '',
    isMLC: false,
    mlcCategory: 'RTA',
    triagePriority: 'RED' as 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN',
    currentBedId: '',
    broughtByName: '',
    broughtByPhone: '',
    broughtByRelation: '',
    policeBadgeNumber: '',
    policeStation: '',
    policeOfficerName: ''
  });

  // Canvas signature state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const bedRes = await api.get('/inpatient/beds');
      if (bedRes.data && bedRes.data.data) {
        setBeds(bedRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load beds:', err);
    }

    try {
      const patRes = await api.get('/v1/emergency/active-patients');
      if (patRes.data && patRes.data.data) {
        setPatients(patRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load active emergency patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Set active patient details & load active patient monitoring timelines
  const selectPatient = async (patient: any) => {
    setActivePatient(patient);
    try {
      const [vitalsRes, ordersRes, consentsRes] = await Promise.all([
        api.get(`/v1/emergency/vitals/history/${patient.emergency_id}`),
        api.get(`/v1/emergency/orders/${patient.emergency_id}`),
        api.get(`/v1/emergency/consents/${patient.emergency_id}`)
      ]);
      setVitalsHistory(vitalsRes.data.data || []);
      setOrders(ordersRes.data.data || []);
      setConsentsList(consentsRes.data.data || []);
    } catch (err) {
      console.error('Failed to load patient timelines:', err);
    }
  };

  const handleIntakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Find doctor user ID from local session or set dummy
      const payload = {
        isUnknown,
        patientName: intakeForm.patientName,
        estimatedAge: intakeForm.estimatedAge,
        gender: intakeForm.gender,
        physicalMarks: intakeForm.physicalMarks,
        belongingsInventory: intakeForm.belongingsInventory,
        isMLC: intakeForm.isMLC,
        mlcCategory: intakeForm.isMLC ? intakeForm.mlcCategory : null,
        broughtBy: {
          name: intakeForm.broughtByName || 'Unknown Samaritian',
          phone: intakeForm.broughtByPhone,
          relation: intakeForm.broughtByRelation,
          policeBadgeNumber: intakeForm.policeBadgeNumber,
          policeStation: intakeForm.policeStation,
          policeOfficerName: intakeForm.policeOfficerName
        },
        triagePriority: intakeForm.triagePriority,
        currentBedId: intakeForm.currentBedId || null,
        admittingDoctorId: user?.user_id || 'u-doc-02'
      };

      const res = await api.post('/v1/emergency/admit', payload);
      if (res.data.success) {
        setIntakeModalOpen(false);
        loadData();
        // Reset
        setIntakeForm({
          patientName: '', estimatedAge: '', gender: 'Male', physicalMarks: '',
          belongingsInventory: '', isMLC: false, mlcCategory: 'RTA',
          triagePriority: 'RED', currentBedId: '', broughtByName: '',
          broughtByPhone: '', broughtByRelation: '', policeBadgeNumber: '',
          policeStation: '', policeOfficerName: ''
        });
        setIsUnknown(false);

        if (res.data.policeNotice?.requiresImmediatePoliceNotice) {
          setActivePoliceNotice({
            ...res.data.policeNotice,
            emergencyId: res.data.data.emergency_id
          });
          setPoliceModalOpen(true);
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to admit emergency patient. Please check bed assignment.');
    }
  };

  const handlePoliceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/v1/emergency/mlc-police-intimation', {
        emergencyId: activePoliceNotice.emergencyId,
        officerName: policeForm.officerName,
        badgeNumber: policeForm.badgeNumber,
        policeStation: policeForm.policeStation
      });
      setPoliceModalOpen(false);
      setPoliceForm({ officerName: '', badgeNumber: '', policeStation: '' });
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to log police intimation');
    }
  };

  const handleVitalsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient) return;
    try {
      const payload = {
        emergencyId: activePatient.emergency_id,
        bpSys: vitalForm.bpSys ? parseInt(vitalForm.bpSys) : null,
        bpDia: vitalForm.bpDia ? parseInt(vitalForm.bpDia) : null,
        pulse: vitalForm.pulse ? parseInt(vitalForm.pulse) : null,
        spo2: vitalForm.spo2 ? parseInt(vitalForm.spo2) : null,
        respiratoryRate: vitalForm.respiratoryRate ? parseInt(vitalForm.respiratoryRate) : null,
        gcsScore: vitalForm.gcsScore ? parseInt(vitalForm.gcsScore) : null
      };

      await api.post('/v1/emergency/vitals/log', payload);
      setVitalForm({ bpSys: '', bpDia: '', pulse: '', spo2: '', respiratoryRate: '', gcsScore: '15' });
      selectPatient(activePatient); // Reload details
    } catch (err) {
      console.error(err);
      alert('Failed to log vital signs.');
    }
  };

  const handleCreateOrder = async (predefinedDetails?: string) => {
    if (!activePatient) return;
    const details = predefinedDetails || newOrderText;
    if (!details.trim()) return;

    try {
      await api.post('/v1/emergency/orders', {
        emergencyId: activePatient.emergency_id,
        orderType: selectedOrderType,
        details
      });
      setNewOrderText('');
      selectPatient(activePatient); // Reload
    } catch (err) {
      console.error(err);
      alert('Failed to place STAT order.');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.patch(`/v1/emergency/orders/${orderId}/status`, { status });
      if (activePatient) selectPatient(activePatient);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusTransition = async () => {
    if (!activePatient) return;
    try {
      await api.put('/v1/emergency/status-update', {
        emergencyId: activePatient.emergency_id,
        status: targetStatus,
        currentBedId: targetStatus === 'IP_TRANSFERRED' ? targetBedId : null
      });
      setStatusModalOpen(false);
      setActivePatient(null);
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to update status. Please make sure destination bed is available.');
    }
  };

  // Canvas drawings handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveConsentSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !activePatient) return;
    const signatureDataUrl = canvas.toDataURL();

    try {
      await api.post('/v1/emergency/consents/sign', {
        emergencyId: activePatient.emergency_id,
        consentType: selectedConsentType,
        signatoryName,
        relation: signatoryRelation,
        signatureDataUrl
      });
      setConsentModalOpen(false);
      setSignatoryName('');
      setSignatoryRelation('');
      selectPatient(activePatient); // Reload
    } catch (err) {
      console.error(err);
      alert('Failed to record digital signature.');
    }
  };

  const getTriagePriorityColor = (priority: string) => {
    switch (priority) {
      case 'RED': return '#ef4444';
      case 'ORANGE': return '#f59e0b';
      case 'YELLOW': return '#eab308';
      case 'GREEN': return '#10b981';
      default: return '#64748b';
    }
  };

  return (
    <div style={{ color: 'var(--text-primary)', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={28} color="#ef4444" className="spin" style={{ animationDuration: '3s' }} />
            Emergency & Trauma Management Console (ETM)
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px' }}>
            Real-time zero-wait triage workspace, digital police intimations, and continuous ER vitals monitoring logs
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" onClick={loadData} icon={<RefreshCw size={14} />}>
            Refresh
          </Button>
          <Button variant="primary" onClick={() => setIntakeModalOpen(true)} icon={<UserPlus size={14} />} style={{ background: 'var(--accent-danger)' }}>
            Rapid Triage Intake
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        
        {/* LEFT COLUMN: ACTIVE ER PATIENTS QUEUE BY MANCHESTER TRIAGE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card title="Manchester Triage ER Grid" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
            {patients.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No active emergency cases. Click <strong>Rapid Triage Intake</strong> to admit a patient.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {patients.map((pat) => {
                  const pCol = getTriagePriorityColor(pat.triage_priority);
                  const isSelected = activePatient?.emergency_id === pat.emergency_id;
                  return (
                    <div 
                      key={pat.emergency_id}
                      onClick={() => selectPatient(pat)}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        background: isSelected ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-primary)',
                        borderLeft: `5px solid ${pCol}`,
                        border: isSelected ? '1px solid #ef4444' : '1px solid var(--border-primary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px' }}>
                          {pat.first_name} {pat.last_name}
                        </span>
                        <span style={{ fontSize: '10px', background: pCol, color: '#fff', padding: '1px 6px', borderRadius: '50px', fontWeight: 'bold' }}>
                          {pat.triage_priority}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        <span>MRN: {pat.medical_record_number}</span>
                        <span>Bed: {pat.bed_number ? `${pat.ward_name} - ${pat.bed_number}` : 'Unallocated'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', marginTop: '4px', borderTop: '1px solid var(--border-secondary)', paddingTop: '4px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Arrived: {new Date(pat.admitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {pat.is_mlc && (
                          <span style={{ color: '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <ShieldAlert size={12} /> MLC
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN: ACTIVE PATIENT WORKSPACE / ER MONITORING LOG */}
        <div>
          {activePatient ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Patient Core ETM Details */}
              <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-primary)', paddingBottom: '12px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px', fontWeight: 800 }}>{activePatient.first_name} {activePatient.last_name}</span>
                      {activePatient.is_mlc && <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px' }}>MLC CASE</span>}
                      {activePatient.is_unknown && <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px' }}>UNKNOWN IDENTITY</span>}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>
                      Tracking ID: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{activePatient.emergency_tracking_id}</span> • MRN: {activePatient.medical_record_number} • Triage: <strong style={{ color: getTriagePriorityColor(activePatient.triage_priority) }}>{activePatient.triage_priority}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Button variant="secondary" onClick={() => setConsentModalOpen(true)} icon={<FileText size={14} />}>
                      Legal Consents ({consentsList.length})
                    </Button>
                    <Button variant="primary" style={{ background: 'var(--accent-primary)' }} onClick={() => { setTargetStatus('IP_TRANSFERRED'); setStatusModalOpen(true); }}>
                      Discharge / Shift
                    </Button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '12px' }}>
                  <div>
                    <div style={{ marginBottom: '6px' }}><span style={{ color: 'var(--text-secondary)' }}>Physical Marks:</span> {activePatient.physical_marks || 'None noted'}</div>
                    <div><span style={{ color: 'var(--text-secondary)' }}>Belongings Inventory:</span> {activePatient.belongings_inventory || 'None logged'}</div>
                  </div>
                  <div>
                    <div style={{ marginBottom: '6px' }}><span style={{ color: 'var(--text-secondary)' }}>Brought By:</span> {activePatient.brought_by_name} ({activePatient.brought_by_relation || 'Samaritian'})</div>
                    <div><span style={{ color: 'var(--text-secondary)' }}>Contact Phone:</span> {activePatient.brought_by_phone || 'N/A'}</div>
                  </div>
                </div>
              </Card>

              {/* STAT Orders Bar */}
              <Card title="Emergency Orders Bar (STAT Entries)" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px', borderBottom: '1px solid var(--border-secondary)', paddingBottom: '14px' }}>
                  <Button variant="secondary" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => handleCreateOrder('Adrenaline 1mg IV STAT')}>💉 Adrenaline STAT</Button>
                  <Button variant="secondary" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => handleCreateOrder('Atropine 0.6mg IV STAT')}>💉 Atropine STAT</Button>
                  <Button variant="secondary" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => handleCreateOrder('Normal Saline 500ml IV STAT')}>💧 Normal Saline</Button>
                  <Button variant="secondary" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => handleCreateOrder('Urgent CT Brain Scan STAT')}>🧠 Urgent CT Brain</Button>
                  <Button variant="secondary" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => handleCreateOrder('Urgent Chest X-Ray STAT')}>🩻 Urgent Chest X-Ray</Button>
                  <Button variant="secondary" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => handleCreateOrder('Order 2 Units PRBC Blood Bank STAT')}>🩸 Blood Bank STAT</Button>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <select 
                    className="select"
                    value={selectedOrderType}
                    onChange={(e) => setSelectedOrderType(e.target.value as any)}
                    style={{ width: '130px', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)', fontSize: '12px' }}
                  >
                    <option value="MEDICATION">Medication</option>
                    <option value="IV_FLUIDS">IV Fluids</option>
                    <option value="BLOOD_BANK">Blood Bank</option>
                    <option value="RADIOLOGY">Radiology</option>
                  </select>
                  <input 
                    type="text"
                    className="input"
                    placeholder="Type custom doctor instructions or prescription..."
                    value={newOrderText}
                    onChange={(e) => setNewOrderText(e.target.value)}
                    style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)', fontSize: '12px' }}
                  />
                  <Button variant="primary" onClick={() => handleCreateOrder()}>Place STAT Order</Button>
                </div>

                {/* Orders Log */}
                <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {orders.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', textAlign: 'center', padding: '10px' }}>No orders placed.</div>
                  ) : (
                    orders.map((ord) => (
                      <div key={ord.order_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', border: '1px solid var(--border-primary)' }}>
                        <div>
                          <span style={{ fontWeight: 'bold', marginRight: '8px', color: '#ef4444' }}>{ord.order_type}</span>
                          <span>{ord.details}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '10px', marginLeft: '8px' }}>by Dr. {ord.first_name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ 
                            fontSize: '10px', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold',
                            background: ord.status === 'Completed' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                            color: ord.status === 'Completed' ? 'var(--accent-success)' : 'var(--accent-warning)'
                          }}>
                            {ord.status}
                          </span>
                          {ord.status !== 'Completed' && (
                            <button 
                              onClick={() => handleUpdateOrderStatus(ord.order_id, 'Completed')}
                              style={{ background: '#10b981', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', padding: '2px 6px', fontSize: '10px' }}
                            >
                              Administer
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Vitals Log and Timeline */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                
                {/* Vitals capture form */}
                <Card title="Log High-Frequency Vitals" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                  <form onSubmit={handleVitalsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>BP Systolic (mmHg)</label>
                        <input type="number" className="input" value={vitalForm.bpSys} onChange={(e) => setVitalForm({ ...vitalForm, bpSys: e.target.value })} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>BP Diastolic (mmHg)</label>
                        <input type="number" className="input" value={vitalForm.bpDia} onChange={(e) => setVitalForm({ ...vitalForm, bpDia: e.target.value })} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Pulse (bpm)</label>
                        <input type="number" className="input" value={vitalForm.pulse} onChange={(e) => setVitalForm({ ...vitalForm, pulse: e.target.value })} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>SpO2 (%)</label>
                        <input type="number" className="input" value={vitalForm.spo2} onChange={(e) => setVitalForm({ ...vitalForm, spo2: e.target.value })} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Resp. Rate</label>
                        <input type="number" className="input" value={vitalForm.respiratoryRate} onChange={(e) => setVitalForm({ ...vitalForm, respiratoryRate: e.target.value })} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Glasgow Coma Scale (GCS Score)</label>
                      <select 
                        className="select" 
                        value={vitalForm.gcsScore} 
                        onChange={(e) => setVitalForm({ ...vitalForm, gcsScore: e.target.value })}
                        style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
                      >
                        <option value="15">15 - Fully Awake/Oriented</option>
                        <option value="14">14 - Mildly Confused</option>
                        <option value="13">13 - Drowsy/Lethargic</option>
                        <option value="12">12 - Moderate Brain Injury</option>
                        <option value="9">9 - Severe Comatose Block</option>
                        <option value="6">6 - Responsive to Pain Only</option>
                        <option value="3">3 - Completely Unresponsive/Coma</option>
                      </select>
                    </div>
                    <Button variant="primary" type="submit" style={{ marginTop: '6px' }}>Log Vitals Entry</Button>
                  </form>
                </Card>

                {/* Vitals history timeline */}
                <Card title="Continuous Monitoring Timeline" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                  <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {vitalsHistory.length === 0 ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: '11px', textAlign: 'center', padding: '10px' }}>No vitals logged yet.</div>
                    ) : (
                      vitalsHistory.map((vit, idx) => (
                        <div key={vit.log_id} style={{ borderBottom: '1px solid var(--border-secondary)', paddingBottom: '6px', fontSize: '11px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '2px', color: 'var(--text-secondary)' }}>
                            <span>Log #{vitalsHistory.length - idx}</span>
                            <span>{new Date(vit.logged_at).toLocaleTimeString()}</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: '4px', fontFamily: 'monospace' }}>
                            <span>BP: {vit.bp_sys}/{vit.bp_dia}</span>
                            <span>Pulse: {vit.pulse}</span>
                            <span>SpO2: {vit.spo2}%</span>
                            <span style={{ color: vit.gcs_score < 12 ? '#ef4444' : 'inherit', fontWeight: vit.gcs_score < 12 ? 'bold' : 'normal' }}>GCS: {vit.gcs_score}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>

              </div>

            </div>
          ) : (
            <div style={{ background: 'var(--bg-card)', border: '1px dashed var(--border-primary)', borderRadius: '8px', padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Heart size={48} color="#ef4444" style={{ marginBottom: '16px', opacity: 0.7 }} />
              <h3>Select an active emergency patient from the Manchester Triage ER grid to open the continuous workspace.</h3>
            </div>
          )}
        </div>

      </div>

      {/* MODAL 1: RAPID TRIAGE INTAKE FORM */}
      {intakeModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '20px' }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '12px', width: '100%', maxWidth: '600px', padding: '24px', position: 'relative' }}>
            <button onClick={() => setIntakeModalOpen(false)} style={{ position: 'absolute', right: '16px', top: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus color="#ef4444" size={22} /> Rapid Emergency Admittance Form
            </h2>

            <form onSubmit={handleIntakeSubmit}>
              
              {/* Unknown/John Doe Toggle */}
              <div style={{ display: 'flex', background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-primary)', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>Unconscious / Unattended Victim mode (John Doe)</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Auto-generates dummy ID, estimated age, gender and belongings inventory</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={isUnknown} 
                  onChange={(e) => setIsUnknown(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                {!isUnknown ? (
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Patient Full Name *</label>
                    <input type="text" className="input" value={intakeForm.patientName} onChange={(e) => setIntakeForm({ ...intakeForm, patientName: e.target.value })} required placeholder="Name" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                ) : (
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Physical Identification Marks *</label>
                    <input type="text" className="input" value={intakeForm.physicalMarks} onChange={(e) => setIntakeForm({ ...intakeForm, physicalMarks: e.target.value })} required placeholder="Tattoos, birthmarks, scars..." style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                )}
                
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{isUnknown ? 'Estimated Age *' : 'Patient Age'}</label>
                  <input type="text" className="input" value={intakeForm.estimatedAge} onChange={(e) => setIntakeForm({ ...intakeForm, estimatedAge: e.target.value })} placeholder="e.g. 25-30 years" required style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Gender *</label>
                  <select className="select" value={intakeForm.gender} onChange={(e) => setIntakeForm({ ...intakeForm, gender: e.target.value })} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Manchester Triage Level *</label>
                  <select className="select" value={intakeForm.triagePriority} onChange={(e) => setIntakeForm({ ...intakeForm, triagePriority: e.target.value as any })} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                    <option value="RED">RED - Resuscitation (Immediate)</option>
                    <option value="ORANGE">ORANGE - Emergency (10 min)</option>
                    <option value="YELLOW">YELLOW - Urgent (60 min)</option>
                    <option value="GREEN">GREEN - Non-Urgent (120 min)</option>
                  </select>
                </div>
              </div>

              {/* Medico-Legal Case Checkbox */}
              <div style={{ display: 'flex', background: 'var(--bg-primary)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-primary)', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Is Medico-Legal Case (MLC)?</span>
                <input 
                  type="checkbox" 
                  checked={intakeForm.isMLC} 
                  onChange={(e) => setIntakeForm({ ...intakeForm, isMLC: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>

              {intakeForm.isMLC && (
                <div style={{ background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.15)', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>MLC Classification Category *</label>
                  <select className="select" value={intakeForm.mlcCategory} onChange={(e) => setIntakeForm({ ...intakeForm, mlcCategory: e.target.value })} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                    <option value="RTA">Road Traffic Accident (RTA) / Hit & Run</option>
                    <option value="SUICIDE_ATTEMPT">Attempted Suicide / Self-Harm / Overdose</option>
                    <option value="ASSAULT">Physical Assault / Burn Case / Poisoning</option>
                    <option value="INDUSTRIAL">Industrial / Workplace Injury</option>
                  </select>
                </div>
              )}

              {/* Bed Assignment */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Assign ER Bed</label>
                <select className="select" value={intakeForm.currentBedId} onChange={(e) => setIntakeForm({ ...intakeForm, currentBedId: e.target.value })} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  <option value="">Select Bed (Unallocated)</option>
                  {beds.map(b => (
                    <option key={b.bed_id} value={b.bed_id} disabled={b.status !== 'Available'}>
                      {b.ward_name} - Bed {b.bed_number} ({b.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Belongings & Brought by */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Brought-By Person Name *</label>
                  <input type="text" className="input" value={intakeForm.broughtByName} onChange={(e) => setIntakeForm({ ...intakeForm, broughtByName: e.target.value })} required placeholder="e.g. Samaritian / Officer Name" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Brought-By Relation</label>
                  <input type="text" className="input" value={intakeForm.broughtByRelation} onChange={(e) => setIntakeForm({ ...intakeForm, broughtByRelation: e.target.value })} placeholder="e.g. Ambulance / Bystander" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Brought-By Contact Phone</label>
                  <input type="text" className="input" value={intakeForm.broughtByPhone} onChange={(e) => setIntakeForm({ ...intakeForm, broughtByPhone: e.target.value })} placeholder="Phone" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Belongings Inventory Details</label>
                  <input type="text" className="input" value={intakeForm.belongingsInventory} onChange={(e) => setIntakeForm({ ...intakeForm, belongingsInventory: e.target.value })} placeholder="Keys, cash, phone, clothing description..." style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-primary)', paddingTop: '16px' }}>
                <Button variant="secondary" type="button" onClick={() => setIntakeModalOpen(false)}>Cancel</Button>
                <Button variant="primary" type="submit" style={{ background: 'var(--accent-danger)' }}>Initiate Zero-Wait Care</Button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DIGITAL CONSENTS & SIGNATURES */}
      {consentModalOpen && activePatient && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '20px' }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '12px', width: '100%', maxWidth: '650px', padding: '24px', position: 'relative' }}>
            <button onClick={() => setConsentModalOpen(false)} style={{ position: 'absolute', right: '16px', top: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Legal Consent Processing</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Select Agreement Template</label>
                <select className="select" value={selectedConsentType} onChange={(e) => setSelectedConsentType(e.target.value)} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', marginBottom: '12px' }}>
                  <option value="HIGH_RISK">Emergency High-Risk Consent</option>
                  <option value="POLICE_INTIMATION">Police Intimation Letter</option>
                  <option value="BROUGHT_BY_WITNESS">Brought-By / Witness Form</option>
                  <option value="SELF_HARM_DECLARATION">Self-Harm Declaration</option>
                  <option value="LAMA">LAMA / Refusal Waiver</option>
                </select>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Signatory Full Name *</label>
                  <input type="text" className="input" value={signatoryName} onChange={(e) => setSignatoryName(e.target.value)} placeholder="John Doe" required style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', marginBottom: '8px' }} />
                  
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Relation to Patient</label>
                  <input type="text" className="input" value={signatoryRelation} onChange={(e) => setSignatoryRelation(e.target.value)} placeholder="e.g. Spouse / Brother / Witness" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', marginBottom: '12px' }} />
                </div>

                <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '6px', fontSize: '11px', border: '1px solid var(--border-primary)' }}>
                  <strong>Consent Records Signed:</strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                    {consentsList.length === 0 ? 'No signatures logged' : consentsList.map(c => (
                      <div key={c.consent_id} style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                        <span>{c.consent_type}</span>
                        <span>{new Date(c.signed_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Digital Signature Pad (Draw Signature)</label>
                <div style={{ background: '#fff', border: '1px solid var(--border-primary)', borderRadius: '8px', overflow: 'hidden' }}>
                  <canvas 
                    ref={canvasRef}
                    width={330}
                    height={160}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    style={{ cursor: 'crosshair', display: 'block', background: '#fff' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                  <Button variant="secondary" icon={<RotateCcw size={12} />} onClick={clearCanvas}>Clear Canvas</Button>
                  <Button variant="primary" onClick={saveConsentSignature}>Capture Signature</Button>
                </div>

                <div style={{ marginTop: '12px', fontSize: '10px', color: 'var(--text-muted)' }}>
                  By signing above, the relative / witness verifies consent to emergency surgical/medical procedures under high-risk exemptions.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: AUTOMATED POLICE INTIMATION TRIGGER */}
      {policeModalOpen && activePoliceNotice && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
          <div style={{ background: 'var(--bg-secondary)', border: '2px solid #ef4444', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '24px', position: 'relative' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px 0', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={24} /> MLC Police Intimation Triggered
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              The system has flagged this MLC Case as requiring immediate police notification. Please fill out officer intake details.
            </p>

            <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-primary)', marginBottom: '16px', fontSize: '12px', fontFamily: 'monospace' }}>
              <strong>Notice Subject:</strong> {activePoliceNotice.noticeSubject}<br/>
              <strong>Brought By:</strong> {activePoliceNotice.templateData.broughtBy}<br/>
              <strong>Diagnosis:</strong> {activePoliceNotice.templateData.provisionalDiagnosis}<br/>
              <strong>Timestamp:</strong> {new Date(activePoliceNotice.templateData.timeOfArrival).toLocaleString()}
            </div>

            <form onSubmit={handlePoliceSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Police Officer Name *</label>
                  <input type="text" className="input" value={policeForm.officerName} onChange={(e) => setPoliceForm({ ...policeForm, officerName: e.target.value })} required placeholder="Officer Name" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Badge Number *</label>
                    <input type="text" className="input" value={policeForm.badgeNumber} onChange={(e) => setPoliceForm({ ...policeForm, badgeNumber: e.target.value })} required placeholder="Badge #" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Police Station Jurisdiction *</label>
                    <input type="text" className="input" value={policeForm.policeStation} onChange={(e) => setPoliceForm({ ...policeForm, policeStation: e.target.value })} required placeholder="Station Name" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <Button variant="primary" type="submit" style={{ background: '#ef4444' }}>Submit Police Intimation Letter</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: DISCHARGE & STATUS TRANSITION */}
      {statusModalOpen && activePatient && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '12px', width: '100%', maxWidth: '450px', padding: '24px', position: 'relative' }}>
            <button onClick={() => setStatusModalOpen(false)} style={{ position: 'absolute', right: '16px', top: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>ER Status Discharge/Transfer</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Select Transition Status</label>
                <select className="select" value={targetStatus} onChange={(e) => setTargetStatus(e.target.value as any)} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  <option value="IP_TRANSFERRED">IP_TRANSFERRED (Admit to inpatient ward)</option>
                  <option value="DISCHARGED">DISCHARGED (Releasing patient)</option>
                  <option value="MORTUARY">MORTUARY (Death registered)</option>
                </select>
              </div>

              {targetStatus === 'IP_TRANSFERRED' && (
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Assign Inpatient Ward Bed *</label>
                  <select className="select" value={targetBedId} onChange={(e) => setTargetBedId(e.target.value)} required style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                    <option value="">Select Bed</option>
                    {beds.map(b => (
                      <option key={b.bed_id} value={b.bed_id} disabled={b.status !== 'Available'}>
                        {b.ward_name} - Bed {b.bed_number} ({b.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="secondary" onClick={() => setStatusModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleStatusTransition}>Execute Transition</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default EmergencyDashboard;
