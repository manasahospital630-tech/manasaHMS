import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bed, AlertCircle, RefreshCw, CheckCircle, Search, LogIn, Plus, Edit, Trash2, X, Settings } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/client';

export const InpatientBeds: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [beds, setBeds] = useState<any[]>([]);
  const [activeAdmissions, setActiveAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Floor Tabs State
  const [activeFloor, setActiveFloor] = useState('All Floors');

  // Management Mode States
  const [isManageMode, setIsManageMode] = useState(false);
  const [bedModalOpen, setBedModalOpen] = useState(false);
  const [editingBed, setEditingBed] = useState<any | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Form States for Add/Edit Bed
  const [bedForm, setBedForm] = useState({
    bedNumber: '',
    wardName: '',
    wardType: 'General',
    floor: '1',
    dailyRate: '2000',
    status: 'Available'
  });

  const isConfigRole = user?.role === 'Admin' || user?.role === 'Incharge';

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [bedsRes, admissionsRes] = await Promise.all([
        api.get('/inpatient/beds'),
        api.get('/inpatient/admissions/active')
      ]);

      if (bedsRes.data.success) {
        setBeds(bedsRes.data.data || []);
      }
      if (admissionsRes.data.success) {
        setActiveAdmissions(admissionsRes.data.data || []);
      }
    } catch (err: any) {
      console.error('Failed to load beds census:', err);
      setError('Unable to fetch beds census and active admissions data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Extract floors dynamically from the beds list
  const floorsList = ['All Floors', ...Array.from(new Set(beds.map((b: any) => b.floor || '1st Floor'))).sort()];

  // Filter beds based on floor AND search term
  const visibleBeds = beds.filter((bed: any) => {
    const matchesFloor = activeFloor === 'All Floors' || bed.floor === activeFloor;
    if (!matchesFloor) return false;

    const term = searchTerm.toLowerCase();
    const matchesBed = bed.bed_number.toLowerCase().includes(term) || bed.ward_name.toLowerCase().includes(term);
    
    const admission = activeAdmissions.find((a: any) => a.current_bed_id === bed.bed_id);
    const matchesPatient = admission 
      ? `${admission.first_name} ${admission.last_name}`.toLowerCase().includes(term) || admission.medical_record_number.toLowerCase().includes(term)
      : false;
      
    return matchesBed || matchesPatient;
  });

  // Calculate statistics
  const totalBedsCount = beds.length;
  const occupiedBedsCount = beds.filter((b: any) => b.status === 'Occupied').length;
  const availableBedsCount = beds.filter((b: any) => b.status === 'Available').length;
  const occupancyRate = totalBedsCount > 0 ? Math.round((occupiedBedsCount / totalBedsCount) * 100) : 0;

  // Group beds by ward
  const bedsByWard = visibleBeds.reduce((acc: Record<string, any[]>, bed: any) => {
    if (!acc[bed.ward_name]) {
      acc[bed.ward_name] = [];
    }
    acc[bed.ward_name].push(bed);
    return acc;
  }, {});

  const handleBedClick = (bed: any) => {
    if (isManageMode) return; // Ignore standard redirect when in management mode
    if (bed.status === 'Available') {
      navigate(`/inpatient/admission?bedId=${bed.bed_id}&wardName=${encodeURIComponent(bed.ward_name)}&bedNum=${encodeURIComponent(bed.bed_number)}`);
    }
  };

  const openAddModal = () => {
    setEditingBed(null);
    setBedForm({
      bedNumber: '',
      wardName: '',
      wardType: 'General',
      floor: activeFloor !== 'All Floors' ? activeFloor : '1',
      dailyRate: '2000',
      status: 'Available'
    });
    setModalError('');
    setBedModalOpen(true);
  };

  const openEditModal = (bed: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBed(bed);
    setBedForm({
      bedNumber: bed.bed_number,
      wardName: bed.ward_name,
      wardType: bed.ward_type || 'General',
      floor: bed.floor ? bed.floor.toString() : '1',
      dailyRate: bed.daily_rate ? parseFloat(bed.daily_rate).toString() : '2000',
      status: bed.status
    });
    setModalError('');
    setBedModalOpen(true);
  };

  const handleDeleteBed = async (bedId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this room/bed configuration?')) {
      return;
    }
    try {
      await api.delete(`/inpatient/beds/${bedId}`);
      fetchData();
      alert('Bed removed from census.');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete bed configuration.');
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');

    const payload = {
      bedNumber: bedForm.bedNumber,
      wardName: bedForm.wardName,
      wardType: bedForm.wardType,
      floor: parseInt(bedForm.floor) || 1,
      dailyRate: parseFloat(bedForm.dailyRate),
      status: bedForm.status
    };

    try {
      if (editingBed) {
        await api.put(`/inpatient/beds/${editingBed.bed_id}`, payload);
      } else {
        await api.post('/inpatient/beds', payload);
      }
      setBedModalOpen(false);
      fetchData();
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to save bed settings. Make sure fields are correct.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bed size={28} color="var(--accent-primary)" />
            Rooms & Beds Floor Census
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px' }}>
            Arrange hospital layout by floors, wards, and beds
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" onClick={fetchData} icon={<RefreshCw size={14} />} disabled={loading}>
            Refresh
          </Button>

          {isConfigRole && (
            <Button 
              variant={isManageMode ? 'primary' : 'secondary'} 
              onClick={() => setIsManageMode(!isManageMode)} 
              icon={<Settings size={14} />}
            >
              {isManageMode ? 'Exit Configure Mode' : 'Configure Wards'}
            </Button>
          )}

          {isManageMode && (
            <Button variant="primary" onClick={openAddModal} icon={<Plus size={14} />}>
              Add Bed
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)', color: 'var(--accent-danger)', padding: '16px', borderRadius: '10px', marginBottom: '24px' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Ribbon */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '16px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Total Hospital Beds</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>{totalBedsCount} Beds</div>
        </Card>
        
        <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '16px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Occupied Beds</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px', color: 'var(--accent-primary)' }}>
            {occupiedBedsCount} Beds
          </div>
        </Card>
        
        <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '16px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Available Beds</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px', color: 'var(--accent-success)' }}>
            {availableBedsCount} Beds
          </div>
        </Card>
        
        <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '16px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Bed Occupancy Rate</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {occupancyRate}%
            <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '50px', background: occupancyRate > 85 ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)', color: occupancyRate > 85 ? 'var(--accent-danger)' : 'var(--accent-success)' }}>
              {occupancyRate > 85 ? 'Critical' : 'Healthy'}
            </span>
          </div>
        </Card>
      </div>

      {/* Floor Selection Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-primary)', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
        {floorsList.map(floorName => (
          <button
            key={floorName}
            onClick={() => setActiveFloor(floorName)}
            style={{
              padding: '8px 16px',
              background: activeFloor === floorName ? 'var(--bg-card)' : 'transparent',
              color: activeFloor === floorName ? 'var(--accent-primary)' : 'var(--text-secondary)',
              border: activeFloor === floorName ? '1px solid var(--border-primary)' : '1px solid transparent',
              borderBottom: activeFloor === floorName ? '1px solid transparent' : '1px solid transparent',
              borderRadius: '8px 8px 0 0',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              marginBottom: '-5px',
              transition: 'all 0.2s'
            }}
          >
            {floorName}
          </button>
        ))}
      </div>

      {/* Search Toolbar */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px', padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Search size={16} />
          </span>
          <input 
            type="text" 
            placeholder="Search rooms/beds by number, ward, patient name or MRN..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
            style={{ paddingLeft: '38px', background: 'var(--bg-primary)' }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <RefreshCw size={32} className="spin" color="var(--accent-primary)" style={{ animation: 'spin 1.5s linear infinite' }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Loading beds census layout...</span>
        </div>
      ) : Object.keys(bedsByWard).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px' }}>
          <Bed size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
          <h3 style={{ margin: 0, fontWeight: 600 }}>No Beds Configured</h3>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px' }}>
            {activeFloor !== 'All Floors' ? `No Wards or Beds are configured on the ${activeFloor}.` : 'No hospital beds matched your search filter.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {Object.entries(bedsByWard).map(([wardName, wardBeds]) => (
            <Card key={wardName} title={`${wardName} (${wardBeds[0]?.floor || '1st Floor'})`} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginTop: '16px' }}>
                {wardBeds.map((bed: any) => {
                  const admission = activeAdmissions.find((a: any) => a.current_bed_id === bed.bed_id);
                  const isOccupied = bed.status === 'Occupied';
                  const isAvailable = bed.status === 'Available';
                  
                  let border = '1px solid var(--border-primary)';
                  let bg = 'rgba(255,255,255,0.01)';
                  let badgeBg = 'rgba(100,116,139,0.1)';
                  let badgeColor = 'var(--text-secondary)';

                  if (isOccupied) {
                    border = '1px solid rgba(14,165,233,0.3)';
                    bg = 'rgba(14,165,233,0.03)';
                    badgeBg = 'rgba(14,165,233,0.15)';
                    badgeColor = 'var(--accent-primary)';
                  } else if (isAvailable) {
                    border = '1px solid rgba(16,185,129,0.3)';
                    bg = 'rgba(16,185,129,0.03)';
                    badgeBg = 'rgba(16,185,129,0.15)';
                    badgeColor = 'var(--accent-success)';
                  } else {
                    border = '1px solid rgba(245,158,11,0.3)';
                    bg = 'rgba(245,158,11,0.03)';
                    badgeBg = 'rgba(245,158,11,0.15)';
                    badgeColor = 'var(--accent-warning)';
                  }

                  return (
                    <div 
                      key={bed.bed_id}
                      onClick={() => handleBedClick(bed)}
                      style={{ 
                        border, 
                        background: bg,
                        borderRadius: '10px', 
                        padding: '16px', 
                        cursor: isAvailable && !isManageMode ? 'pointer' : 'default',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '130px',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        if (isAvailable && !isManageMode) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.borderColor = 'var(--accent-success)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (isAvailable && !isManageMode) {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)';
                        }
                      }}
                    >
                      {/* Administrative Edit Actions */}
                      {isManageMode && (
                        <div style={{ position: 'absolute', right: '10px', bottom: '10px', display: 'flex', gap: '6px', zIndex: 10 }}>
                          <button 
                            onClick={(e) => openEditModal(bed, e)}
                            style={{ padding: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex' }}
                            title="Edit Bed"
                          >
                            <Edit size={12} />
                          </button>
                          <button 
                            onClick={(e) => handleDeleteBed(bed.bed_id, e)}
                            style={{ padding: '6px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.15)', borderRadius: '6px', cursor: 'pointer', color: 'var(--accent-danger)', display: 'flex' }}
                            disabled={isOccupied}
                            title={isOccupied ? 'Cannot delete occupied bed' : 'Delete Bed'}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}

                      {/* Top Row: Bed details */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Bed size={16} color={isOccupied ? 'var(--accent-primary)' : isAvailable ? 'var(--accent-success)' : 'var(--accent-warning)'} />
                          <span style={{ fontWeight: 700, fontSize: '15px' }}>Bed {bed.bed_number}</span>
                        </div>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '50px', fontWeight: 600, background: badgeBg, color: badgeColor }}>
                          {bed.status}
                        </span>
                      </div>

                      {/* Middle: Details / Status text */}
                      <div style={{ margin: '12px 0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        {isOccupied && admission ? (
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                              {admission.first_name} {admission.last_name}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              MRN: {admission.medical_record_number}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Dr. {admission.doc_first} {admission.doc_last}
                            </div>
                          </div>
                        ) : isAvailable ? (
                          isManageMode ? (
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Bed is ready for intake</span>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-success)', fontSize: '12px', fontWeight: 500 }}>
                              <LogIn size={14} />
                              <span>Click to admit patient</span>
                            </div>
                          )
                        ) : (
                          <div style={{ fontSize: '12px', color: 'var(--accent-warning)' }}>
                            Under maintenance
                          </div>
                        )}
                      </div>

                      {/* Bottom Row: Cost per day */}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', paddingRight: isManageMode ? '60px' : '0' }}>
                        <span>Charge / Day</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Rs. {parseFloat(bed.per_day_charge || '2000').toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Bed Modal */}
      {bedModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '24px', position: 'relative', boxShadow: 'var(--shadow-lg)' }}>
            <button 
              onClick={() => setBedModalOpen(false)}
              style={{ position: 'absolute', right: '16px', top: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <X size={20} />
            </button>
            
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
              <Bed size={20} color="var(--accent-primary)" />
              {editingBed ? 'Edit Care Bed Configuration' : 'Add New Room / Bed'}
            </h2>

            {modalError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-danger)', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
                <AlertCircle size={16} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleModalSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Bed Number *</label>
                    <input 
                      type="text" 
                      className="input"
                      value={bedForm.bedNumber}
                      onChange={(e) => setBedForm({ ...bedForm, bedNumber: e.target.value })}
                      placeholder="e.g. GW-105, ICU-3"
                      required
                      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Floor Level *</label>
                    <select 
                      className="select"
                      value={bedForm.floor}
                      onChange={(e) => setBedForm({ ...bedForm, floor: e.target.value })}
                      required
                      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    >
                      <option value="Ground Floor">Ground Floor</option>
                      <option value="1st Floor">1st Floor</option>
                      <option value="2nd Floor">2nd Floor</option>
                      <option value="3rd Floor">3rd Floor</option>
                      <option value="4th Floor">4th Floor</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Ward Name / Room Label *</label>
                  <input 
                    type="text" 
                    className="input"
                    value={bedForm.wardName}
                    onChange={(e) => setBedForm({ ...bedForm, wardName: e.target.value })}
                    placeholder="e.g. General Medical Ward, Intensive Care Unit"
                    required
                    style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Ward Type *</label>
                    <select 
                      className="select"
                      value={bedForm.wardType}
                      onChange={(e) => setBedForm({ ...bedForm, wardType: e.target.value })}
                      required
                      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    >
                      <option value="General">General Ward</option>
                      <option value="ICU">ICU</option>
                      <option value="Emergency">Emergency</option>
                      <option value="Semi_Private">Semi-Private</option>
                      <option value="Private_Suite">Private Suite</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Daily Rate (Rs.) *</label>
                    <input 
                      type="number" 
                      className="input"
                      value={bedForm.dailyRate}
                      onChange={(e) => setBedForm({ ...bedForm, dailyRate: e.target.value })}
                      min="1"
                      required
                      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Availability Status *</label>
                  <select 
                    className="select"
                    value={bedForm.status}
                    onChange={(e) => setBedForm({ ...bedForm, status: e.target.value })}
                    disabled={editingBed?.status === 'Occupied'}
                    required
                    style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  >
                    <option value="Available">Available</option>
                    <option value="Maintenance">Maintenance</option>
                    {editingBed?.status === 'Occupied' && <option value="Occupied">Occupied</option>}
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px', borderTop: '1px solid var(--border-primary)', paddingTop: '16px' }}>
                  <Button variant="secondary" type="button" onClick={() => setBedModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" loading={modalLoading}>
                    {editingBed ? 'Save Changes' : 'Create Room / Bed'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default InpatientBeds;
