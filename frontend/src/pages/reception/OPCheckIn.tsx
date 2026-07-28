import React, { useState, useEffect } from 'react';
import { UserCheck, Search, Printer, CheckCircle, Stethoscope, RefreshCw, IndianRupee, Layers, UserPlus, Calendar, BarChart2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { PatientSearchBar } from '../../components/shared/PatientSearchBar';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { OPDAnalyticsDashboard } from '../../components/opd/OPDAnalyticsDashboard';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/client';
import { formatCurrency, formatDateTime, formatDisplayAge } from '../../utils/formatters';
import { getHospitalLogoHtml } from '../../utils/logoHelper';

const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
];

const BLOOD_GROUPS = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
];

const calculateAge = (dob?: string, ageVal?: any) => {
  return formatDisplayAge(dob, ageVal);
};

const numberToWords = (num: number) => {
  if (num === 0) return 'RUPEES ZERO ONLY';
  const a = [
    '', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN',
    'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN',
    'EIGHTEEN', 'NINETEEN'
  ];
  const b = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
  
  if (num === 500) return 'RUPEES FIVE HUNDRED ONLY';
  if (num === 400) return 'RUPEES FOUR HUNDRED ONLY';
  if (num === 600) return 'RUPEES SIX HUNDRED ONLY';
  if (num === 300) return 'RUPEES THREE HUNDRED ONLY';
  
  const integerPart = Math.floor(num);
  if (integerPart < 1000) {
    let s = '';
    let n = integerPart;
    if (n >= 100) {
      s += a[Math.floor(n / 100)] + ' HUNDRED ';
      n %= 100;
    }
    if (n >= 20) {
      s += b[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      s += a[n] + ' ';
    }
    return `RUPEES ${s.trim()} ONLY`;
  }
  return `RUPEES ${integerPart} ONLY`;
};

const OPCheckIn: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'queue'>('analytics');
  const [patient, setPatient] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [reviewStatus, setReviewStatus] = useState<{ isFreeReview: boolean; lastAppointmentDate: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Booked consultations list states
  const [bookings, setBookings] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(false);

  // Hospital settings
  const [hospitalDetails, setHospitalDetails] = useState<any>(null);

  // Filtration states
  const [filterSearch, setFilterSearch] = useState('');
  const [filterDate, setFilterDate] = useState('Today'); // 'Today', 'Yesterday', '7Days', 'All'
  const [filterType, setFilterType] = useState('All'); // 'All', 'Paid', 'Free'

  // Post check-in slip states
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [lastCheckInResult, setLastCheckInResult] = useState<any>(null);
  const [lastPatient, setLastPatient] = useState<any>(null);

  // Quick Registration Modal states
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regForm, setRegForm] = useState({
    firstName: '', lastName: '', age: '', gender: 'Male',
    bloodGroup: '', address: '', phone: '', email: '',
    emergencyContactName: '', emergencyContactPhone: '',
    insuranceProvider: '', insurancePolicyNumber: '', allergies: '', referredBy: ''
  });
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/doctor-profiles');
      setDoctors(res.data.data || []);
    } catch {
      setErrorMsg('Failed to load doctors and fees.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    setListLoading(true);
    try {
      const res = await api.get('/appointments?limit=150');
      setBookings(res.data.data.appointments || []);
    } catch {
      console.error('Failed to load bookings list.');
    } finally {
      setListLoading(false);
    }
  };

  const fetchHospitalSettings = async () => {
    try {
      const res = await api.get('/admin/hospital-settings');
      if (res.data.success && res.data.data) {
        setHospitalDetails(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load hospital settings', err);
    }
  };

  useEffect(() => {
    fetchDoctors();
    fetchBookings();
    fetchHospitalSettings();
  }, []);

  const selectedDoctor = doctors.find(d => d.doctorId === selectedDoctorId);

  // Check 7-day review status when patient or doctor changes
  useEffect(() => {
    if (patient && selectedDoctorId) {
      api.get(`/appointments/check-review?patientId=${patient.patient_id}&doctorId=${selectedDoctorId}`)
        .then(res => {
          setReviewStatus(res.data.data);
        })
        .catch(() => {
          setReviewStatus(null);
        });
    } else {
      setReviewStatus(null);
    }
  }, [patient, selectedDoctorId]);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) {
      setErrorMsg('Please select a patient first.');
      return;
    }
    if (!selectedDoctorId) {
      setErrorMsg('Please select a consulting doctor.');
      return;
    }

    setSaveLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/appointments/op-checkin', {
        patientId: patient.patient_id,
        doctorId: selectedDoctorId,
        paymentMethod
      });

      if (res.data.success) {
        setLastCheckInResult(res.data.data);
        setLastPatient(patient);
        setShowSlipModal(true);

        // Automatically trigger print dialog right after OP booking
        printConsultationSlip(res.data.data, patient);

        // Reset state
        setPatient(null);
        setSelectedDoctorId('');
        setPaymentMethod('Cash');
        setReviewStatus(null);
        fetchBookings();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to complete OP Check-in.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleQuickRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError('');
    try {
      const formattedAge = (regForm as any).patientCategory === 'Child'
        ? (regForm.age ? `${regForm.age} Years ${(regForm as any).ageMonths || '0'} Months` : `${(regForm as any).ageMonths || '0'} Months`)
        : `${regForm.age} Years`;

      const payload = {
        ...regForm,
        age: formattedAge
      };

      const res = await api.post('/patients', payload);
      if (res.data.success) {
        // Automatically select newly registered patient
        setPatient(res.data.data);
        setShowRegisterModal(false);
        // Reset reg form
        setRegForm({
          firstName: '', lastName: '', age: '', ageMonths: '', gender: 'Male',
          patientCategory: 'Adult', bloodGroup: '', address: '', phone: '', email: '',
          emergencyContactName: '', emergencyContactPhone: '',
          insuranceProvider: '', insurancePolicyNumber: '', allergies: '', referredBy: ''
        } as any);
      }
    } catch (err: any) {
      setRegError(err.response?.data?.error || 'Failed to register patient.');
    } finally {
      setRegLoading(false);
    }
  };

  const printConsultationSlip = (result: any, patientInfo: any) => {
    const printWindow = window.open('', '_blank', 'width=780,height=580');
    if (!printWindow) return;

    // Formatting date
    const d = new Date(result.appointment.appointment_date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}`;

    const ageCalculated = calculateAge(patientInfo.date_of_birth);
    const genderInitial = (patientInfo.gender || 'F').substring(0, 1).toUpperCase();
    const billingRate = parseFloat(result.chargedFee || '0.00');
    const billingRateFormatted = billingRate.toFixed(2);
    const inWords = numberToWords(billingRate);
    const preparer = currentUser ? `${currentUser.first_name} ${currentUser.last_name}`.toLowerCase() : 'receptionist';

    printWindow.document.write(`
      <html>
        <head>
          <title>OP Bill - ${result.billNo}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 20px; font-size: 13px; line-height: 1.5; }
            .header-container { display: flex; align-items: center; justify-content: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 15px; }
            .logo-placeholder { flex: 0 0 120px; margin-right: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
            .logo-img { max-height: 60px; max-width: 120px; object-fit: contain; border-radius: 4px; }
            .logo-placeholder svg { width: 32px; height: 32px; color: #0f172a; }
            .logo-text { font-size: 9px; font-weight: 800; letter-spacing: 1px; margin-top: 2px; text-transform: uppercase; text-align: center; line-height: 1; }
            .header-details { flex: 1; text-align: left; }
            .header-details h2 { margin: 0 0 4px 0; font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: 0.5px; }
            .header-details p { margin: 3px 0; font-size: 11px; color: #475569; }
            
            .validity-stamp {
              position: absolute;
              right: 20px;
              top: 15px;
              border: 2px dashed #3b82f6;
              color: #3b82f6;
              padding: 6px 12px;
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              transform: rotate(-8deg);
              border-radius: 4px;
              letter-spacing: 1px;
              background: rgba(59, 130, 246, 0.03);
            }

            .bill-title {
              text-align: center;
              font-weight: 700;
              font-size: 13px;
              margin: 15px 0 10px 0;
              padding: 4px 0;
              border-top: 1px solid #cbd5e1;
              border-bottom: 1px solid #cbd5e1;
              letter-spacing: 1px;
              color: #0f172a;
              text-transform: uppercase;
            }

            .info-grid {
              display: grid;
              grid-template-columns: 1.2fr 1fr;
              gap: 8px 30px;
              margin-bottom: 12px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              border-bottom: 1px dotted #e2e8f0;
              padding-bottom: 2px;
            }
            .info-row span.label {
              font-weight: 600;
              color: #475569;
              width: 110px;
            }
            .info-row span.value {
              flex: 1;
              text-align: left;
              color: #0f172a;
            }

            .patient-box {
              border: 1px solid #cbd5e1;
              border-radius: 4px;
              padding: 8px 12px;
              margin: 12px 0;
              background: #f8fafc;
            }
            .patient-grid {
              display: grid;
              grid-template-columns: 2fr 1.2fr 1fr 0.8fr 1.2fr;
              gap: 10px;
            }
            .patient-col-title {
              font-size: 10px;
              font-weight: 600;
              color: #64748b;
              text-transform: uppercase;
              margin-bottom: 3px;
            }
            .patient-col-val {
              font-size: 12px;
              font-weight: 700;
              color: #0f172a;
            }

            .particulars-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            .particulars-table th {
              border-bottom: 1px solid #94a3b8;
              padding: 6px 4px;
              text-align: left;
              font-size: 11px;
              color: #475569;
              text-transform: uppercase;
            }
            .particulars-table td {
              padding: 8px 4px;
              border-bottom: 1px solid #e2e8f0;
              font-size: 12px;
            }
            .num-col { text-align: center; }
            .rate-col { text-align: right; width: 100px; }
            .amt-col { text-align: right; width: 100px; font-weight: 700; }

            .totals-container {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-top: 12px;
            }
            .words-part {
              font-size: 11px;
              font-style: italic;
              color: #475569;
              max-width: 450px;
              line-height: 1.4;
            }
            .pricing-part {
              width: 240px;
            }
            .price-row {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
              font-size: 12px;
            }
            .price-row.final {
              font-size: 13px;
              font-weight: 700;
              border-top: 1px solid #94a3b8;
              padding-top: 6px;
              color: #0f172a;
            }

            .footer-sign {
              display: flex;
              justify-content: space-between;
              margin-top: 40px;
              font-size: 11px;
              color: #64748b;
            }
            .footer-sign span.preparer {
              font-weight: 700;
              color: #475569;
            }

            @media print {
              .no-print { display: none; }
              body { padding: 10px; }
            }
          </style>
        </head>
        <body>
          <!-- Stamped top right validity label -->
          <div class="validity-stamp">${hospitalDetails?.license_info || 'One Week Validity'}</div>

          <!-- Header hospital profile -->
          <div class="header-container">
            <div class="logo-placeholder">
              ${getHospitalLogoHtml(hospitalDetails?.hospital_logo, 70)}
            </div>

            <div class="header-details">
              <h2>${hospitalDetails?.hospital_name || 'Prasad Hospitals India Pvt. Ltd.'}</h2>
              <p>${hospitalDetails?.hospital_address || '44-617/12, Adjacent to BSNL Telephone Exchange, Mallapur Road, Nacharam, Secunderabad-500 076'}</p>
              <p>Phone: ${hospitalDetails?.phone_number || '040 - 68244555, 88012 33333'} &nbsp;|&nbsp; Web: ${hospitalDetails?.website || 'https://prasadhospitals.in'} &nbsp;|&nbsp; Email: ${hospitalDetails?.email || 'info@prasadhospitals.in'}</p>
              <p><strong>GSTIN: ${hospitalDetails?.gstin || '36AABCU2450J1ZD'}</strong></p>
            </div>
          </div>

          <div class="bill-title">OP Bill</div>

          <!-- Invoice general reference layout -->
          <div class="info-grid">
            <div>
              <div class="info-row">
                <span class="label">OP No</span>
                <span class="value">: ${result.opNo || '—'}</span>
              </div>
              <div class="info-row" style="margin-top: 4px;">
                <span class="label">Consultant</span>
                <span class="value">: Dr. ${result.doctorName} (${result.department}) M.B.B.S, M.D.</span>
              </div>
              <div class="info-row" style="margin-top: 4px;">
                <span class="label">Date</span>
                <span class="value">: ${formattedDate}</span>
              </div>
            </div>
            <div>
              <div class="info-row">
                <span class="label">Token No</span>
                <span class="value">: <strong>${result.tokenNo || '—'}</strong></span>
              </div>
              <div class="info-row" style="margin-top: 4px;">
                <span class="label">Referred By</span>
                <span class="value">: self</span>
              </div>
              <div class="info-row" style="margin-top: 4px;">
                <span class="label">Bill No</span>
                <span class="value">: ${result.billNo || '—'}</span>
              </div>
            </div>
          </div>

          <!-- Patient details box -->
          <div class="patient-box">
            <div class="patient-grid">
              <div>
                <div class="patient-col-title">Name</div>
                <div class="patient-col-val">${patientInfo.first_name} ${patientInfo.last_name}</div>
              </div>
              <div>
                <div class="patient-col-title">ID (MRN)</div>
                <div class="patient-col-val" style="font-family: monospace;">${patientInfo.medical_record_number}</div>
              </div>
              <div>
                <div class="patient-col-title">Age</div>
                <div class="patient-col-val">${ageCalculated}</div>
              </div>
              <div>
                <div class="patient-col-title">Gender</div>
                <div class="patient-col-val">${genderInitial}</div>
              </div>
              <div>
                <div class="patient-col-title">Mobile</div>
                <div class="patient-col-val">${patientInfo.phone || '—'}</div>
              </div>
            </div>
          </div>

          <div style="font-size: 11px; font-weight: 600; color: #475569; margin-top: 8px;">
            Payment Type: <span style="color: #0f172a;">${result.invoice?.payment_method || result.appointment?.notes || 'Cash'}</span>
          </div>

          <!-- Financial Item Listing Table -->
          <table class="particulars-table">
            <thead>
              <tr>
                <th style="width: 50px;">S.No</th>
                <th>Particulars</th>
                <th class="num-col" style="width: 60px;">Qty</th>
                <th class="rate-col">Rate</th>
                <th class="amt-col">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="num-col">1.</td>
                <td><strong>OP - CONSULTATION</strong></td>
                <td class="num-col">1</td>
                <td class="rate-col">${billingRateFormatted}</td>
                <td class="amt-col">${billingRateFormatted}</td>
              </tr>
            </tbody>
          </table>

          <!-- Words and Totals Summary Grid -->
          <div class="totals-container">
            <div class="words-part">
              <strong>Amount (in words):</strong><br/>
              <span style="text-transform: uppercase;">${inWords}</span>
            </div>
            <div class="pricing-part">
              <div class="price-row">
                <span>Amount Receivable</span>
                <span>${billingRateFormatted}</span>
              </div>
              <div class="price-row final">
                <span>Amount Received</span>
                <span>${billingRateFormatted}</span>
              </div>
            </div>
          </div>

          <!-- Footer signatures -->
          <div class="footer-sign">
            <span>Prepared By: <span class="preparer">${preparer}</span></span>
            <span>Signature / Stamp</span>
          </div>

          <!-- Print button outside layout -->
          <div class="no-print" style="text-align: center; margin-top: 40px; border-top: 1px dotted #cbd5e1; padding-top: 20px;">
            <button onclick="window.print()" style="padding: 10px 28px; font-size: 13px; font-weight: 600; background: #0f172a; color: #fff; border: none; border-radius: 4px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.15);">
              🖨️ Print OP Consultation Slip
            </button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  };

  // Helper to re-print slip directly from the table
  const handlePrintSlipFromTable = (row: any) => {
    const isFreeReview = row.notes === 'Free 7-day review consultation';
    const result = {
      appointment: {
        appointment_id: row.appointment_id,
        appointment_date: row.appointment_date,
        notes: row.notes
      },
      isFreeReview,
      chargedFee: isFreeReview ? 0.00 : parseFloat(row.doctor_fee || '0.00'),
      doctorName: row.doctor_name,
      department: row.doctor_department || 'General Medicine',
      opNo: row.op_no || row.opNo || '—',
      tokenNo: row.token_no || row.tokenNo || '—',
      billNo: row.bill_no || row.billNo || `OP2627-${row.appointment_id.substring(0, 4).toUpperCase()}`
    };
    const patientInfo = {
      first_name: row.patient_name.split(' ')[0],
      last_name: row.patient_name.split(' ').slice(1).join(' ') || '',
      medical_record_number: row.medical_record_number,
      phone: row.patient_phone,
      date_of_birth: row.date_of_birth || '1995-01-01',
      gender: row.gender || 'F'
    };
    printConsultationSlip(result, patientInfo);
  };

  // Filtration logic for booked appointments
  const filteredBookings = bookings.filter((b) => {
    // 1. Text Search (Patient name, MRN, Doctor name)
    if (filterSearch.trim()) {
      const q = filterSearch.toLowerCase();
      const matches = (
        (b.patient_name || '').toLowerCase().includes(q) ||
        (b.medical_record_number || '').toLowerCase().includes(q) ||
        (b.doctor_name || '').toLowerCase().includes(q)
      );
      if (!matches) return false;
    }

    // 2. Type Filter
    const isFreeReview = b.notes === 'Free 7-day review consultation';
    if (filterType === 'Paid' && isFreeReview) return false;
    if (filterType === 'Free' && !isFreeReview) return false;

    // 3. Date Filter
    if (filterDate !== 'All') {
      const apptDate = new Date(b.appointment_date);
      const today = new Date();
      
      if (filterDate === 'Today') {
        const isToday = apptDate.toDateString() === today.toDateString();
        if (!isToday) return false;
      } else if (filterDate === 'Yesterday') {
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        const isYesterday = apptDate.toDateString() === yesterday.toDateString();
        if (!isYesterday) return false;
      } else if (filterDate === '7Days') {
        const diffTime = Math.abs(today.getTime() - apptDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 7) return false;
      }
    }

    return true;
  });

  const chargedFee = reviewStatus?.isFreeReview ? 0.00 : (selectedDoctor ? selectedDoctor.consultationFee : 0.00);

  return (
    <div className="w-full max-w-[1600px] mx-auto overflow-x-hidden">
      <div className="page-header">
        <h1>
          <UserCheck size={28} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--accent-primary)' }} />
          OPD Check-in
        </h1>
        <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={() => { fetchDoctors(); fetchBookings(); }} loading={loading}>
          Refresh All
        </Button>
      </div>

      {/* Subtabs Navigation Bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-primary)', gap: '12px', marginBottom: 'var(--space-lg)' }}>
        <button
          type="button"
          onClick={() => setActiveSubTab('analytics')}
          style={{
            padding: '10px 24px',
            background: activeSubTab === 'analytics' ? 'var(--bg-card)' : 'transparent',
            color: activeSubTab === 'analytics' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            border: activeSubTab === 'analytics' ? '1px solid var(--border-primary)' : '1px solid transparent',
            borderBottom: activeSubTab === 'analytics' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            borderRadius: '8px 8px 0 0',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            marginBottom: '-1px'
          }}
        >
          <BarChart2 size={18} />
          Tab 1: OPD Analytics Dashboard
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('queue')}
          style={{
            padding: '10px 24px',
            background: activeSubTab === 'queue' ? 'var(--bg-card)' : 'transparent',
            color: activeSubTab === 'queue' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            border: activeSubTab === 'queue' ? '1px solid var(--border-primary)' : '1px solid transparent',
            borderBottom: activeSubTab === 'queue' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            borderRadius: '8px 8px 0 0',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            marginBottom: '-1px'
          }}
        >
          <UserCheck size={18} />
          Tab 2: Book OP & Queue Management
        </button>
      </div>

      {activeSubTab === 'analytics' ? (
        <OPDAnalyticsDashboard
          doctors={doctors}
          onPrintSlip={handlePrintSlipFromTable}
          hospitalDetails={hospitalDetails}
        />
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
          {/* OP Booking Card */}
          <Card title="Book OP Consultation & OPD Check-in" style={{ position: 'relative', zIndex: 50 }}>
            <form onSubmit={handleCheckIn}>
              <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                {errorMsg && (
                  <div style={{ color: 'var(--accent-danger)', fontSize: 'var(--font-sm)', padding: 'var(--space-sm)', background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-sm)' }}>
                    ⚠️ {errorMsg}
                  </div>
                )}

                {/* Patient Selector */}
                <div style={{ display: 'grid', gap: 'var(--space-xs)' }}>
                  <label style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Primary Patient Search (Mobile Number / Name / MRN) *
                  </label>
                  <PatientSearchBar 
                    onSelect={(p) => setPatient(p)} 
                    placeholder="📱 Primary Search: Enter Mobile Number, Name or MRN..."
                    showRegisterOption={true}
                    onRegisterClick={() => setShowRegisterModal(true)}
                  />
                  {patient && (
                    <div style={{ padding: 'var(--space-md)', background: 'rgba(37,99,235,0.04)', borderRadius: 'var(--radius)', border: '1px solid rgba(37,99,235,0.2)', marginTop: 'var(--space-sm)' }}>
                      <h4 style={{ margin: '0 0 var(--space-xs) 0', color: 'var(--accent-primary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <UserCheck size={16} /> Selected Patient Identity
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-xs) var(--space-md)', fontSize: '13px' }}>
                        <div><strong>📱 Mobile Number:</strong> <span style={{ fontWeight: 700, color: '#1d4ed8', background: '#dbeafe', padding: '2px 8px', borderRadius: '4px' }}>{patient.phone || 'No Mobile'}</span></div>
                        <div><strong>👤 Patient Name:</strong> <span style={{ fontWeight: 700 }}>{patient.first_name} {patient.last_name}</span></div>
                        <div><strong>🆔 MRN:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{patient.medical_record_number}</span></div>
                        <div><strong>🎂 Gender / Age:</strong> {patient.gender || '—'} ({calculateAge(patient.date_of_birth, patient.age)})</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Doctor Selector */}
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-md)' }}>
                  <Select
                    label="Select Consulting Doctor *"
                    value={selectedDoctorId}
                    onChange={(e) => {
                      setSelectedDoctorId(e.target.value);
                      setReviewStatus(null);
                    }}
                    options={[
                      { value: '', label: '-- Select Doctor --' },
                      ...doctors.map(d => ({
                        value: d.doctorId,
                        label: `Dr. ${d.doctorName} (${d.department || 'General'})`
                      }))
                    ]}
                    required
                  />

                  <Select
                    label="Payment Method *"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    options={[
                      { value: 'Cash', label: '💵 Cash' },
                      { value: 'UPI / Online', label: '📱 UPI / Online' },
                      { value: 'Card', label: '💳 Card' },
                      { value: 'Insurance', label: '🛡️ Insurance' }
                    ]}
                    required
                  />
                </div>

                {/* Consultation Fee Status Panel */}
                {selectedDoctor && (
                  <div style={{
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-md)',
                    background: reviewStatus?.isFreeReview ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.01)',
                    marginTop: 'var(--space-xs)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                      <Stethoscope size={18} style={{ color: 'var(--accent-primary)' }} />
                      <strong style={{ fontSize: 'var(--font-sm)' }}>Consultation Fee Calculation</strong>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', fontSize: '14px' }}>
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Doctor Rate:</span>{' '}
                        <strong>{formatCurrency(selectedDoctor.consultationFee)}</strong>
                      </div>
                      {reviewStatus && (
                        <div>
                          {reviewStatus.isFreeReview ? (
                            <span style={{ color: 'var(--accent-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                              ✅ Free 7-Day Review Active (Last visit:{' '}
                              {reviewStatus.lastAppointmentDate ? new Date(reviewStatus.lastAppointmentDate).toLocaleDateString('en-IN') : 'N/A'})
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-tertiary)' }}>No recent consultations (charged at normal rate)</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: 'var(--space-sm)', marginTop: 'var(--space-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '15px', fontWeight: 600 }}>Total Billed Amount:</span>
                      <strong style={{ fontSize: '20px', color: reviewStatus?.isFreeReview ? 'var(--accent-success)' : 'var(--accent-primary)' }}>
                        {formatCurrency(chargedFee)}
                      </strong>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-sm)' }}>
                  <Button variant="primary" type="submit" loading={saveLoading} disabled={!patient || !selectedDoctorId}>
                    Book OP Consultation & Print Slip
                  </Button>
                </div>
              </div>
            </form>
          </Card>

          {/* OP Consultation Bookings History Table */}
          <Card title="OP Consultation Bookings Queue">
            {/* Filters Section */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', marginBottom: 'var(--space-md)', alignItems: 'flex-end' }}>
              <div style={{ flex: 2, minWidth: 240 }}>
                <Input
                  placeholder="Search patient name, MRN, doctor..."
                  value={filterSearch}
                  onChange={e => setFilterSearch(e.target.value)}
                />
              </div>
              <div style={{ flex: 1, minWidth: 150 }}>
                <Select
                  label="Date Range"
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  options={[
                    { value: 'Today', label: '📅 Today' },
                    { value: 'Yesterday', label: '📅 Yesterday' },
                    { value: '7Days', label: '📅 Last 7 Days' },
                    { value: 'All', label: '📅 All Bookings' }
                  ]}
                />
              </div>
              <div style={{ flex: 1, minWidth: 150 }}>
                <Select
                  label="Check-in Type"
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  options={[
                    { value: 'All', label: '🏷️ All Types' },
                    { value: 'Paid', label: '💵 Paid OPD' },
                    { value: 'Free', label: '🎁 Free Reviews' }
                  ]}
                />
              </div>
            </div>

            <Table
              columns={[
                {
                  key: 'op_no',
                  label: 'OP No',
                  render: (_, row) => {
                    const opNo = row.op_no || row.opNo || '—';
                    return <strong style={{ color: 'var(--text-secondary)' }}>{opNo}</strong>;
                  }
                },
                {
                  key: 'token_no',
                  label: 'Token No',
                  render: (_, row) => {
                    const tokenNo = row.token_no || row.tokenNo || '—';
                    return <strong style={{ color: 'var(--accent-warning)', fontSize: 'var(--font-base)' }}>{tokenNo}</strong>;
                  }
                },
                {
                  key: 'medical_record_number',
                  label: 'MRN',
                  render: (v) => <span style={{ color: 'var(--accent-primary)', fontFamily: 'monospace' }}>{v}</span>
                },
                {
                  key: 'patient_name',
                  label: 'Patient Details',
                  render: (v, row) => (
                    <div>
                      <div style={{ fontWeight: 600 }}>{v}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>📞 {row.patient_phone || '—'}</div>
                    </div>
                  )
                },
                {
                  key: 'doctor_name',
                  label: 'Consulting Doctor',
                  render: (v, row) => (
                    <div>
                      <div style={{ fontWeight: 500 }}>Dr. {v}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{row.doctor_department || 'General'}</div>
                    </div>
                  )
                },
                {
                  key: 'appointment_date',
                  label: 'Check-in Time',
                  render: (v) => formatDateTime(v)
                },
                {
                  key: 'status',
                  label: 'Status',
                  render: (v) => <StatusBadge status={v} />
                },
                {
                  key: 'amount',
                  label: 'Amount',
                  render: (_, row) => {
                    const isFree = row.notes === 'Free 7-day review consultation';
                    return isFree ? (
                      <Badge variant="success" style={{ fontSize: '11px' }}>FREE REVIEW</Badge>
                    ) : (
                      <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(parseFloat(row.doctor_fee || '0.00'))}</strong>
                    );
                  }
                },
                {
                  key: 'actions',
                  label: 'Actions',
                  render: (_, row) => (
                    <Button variant="ghost" size="sm" icon={<Printer size={13} />} onClick={() => handlePrintSlipFromTable(row)}>
                      Print Slip
                    </Button>
                  )
                }
              ]}
              data={filteredBookings}
            />
          </Card>
        </div>
      )}

      {/* Slip Modal Popup */}
      <Modal isOpen={showSlipModal} onClose={() => setShowSlipModal(false)} title="OPD Check-in Successful!" size="sm">
        <div style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
          <CheckCircle size={56} style={{ color: 'var(--accent-success)', marginBottom: 'var(--space-md)' }} />
          <h2 style={{ margin: '0 0 var(--space-sm) 0' }}>Consultation Booked</h2>
          {lastCheckInResult && (
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
              Consultation Slip for <strong>Dr. {lastCheckInResult.doctorName}</strong>. Billed:{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {lastCheckInResult.isFreeReview ? 'FREE REVIEW' : formatCurrency(lastCheckInResult.chargedFee)}
              </strong>
            </p>
          )}
          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
            <Button variant="primary" icon={<Printer size={16} />} onClick={() => lastCheckInResult && printConsultationSlip(lastCheckInResult, lastPatient)}>
              Print OPD Slip
            </Button>
            <Button variant="secondary" onClick={() => setShowSlipModal(false)}>Close</Button>
          </div>
        </div>
      </Modal>

      {/* Quick Registration Modal */}
      <Modal isOpen={showRegisterModal} onClose={() => setShowRegisterModal(false)} title="Quick Patient Registration" size="lg">
        <form onSubmit={handleQuickRegister}>
          <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
            {regError && (
              <div style={{ color: 'var(--accent-danger)', fontSize: 'var(--font-sm)', padding: 'var(--space-sm)', background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-sm)' }}>
                ⚠️ {regError}
              </div>
            )}

            <div style={{ marginBottom: '16px', background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-primary)' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                Patient Category *
              </label>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="opPatientCategory"
                    value="Adult"
                    checked={(regForm as any).patientCategory !== 'Child'}
                    onChange={() => setRegForm({ ...regForm, patientCategory: 'Adult' } as any)}
                  />
                  👨‍💼 Adult (≥ 10 Years)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="opPatientCategory"
                    value="Child"
                    checked={(regForm as any).patientCategory === 'Child'}
                    onChange={() => setRegForm({ ...regForm, patientCategory: 'Child' } as any)}
                  />
                  👶 Child / Pediatric (&lt; 10 Years)
                </label>
              </div>
            </div>

            <div className="form-row">
              <Input 
                label="First Name *" 
                value={regForm.firstName} 
                onChange={e => setRegForm({ ...regForm, firstName: e.target.value })} 
                required 
              />
              <Input 
                label="Last Name *" 
                value={regForm.lastName} 
                onChange={e => setRegForm({ ...regForm, lastName: e.target.value })} 
                required 
              />
            </div>

            {(regForm as any).patientCategory === 'Child' ? (
              <div className="form-row">
                <Input 
                  label="Age (Years)" 
                  type="number" 
                  min="0"
                  max="9"
                  placeholder="e.g. 4"
                  value={(regForm as any).age || ''} 
                  onChange={e => setRegForm({ ...regForm, age: e.target.value } as any)} 
                />
                <Input 
                  label="Age (Months) *" 
                  type="number" 
                  min="0"
                  max="11"
                  placeholder="e.g. 6"
                  value={(regForm as any).ageMonths || ''} 
                  onChange={e => setRegForm({ ...regForm, ageMonths: e.target.value } as any)} 
                  required
                />
                <Select 
                  label="Gender *" 
                  value={regForm.gender} 
                  onChange={e => setRegForm({ ...regForm, gender: e.target.value })}
                  options={GENDER_OPTIONS} 
                />
              </div>
            ) : (
              <div className="form-row">
                <Input 
                  label="Age (Years) *" 
                  type="number" 
                  min="10"
                  max="120"
                  placeholder="e.g. 35"
                  value={(regForm as any).age || ''} 
                  onChange={e => setRegForm({ ...regForm, age: e.target.value } as any)} 
                  required 
                />
                <Select 
                  label="Gender *" 
                  value={regForm.gender} 
                  onChange={e => setRegForm({ ...regForm, gender: e.target.value })}
                  options={GENDER_OPTIONS} 
                />
              </div>
            )}

            <div className="form-row">
              <Input 
                label="Phone" 
                value={regForm.phone} 
                onChange={e => setRegForm({ ...regForm, phone: e.target.value })} 
              />
              <Input 
                label="Email" 
                type="email" 
                value={regForm.email} 
                onChange={e => setRegForm({ ...regForm, email: e.target.value })} 
              />
            </div>

            <div className="form-row">
              <Select 
                label="Blood Group" 
                value={regForm.bloodGroup} 
                onChange={e => setRegForm({ ...regForm, bloodGroup: e.target.value })}
                options={[{ value: '', label: '-- Select --' }, ...BLOOD_GROUPS]} 
              />
              <Input 
                label="Allergies" 
                value={regForm.allergies} 
                onChange={e => setRegForm({ ...regForm, allergies: e.target.value })} 
                placeholder="List any known allergies..." 
              />
            </div>

            <div className="form-row">
              <Input 
                label="Patient Referred By" 
                value={(regForm as any).referredBy || ''} 
                onChange={e => setRegForm({ ...regForm, referredBy: e.target.value } as any)} 
                placeholder="Doctor / Clinic / Source name" 
              />
              <Input 
                label="Address" 
                value={regForm.address} 
                onChange={e => setRegForm({ ...regForm, address: e.target.value })} 
              />
            </div>

            <div style={{ border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', background: 'rgba(255,255,255,0.01)', marginTop: 'var(--space-xs)' }}>
              <strong style={{ display: 'block', fontSize: 'var(--font-sm)', marginBottom: 'var(--space-sm)' }}>Emergency Contact</strong>
              <div className="form-row">
                <Input 
                  label="Contact Name" 
                  value={regForm.emergencyContactName} 
                  onChange={e => setRegForm({ ...regForm, emergencyContactName: e.target.value })} 
                />
                <Input 
                  label="Contact Phone" 
                  value={regForm.emergencyContactPhone} 
                  onChange={e => setRegForm({ ...regForm, emergencyContactPhone: e.target.value })} 
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <Button variant="secondary" type="button" onClick={() => setShowRegisterModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={regLoading}>Register & Select Patient</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OPCheckIn;
