import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, Plus, Trash2, RefreshCw, AlertTriangle, CheckCircle, XCircle, Check,
  Ban, ArrowLeftRight, Printer, Search, X, Edit, Package, BarChart2, TrendingUp,
  DollarSign, CreditCard, Calendar, Filter, ArrowUpRight, Shield, Layers
} from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PatientSearchBar } from '../../components/shared/PatientSearchBar';
import api from '../../api/client';
import { formatCurrency, formatDisplayAge, formatDateTime } from '../../utils/formatters';
import { getHospitalLogoHtml } from '../../utils/logoHelper';

const InvoiceGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'generator' | 'list'>('dashboard');
  
  // Dashboard Analytics States
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(false);

  // Generator States
  const [patient, setPatient] = useState<any>(null);
  const [items, setItems] = useState<{ description: string; category: string; quantity: number; unitPrice: number }[]>([]);
  const [itemForm, setItemForm] = useState({ description: '', category: 'General', quantity: '1', unitPrice: '0' });
  const [discount, setDiscount] = useState('0');
  const [tax, setTax] = useState('0');
  const [insurance, setInsurance] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [advancePaid, setAdvancePaid] = useState<string>('');

  const DEFAULT_DOCTORS = useMemo(() => [
    'Dr. Priya Nair (Dermatology) M.B.B.S, M.D.',
    'Dr. Alex Nguyen (General Medicine) M.D.',
    'Dr. Rajesh Kumar (Cardiology) M.D., DM',
    'Dr. Ananya Sharma (Pediatrics) M.D.',
    'Dr. K. V. Rao (Orthopedics) M.S.'
  ], []);

  const [hospitalDoctors, setHospitalDoctors] = useState<string[]>(DEFAULT_DOCTORS);
  const [consultantSelect, setConsultantSelect] = useState<string>(DEFAULT_DOCTORS[0]);
  const [consultantCustomName, setConsultantCustomName] = useState<string>('');
  
  const [referredBySelect, setReferredBySelect] = useState<string>('Self');
  const [referredByCustomName, setReferredByCustomName] = useState<string>('');

  const effectiveConsultantDoctor = consultantSelect === 'OTHER' 
    ? (consultantCustomName || 'Other Consultant Doctor') 
    : consultantSelect;

  const effectiveReferredBy = referredBySelect === 'OTHER' 
    ? (referredByCustomName || 'Other Hospital Doctor') 
    : referredBySelect;

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // Quick Patient Registration Modal State
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [regForm, setRegForm] = useState({
    firstName: '',
    lastName: '',
    age: '',
    ageMonths: '',
    gender: 'Male',
    patientCategory: 'Adult',
    phone: '',
    bloodGroup: '',
    address: '',
    referredBy: ''
  });
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  const handleQuickPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError('');
    try {
      const formattedAge = regForm.patientCategory === 'Child'
        ? (regForm.age ? `${regForm.age} Years ${regForm.ageMonths || '0'} Months` : `${regForm.ageMonths || '0'} Months`)
        : `${regForm.age} Years`;

      const payload = {
        ...regForm,
        age: formattedAge
      };

      const res = await api.post('/patients', payload);
      if (res.data.success && res.data.data) {
        setPatient(res.data.data);
        setPatientModalOpen(false);
        setRegForm({
          firstName: '',
          lastName: '',
          age: '',
          ageMonths: '',
          gender: 'Male',
          patientCategory: 'Adult',
          phone: '',
          bloodGroup: '',
          address: '',
          referredBy: ''
        });
      }
    } catch (err: any) {
      setRegError(err.response?.data?.error || 'Failed to register patient.');
    } finally {
      setRegLoading(false);
    }
  };

  // Manage Line Items States
  const [categories, setCategories] = useState<any[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    categoryId: '',
    serviceCode: '',
    price: '',
    gstPercentage: '18',
    durationMinutes: '30',
    sampleRequired: 'None',
    normalRange: '',
    machineRequired: '',
    homeCollectionAvailable: false,
    emergencyAvailable: false,
    isActive: true
  });

  const [diagSearchQuery, setDiagSearchQuery] = useState('');
  const [diagDropdownOpen, setDiagDropdownOpen] = useState(false);

  useEffect(() => {
    if (patient) {
      setPaymentStatus(patient.is_inpatient ? 'Unpaid' : 'Paid');
    }
  }, [patient]);

  // Diagnostic Catalog State
  const [diagServices, setDiagServices] = useState<any[]>([]);
  const [diagPackages, setDiagPackages] = useState<any[]>([]);

  // List States & Filters
  const [invoices, setInvoices] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState('');
  const [hospitalSettings, setHospitalSettings] = useState<any>(null);

  // All Bills Search & Date Filter States
  const [billSearchQuery, setBillSearchQuery] = useState('');
  const [billDateFilter, setBillDateFilter] = useState<'all' | 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_year' | 'custom'>('all');
  const [billStatusFilter, setBillStatusFilter] = useState<string>('ALL');
  const [listFromDate, setListFromDate] = useState<string>('');
  const [listToDate, setListToDate] = useState<string>('');

  // Collect Remaining Due Modal States
  const [collectModalOpen, setCollectModalOpen] = useState(false);
  const [selectedCollectInvoice, setSelectedCollectInvoice] = useState<any>(null);
  const [collectAmount, setCollectAmount] = useState<string>('');
  const [collectMethod, setCollectMethod] = useState<string>('Cash');
  const [collectRef, setCollectRef] = useState<string>('');
  const [collectDate, setCollectDate] = useState<string>('');
  const [collectLoading, setCollectLoading] = useState(false);
  const [collectError, setCollectError] = useState('');

  // Invoice Details View Modal with History Log States
  const [viewInvoiceModalOpen, setViewInvoiceModalOpen] = useState(false);
  const [viewInvoiceData, setViewInvoiceData] = useState<any>(null);
  const [viewInvoiceLoading, setViewInvoiceLoading] = useState(false);

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const total = subtotal - Number(discount) + Number(tax);
  const patientOwes = total - Number(insurance);

  const actualPaidAmountNum = advancePaid !== '' ? Math.max(0, Number(advancePaid)) : patientOwes;
  const clampedPaidAmount = Math.min(patientOwes, actualPaidAmountNum);
  const calculatedDueAmount = Math.max(0, patientOwes - clampedPaidAmount);

  let calculatedPaymentStatus: 'Paid' | 'PartiallyPaid' | 'Unpaid' = 'Unpaid';
  if (clampedPaidAmount >= patientOwes && patientOwes > 0) {
    calculatedPaymentStatus = 'Paid';
  } else if (clampedPaidAmount > 0) {
    calculatedPaymentStatus = 'PartiallyPaid';
  } else {
    calculatedPaymentStatus = 'Unpaid';
  }

  const loadHospitalSettings = async () => {
    try {
      const res = await api.get('/admin/hospital-settings/public');
      if (res.data.success) {
        setHospitalSettings(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load hospital settings:', err);
    }
  };

  const loadDiagnosticsAndInvoices = async () => {
    try {
      const [diagRes, catsRes, pkgsRes, docsRes] = await Promise.all([
        api.get('/diagnostics/services'),
        api.get('/diagnostics/categories'),
        api.get('/diagnostics/packages'),
        api.get('/admin/consultations').catch(() => ({ data: { success: false, data: [] } }))
      ]);
      if (diagRes.data.success) {
        setDiagServices(diagRes.data.data || []);
      }
      if (catsRes.data.success) {
        setCategories(catsRes.data.data || []);
      }
      if (pkgsRes.data.success) {
        setDiagPackages(pkgsRes.data.data || []);
      }
      if (docsRes.data?.success && Array.isArray(docsRes.data.data) && docsRes.data.data.length > 0) {
        const fetched = docsRes.data.data.map((d: any) => 
          d.doctorName ? `Dr. ${d.doctorName}${d.department ? ` (${d.department})` : ''}` : d.name
        ).filter(Boolean);
        if (fetched.length > 0) {
          setHospitalDoctors(Array.from(new Set([...fetched, ...DEFAULT_DOCTORS])));
        }
      }
    } catch (err) {
      console.error('Failed to load diagnostics services, categories or packages:', err);
    }
  };

  const allCatalogItems = useMemo(() => {
    const serviceItems = diagServices.map(s => ({
      id: `svc-${s.service_id}`,
      name: s.name,
      code: s.service_code,
      type: 'Service',
      category: s.category_name || 'Diagnostics',
      price: s.price,
      count: 0
    }));
    const packageItems = diagPackages.map(p => ({
      id: `pkg-${p.package_id}`,
      name: p.name,
      code: 'PROFILE',
      type: 'Profile/Package',
      category: 'Diagnostics',
      price: p.price,
      count: p.services ? p.services.length : 0
    }));
    return [...serviceItems, ...packageItems];
  }, [diagServices, diagPackages]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      // 1. Text Search Filter (Invoice ID, Patient Name, Phone, MRN, Doctor Name)
      if (billSearchQuery.trim()) {
        const q = billSearchQuery.toLowerCase().trim();
        const invId = (inv.invoice_id || '').toLowerCase();
        const patientName = (inv.patient_name || '').toLowerCase();
        const phone = (inv.patient_phone || inv.phone || '').toLowerCase();
        const mrn = (inv.patient_mrn || inv.medical_record_number || '').toLowerCase();
        const docName = (inv.doctor_name || '').toLowerCase();
        
        const matchesSearch = 
          invId.includes(q) || 
          patientName.includes(q) || 
          phone.includes(q) || 
          mrn.includes(q) || 
          docName.includes(q);
        
        if (!matchesSearch) return false;
      }

      // 2. Status Filter
      if (billStatusFilter !== 'ALL' && inv.status !== billStatusFilter) {
        return false;
      }

      // 3. Date Filter (All, Today, Yesterday, This Week, Last Week, This Month, Last Month, Year, Custom Date)
      if (billDateFilter !== 'all' && inv.created_at) {
        const invDate = new Date(inv.created_at);
        const now = new Date();

        const isSameDay = (d1: Date, d2: Date) =>
          d1.getFullYear() === d2.getFullYear() &&
          d1.getMonth() === d2.getMonth() &&
          d1.getDate() === d2.getDate();

        if (billDateFilter === 'today') {
          if (!isSameDay(invDate, now)) return false;
        } else if (billDateFilter === 'yesterday') {
          const yest = new Date(now);
          yest.setDate(now.getDate() - 1);
          if (!isSameDay(invDate, yest)) return false;
        } else if (billDateFilter === 'this_week') {
          const startOfWeek = new Date(now);
          const day = now.getDay() || 7;
          startOfWeek.setDate(now.getDate() - day + 1);
          startOfWeek.setHours(0, 0, 0, 0);
          if (invDate < startOfWeek) return false;
        } else if (billDateFilter === 'last_week') {
          const startOfThisWeek = new Date(now);
          const day = now.getDay() || 7;
          startOfThisWeek.setDate(now.getDate() - day + 1);
          startOfThisWeek.setHours(0, 0, 0, 0);
          
          const startOfLastWeek = new Date(startOfThisWeek);
          startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
          
          if (invDate < startOfLastWeek || invDate >= startOfThisWeek) return false;
        } else if (billDateFilter === 'this_month') {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          if (invDate < startOfMonth) return false;
        } else if (billDateFilter === 'last_month') {
          const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          if (invDate < startOfLastMonth || invDate >= startOfThisMonth) return false;
        } else if (billDateFilter === 'this_year') {
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          if (invDate < startOfYear) return false;
        } else if (billDateFilter === 'custom') {
          if (listFromDate) {
            const fromD = new Date(listFromDate);
            fromD.setHours(0, 0, 0, 0);
            if (invDate < fromD) return false;
          }
          if (listToDate) {
            const toD = new Date(listToDate);
            toD.setHours(23, 59, 59, 999);
            if (invDate > toD) return false;
          }
        }
      }

      return true;
    });
  }, [invoices, billSearchQuery, billStatusFilter, billDateFilter, listFromDate, listToDate]);

  const loadInvoices = async () => {
    setListLoading(true);
    setListError('');
    try {
      const res = await api.get('/billing/invoices');
      if (res.data.success) {
        setInvoices(res.data.data?.invoices || res.data.data || []);
      }
    } catch (err: any) {
      console.error(err);
      setListError('Failed to fetch invoice history.');
    } finally {
      setListLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const params: any = { period: analyticsPeriod };
      if (analyticsPeriod === 'custom') {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }
      const res = await api.get('/billing/analytics', { params });
      if (res.data.success) {
        setAnalyticsData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load billing analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    loadDiagnosticsAndInvoices();
    loadHospitalSettings();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (activeTab === 'list') {
      loadInvoices();
    } else if (activeTab === 'dashboard') {
      fetchAnalytics();
    }
  }, [activeTab, analyticsPeriod]);

  const handleDiagSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const serviceId = e.target.value;
    if (!serviceId) return;

    const service = diagServices.find(s => s.service_id === serviceId);
    if (service) {
      setItemForm({
        description: service.name,
        category: 'Diagnostics',
        quantity: '1',
        unitPrice: parseFloat(service.price).toString()
      });
    }
  };

  const addItem = () => {
    if (!itemForm.description) return;
    setItems([
      ...items,
      {
        description: itemForm.description,
        category: itemForm.category,
        quantity: Number(itemForm.quantity),
        unitPrice: Number(itemForm.unitPrice)
      }
    ]);
    setItemForm({ description: '', category: 'General', quantity: '1', unitPrice: '0' });
  };

  const findPackageForDescription = (description: string, packages: any[]) => {
    if (!description || !packages || !Array.isArray(packages) || packages.length === 0) return null;
    
    const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const targetNorm = norm(description);
    
    if (!targetNorm) return null;

    // 1. Direct normalized match or substring match
    let found = packages.find((p: any) => {
      const pNorm = norm(p.name);
      return pNorm === targetNorm || targetNorm.includes(pNorm) || pNorm.includes(targetNorm);
    });
    if (found) return found;

    // 2. Singular / Plural match (e.g., "profiles" vs "profile")
    const targetNoS = targetNorm.replace(/s$/, '');
    found = packages.find((p: any) => {
      const pNoS = norm(p.name).replace(/s$/, '');
      return pNoS === targetNoS || targetNoS.includes(pNoS) || pNoS.includes(targetNoS);
    });
    if (found) return found;

    // 3. Word token intersection (e.g., "fever" and "profile")
    const words = description.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length >= 3);
    if (words.length > 0) {
      found = packages.find((p: any) => {
        const pLower = (p.name || '').toLowerCase();
        return words.every(w => pLower.includes(w));
      });
    }
    return found || null;
  };

  const getPackageTestListString = (itemDesc: string, pkgs: any[]) => {
    const pkg = findPackageForDescription(itemDesc, pkgs);
    if (!pkg || !pkg.services || !Array.isArray(pkg.services) || pkg.services.length === 0) {
      return '';
    }
    return pkg.services
      .map((s: any) => (typeof s === 'string' ? s : (s.name || s.service_name || '')))
      .filter(Boolean)
      .join(', ');
  };

  const handlePrintBill = async (invoiceId: string) => {
    try {
      const [invRes, pkgsRes] = await Promise.all([
        api.get(`/billing/invoices/${invoiceId}`),
        api.get('/diagnostics/packages').catch(() => ({ data: { success: false, data: [] } }))
      ]);

      if (invRes.data.success) {
        const inv = invRes.data.data;
        const availablePackages = (pkgsRes.data?.data && pkgsRes.data.data.length > 0) ? pkgsRes.data.data : diagPackages;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const isIP = !!inv.is_inpatient;

          // Hospital Settings dynamic variables
          const hospitalName = hospitalSettings?.hospital_name || 'Hannah Hospitals India Pvt. Ltd.';
          const hospitalAddress = hospitalSettings?.hospital_address || '44-617/12, Adjacent to BSNL Telephone Exchange, Nacharam, Secunderabad-500 076';
          const phoneNumber = hospitalSettings?.phone_number || '040 - 68244555, 88012 33333';
          const website = hospitalSettings?.website || 'https://hannahhospitals.in';
          const email = hospitalSettings?.email || 'info@hannahhospitals.in';
          const gstin = hospitalSettings?.gstin || '36AABCU2450J1ZD';
          const licenseInfo = hospitalSettings?.license_info || 'PR-2026/8508';
          const logoUrl = hospitalSettings?.hospital_logo || null;
          const logoHtml = getHospitalLogoHtml(logoUrl, 70);

          // Date formatting (DD/MM/YYYY HH:MM)
          const dateObj = new Date(inv.created_at);
          const pad = (n: number) => n.toString().padStart(2, '0');
          const formattedDate = `${pad(dateObj.getDate())}/${pad(dateObj.getMonth() + 1)}/${dateObj.getFullYear()} ${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;

          // Bill Reference Number format
          const billPrefix = isIP ? 'IP' : 'OP';
          const billYear = dateObj.getFullYear().toString().substring(2);
          const billNumber = `${billPrefix}${billYear}-${inv.invoice_id.substring(0, 8).toUpperCase()}`;

          // Dynamic Age computation according to adult/child rules
          const ageStr = formatDisplayAge(inv.birth_date, inv.patient_age || inv.age);

          // Rupees in words converter
          const numberToWords = (num: number): string => {
            const a = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
            const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
            
            const numToString = (n: number): string => {
              if (n < 20) return a[n];
              const digit = n % 10;
              if (n < 100) return b[Math.floor(n / 10)] + (digit ? '-' + a[digit] : '');
              if (n < 1000) return a[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' and ' + numToString(n % 100) : '');
              return '';
            };
            
            const convert = (n: number): string => {
              if (n === 0) return 'zero';
              let words = '';
              if (n >= 10000000) {
                words += convert(Math.floor(n / 10000000)) + ' crore ';
                n %= 10000000;
              }
              if (n >= 100000) {
                words += convert(Math.floor(n / 100000)) + ' lakh ';
                n %= 100000;
              }
              if (n >= 1000) {
                words += numToString(Math.floor(n / 1000)) + ' thousand ';
                n %= 1000;
              }
              if (n > 0) {
                words += numToString(n);
              }
              return words.trim();
            };
            
            return 'RUPEES ' + convert(Math.floor(num)).toUpperCase() + ' ONLY';
          };
          const wordsTotal = numberToWords(parseFloat(inv.patient_responsibility));

          const userObj = JSON.parse(localStorage.getItem('hms_user') || '{}');
          const preparedBy = `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim() || 'system admin';

          printWindow.document.write(`
            <html>
              <head>
                <title>${isIP ? 'IP BILL' : 'OP BILL'}</title>
                <style>
                  @page {
                    size: auto;
                    margin: 15mm 15mm 15mm 15mm;
                  }
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                    color: #0f172a;
                    padding: 10px;
                    line-height: 1.4;
                    margin: 0;
                    font-size: 13px;
                  }
                  .logo-col {
                    width: 100px;
                  }
                  .header-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                  }
                  .hospital-details {
                    flex: 1;
                    padding-left: 20px;
                  }
                  .hospital-name {
                    font-size: 24px;
                    font-weight: 800;
                    color: #0f172a;
                    margin: 0 0 6px 0;
                  }
                  .hospital-sub {
                    font-size: 12px;
                    color: #475569;
                    margin: 2px 0;
                  }
                  .hospital-sub strong {
                    color: #0f172a;
                  }
                  .stamp-col {
                    width: 180px;
                    text-align: right;
                  }
                  .reg-stamp {
                    border: 1.5px dashed #2563eb;
                    color: #1d4ed8;
                    padding: 6px 10px;
                    font-size: 11px;
                    font-weight: 700;
                    border-radius: 6px;
                    display: inline-block;
                    text-align: center;
                  }
                  .divider-thick {
                    border-bottom: 2px solid #0f172a;
                    margin: 12px 0 16px 0;
                  }
                  .bill-title {
                    text-align: center;
                    font-size: 14px;
                    font-weight: 800;
                    letter-spacing: 1.5px;
                    margin-bottom: 16px;
                    text-transform: uppercase;
                  }
                  .patient-banner {
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 10px 16px;
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 16px;
                    background: #f8fafc;
                  }
                  .patient-block {
                    display: flex;
                    flex-direction: column;
                  }
                  .patient-label {
                    font-size: 10px;
                    color: #64748b;
                    font-weight: 700;
                    margin-bottom: 2px;
                  }
                  .patient-value {
                    font-weight: 800;
                    font-size: 13px;
                    color: #0f172a;
                  }
                  .payment-type {
                    font-weight: 700;
                    margin-bottom: 12px;
                    font-size: 12px;
                  }
                  .table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                  }
                  .table th {
                    border-top: 1.5px solid #0f172a;
                    border-bottom: 1.5px solid #0f172a;
                    padding: 8px;
                    font-size: 11px;
                    font-weight: 700;
                    color: #334155;
                  }
                  .table td {
                    padding: 8px;
                    border-bottom: 1px solid #f1f5f9;
                    font-size: 12px;
                  }
                  .summary-container {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 10px;
                    align-items: flex-start;
                  }
                  .words-block {
                    flex: 1;
                    padding-right: 20px;
                  }
                  .words-label {
                    font-size: 11px;
                    font-weight: 700;
                    color: #475569;
                  }
                  .words-val {
                    font-weight: 800;
                    font-style: italic;
                    font-size: 12px;
                    margin-top: 2px;
                  }
                  .calc-block {
                    width: 280px;
                  }
                  .calc-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 4px 0;
                    font-size: 12px;
                  }
                  .receivable-row {
                    border-top: 1px solid #e2e8f0;
                    padding-top: 6px;
                  }
                  .received-row {
                    border-top: 1px solid #e2e8f0;
                    font-weight: 800;
                    font-size: 13px;
                    padding-top: 6px;
                    margin-top: 2px;
                  }
                  .footer-signature {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-top: 80px;
                    font-size: 12px;
                    color: #475569;
                  }
                  .prepared-by {
                    font-weight: 700;
                    color: #0f172a;
                  }
                  .sig-line {
                    border-top: 1px dashed #94a3b8;
                    width: 150px;
                    text-align: center;
                    padding-top: 5px;
                    font-weight: 600;
                  }
                </style>
              </head>
              <body onload="window.print(); setTimeout(function() { window.close(); }, 500);">
                <div class="header-container">
                  <div class="logo-col">
                    ${logoHtml}
                  </div>
                  <div class="hospital-details">
                    <h1 class="hospital-name">${hospitalName}</h1>
                    <p class="hospital-sub">${hospitalAddress}</p>
                    <p class="hospital-sub">Phone: ${phoneNumber} | Web: ${website} | Email: ${email}</p>
                    <p class="hospital-sub"><strong>GSTIN: ${gstin}</strong></p>
                  </div>
                  <div class="stamp-col">
                    <div class="reg-stamp">REG NO: ${licenseInfo}</div>
                  </div>
                </div>

                <div class="divider-thick"></div>

                <div class="bill-title">${isIP ? 'IP BILL' : 'OP BILL'}</div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
                  <tbody>
                    <tr>
                      <td style="width: 120px; padding: 4px 0; color: #475569; font-weight: 600;">${isIP ? 'IP No' : 'OP No'}</td>
                      <td style="padding: 4px 0; font-weight: 700;">: ${isIP ? 'IP' : 'OP'}-${inv.patient_id.substring(0, 4).toUpperCase()}</td>
                      <td style="width: 120px; padding: 4px 0; color: #475569; font-weight: 600;">Token No</td>
                      <td style="padding: 4px 0; font-weight: 700;">: 1</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; color: #475569; font-weight: 600;">Consultant</td>
                      <td style="padding: 4px 0; font-weight: 700;">: ${inv.doctor_name || effectiveConsultantDoctor}</td>
                      <td style="padding: 4px 0; color: #475569; font-weight: 600;">Referred By</td>
                      <td style="padding: 4px 0; font-weight: 700;">: ${effectiveReferredBy}</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; color: #475569; font-weight: 600;">Date</td>
                      <td style="padding: 4px 0; font-weight: 700;">: ${formattedDate}</td>
                      <td style="padding: 4px 0; color: #475569; font-weight: 600;">Bill No</td>
                      <td style="padding: 4px 0; font-weight: 700;">: ${billNumber}</td>
                    </tr>
                  </tbody>
                </table>

                <div class="patient-banner">
                  <div class="patient-block">
                    <span class="patient-label">NAME</span>
                    <span class="patient-value">${inv.patient_name}</span>
                  </div>
                  <div class="patient-block">
                    <span class="patient-label">ID (MRN)</span>
                    <span class="patient-value">${inv.medical_record_number}</span>
                  </div>
                  <div class="patient-block">
                    <span class="patient-label">AGE</span>
                    <span class="patient-value">${ageStr}</span>
                  </div>
                  <div class="patient-block">
                    <span class="patient-label">GENDER</span>
                    <span class="patient-value">${(inv.gender || 'F').toUpperCase()}</span>
                  </div>
                  <div class="patient-block">
                    <span class="patient-label">MOBILE</span>
                    <span class="patient-value">${inv.phone || '—'}</span>
                  </div>
                </div>

                <div class="payment-type">
                  Payment Type: ${inv.payment_method || 'Cash'}
                </div>

                <table class="table">
                  <thead>
                    <tr>
                      <th style="width: 50px; text-align: left;">S.NO</th>
                      <th style="text-align: left;">PARTICULARS</th>
                      <th style="width: 80px; text-align: right;">QTY</th>
                      <th style="width: 120px; text-align: right;">RATE</th>
                      <th style="width: 120px; text-align: right;">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(inv.items || []).map((item: any, idx: number) => {
                      const testListStr = getPackageTestListString(item.description, availablePackages);

                      return `
                        <tr>
                          <td style="text-align: left; vertical-align: top;">${idx + 1}.</td>
                          <td style="text-align: left; vertical-align: top;">
                            <div style="font-weight: 700; text-transform: uppercase; color: #0f172a;">${item.description}</div>
                            ${testListStr ? `
                              <div style="font-size: 11px; font-weight: 600; color: #334155; margin-top: 4px; line-height: 1.3; text-transform: none;">
                                (${testListStr})
                              </div>
                            ` : ''}
                          </td>
                          <td style="text-align: right; vertical-align: top;">${item.quantity}</td>
                          <td style="text-align: right; vertical-align: top;">${parseFloat(item.unit_price).toFixed(2)}</td>
                          <td style="text-align: right; vertical-align: top; font-weight: 700;">${(parseFloat(item.unit_price) * item.quantity).toFixed(2)}</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>

                <div class="summary-container">
                  <div class="words-block">
                    <div class="words-label">Amount (in words):</div>
                    <div class="words-val">${wordsTotal}</div>
                  </div>
                  <div class="calc-block">
                    <div class="calc-row receivable-row">
                      <span class="calc-label">Total Bill Amount</span>
                      <span class="calc-val">Rs. ${parseFloat(inv.patient_responsibility || inv.total_amount).toFixed(2)}</span>
                    </div>
                    <div class="calc-row received-row" style="color: #16a34a;">
                      <span class="calc-label">Paid Amount (Advance)</span>
                      <span class="calc-val">Rs. ${parseFloat(inv.amount_paid || 0).toFixed(2)}</span>
                    </div>
                    <div class="calc-row due-row" style="font-weight: 800; border-top: 1px solid #e2e8f0; padding-top: 6px; margin-top: 2px; color: ${parseFloat(inv.due_amount !== undefined && inv.due_amount !== null ? inv.due_amount : (inv.patient_responsibility - inv.amount_paid)) > 0 ? '#d97706' : '#16a34a'};">
                      <span class="calc-label">Balance Due Amount</span>
                      <span class="calc-val">Rs. ${parseFloat(inv.due_amount !== undefined && inv.due_amount !== null ? inv.due_amount : (inv.patient_responsibility - inv.amount_paid)).toFixed(2)}</span>
                    </div>
                    <div class="calc-row" style="margin-top: 4px;">
                      <span class="calc-label">Payment Status</span>
                      <span class="calc-val" style="font-weight: 700; color: ${inv.status === 'Paid' ? '#16a34a' : inv.status === 'PartiallyPaid' ? '#d97706' : '#dc2626'};">
                        ${inv.status === 'PartiallyPaid' ? 'PARTIALLY PAID / DUE' : (inv.status || 'UNPAID').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                ${inv.payment_logs && inv.payment_logs.length > 0 ? `
                  <div style="margin-top: 16px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; background-color: #f8fafc;">
                    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #1e293b; margin-bottom: 6px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
                      <span>📜 Payment & Installment Transaction History Audit Log</span>
                      <span style="font-size: 10px; font-weight: 600; color: #64748b;">(${inv.payment_logs.length} Installment Records)</span>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                      <thead>
                        <tr style="background: #e2e8f0; text-align: left; font-weight: 700; color: #334155;">
                          <th style="padding: 5px 6px; border: 1px solid #cbd5e1;">Txn #</th>
                          <th style="padding: 5px 6px; border: 1px solid #cbd5e1;">Date & Time</th>
                          <th style="padding: 5px 6px; border: 1px solid #cbd5e1;">Type</th>
                          <th style="padding: 5px 6px; border: 1px solid #cbd5e1;">Mode</th>
                          <th style="padding: 5px 6px; border: 1px solid #cbd5e1;">Ref / Notes</th>
                          <th style="padding: 5px 6px; border: 1px solid #cbd5e1; text-align: right;">Amount Paid</th>
                          <th style="padding: 5px 6px; border: 1px solid #cbd5e1; text-align: right;">Balance Remaining</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${inv.payment_logs.map((log: any, lIdx: number) => `
                          <tr style="border-bottom: 1px solid #e2e8f0; background: ${lIdx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                            <td style="padding: 5px 6px; border: 1px solid #e2e8f0; font-weight: 600;">Txn #${lIdx + 1}</td>
                            <td style="padding: 5px 6px; border: 1px solid #e2e8f0;">${new Date(log.payment_timestamp || log.created_at).toLocaleString()}</td>
                            <td style="padding: 5px 6px; border: 1px solid #e2e8f0; font-weight: 600;">${log.payment_type}</td>
                            <td style="padding: 5px 6px; border: 1px solid #e2e8f0;">${log.payment_mode}</td>
                            <td style="padding: 5px 6px; border: 1px solid #e2e8f0; color: #64748b;">${log.transaction_ref || '-'}</td>
                            <td style="padding: 5px 6px; border: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #16a34a;">Rs. ${parseFloat(log.amount_paid).toFixed(2)}</td>
                            <td style="padding: 5px 6px; border: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: ${parseFloat(log.remaining_due_after_txn) > 0 ? '#d97706' : '#16a34a'};">Rs. ${parseFloat(log.remaining_due_after_txn).toFixed(2)}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                ` : ''}

                <div class="footer-signature">
                  <div>Prepared By: <span class="prepared-by">${preparedBy}</span></div>
                  <div class="sig-line">Signature / Stamp</div>
                </div>
              </body>
            </html>
          `);
          printWindow.document.close();
        }
      }
    } catch (err: any) {
      alert('Failed to retrieve full invoice data for printing.');
    }
  };

  const handleSubmit = async () => {
    if (!patient || items.length === 0) return;

    if (advancePaid !== '' && Number(advancePaid) > patientOwes) {
      alert(`⚠️ Advance paid amount (Rs. ${advancePaid}) cannot exceed Total Bill Amount (${formatCurrency(patientOwes)}).`);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/billing/invoices', {
        patientId: patient.patient_id,
        items,
        discount: Number(discount),
        tax: Number(tax),
        insuranceCoverage: Number(insurance),
        paymentMethod,
        paidAmount: clampedPaidAmount,
        paymentStatus: calculatedPaymentStatus
      });
      
      if (res.data.success) {
        const createdInv = res.data.data;
        setSuccess('Invoice created successfully! Initializing printout...');
        setItems([]);
        setPatient(null);
        setAdvancePaid('');
        setTimeout(() => setSuccess(''), 3000);
        
        // Print the invoice directly
        handlePrintBill(createdInv.invoice_id);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to generate invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCollectModal = (inv: any) => {
    const totalAmt = parseFloat(inv.total_amount || inv.patient_responsibility || 0);
    const paidAmt = parseFloat(inv.amount_paid || 0);
    const currentDue = inv.due_amount !== undefined && inv.due_amount !== null ? parseFloat(inv.due_amount) : Math.max(0, totalAmt - paidAmt);

    setSelectedCollectInvoice({
      ...inv,
      totalAmt,
      paidAmt,
      currentDue
    });
    setCollectAmount(currentDue.toString());
    setCollectMethod('Cash');
    setCollectRef('');
    setCollectDate(new Date().toISOString().slice(0, 16));
    setCollectError('');
    setCollectModalOpen(true);
  };

  const handleCollectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollectInvoice) return;

    const numCollect = parseFloat(collectAmount);
    if (isNaN(numCollect) || numCollect <= 0) {
      setCollectError('⚠️ Collection amount must be a positive number.');
      return;
    }
    if (numCollect > selectedCollectInvoice.currentDue + 0.01) {
      setCollectError(`⚠️ Collection amount (Rs. ${numCollect}) cannot exceed current balance due (Rs. ${selectedCollectInvoice.currentDue.toFixed(2)}).`);
      return;
    }

    setCollectLoading(true);
    setCollectError('');
    try {
      const res = await api.post(`/billing/invoices/${selectedCollectInvoice.invoice_id}/payments`, {
        amountPaid: numCollect,
        paymentMethod: collectMethod,
        transactionRef: collectRef || undefined,
        paymentTimestamp: collectDate ? new Date(collectDate).toISOString() : undefined,
        collectedBy: 'Reception Staff'
      });

      if (res.data.success) {
        setCollectModalOpen(false);
        loadInvoices();
        // Print updated invoice receipt with full installment history
        handlePrintBill(selectedCollectInvoice.invoice_id);
      }
    } catch (err: any) {
      setCollectError(err.response?.data?.error || 'Failed to record due payment collection.');
    } finally {
      setCollectLoading(false);
    }
  };

  const handleViewInvoiceDetails = async (invoiceId: string) => {
    setViewInvoiceLoading(true);
    setViewInvoiceModalOpen(true);
    try {
      const res = await api.get(`/billing/invoices/${invoiceId}`);
      if (res.data.success) {
        setViewInvoiceData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load invoice details:', err);
    } finally {
      setViewInvoiceLoading(false);
    }
  };

  const handleCancelInvoice = async (invoiceId: string) => {
    if (!window.confirm('Are you sure you want to CANCEL this bill?')) return;
    try {
      await api.post(`/billing/invoices/${invoiceId}/cancel`);
      loadInvoices();
      alert('Invoice cancelled successfully.');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel invoice.');
    }
  };

  const handleReturnInvoice = async (invoiceId: string) => {
    if (!window.confirm('Are you sure you want to RETURN/REFUND this bill? This resets paid amount to 0.')) return;
    try {
      await api.post(`/billing/invoices/${invoiceId}/return`);
      loadInvoices();
      alert('Invoice returned successfully.');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to return invoice.');
    }
  };

  const handleUpdateStatus = async (invoiceId: string, targetStatus: 'Paid' | 'Unpaid') => {
    const actionText = targetStatus === 'Paid' ? 'mark this bill as PAID (Cash Payment)' : 'mark this bill as UNPAID';
    if (!window.confirm(`Are you sure you want to ${actionText}?`)) return;
    try {
      await api.post(`/billing/invoices/${invoiceId}/update-status`, {
        status: targetStatus,
        paymentMethod: 'Cash'
      });
      loadInvoices();
      alert(`Invoice marked as ${targetStatus} successfully.`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update payment status.');
    }
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.name || !serviceForm.categoryId || !serviceForm.serviceCode || !serviceForm.price) {
      alert('Please fill in all required fields.');
      return;
    }
    try {
      const payload = {
        name: serviceForm.name,
        categoryId: serviceForm.categoryId,
        serviceCode: serviceForm.serviceCode.toUpperCase(),
        price: parseFloat(serviceForm.price),
        gstPercentage: parseFloat(serviceForm.gstPercentage),
        durationMinutes: parseInt(serviceForm.durationMinutes),
        sampleRequired: serviceForm.sampleRequired,
        normalRange: serviceForm.normalRange,
        machineRequired: serviceForm.machineRequired,
        homeCollectionAvailable: serviceForm.homeCollectionAvailable,
        emergencyAvailable: serviceForm.emergencyAvailable,
        isActive: serviceForm.isActive
      };

      if (editingService) {
        await api.put(`/diagnostics/services/${editingService.service_id}`, payload);
        alert('Billing line item updated successfully.');
      } else {
        await api.post('/diagnostics/services', payload);
        alert('New billing line item created successfully.');
      }
      setServiceModalOpen(false);
      setEditingService(null);
      setServiceForm({
        name: '',
        categoryId: categories[0]?.category_id || '',
        serviceCode: '',
        price: '',
        gstPercentage: '18',
        durationMinutes: '30',
        sampleRequired: 'None',
        normalRange: '',
        machineRequired: '',
        homeCollectionAvailable: false,
        emergencyAvailable: false,
        isActive: true
      });
      loadDiagnosticsAndInvoices();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to save line item.');
    }
  };

  const handleEditServiceClick = (service: any) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      categoryId: service.category_id,
      serviceCode: service.service_code,
      price: parseFloat(service.price).toString(),
      gstPercentage: parseFloat(service.gst_percentage || '18').toString(),
      durationMinutes: parseInt(service.duration_minutes || '30').toString(),
      sampleRequired: service.sample_required || 'None',
      normalRange: service.normal_range || '',
      machineRequired: service.machine_required || '',
      homeCollectionAvailable: !!service.home_collection_available,
      emergencyAvailable: !!service.emergency_available,
      isActive: !!service.is_active
    });
    setServiceModalOpen(true);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!window.confirm('Are you sure you want to delete this billing line item?')) return;
    try {
      await api.delete(`/diagnostics/services/${serviceId}`);
      alert('Billing line item deleted successfully.');
      loadDiagnosticsAndInvoices();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to delete line item.');
    }
  };

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={28} color="var(--accent-primary)" />
            Invoices & Billing Panel
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px' }}>
            Generate patient bills, search diagnostics catalog, and manage cancellations/returns
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-primary)', gap: '8px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('dashboard')}
          style={{
            padding: '8px 20px',
            background: activeTab === 'dashboard' ? 'var(--bg-card)' : 'transparent',
            color: activeTab === 'dashboard' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            border: activeTab === 'dashboard' ? '1px solid var(--border-primary)' : '1px solid transparent',
            borderBottom: activeTab === 'dashboard' ? '1px solid transparent' : '1px solid transparent',
            borderRadius: '8px 8px 0 0',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '-1px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <BarChart2 size={16} />
          Billing Revenue Dashboard
        </button>
        <button
          onClick={() => setActiveTab('generator')}
          style={{
            padding: '8px 20px',
            background: activeTab === 'generator' ? 'var(--bg-card)' : 'transparent',
            color: activeTab === 'generator' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            border: activeTab === 'generator' ? '1px solid var(--border-primary)' : '1px solid transparent',
            borderBottom: activeTab === 'generator' ? '1px solid transparent' : '1px solid transparent',
            borderRadius: '8px 8px 0 0',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '-1px'
          }}
        >
          Invoice Generator
        </button>
        <button
          onClick={() => setActiveTab('list')}
          style={{
            padding: '8px 20px',
            background: activeTab === 'list' ? 'var(--bg-card)' : 'transparent',
            color: activeTab === 'list' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            border: activeTab === 'list' ? '1px solid var(--border-primary)' : '1px solid transparent',
            borderBottom: activeTab === 'list' ? '1px solid transparent' : '1px solid transparent',
            borderRadius: '8px 8px 0 0',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '-1px'
          }}
        >
          All Bills & Receipts
        </button>
      </div>

      {success && <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--accent-success)', padding: '12px', borderRadius: '8px', marginBottom: '24px' }}>{success}</div>}

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Controls Bar: Period Filter Buttons & Date Picker */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', background: 'var(--bg-card)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-primary)' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={22} color="var(--accent-primary)" />
                Billing Revenue Analytics Dashboard
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '2px 0 0 0' }}>
                Real-time tracking of total revenue, paid/unpaid bills, cash, UPI, card, and IP/OP billing counts
              </p>
            </div>

            {/* Time Period Filter Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'today', label: 'Today' },
                { id: 'week', label: 'This Week' },
                { id: 'month', label: 'This Month' },
                { id: 'year', label: 'This Year' },
                { id: 'custom', label: 'Custom Range' },
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setAnalyticsPeriod(p.id as any)}
                  style={{
                    padding: '6px 14px',
                    fontSize: '13px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: '1px solid var(--border-primary)',
                    background: analyticsPeriod === p.id ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    color: analyticsPeriod === p.id ? '#ffffff' : 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {p.label}
                </button>
              ))}

              <Button
                variant="secondary"
                size="sm"
                icon={<RefreshCw size={14} />}
                onClick={fetchAnalytics}
                loading={analyticsLoading}
              >
                Refresh
              </Button>
            </div>
          </div>

          {/* Custom Date Range Picker Container (If Custom selected) */}
          {analyticsPeriod === 'custom' && (
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.2)', padding: '12px 20px', borderRadius: '10px' }}>
              <Calendar size={18} color="var(--accent-primary)" />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>From Date *</label>
                  <input
                    type="date"
                    className="input"
                    value={customStartDate}
                    onChange={e => setCustomStartDate(e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>To Date *</label>
                  <input
                    type="date"
                    className="input"
                    value={customEndDate}
                    onChange={e => setCustomEndDate(e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '13px' }}
                  />
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={fetchAnalytics}
                  style={{ marginTop: '18px' }}
                >
                  Apply Custom Range
                </Button>
              </div>
            </div>
          )}

          {/* KPI Summary Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            
            {/* KPI 1: Total Revenue */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Billing Revenue</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(37,99,235,0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={20} />
                </div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {formatCurrency(analyticsData?.totalRevenue || 0)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <strong>{analyticsData?.totalInvoices || 0} Total Bills Generated</strong>
              </div>
            </div>

            {/* KPI 2: Total Paid Invoices */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Paid Amount Collected</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(34,197,94,0.1)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle size={20} />
                </div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#16a34a' }}>
                {formatCurrency(analyticsData?.totalAmountPaid || 0)}
              </div>
              <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px', fontWeight: 700 }}>
                ✓ {analyticsData?.paidInvoicesCount || 0} Fully Paid Invoices
              </div>
            </div>

            {/* KPI 3: Pending / Unpaid Amount */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Pending Amount Outstanding</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={20} />
                </div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#ef4444' }}>
                {formatCurrency(analyticsData?.totalPendingAmount || 0)}
              </div>
              <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', fontWeight: 700 }}>
                ⚠️ {(analyticsData?.unpaidInvoicesCount || 0) + (analyticsData?.partialInvoicesCount || 0)} Unpaid / Partial Bills
              </div>
            </div>

            {/* KPI 4: UPI / Online Payments */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>UPI & QR Collections</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(147,51,234,0.1)', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={20} />
                </div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#9333ea' }}>
                {formatCurrency(analyticsData?.upiAmount || 0)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                📱 {analyticsData?.upiCount || 0} UPI Transactions
              </div>
            </div>

            {/* KPI 5: Cash Collections */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Cash Receipts</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(217,119,6,0.1)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={20} />
                </div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#d97706' }}>
                {formatCurrency(analyticsData?.cashAmount || 0)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                💵 {analyticsData?.cashCount || 0} Cash Receipts
              </div>
            </div>

            {/* KPI 6: IP vs OP Revenue Breakdown */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Inpatient (IP) vs Outpatient (OP)</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(13,148,136,0.1)', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart2 size={20} />
                </div>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                <div><strong>🏥 IP Revenue:</strong> <span style={{ color: '#0d9488', fontWeight: 800 }}>{formatCurrency(analyticsData?.ipAmount || 0)}</span> ({analyticsData?.ipInvoicesCount || 0} Bills)</div>
                <div><strong>🩺 OP Revenue:</strong> <span style={{ color: '#0284c7', fontWeight: 800 }}>{formatCurrency(analyticsData?.opAmount || 0)}</span> ({analyticsData?.opInvoicesCount || 0} Bills)</div>
              </div>
            </div>

          </div>

          {/* Breakdown Tables Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            
            {/* Daily Trend Table */}
            <Card title="Daily Revenue & Payment Method Trend" icon={<BarChart2 size={18} />}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', textAlign: 'left', borderBottom: '1px solid var(--border-primary)' }}>
                      <th style={{ padding: '10px 12px' }}>Date</th>
                      <th style={{ padding: '10px 12px' }}>Bills Count</th>
                      <th style={{ padding: '10px 12px' }}>Total Revenue</th>
                      <th style={{ padding: '10px 12px' }}>Cash Amount</th>
                      <th style={{ padding: '10px 12px' }}>UPI Amount</th>
                      <th style={{ padding: '10px 12px' }}>Card Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!analyticsData?.dailyTrends || analyticsData.dailyTrends.length === 0) ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No billing records found for the selected time period.
                        </td>
                      </tr>
                    ) : (
                      analyticsData.dailyTrends.map((t: any, idx: number) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 700 }}>{t.date}</td>
                          <td style={{ padding: '10px 12px' }}>{t.invoiceCount} Bills</td>
                          <td style={{ padding: '10px 12px', fontWeight: 800, color: 'var(--text-primary)' }}>{formatCurrency(t.totalAmount)}</td>
                          <td style={{ padding: '10px 12px', color: '#d97706', fontWeight: 600 }}>{formatCurrency(t.cashAmount)}</td>
                          <td style={{ padding: '10px 12px', color: '#9333ea', fontWeight: 600 }}>{formatCurrency(t.upiAmount)}</td>
                          <td style={{ padding: '10px 12px', color: '#0284c7', fontWeight: 600 }}>{formatCurrency(t.cardAmount)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Payment Method Distribution Breakdown Card */}
            <Card title="Payment Method Share" icon={<CreditCard size={18} />}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
                
                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong>💵 Cash Receipts</strong>
                    <span style={{ color: '#d97706', fontWeight: 800 }}>{formatCurrency(analyticsData?.cashAmount || 0)}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {analyticsData?.cashCount || 0} Transactions
                  </div>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong>📱 UPI & Online QR</strong>
                    <span style={{ color: '#9333ea', fontWeight: 800 }}>{formatCurrency(analyticsData?.upiAmount || 0)}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {analyticsData?.upiCount || 0} Transactions
                  </div>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong>💳 Card Payments</strong>
                    <span style={{ color: '#0284c7', fontWeight: 800 }}>{formatCurrency(analyticsData?.cardAmount || 0)}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {analyticsData?.cardCount || 0} Transactions
                  </div>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong>🏥 Insurance & Coverage</strong>
                    <span style={{ color: '#059669', fontWeight: 800 }}>{formatCurrency(analyticsData?.insuranceAmount || 0)}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {analyticsData?.insuranceCount || 0} Claims / Covered Bills
                  </div>
                </div>

              </div>
            </Card>

          </div>

        </div>
      )}

      {activeTab === 'generator' && (
        <>
          <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '20px', borderRadius: '12px', marginBottom: '24px', position: 'relative', zIndex: 50 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div className="form-section-title" style={{ fontWeight: 700, margin: 0 }}>Patient Selection</div>
              <Button 
                variant="secondary" 
                size="sm" 
                icon={<Plus size={14} />} 
                onClick={() => setPatientModalOpen(true)}
              >
                Create New Patient
              </Button>
            </div>
            <PatientSearchBar 
              onSelect={setPatient} 
              placeholder="📱 Primary Search: Enter Mobile Number, Name or MRN..."
              showRegisterOption={true} 
              onRegisterClick={() => setPatientModalOpen(true)} 
            />
            {patient && (
              <div style={{ background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.2)', padding: '12px 16px', borderRadius: '8px', marginTop: '12px', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, color: '#1d4ed8', background: '#dbeafe', padding: '2px 8px', borderRadius: '4px', fontSize: '13px' }}>
                    📱 {patient.phone || 'No Mobile'}
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>{patient.first_name} {patient.last_name}</span> 
                  <span style={{ fontFamily: 'monospace', color: '#475569', fontSize: '13px' }}>🆔 {patient.medical_record_number}</span> 
                  {patient.age && <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>• Age: {patient.age} yrs</span>}
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '50px', background: patient.is_inpatient ? '#eff6ff' : '#ecfdf5', color: patient.is_inpatient ? '#1d4ed8' : '#047857', fontWeight: 700 }}>
                    {patient.is_inpatient ? 'Inpatient (IP)' : 'Outpatient (OP)'}
                  </span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setPatient(null)} 
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent-danger)' }}
                  title="Remove selected patient"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '20px', borderRadius: '12px', marginBottom: '24px', position: 'relative', zIndex: 20 }}>
            <div className="form-section-title" style={{ fontWeight: 700, marginBottom: '16px' }}>Consultant Doctor & Referral Information</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              
              {/* Consultant Doctor Selection */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Consultant Doctor
                </label>
                <Select
                  value={consultantSelect}
                  onChange={(e) => setConsultantSelect(e.target.value)}
                  options={[
                    ...hospitalDoctors.map(doc => ({ value: doc, label: doc })),
                    { value: 'OTHER', label: '+ Other / Custom Doctor Name...' }
                  ]}
                />
                {consultantSelect === 'OTHER' && (
                  <div style={{ marginTop: '8px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-primary)', display: 'block', marginBottom: '4px' }}>
                      Doctor Name (Custom)
                    </label>
                    <Input
                      placeholder="Type consultant doctor name..."
                      value={consultantCustomName}
                      onChange={(e) => setConsultantCustomName(e.target.value)}
                      style={{ background: 'var(--bg-primary)' }}
                    />
                  </div>
                )}
              </div>

              {/* Referred By Selection */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Referred By
                </label>
                <Select
                  value={referredBySelect}
                  onChange={(e) => setReferredBySelect(e.target.value)}
                  options={[
                    { value: 'Self', label: 'Self (Direct Walk-in)' },
                    ...hospitalDoctors.map(doc => ({ value: doc, label: doc })),
                    { value: 'OTHER', label: '+ Other Hospital / External Doctor' }
                  ]}
                />
                {referredBySelect === 'OTHER' && (
                  <div style={{ marginTop: '8px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-primary)', display: 'block', marginBottom: '4px' }}>
                      External Doctor Name / Hospital Name
                    </label>
                    <Input
                      placeholder="Type referring doctor or hospital name..."
                      value={referredByCustomName}
                      onChange={(e) => setReferredByCustomName(e.target.value)}
                      style={{ background: 'var(--bg-primary)' }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
            <div className="form-section-title" style={{ fontWeight: 700, marginBottom: '12px' }}>Line Items</div>
            
            {/* Quick Search Box for Diagnostics Services & Profiles / Packages */}
            {allCatalogItems.length > 0 && (
              <div style={{ marginBottom: '16px', background: 'var(--bg-primary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-primary)', position: 'relative' }}>
                <label style={{ fontSize: '12px', color: 'var(--accent-primary)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                  🔍 Quick Search Diagnostics Services & Profiles / Packages (By Code, Test Name, or Package Title)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '8px 12px', borderRadius: '8px' }}>
                  <Search size={16} color="var(--text-muted)" />
                  <input 
                    type="text" 
                    placeholder="Type to search test services or packages (e.g. CBP, LFT, Executive Health Profile...)" 
                    value={diagSearchQuery}
                    onChange={(e) => {
                      setDiagSearchQuery(e.target.value);
                      setDiagDropdownOpen(true);
                    }}
                    onFocus={() => setDiagDropdownOpen(true)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', outline: 'none', fontSize: '13px' }}
                  />
                  {diagSearchQuery && (
                    <button 
                      type="button"
                      onClick={() => {
                        setDiagSearchQuery('');
                        setDiagDropdownOpen(false);
                      }} 
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Floating autocomplete results list */}
                {diagDropdownOpen && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '100%', 
                    left: 0, 
                    right: 0, 
                    background: 'var(--bg-card)', 
                    border: '1px solid var(--border-primary)', 
                    borderRadius: '8px', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', 
                    maxHeight: '260px', 
                    overflowY: 'auto', 
                    zIndex: 50,
                    marginTop: '4px'
                  }}>
                    {allCatalogItems
                      .filter(item => 
                        !diagSearchQuery ||
                        item.name.toLowerCase().includes(diagSearchQuery.toLowerCase()) || 
                        item.code.toLowerCase().includes(diagSearchQuery.toLowerCase())
                      )
                      .slice(0, 20)
                      .map(item => (
                        <div 
                          key={item.id} 
                          onClick={() => {
                            setItemForm({
                              description: item.name,
                              category: 'Diagnostics',
                              quantity: '1',
                              unitPrice: parseFloat(item.price).toString()
                            });
                            setDiagSearchQuery(`${item.name} (${item.code})`);
                            setDiagDropdownOpen(false);
                          }}
                          style={{ 
                            padding: '10px 14px', 
                            cursor: 'pointer', 
                            borderBottom: '1px solid var(--border-primary)',
                            transition: 'background 0.2s',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '13px'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {item.type === 'Profile/Package' ? (
                              <span style={{ fontFamily: 'sans-serif', fontSize: '10px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                PROFILE / PACKAGE
                              </span>
                            ) : (
                              <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 700 }}>
                                [{item.code}]
                              </span>
                            )}
                            <span style={{ fontWeight: item.type === 'Profile/Package' ? 700 : 500 }}>{item.name}</span>
                            {item.type === 'Profile/Package' && item.count > 0 && (
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({item.count} Tests Included)</span>
                            )}
                          </div>
                          <span style={{ fontWeight: 700, color: 'var(--accent-success)' }}>Rs. {parseFloat(item.price).toFixed(0)}</span>
                        </div>
                      ))}
                    {allCatalogItems.filter(item => 
                      !diagSearchQuery ||
                      item.name.toLowerCase().includes(diagSearchQuery.toLowerCase()) || 
                      item.code.toLowerCase().includes(diagSearchQuery.toLowerCase())
                    ).length === 0 && (
                      <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                        No matching diagnostic services or profiles/packages found.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px 100px auto', gap: '10px', alignItems: 'end', marginBottom: '16px' }}>
              <Input label="Description" value={itemForm.description} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} style={{ background: 'var(--bg-primary)' }} />
              <Select label="Category" value={itemForm.category} onChange={e => setItemForm({ ...itemForm, category: e.target.value })} options={[{ value: 'Consultation', label: 'Consultation' }, { value: 'Lab', label: 'Lab' }, { value: 'Diagnostics', label: 'Diagnostics' }, { value: 'Medication', label: 'Medication' }, { value: 'Procedure', label: 'Procedure' }, { value: 'General', label: 'General' }]} />
              <Input label="Qty" type="number" value={itemForm.quantity} onChange={e => setItemForm({ ...itemForm, quantity: e.target.value })} style={{ background: 'var(--bg-primary)' }} />
              <Input label="Price" type="number" step="0.01" value={itemForm.unitPrice} onChange={e => setItemForm({ ...itemForm, unitPrice: e.target.value })} style={{ background: 'var(--bg-primary)' }} />
              <Button variant="secondary" icon={<Plus size={16} />} onClick={addItem} style={{ height: '36px' }}>Add</Button>
            </div>
            
            {items.map((item, i) => {
              const testListStr = getPackageTestListString(item.description, diagPackages);

              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-primary)', fontSize: '13px', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.description} ({item.category})</div>
                    {testListStr && (
                      <div style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: '2px', fontWeight: 500 }}>
                        ({testListStr})
                      </div>
                    )}
                  </div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span>{item.quantity} × {formatCurrency(item.unitPrice)} = {formatCurrency(item.quantity * item.unitPrice)}</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => setItems(items.filter((_, idx) => idx !== i))} style={{ padding: '4px', cursor: 'pointer', color: 'var(--accent-danger)', border: 'none', background: 'transparent' }}>
                      <Trash2 size={14} />
                    </button>
                  </span>
                </div>
              );
            })}
          </div>

          <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <Input label="Discount" type="number" step="0.01" value={discount} onChange={e => setDiscount(e.target.value)} style={{ background: 'var(--bg-primary)' }} />
              <Input label="Tax" type="number" step="0.01" value={tax} onChange={e => setTax(e.target.value)} style={{ background: 'var(--bg-primary)' }} />
              <Input label="Insurance Coverage" type="number" step="0.01" value={insurance} onChange={e => setInsurance(e.target.value)} style={{ background: 'var(--bg-primary)' }} />
            </div>
            <hr className="divider" style={{ border: 'none', borderTop: '1px solid var(--border-primary)', margin: '16px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
              <span>Subtotal: {formatCurrency(subtotal)}</span>
              <span>Total: <strong>{formatCurrency(total)}</strong></span>
              <span>Patient Owes: <strong style={{ color: 'var(--accent-primary)' }}>{formatCurrency(patientOwes)}</strong></span>
            </div>
          </div>

          <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
            <div className="form-section-title" style={{ fontWeight: 700, marginBottom: '14px' }}>
              💳 Payment & Advance Collection Settlement
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px', alignItems: 'end' }}>
              <Select 
                label="Payment Method" 
                value={paymentMethod} 
                onChange={e => setPaymentMethod(e.target.value)} 
                options={[
                  { value: 'Cash', label: 'Cash' },
                  { value: 'Card', label: 'Card' },
                  { value: 'UPI', label: 'UPI' },
                  { value: 'Insurance', label: 'Insurance' },
                  { value: 'Bank Transfer', label: 'Bank Transfer' }
                ]} 
              />

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Initial / Advance Paid Amount (Rs.)
                </label>
                <Input 
                  type="number"
                  step="0.01"
                  placeholder={`Full Rs. ${patientOwes.toFixed(0)}`}
                  value={advancePaid}
                  onChange={e => setAdvancePaid(e.target.value)}
                  style={{ background: 'var(--bg-primary)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Calculated Payment Status
                </label>
                <div style={{ 
                  padding: '8px 12px', 
                  borderRadius: '8px', 
                  fontWeight: 700, 
                  fontSize: '13px', 
                  display: 'inline-block',
                  width: '100%',
                  textAlign: 'center',
                  background: calculatedPaymentStatus === 'Paid' ? 'rgba(34, 197, 94, 0.15)' : calculatedPaymentStatus === 'PartiallyPaid' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: calculatedPaymentStatus === 'Paid' ? '#16a34a' : calculatedPaymentStatus === 'PartiallyPaid' ? '#d97706' : '#dc2626',
                  border: `1px solid ${calculatedPaymentStatus === 'Paid' ? 'rgba(34, 197, 94, 0.3)' : calculatedPaymentStatus === 'PartiallyPaid' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                }}>
                  {calculatedPaymentStatus === 'Paid' ? '✅ Paid (Full Settlement)' : calculatedPaymentStatus === 'PartiallyPaid' ? '⚠️ Partially Paid / Due' : '❌ Unpaid (Full Due)'}
                </div>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Quick Pay Presets:</span>
              <button 
                type="button"
                onClick={() => setAdvancePaid(patientOwes.toString())}
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600, color: 'var(--accent-success)' }}
              >
                Full Payment (Rs. {patientOwes.toFixed(0)})
              </button>
              <button 
                type="button"
                onClick={() => setAdvancePaid((patientOwes / 2).toFixed(0))}
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600, color: '#d97706' }}
              >
                50% Advance (Rs. {(patientOwes / 2).toFixed(0)})
              </button>
              <button 
                type="button"
                onClick={() => setAdvancePaid('0')}
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600, color: 'var(--accent-danger)' }}
              >
                Zero Paid (Unpaid / Rs. 0)
              </button>
            </div>

            {/* Real-time Ledger Summary Banner */}
            <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', padding: '14px', borderRadius: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', textAlign: 'center' }}>
              <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-primary)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Bill Amount</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>{formatCurrency(patientOwes)}</div>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-primary)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Paid Amount (Advance)</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a', marginTop: '2px' }}>{formatCurrency(clampedPaidAmount)}</div>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-primary)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Balance Due Amount</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: calculatedDueAmount > 0 ? '#d97706' : '#16a34a', marginTop: '2px' }}>{formatCurrency(calculatedDueAmount)}</div>
              </div>
            </div>

            {Number(advancePaid) > patientOwes && (
              <div style={{ marginTop: '12px', color: '#dc2626', fontSize: '12px', fontWeight: 700, background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: '6px' }}>
                ⚠️ Warning: Advance paid amount (Rs. {advancePaid}) cannot exceed Total Bill Amount ({formatCurrency(patientOwes)}).
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" loading={loading} onClick={handleSubmit} disabled={!patient || items.length === 0}>Create & Print Invoice</Button>
          </div>
        </>
      )}

      {activeTab === 'list' && (
        <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '20px' }}>
          
          {/* Search & Filter Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              
              {/* Search Bar Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', padding: '8px 14px', borderRadius: '8px', flex: 1, minWidth: '280px' }}>
                <Search size={16} color="var(--text-muted)" />
                <input 
                  type="text" 
                  placeholder="🔍 Search bills by Invoice ID, Patient Name, Phone, MRN or Doctor..." 
                  value={billSearchQuery} 
                  onChange={(e) => setBillSearchQuery(e.target.value)} 
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', outline: 'none', fontSize: '13px' }}
                />
                {billSearchQuery && (
                  <button onClick={() => setBillSearchQuery('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Date Filter Select */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '180px' }}>
                <Calendar size={16} color="var(--accent-primary)" />
                <select
                  value={billDateFilter}
                  onChange={(e: any) => setBillDateFilter(e.target.value)}
                  className="input"
                  style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}
                >
                  <option value="all">📅 All Dates</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="this_week">This Week</option>
                  <option value="last_week">Last Week</option>
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="this_year">This Year</option>
                  <option value="custom">Custom Date Range...</option>
                </select>
              </div>

              {/* Status Filter Select */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '160px' }}>
                <Filter size={16} color="var(--text-secondary)" />
                <select
                  value={billStatusFilter}
                  onChange={(e) => setBillStatusFilter(e.target.value)}
                  className="input"
                  style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid</option>
                  <option value="PartiallyPaid">Partially Paid</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Returned">Returned</option>
                </select>
              </div>

              <Button
                variant="secondary"
                size="sm"
                icon={<RefreshCw size={14} />}
                onClick={loadInvoices}
                loading={listLoading}
              >
                Refresh
              </Button>
            </div>

            {/* Custom Date Range Picker Container */}
            {billDateFilter === 'custom' && (
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.2)', padding: '12px 16px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>From Date</label>
                    <input
                      type="date"
                      className="input"
                      value={listFromDate}
                      onChange={e => setListFromDate(e.target.value)}
                      style={{ padding: '6px 10px', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>To Date</label>
                    <input
                      type="date"
                      className="input"
                      value={listToDate}
                      onChange={e => setListToDate(e.target.value)}
                      style={{ padding: '6px 10px', fontSize: '13px' }}
                    />
                  </div>
                  {(listFromDate || listToDate) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setListFromDate(''); setListToDate(''); }}
                      style={{ marginTop: '18px', color: 'var(--accent-danger)' }}
                    >
                      Clear Custom Range
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {listError && <div style={{ color: 'var(--accent-danger)', padding: '16px' }}>{listError}</div>}
          {listLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <RefreshCw size={24} className="spin" style={{ animation: 'spin 1.5s linear infinite' }} />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              No bills found matching your search query or date filters.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-primary)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px' }}>Invoice ID</th>
                    <th style={{ padding: '12px 16px' }}>Patient</th>
                    <th style={{ padding: '12px 16px' }}>Doctor</th>
                    <th style={{ padding: '12px 16px' }}>Total Bill</th>
                    <th style={{ padding: '12px 16px' }}>Paid (Advance)</th>
                    <th style={{ padding: '12px 16px' }}>Balance Due</th>
                    <th style={{ padding: '12px 16px' }}>Date</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv) => {
                    const totalAmt = parseFloat(inv.total_amount || 0);
                    const paidAmt = parseFloat(inv.amount_paid || 0);
                    const dueAmt = inv.due_amount !== undefined && inv.due_amount !== null ? parseFloat(inv.due_amount) : Math.max(0, totalAmt - paidAmt);

                    return (
                      <tr key={inv.invoice_id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px', fontFamily: 'monospace' }}>
                          {inv.invoice_id.substring(0, 8).toUpperCase()}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                          <div>{inv.patient_name}</div>
                          {(inv.patient_phone || inv.patient_mrn) && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {inv.patient_phone ? `📱 ${inv.patient_phone}` : ''} {inv.patient_mrn ? `| MRN: ${inv.patient_mrn}` : ''}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {inv.doctor_name || 'Hospital Doctor'}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 700 }}>{formatCurrency(totalAmt)}</td>
                        <td style={{ padding: '12px 16px', color: '#16a34a', fontWeight: 600 }}>{formatCurrency(paidAmt)}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: dueAmt > 0 ? '#d97706' : '#16a34a' }}>
                          {formatCurrency(dueAmt)}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                          {new Date(inv.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ 
                            fontSize: '11px', padding: '3px 9px', borderRadius: '50px', fontWeight: 700,
                            background: inv.status === 'Paid' ? 'rgba(34,197,94,0.15)' : 
                                        inv.status === 'PartiallyPaid' ? 'rgba(245,158,11,0.15)' : 
                                        inv.status === 'Cancelled' ? 'rgba(100,116,139,0.15)' : 
                                        inv.status === 'Returned' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                            color: inv.status === 'Paid' ? '#16a34a' : 
                                   inv.status === 'PartiallyPaid' ? '#d97706' : 
                                   inv.status === 'Cancelled' ? 'var(--text-muted)' : 
                                   inv.status === 'Returned' ? '#d97706' : '#dc2626',
                            border: `1px solid ${inv.status === 'Paid' ? 'rgba(34,197,94,0.3)' : inv.status === 'PartiallyPaid' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`
                          }}>
                            {inv.status === 'PartiallyPaid' ? 'Partially Paid / Due' : inv.status}
                          </span>
                        </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
                          <button 
                            onClick={() => handleViewInvoiceDetails(inv.invoice_id)} 
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}
                            title="View Full Details & Installment History Log"
                          >
                            <FileText size={13} /> Details
                          </button>

                          <button 
                            onClick={() => handlePrintBill(inv.invoice_id)} 
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                            title="Print Invoice Receipt"
                          >
                            <Printer size={13} /> Print
                          </button>

                          {(dueAmt > 0 || inv.status === 'PartiallyPaid' || inv.status === 'Unpaid') && inv.status !== 'Cancelled' && inv.status !== 'Returned' && (
                            <button 
                              onClick={() => handleOpenCollectModal(inv)} 
                              style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#16a34a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '4px 8px', borderRadius: '6px', fontWeight: 700, border: '1px solid rgba(34, 197, 94, 0.3)' }}
                              title="Collect Remaining Due Balance"
                            >
                              <DollarSign size={13} /> Collect Due
                            </button>
                          )}

                          {inv.status === 'Paid' && (inv.payment_method === 'Cash' || !inv.payment_method) && (
                            <button 
                              onClick={() => handleUpdateStatus(inv.invoice_id, 'Unpaid')} 
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                              title="Mark Unpaid"
                            >
                              <XCircle size={13} /> Mark Unpaid
                            </button>
                          )}
                          {inv.status !== 'Paid' && inv.status !== 'Cancelled' && inv.status !== 'Returned' && (
                            <button 
                              onClick={() => handleCancelInvoice(inv.invoice_id)} 
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                              title="Cancel Bill"
                            >
                              <Ban size={13} /> Cancel
                            </button>
                          )}
                          {inv.status === 'Paid' && (
                            <button 
                              onClick={() => handleReturnInvoice(inv.invoice_id)} 
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--accent-warning)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                              title="Return / Refund Bill"
                            >
                              <ArrowLeftRight size={13} /> Return
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Quick Patient Registration Modal */}
      {patientModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '24px', position: 'relative' }}>
            <button onClick={() => setPatientModalOpen(false)} style={{ position: 'absolute', right: '16px', top: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={20} color="var(--accent-primary)" /> Create New Patient Record
            </h2>
            {regError && <div style={{ color: 'var(--accent-danger)', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>{regError}</div>}
            <form onSubmit={handleQuickPatientSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Patient Category Adult/Child Selector */}
                <div style={{ background: 'var(--bg-primary)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-primary)' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                    Patient Category *
                  </label>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 600 }}>
                      <input
                        type="radio"
                        name="quickPatientCategory"
                        value="Adult"
                        checked={regForm.patientCategory !== 'Child'}
                        onChange={() => setRegForm({ ...regForm, patientCategory: 'Adult' })}
                      />
                      👨‍💼 Adult (≥ 10 Yrs)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 600 }}>
                      <input
                        type="radio"
                        name="quickPatientCategory"
                        value="Child"
                        checked={regForm.patientCategory === 'Child'}
                        onChange={() => setRegForm({ ...regForm, patientCategory: 'Child' })}
                      />
                      👶 Child (&lt; 10 Yrs)
                    </label>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>First Name *</label>
                    <input type="text" className="input" value={regForm.firstName} onChange={e => setRegForm({ ...regForm, firstName: e.target.value })} required placeholder="First Name" style={{ width: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Last Name *</label>
                    <input type="text" className="input" value={regForm.lastName} onChange={e => setRegForm({ ...regForm, lastName: e.target.value })} required placeholder="Last Name" style={{ width: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                </div>

                {regForm.patientCategory === 'Child' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Age (Years)</label>
                      <input type="number" min="0" max="9" className="input" value={regForm.age} onChange={e => setRegForm({ ...regForm, age: e.target.value })} placeholder="e.g. 4" style={{ width: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Age (Months) *</label>
                      <input type="number" min="0" max="11" className="input" value={regForm.ageMonths} onChange={e => setRegForm({ ...regForm, ageMonths: e.target.value })} required placeholder="e.g. 6" style={{ width: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Gender *</label>
                      <select className="select" value={regForm.gender} onChange={e => setRegForm({ ...regForm, gender: e.target.value })} required style={{ width: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Age (Years) *</label>
                      <input type="number" min="10" max="120" className="input" value={regForm.age} onChange={e => setRegForm({ ...regForm, age: e.target.value })} required placeholder="e.g. 35" style={{ width: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Gender *</label>
                      <select className="select" value={regForm.gender} onChange={e => setRegForm({ ...regForm, gender: e.target.value })} required style={{ width: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Phone Number</label>
                    <input type="text" className="input" value={regForm.phone} onChange={e => setRegForm({ ...regForm, phone: e.target.value })} placeholder="Mobile Number" style={{ width: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Blood Group</label>
                    <select className="select" value={regForm.bloodGroup} onChange={e => setRegForm({ ...regForm, bloodGroup: e.target.value })} style={{ width: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                      <option value="">Select</option>
                      {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Patient Referred By</label>
                    <input type="text" className="input" value={regForm.referredBy} onChange={e => setRegForm({ ...regForm, referredBy: e.target.value })} placeholder="Doctor / Clinic / Source" style={{ width: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Address</label>
                    <input type="text" className="input" value={regForm.address} onChange={e => setRegForm({ ...regForm, address: e.target.value })} placeholder="City, Locality" style={{ width: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px', borderTop: '1px solid var(--border-primary)', paddingTop: '16px' }}>
                  <Button variant="secondary" type="button" onClick={() => setPatientModalOpen(false)}>Cancel</Button>
                  <Button variant="primary" type="submit" loading={regLoading}>Register & Select Patient</Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Remaining Bill Modal */}
      {collectModalOpen && selectedCollectInvoice && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '12px', width: '100%', maxWidth: '520px', padding: '24px', position: 'relative' }}>
            <button onClick={() => setCollectModalOpen(false)} style={{ position: 'absolute', right: '16px', top: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={20} color="var(--accent-success)" /> Collect Remaining Bill / Due Settlement
            </h2>

            {/* Invoice Summary Card */}
            <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Invoice ID:</span> <strong>{selectedCollectInvoice.invoice_id?.substring(0, 8).toUpperCase()}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Patient Name:</span> <strong>{selectedCollectInvoice.patient_name}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Total Bill Amount:</span> <strong>{formatCurrency(selectedCollectInvoice.totalAmt)}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Previously Paid:</span> <strong style={{ color: '#16a34a' }}>{formatCurrency(selectedCollectInvoice.paidAmt)}</strong></div>
              <div style={{ gridColumn: 'span 2', background: 'rgba(245, 158, 11, 0.12)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: '#d97706' }}>Current Balance Due:</span>
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#d97706' }}>{formatCurrency(selectedCollectInvoice.currentDue)}</span>
              </div>
            </div>

            <form onSubmit={handleCollectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Amount Being Paid Now (Rs.) *
                </label>
                <Input 
                  type="number"
                  step="0.01"
                  required
                  value={collectAmount}
                  onChange={e => setCollectAmount(e.target.value)}
                  placeholder={`Enter amount (Max: Rs. ${selectedCollectInvoice.currentDue.toFixed(2)})`}
                  style={{ background: 'var(--bg-primary)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                    Payment Method *
                  </label>
                  <Select 
                    value={collectMethod}
                    onChange={e => setCollectMethod(e.target.value)}
                    options={[
                      { value: 'Cash', label: 'Cash' },
                      { value: 'UPI', label: 'UPI / QR Code' },
                      { value: 'Card', label: 'Credit / Debit Card' },
                      { value: 'Bank Transfer', label: 'Bank Transfer / NEFT' },
                      { value: 'Insurance', label: 'Insurance' }
                    ]}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                    Payment Date & Time
                  </label>
                  <input 
                    type="datetime-local"
                    className="input"
                    value={collectDate}
                    onChange={e => setCollectDate(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Transaction Ref / Notes (Optional)
                </label>
                <Input 
                  placeholder="e.g. UPI Ref ID 987654321 / Card Approval Code"
                  value={collectRef}
                  onChange={e => setCollectRef(e.target.value)}
                  style={{ background: 'var(--bg-primary)' }}
                />
              </div>

              {/* Dynamic Calculation Banner */}
              {(() => {
                const numCollect = parseFloat(collectAmount) || 0;
                const remDue = Math.max(0, selectedCollectInvoice.currentDue - numCollect);
                const isSettled = remDue === 0;

                return (
                  <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Remaining Due After Collection</div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: isSettled ? '#16a34a' : '#d97706', marginTop: '2px' }}>
                        {formatCurrency(remDue)}
                      </div>
                    </div>
                    <div style={{ padding: '6px 12px', borderRadius: '50px', fontSize: '12px', fontWeight: 700, background: isSettled ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: isSettled ? '#16a34a' : '#d97706' }}>
                      {isSettled ? '✅ Full Settlement (Paid)' : '⚠️ Partially Paid / Due'}
                    </div>
                  </div>
                );
              })()}

              {collectError && (
                <div style={{ color: '#dc2626', background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                  {collectError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <Button type="button" variant="secondary" onClick={() => setCollectModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" loading={collectLoading}>Collect Payment & Print Receipt</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Invoice Details & Transaction Log Modal */}
      {viewInvoiceModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '12px', width: '100%', maxWidth: '750px', maxHeight: '85vh', overflowY: 'auto', padding: '24px', position: 'relative' }}>
            <button onClick={() => setViewInvoiceModalOpen(false)} style={{ position: 'absolute', right: '16px', top: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <X size={20} />
            </button>

            {viewInvoiceLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <RefreshCw size={24} className="spin" style={{ animation: 'spin 1.5s linear infinite' }} />
              </div>
            ) : viewInvoiceData ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={20} color="var(--accent-primary)" /> Invoice Details & Payment History
                  </h2>
                  <Button size="sm" variant="secondary" icon={<Printer size={14} />} onClick={() => handlePrintBill(viewInvoiceData.invoice_id)}>
                    Print Invoice
                  </Button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'var(--bg-primary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-primary)', marginBottom: '16px', fontSize: '13px' }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>Invoice ID:</span> <strong>{viewInvoiceData.invoice_id?.substring(0, 8).toUpperCase()}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Patient Name:</span> <strong>{viewInvoiceData.patient_name}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Phone / MRN:</span> <strong>{viewInvoiceData.phone || viewInvoiceData.patient_phone || '-'}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Date:</span> <strong>{new Date(viewInvoiceData.created_at).toLocaleString()}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Total Amount:</span> <strong>{formatCurrency(parseFloat(viewInvoiceData.total_amount))}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Total Paid:</span> <strong style={{ color: '#16a34a' }}>{formatCurrency(parseFloat(viewInvoiceData.amount_paid))}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Balance Due:</span> <strong style={{ color: parseFloat(viewInvoiceData.due_amount) > 0 ? '#d97706' : '#16a34a' }}>{formatCurrency(parseFloat(viewInvoiceData.due_amount || 0))}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Status:</span> <strong style={{ color: viewInvoiceData.status === 'Paid' ? '#16a34a' : viewInvoiceData.status === 'PartiallyPaid' ? '#d97706' : '#dc2626' }}>{viewInvoiceData.status}</strong></div>
                </div>

                {/* Billed Items Table */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    📦 Billed Services / Tests ({viewInvoiceData.items?.length || 0} Items)
                  </h3>
                  <div className="table-responsive" style={{ border: '1px solid var(--border-primary)', borderRadius: '8px' }}>
                    <table className="table" style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-primary)', textAlign: 'left' }}>
                          <th style={{ padding: '8px 10px' }}>Item Description</th>
                          <th style={{ padding: '8px 10px' }}>Category</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right' }}>Qty</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right' }}>Price</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewInvoiceData.items?.map((item: any, idx: number) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                            <td style={{ padding: '8px 10px', fontWeight: 600 }}>{item.description}</td>
                            <td style={{ padding: '8px 10px' }}>{item.category}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'right' }}>{item.quantity}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'right' }}>{formatCurrency(parseFloat(item.unit_price))}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(item.quantity * parseFloat(item.unit_price))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Payment History Log Table */}
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📜 Payment & Installment Audit Log ({viewInvoiceData.payment_logs?.length || 0} Transactions)
                  </h3>
                  {viewInvoiceData.payment_logs && viewInvoiceData.payment_logs.length > 0 ? (
                    <div className="table-responsive" style={{ border: '1px solid var(--border-primary)', borderRadius: '8px' }}>
                      <table className="table" style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-primary)', textAlign: 'left' }}>
                            <th style={{ padding: '8px 10px' }}>Txn #</th>
                            <th style={{ padding: '8px 10px' }}>Date & Time</th>
                            <th style={{ padding: '8px 10px' }}>Type</th>
                            <th style={{ padding: '8px 10px' }}>Mode</th>
                            <th style={{ padding: '8px 10px' }}>Ref / Notes</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Amount Paid</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Remaining Due</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewInvoiceData.payment_logs.map((log: any, idx: number) => (
                            <tr key={log.payment_id || idx} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                              <td style={{ padding: '8px 10px', fontWeight: 600 }}>Txn #{idx + 1}</td>
                              <td style={{ padding: '8px 10px' }}>{new Date(log.payment_timestamp || log.created_at).toLocaleString()}</td>
                              <td style={{ padding: '8px 10px', fontWeight: 600 }}>{log.payment_type}</td>
                              <td style={{ padding: '8px 10px' }}>{log.payment_mode}</td>
                              <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{log.transaction_ref || '-'}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>{formatCurrency(parseFloat(log.amount_paid))}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: parseFloat(log.remaining_due_after_txn) > 0 ? '#d97706' : '#16a34a' }}>{formatCurrency(parseFloat(log.remaining_due_after_txn))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                      No separate payment installment logs recorded yet.
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceGenerator;
