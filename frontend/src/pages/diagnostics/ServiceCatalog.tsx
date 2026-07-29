import React, { useState, useEffect } from 'react';
import { Beaker, Layers, Plus, Edit, Trash2, X, RefreshCw, Info, CheckCircle, Printer, Search, List, Eye } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import api from '../../api/client';
import { getHospitalLogoHtml, getQrCodeHeaderSyncHtml } from '../../utils/logoHelper';
import { resolvePatientReferenceRange } from '../../utils/referenceRangeResolver';

export const ServiceCatalog: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'services' | 'packages' | 'reports'>('services');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Bulk Import States
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importLoading, setImportLoading] = useState(false);

  // Completed Test Reports States
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [reportSearch, setReportSearch] = useState('');
  const [hospitalSettings, setHospitalSettings] = useState<any>(null);
  const [printMode, setPrintMode] = useState<'plain' | 'letterhead'>('plain');

  // Service Modal States
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [paramViewModalOpen, setParamViewModalOpen] = useState(false);
  const [selectedParamService, setSelectedParamService] = useState<any | null>(null);

  const [serviceForm, setServiceForm] = useState<{
    name: string;
    categoryId: string;
    serviceCode: string;
    price: string;
    gstPercentage: string;
    durationMinutes: string;
    sampleRequired: string;
    normalRange: string;
    machineRequired: string;
    homeCollectionAvailable: boolean;
    emergencyAvailable: boolean;
    isActive: boolean;
    reportType: 'Structured' | 'Qualitative' | 'Descriptive';
    parameters: Array<{ 
      name: string; 
      unit: string; 
      referenceRange: string;
      inputType?: string;
      dropdownOptions?: string;
      minValue?: string;
      maxValue?: string;
      ageGroup?: string;
      gender?: string;
      refMinMale?: string;
      refMaxMale?: string;
      refMinFemale?: string;
      refMaxFemale?: string;
      refMinChild?: string;
      refMaxChild?: string;
      rowType?: 'parameter' | 'reference' | 'findings';
    }>;
    qualitativeInputType: string;
    qualitativeOptions: string;
    qualitativeNotes: string;
    techniqueTemplate: string;
    findingsTemplate: string;
    impressionTemplate: string;
  }>({
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
    isActive: true,
    reportType: 'Structured',
    parameters: [],
    qualitativeInputType: 'Dropdown',
    qualitativeOptions: 'Positive, Negative, Equivocal',
    qualitativeNotes: '',
    techniqueTemplate: '',
    findingsTemplate: '',
    impressionTemplate: ''
  });

  // Package Modal States
  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [packageSearch, setPackageSearch] = useState('');
  const [packageForm, setPackageForm] = useState({
    name: '',
    price: '',
    discount: '0',
    validityDays: '365',
    selectedServices: [] as string[]
  });

  const [packageQuickViewModalOpen, setPackageQuickViewModalOpen] = useState(false);
  const [selectedQuickViewPackage, setSelectedQuickViewPackage] = useState<any>(null);

  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const loadCatalogData = async () => {
    setLoading(true);
    setError('');
    try {
      const [catsRes, servsRes, pkgsRes, settingsRes, deptRes] = await Promise.all([
        api.get('/diagnostics/categories').catch(() => ({ data: { success: false } })),
        api.get('/diagnostics/services').catch(() => ({ data: { success: false } })),
        api.get('/diagnostics/packages').catch(() => ({ data: { success: false } })),
        api.get('/admin/hospital-settings/public').catch(() => ({ data: { success: false } })),
        api.get('/admin/departments').catch(() => api.get('/departments')).catch(() => ({ data: { data: [] } }))
      ]);

      const deptList = deptRes.data?.data || deptRes.data || [];
      
      // Filter ONLY "Diagnostic & Laboratory" Category Departments from /admin/departments
      const diagnosticDepts = deptList.filter((d: any) => {
        const cat = (d.categoryName || d.category_name || d.category || '').toLowerCase();
        const name = (d.departmentName || d.department_name || d.name || '').toLowerCase();
        return (
          cat === 'diagnostic & laboratory' ||
          cat.includes('diagnostic') ||
          cat.includes('lab') ||
          name.includes('pathology') ||
          name.includes('radiology') ||
          name.includes('microbiology') ||
          name.includes('biochemistry') ||
          name.includes('blood bank') ||
          name.includes('histopathology')
        );
      });

      const formattedDeptCategories = diagnosticDepts.map((d: any) => ({
        category_id: d.departmentId || d.department_id || `dept-${d.departmentName}`,
        name: d.departmentName || d.department_name || d.name,
        description: d.description || `${d.departmentName} Department`
      }));

      let existingCats = catsRes.data?.success ? (catsRes.data.data || []) : [];
      const catNames = new Set(formattedDeptCategories.map((c: any) => c.name.toLowerCase()));
      for (const ec of existingCats) {
        if (!catNames.has(ec.name.toLowerCase())) {
          formattedDeptCategories.push(ec);
        }
      }

      setCategories(formattedDeptCategories.length > 0 ? formattedDeptCategories : existingCats);

      if (servsRes.data?.success) {
        const freshServices = servsRes.data.data || [];
        setServices(freshServices);
        setSelectedParamService((prev: any) => {
          if (!prev) return null;
          const updated = freshServices.find((s: any) => s.service_id === prev.service_id);
          return updated || prev;
        });
      }
      if (pkgsRes.data?.success) setPackages(pkgsRes.data.data || []);
      if (settingsRes.data?.success) setHospitalSettings(settingsRes.data.data);
    } catch (err: any) {
      console.error('Failed to load diagnostics catalog:', err);
      setError('Unable to fetch services or health packages catalog.');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await api.get('/diagnostics/orders');
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load test orders for reports:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    loadCatalogData();
  }, []);

  useEffect(() => {
    if (activeTab === 'reports') {
      loadOrders();
    }
  }, [activeTab]);

  const openAddPackageModal = () => {
    setEditingPackageId(null);
    setPackageForm({
      name: '',
      price: '',
      discount: '0',
      validityDays: '365',
      selectedServices: []
    });
    setPackageSearch('');
    setModalError('');
    setPackageModalOpen(true);
  };

  const openEditPackageModal = (pkg: any) => {
    setEditingPackageId(pkg.package_id);
    setPackageForm({
      name: pkg.name || '',
      price: pkg.price ? pkg.price.toString() : '',
      discount: pkg.discount ? pkg.discount.toString() : '0',
      validityDays: pkg.validity_days ? pkg.validity_days.toString() : '365',
      selectedServices: (pkg.services || []).map((s: any) => s.service_id)
    });
    setPackageSearch('');
    setModalError('');
    setPackageModalOpen(true);
  };

  const handleDeletePackage = async (packageId: string) => {
    if (!window.confirm('Are you sure you want to delete this grouped profile / package?')) return;
    try {
      await api.delete(`/diagnostics/packages/${packageId}`);
      loadCatalogData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete package.');
    }
  };

  const handlePackageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (packageForm.selectedServices.length === 0) {
      setModalError('Select at least one test service to include in this profile / package.');
      return;
    }
    setModalLoading(true);
    setModalError('');

    const payload = {
      name: packageForm.name,
      price: parseFloat(packageForm.price),
      discount: parseFloat(packageForm.discount || '0'),
      validityDays: parseInt(packageForm.validityDays || '365'),
      services: packageForm.selectedServices
    };

    try {
      if (editingPackageId) {
        await api.put(`/diagnostics/packages/${editingPackageId}`, payload);
      } else {
        await api.post('/diagnostics/packages', payload);
      }
      setPackageModalOpen(false);
      loadCatalogData();
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to save profile package.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleServiceSelectToggle = (serviceId: string) => {
    const isSelected = packageForm.selectedServices.includes(serviceId);
    if (isSelected) {
      setPackageForm({
        ...packageForm,
        selectedServices: packageForm.selectedServices.filter(id => id !== serviceId)
      });
    } else {
      setPackageForm({
        ...packageForm,
        selectedServices: [...packageForm.selectedServices, serviceId]
      });
    }
  };

  const getCompletedReports = () => {
    const list: any[] = [];
    orders.forEach(o => {
      (o.items || []).forEach((item: any) => {
        if (item.status === 'Completed' || item.status === 'Verified') {
          list.push({
            ...item,
            patient_name: o.first_name || o.last_name ? `${o.first_name || ''} ${o.last_name || ''}`.trim() : (o.patient_name || 'Patient'),
            patient_mrn: o.medical_record_number || o.patient_mrn || '—',
            patient_gender: o.patient_gender || o.gender || 'Male',
            patient_birth_date: o.patient_birth_date || o.birth_date || o.date_of_birth,
            patient_age: o.patient_age !== undefined ? o.patient_age : o.age,
            patient_phone: o.patient_phone || o.phone,
            order_number: o.order_number,
            doctor_name: o.doc_first ? `Dr. ${o.doc_first} ${o.doc_last}` : (o.doctor_name || 'Dr. S Tarundas'),
            created_at: o.created_at,
            order: o
          });
        }
      });
    });
    return list;
  };

  const handlePrintReport = (item: any) => {
    const isLab = item.category_name === 'Laboratory';
    const hospitalName = hospitalSettings?.hospital_name || 'Manasa Hospital';
    const hospitalAddress = hospitalSettings?.hospital_address || 'Market Lane, Narsingi, Gandipet Mandal Rangareddy Dist - 500089.';
    const phoneNumber = hospitalSettings?.phone_number || 'Ph: 7386301348';
    const website = hospitalSettings?.website || 'www.manasahospital.co.in';
    const email = hospitalSettings?.email || 'info@manasahospital.org';
    const gstin = hospitalSettings?.gstin || '-';
    const licenseInfo = hospitalSettings?.license_info || 'PR-2026/8508';
    const logoUrl = hospitalSettings?.hospital_logo || null;

    const logoHtml = getHospitalLogoHtml(logoUrl, 70);
    const reportUrl = `${window.location.origin}/verify/reports/${item.item_id}`;
    const cleanId = (item.item_id || 'report').replace(/[^a-zA-Z0-9_-]/g, '_');
    const s3QrUrl = item.qr_code_url || `/uploads/qrcodes/qr_${cleanId}.png`;
    const qrCodeHeaderHtml = getQrCodeHeaderSyncHtml(reportUrl, s3QrUrl, 'VERIFY REPORT');

    const printWindow = window.open('', '_blank');
    if (printWindow) {

      const headerHtml = printMode === 'letterhead'
        ? `<table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
             <tr>
               <td style="height: 2.0in; vertical-align: top; text-align: right; padding-top: 10px; padding-right: 10px;">
                 ${qrCodeHeaderHtml}
               </td>
             </tr>
           </table>`
        : `<table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
             <tr>
               <td style="width: 75px; vertical-align: middle; padding: 0;">${logoHtml}</td>
               <td style="vertical-align: middle; padding-left: 15px; padding-right: 15px;">
                 <h1 class="hospital-name" style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; line-height: 1.1;">${hospitalName}</h1>
                 <p class="hospital-sub" style="font-size: 11px; color: #475569; margin: 1px 0;">${hospitalAddress}</p>
                 <p class="hospital-sub" style="font-size: 11px; color: #475569; margin: 1px 0;">Phone: ${phoneNumber} | Web: ${website} | Email: ${email}</p>
                 <p class="hospital-sub" style="font-size: 11px; color: #475569; margin: 1px 0;"><strong>GSTIN: ${gstin}</strong></p>
               </td>
               <td style="width: 85px; vertical-align: middle; text-align: right; padding: 0;">
                 ${qrCodeHeaderHtml}
               </td>
             </tr>
           </table>
           <div class="divider-thick" style="border-bottom: 2.5px solid #0f172a; margin: 8px 0 14px 0;"></div>`;

      const getAgeStr = (birthDateStr?: string, ageVal?: any): string => {
        if (ageVal !== undefined && ageVal !== null && ageVal !== '' && ageVal !== 0) {
          return `${ageVal} Years`;
        }
        if (!birthDateStr) return '—';
        const birth = new Date(birthDateStr);
        const today = new Date();
        if (isNaN(birth.getTime())) return '—';
        let years = today.getFullYear() - birth.getFullYear();
        let months = today.getMonth() - birth.getMonth();
        if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
          years--;
          months += 12;
        }
        if (years < 0) return '—';
        return `${years} Years`;
      };

      const ageStr = getAgeStr(item.patient_birth_date, item.patient_age || item.age);
      const dateObj = new Date(item.created_at);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const formattedDate = `${pad(dateObj.getDate())}-${pad(dateObj.getMonth() + 1)}-${dateObj.getFullYear()} ${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())} ${dateObj.getHours() >= 12 ? 'PM' : 'AM'}`;

      const parseConcatenatedResult = (actualResult: string) => {
        if (!actualResult || !actualResult.includes(':')) return null;
        try {
          const parts = actualResult.split(',');
          return parts.map(part => {
            const colonIdx = part.indexOf(':');
            if (colonIdx === -1) return null;
            const name = part.substring(0, colonIdx).trim();
            const remaining = part.substring(colonIdx + 1).trim();
            
            const spaceIdx = remaining.indexOf(' ');
            let value = remaining;
            let unit = '';
            if (spaceIdx !== -1) {
              value = remaining.substring(0, spaceIdx).trim();
              unit = remaining.substring(spaceIdx + 1).trim();
            }
            return { name, value, unit };
          }).filter(Boolean);
        } catch (e) {
          return null;
        }
      };

      const checkIsAbnormal = (valStr: string, rangeStr: string): boolean => {
        if (!valStr || !rangeStr || rangeStr === '—') return false;
        
        const valClean = valStr.trim();
        const rangeClean = rangeStr.replace(/\s+/g, ' ').trim();

        // Handle titer comparisons (e.g. 1:160 and <1:80)
        if (valClean.includes(':') && rangeClean.includes(':')) {
          const valParts = valClean.split(':');
          const valTiter = parseFloat(valParts[1]);
          if (!isNaN(valTiter)) {
            if (rangeClean.startsWith('<')) {
              const limitParts = rangeClean.substring(1).trim().split(':');
              const limitTiter = parseFloat(limitParts[1]);
              if (!isNaN(limitTiter)) {
                return valTiter >= limitTiter;
              }
            }
            if (rangeClean.startsWith('>')) {
              const limitParts = rangeClean.substring(1).trim().split(':');
              const limitTiter = parseFloat(limitParts[1]);
              if (!isNaN(limitTiter)) {
                return valTiter <= limitTiter;
              }
            }
          }
        }
        
        const val = parseFloat(valClean);
        if (isNaN(val)) return false;

        const cleanRange = rangeClean;

        try {
          if (cleanRange.includes('-')) {
            const parts = cleanRange.split('-');
            if (parts.length === 2) {
              const min = parseFloat(parts[0].trim());
              const max = parseFloat(parts[1].trim());
              if (!isNaN(min) && !isNaN(max)) {
                return val < min || val > max;
              }
            }
          }
          if (cleanRange.includes('–')) {
            const parts = cleanRange.split('–');
            if (parts.length === 2) {
              const min = parseFloat(parts[0].trim());
              const max = parseFloat(parts[1].trim());
              if (!isNaN(min) && !isNaN(max)) {
                return val < min || val > max;
              }
            }
          }
          if (cleanRange.startsWith('<')) {
            const limit = parseFloat(cleanRange.substring(1).trim());
            if (!isNaN(limit)) {
              return val >= limit;
            }
          }
          if (cleanRange.startsWith('>')) {
            const limit = parseFloat(cleanRange.substring(1).trim());
            if (!isNaN(limit)) {
              return val <= limit;
            }
          }
        } catch (e) {
          console.error(e);
        }
        return false;
      };

      const refRanges: { [key: string]: string } = {
        'HAEMOGLOBIN': '12.0 - 15.0 g/dL',
        'TOTAL RBC COUNT': '3.8 - 4.8 X 10¹²/L',
        'PCV / HCT': '36 - 46 %',
        'MCV': '83 - 101 fl',
        'MCH': '27 - 32 pg',
        'MCHC': '31.5 - 34.5 g/dl',
        'RDW': '11.5 - 13.5 %',
        'TOTAL WBC COUNT': '4.0-10.0 X 10³/uL',
        'PLATELET COUNT': '150 - 410 X 10³/uL',
        'NEUTROPHILS': '2.0-7.5 X 10³/uL (40 - 80%)',
        'LYMPHOCYTES': '1.0-4.0 X 10³/uL (20 - 40%)',
        'MONOCYTES': '0.2-1.0 X 10³/uL (2 - 10%)',
        'EOSINOPHILS': '0.02-0.5 X 10³/uL (1 - 6%)',
        'BASOPHILS': '0.02 - 0.1 X 10³/uL (1 - 2%)',
        'POLYMORPHS': '40 - 80 %',
        'RBC MORPHOLOGY': 'Normocytic Normochromic',
        'WBC ON SMEAR': 'Normal count & distribution',
        'PLATELETS ON SMEAR': 'Adequate',
        'COLOUR': 'PALE YELLOW',
        'APPEARANCE': 'CLEAR',
        'REACTION / PH': '4.6 - 8.0',
        'SPECIFIC GRAVITY': '1.003 - 1.035',
        'PROTEINS': 'NIL',
        'GLUCOSE': 'NIL',
        'BLOOD': 'NIL',
        'KETONE BODIES': 'Negative',
        'BILIRUBIN': 'Negative',
        'UROBILINOGEN': 'Present in normal amount',
        'NITRITE': 'Negative',
        'PUS CELLS': '0 - 5 /HPF',
        'EPITHELIAL CELLS': '0 - 8 /HPF',
        'RBC': 'Nil',
        'CASTS': 'Nil',
        'CRYSTALS': 'Nil',
        'OTHERS': 'Nil',
        'ABSOLUTE EOSINOPHIL COUNT': '40-440 cells/µL',
        'ACTIVATED PARTIAL THROMBOPLASTIN TIME': '25-35 sec',
        'CONTROL': 'Laboratory Control',
        'APTT RATIO': '0.8-1.2',
        'ALKALINE PHOSPHATASE': '44-147 U/L',
        'ERYTHROCYTE SEDIMENTATION RATE': '0-15 (Male)',
        'RANDOM BLOOD SUGAR': '70-140 mg/dL',
        'FASTING BLOOD SUGAR': '70-99 mg/dL',
        'POST LUNCH BLOOD SUGAR': '<140',
        'POST PRANDIAL BLOOD SUGAR': '<140',
        // 6 PDF manual tests
        'ANTI-TPO ANTIBODY': '<35',
        'ANTI THYROID PEROXIDASE ANTIBODY': '<35',
        'AMH': '1.0-4.0*',
        'ANTI-MÜLLERIAN HORMONE': '1.0-4.0*',
        'ASO TITRE': '<200',
        'ANTI-STREPTOLYSIN O TITRE': '<200',
        'BETA HCG': 'Interpret clinically',
        'BETA HUMAN CHORIONIC GONADOTROPIN': 'Interpret clinically',
        'BLEEDING TIME': '2-7',
        'CLOTTING TIME': '5-11',
        'ABO BLOOD GROUP': 'A/B/AB/O',
        'RH FACTOR': 'Positive/Negative',
        // 8 PDF batch 2 manual tests
        'C-REACTIVE PROTEIN': '<5',
        'CHIKUNGUNYA IGM': 'Negative',
        'CHIKUNGUNYA IGG': 'Negative',
        'D-DIMER': '<0.50',
        'DENGUE IGM': 'Negative',
        'DENGUE IGG': 'Negative',
        'NS1 ANTIGEN': 'Negative',
        'ESR': 'Male 0-15; Female 0-20',
        // 10 PDF batch 3 manual tests
        'EGFR': '>=90',
        'ESTIMATED GLOMERULAR FILTRATION RATE': '>=90',
        'FSH': 'Male:1.5-12.4; Female phase dependent',
        'FOLLICLE STIMULATING HORMONE': 'Male:1.5-12.4; Female phase dependent',
        'FREE TESTOSTERONE': 'Male:5-21',
        'FREE T3': '2.0-4.4',
        'FREE TRIIODOTHYRONINE': '2.0-4.4',
        'FREE T4': '0.8-1.8',
        'FREE THYROXINE': '0.8-1.8',
        'FASTING GLUCOSE': '70-99',
        '1 HOUR GLUCOSE': 'Lab specific',
        '2 HOUR GLUCOSE': '<140',
        'HBA1C': '4.0-5.6',
        'GLYCATED HEMOGLOBIN': '4.0-5.6',
        'HBSAG': 'Non-Reactive',
        'HEPATITIS B SURFACE ANTIGEN': 'Non-Reactive',
        'ANTI-HCV': 'Non-Reactive',
        'HEPATITIS C VIRUS TEST': 'Non-Reactive',
        'HDL CHOLESTEROL': 'Male >40; Female >50',
        // 8 PDF batch 4 manual tests
        'HIV I & II ANTIBODY': 'Non-Reactive',
        'HUMAN IMMUNODEFICIENCY VIRUS TEST': 'Non-Reactive',
        'TOTAL CHOLESTEROL': '<200',
        'TRIGLYCERIDES': '<150',
        'LDL CHOLESTEROL': '<100',
        'VLDL CHOLESTEROL': '5-40',
        'TC/HDL RATIO': '<5',
        'LUTEINIZING HORMONE': 'Male 1.7-8.6; Female phase dependent',
        'LH': 'Male 1.7-8.6; Female phase dependent',
        'PLASMODIUM VIVAX': 'Negative',
        'PLASMODIUM FALCIPARUM': 'Negative',
        'INDURATION AFTER 48-72 HRS': 'Interpret clinically',
        'MANTOUX TEST': 'Interpret clinically',
        'PROLACTIN': 'Male 4-15; Female 5-25',
        'TOTAL PSA': '0-4.0',
        'PROSTATE SPECIFIC ANTIGEN': '0-4.0',
        'PROTHROMBIN TIME': '11-13.5',
        'INR': '0.8-1.2',
        // 8 PDF batch 5 manual tests (Radiology & Lab)
        'LIVER': 'Normal',
        'GALL BLADDER': 'Normal',
        'PANCREAS': 'Normal',
        'SPLEEN': 'Normal',
        'KIDNEYS': 'Normal',
        'URINARY BLADDER': 'Normal',
        'PROSTATE/UTERUS & OVARIES': 'Normal',
        'LUNG FIELDS': 'Clear',
        'CARDIAC SILHOUETTE': 'Normal',
        'MEDIASTINUM': 'Normal',
        'PLEURA': 'No effusion',
        'BONES': 'No abnormality',
        'VITAMIN D3': '30-100',
        'VITAMIN B12': '200-900',
        'VDRL': 'Non-Reactive',
        'URINE HCG': 'Negative',
        'CULTURE': 'No Growth',
        'SENSITIVITY': 'As applicable',
        'URINE ALBUMIN': 'Negative',
        // 8 PDF batch 6 manual tests
        'TROPONIN-T': '<14',
        'TN-T': '<14',
        'TROPONIN-I': '<34 (Male), <16 (Female)',
        'TN-I': '<34 (Male), <16 (Female)',
        'TOTAL TESTOSTERONE': 'Male:300-1000',
        'TT': 'Male:300-1000',
        'TSH': '0.27-4.20',
        'THYROID STIMULATING HORMONE': '0.27-4.20',
        'TOTAL T3': '0.8-2.0',
        'TOTAL T4': '5.1-14.1',
        // 13 PDF batch 7 manual tests
        'PT': '11-13.5',
        'APTT': '25-35',
        'RHEUMATOID FACTOR': '<20',
        'RF': '<20',
        'SERUM AMYLASE': '30-110',
        'SERUM BILIRUBIN': '0.3-1.2',
        'SERUM CALCIUM': '8.5-10.5',
        'SERUM LIPASE': '13-60',
        'SERUM URIC ACID': 'Male 3.4-7.0',
        'OCCULT BLOOD': 'Negative',
        'PROFILE STATUS': 'All Included',
        // 4 PDF batch 8 serology manual tests
        'HIV 1 ANTIBODY': 'Non-Reactive',
        'HIV 2 ANTIBODY': 'Non-Reactive',
        'RPR': 'Non-Reactive',
        'HBA': '95-98',
        'HBA2': '2.0-3.5',
        'HBF': '<1.0',
        'HBS': 'Absent',
        'HBD/HBE/OTHER VARIANTS': 'Absent',
        'RUBELLA IGG ANTIBODY': '>=10 Immune',
        'RUBELLA IGG': '>=10 Immune',
        // RFT parameters
        'BLOOD UREA': '15–40',
        'BLOOD UREA NITROGEN': '7–20',
        'SERUM CREATININE': '0.7–1.3',
        'BUN': '7–20',
        'URIC ACID': '3.4–7.0',
        'SODIUM': '135–145',
        'POTASSIUM': '3.5–5.1',
        'CHLORIDE': '98–107',
        'BICARBONATE': '22–29',
        'CALCIUM': '8.5–10.5',
        'PHOSPHORUS': '2.5–4.5',
        // LFT parameters
        'TOTAL BILIRUBIN': '0.3–1.2',
        'DIRECT BILIRUBIN': '0.0–0.3',
        'INDIRECT BILIRUBIN': '0.2–0.9',
        'AST (SGOT)': '10–40',
        'ALT (SGPT)': '7–56',
        'ALP': '44–147',
        'TOTAL PROTEIN': '6.4–8.3',
        'ALBUMIN': '3.5–5.2',
        'GLOBULIN': '2.0–3.5',
        'A/G RATIO': '1.0–2.2'
      };

      const lr = item.lab_result || {};
      let finalParameters = item.result_parameters || [];
      if (isLab && (!finalParameters || finalParameters.length === 0) && lr.actual_result) {
        const parsed = parseConcatenatedResult(lr.actual_result);
        if (parsed) {
          finalParameters = parsed.map((p: any, idx: number) => ({
            parameter_id: `parsed-${idx}`,
            parameter_name: p.name,
            actual_value: p.value,
            unit: p.unit,
            reference_range: refRanges[p.name.toUpperCase()] || '',
            status: 'Normal'
          }));
        }
      }

      // Determine department title for ALL test categories
      const getDeptTitle = () => {
        const catName = (item.category_name || '').toUpperCase();
        const svcName = (item.service_name || '').toUpperCase();
        if (catName === 'LABORATORY') {
          if (svcName.includes('BLOOD') || svcName.includes('HEM') || svcName.includes('CBC') || svcName.includes('CBP')) return 'HAEMATOLOGY';
          if (svcName.includes('URINE') || svcName.includes('CUE')) return 'CLINICAL PATHOLOGY';
          return 'CLINICAL BIOCHEMISTRY';
        }
        if (catName.includes('RADIOLOGY')) return 'RADIOLOGY DEPARTMENT';
        if (catName.includes('ULTRASOUND')) return 'ULTRASOUND / SONOGRAPHY DEPARTMENT';
        if (catName.includes('CARDIOLOGY')) return 'CARDIOLOGY DEPARTMENT';
        if (catName.includes('NEUROLOGY')) return 'NEUROLOGY DEPARTMENT';
        return catName || 'DIAGNOSTICS DEPARTMENT';
      };
      const deptTitle = getDeptTitle();

      const verifiedBy = item.verification?.verified_by_name || 'Dr. Priya Nair (Pathologist) M.D.';
      const verifiedDate = item.verification?.verified_at 
        ? new Date(item.verification.verified_at).toLocaleDateString() + ' ' + new Date(item.verification.verified_at).toLocaleTimeString()
        : formattedDate;

      const patientCardHtml = `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 11px; border-bottom: 2px solid #0f172a; padding-bottom: 6px;">
          <tbody>
            <tr>
              <td style="padding: 3px 0; font-weight: 600; color: #475569; width: 15%;">Patient Name:</td>
              <td style="padding: 3px 0; font-weight: 700; width: 35%; text-transform: uppercase;">${item.patient_name}</td>
              <td style="padding: 3px 0; font-weight: 600; color: #475569; width: 15%;">Ref. Doctor:</td>
              <td style="padding: 3px 0; font-weight: 700; width: 35%; text-transform: uppercase;">${item.doctor_name || 'Dr S Tarundas'}</td>
            </tr>
            <tr>
              <td style="padding: 3px 0; font-weight: 600; color: #475569;">Patient Id:</td>
              <td style="padding: 3px 0; font-weight: 700;">${item.patient_mrn}</td>
              <td style="padding: 3px 0; font-weight: 600; color: #475569;">Lab Id:</td>
              <td style="padding: 3px 0; font-weight: 700;">${item.item_id.substring(0, 8).toUpperCase()}</td>
            </tr>
            <tr>
              <td style="padding: 3px 0; font-weight: 600; color: #475569;">OP Id:</td>
              <td style="padding: 3px 0; font-weight: 700;">${item.order_number || 'HY-SVN-1225-00080'}</td>
              <td style="padding: 3px 0; font-weight: 600; color: #475569;">Sample Collection Date:</td>
              <td style="padding: 3px 0; font-weight: 700;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 3px 0; font-weight: 600; color: #475569;">Age/Gender:</td>
              <td style="padding: 3px 0; font-weight: 700;">${ageStr} / ${(item.patient_gender || item.gender || 'Male').toUpperCase()}</td>
              <td style="padding: 3px 0; font-weight: 600; color: #475569;">Reporting Date & time:</td>
              <td style="padding: 3px 0; font-weight: 700;">${verifiedDate}</td>
            </tr>
          </tbody>
        </table>
      `;

      const signatureHtml = `
        <div class="footer-signature" style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 25px; font-size: 11px; page-break-inside: avoid; break-inside: avoid;">
          <div>
            <p style="margin: 0; color: #475569; font-style: italic;">Please correlate clinically</p>
            <p style="margin: 4px 0 0 0; color: #475569;">Test Performed By : <strong style="color: #0f172a;">${item.order?.items?.[0]?.entered_by_name || 'clsowmya'}</strong></p>
          </div>
          <div style="text-align: right; width: 220px;">
            <div style="font-family: 'Georgia', cursive; font-style: italic; color: #1e3a8a; font-size: 16px; font-weight: 700; margin-bottom: 2px;">
              ${verifiedBy.includes('Priya') ? 'Dr Priya Nair' : 'Dr Vidya Kedari'}
            </div>
            <div style="border-top: 1px dashed #94a3b8; padding-top: 4px; font-weight: 700; color: #0f172a;">
              ${verifiedBy}
            </div>
            <div style="font-size: 10px; color: #64748b;">
              Consultant Pathologist
            </div>
          </div>
        </div>
        <div style="text-align: center; font-size: 10px; color: #64748b; margin-top: 15px; font-weight: bold; letter-spacing: 2px; page-break-inside: avoid; break-inside: avoid;">
          *** END OF REPORT ***
        </div>
      `;

      let pagesContentHtml = '';
      if (isLab) {
        const targetItems = item.package_id
          ? (item.order?.items || []).filter((i: any) => i.package_id === item.package_id)
          : [item];

        pagesContentHtml = targetItems.map((tItem: any, pIdx: number) => {
          const tLr = tItem.lab_result || {};
          let tParams = tItem.result_parameters || [];
          if ((!tParams || tParams.length === 0) && tLr.actual_result) {
            const parsed = parseConcatenatedResult(tLr.actual_result);
            if (parsed) {
              tParams = parsed.map((p: any, idx: number) => ({
                parameter_id: `parsed-${idx}`,
                parameter_name: p.name,
                actual_value: p.value,
                unit: p.unit,
                reference_range: refRanges[p.name.toUpperCase()] || '',
                status: 'Normal'
              }));
            }
          }

          let paramRows = '';
          if (tParams && tParams.length > 0) {
            paramRows = tParams.map((rp: any) => {
              const name = rp.parameter_name || rp.name || '';
              const isHeader = name.toUpperCase() === 'DIFFERENTIAL LEUKOCYTE COUNT' || name.toUpperCase() === 'PHYSICAL EXAMINATION' || name.toUpperCase() === 'CHEMICAL EXAMINATION' || name.toUpperCase() === 'MICROSCOPIC EXAMINATION' || name.toUpperCase() === 'PERIPHERAL SMEAR';

              if (isHeader) {
                return `
                  <tr style="background: #f8fafc; page-break-inside: avoid; break-inside: avoid;">
                    <td colspan="4" style="padding: 6px 0; font-weight: 800; font-size: 11px; text-transform: uppercase; color: #1e3a8a; border-bottom: 1px solid #e2e8f0;">
                      ${name}
                    </td>
                  </tr>
                `;
              }

              const paramDef = (tItem.parameters || []).find((p: any) =>
                (p.parameter_id && (p.parameter_id === rp.parameter_id || p.parameter_id === rp.parameterId)) ||
                (p.name && p.name.trim().toLowerCase() === (rp.parameter_name || rp.name || name || '').trim().toLowerCase())
              );
              const refVal = resolvePatientReferenceRange(paramDef || rp, item.order || item || tItem);
              const isAbnormal = (rp.status && rp.status !== 'Normal') || checkIsAbnormal(rp.actual_value || rp.actualValue || '', refVal);
              const flagText = rp.status && rp.status !== 'Normal' ? `${rp.status} / ` : (isAbnormal ? 'Abnormal / ' : '');
              const displayVal = rp.actual_value || rp.actualValue || '—';

              return `
                <tr style="border-bottom: 1px solid #f1f5f9; page-break-inside: avoid; break-inside: avoid;">
                  <td style="padding: 5px 0; font-weight: 500; color: #334155;">${name}</td>
                  <td style="padding: 5px 0; text-align: center; font-size: 12px; font-weight: ${isAbnormal ? '700' : '400'}; color: ${isAbnormal ? '#ef4444' : '#0f172a'};">${displayVal}</td>
                  <td style="padding: 5px 0; text-align: center; color: #475569; font-family: monospace; font-size: 10px;">${refVal}</td>
                  <td style="padding: 5px 0; text-align: right; color: ${isAbnormal ? '#ef4444' : '#64748b'}; font-weight: ${isAbnormal ? '700' : '400'};">${flagText}${rp.unit || '—'}</td>
                </tr>
              `;
            }).join('');
          } else {
            const refVal = tLr.reference_range || tItem.normal_range || '—';
            const isAbnormal = tLr.status && tLr.status !== 'Normal';
            const flagText = isAbnormal ? `${tLr.status} / ` : '';
            const displayVal = tLr.actual_result || '—';

            paramRows = `
              <tr style="border-bottom: 1px solid #f1f5f9; page-break-inside: avoid; break-inside: avoid;">
                <td style="padding: 6px 0; font-weight: 700; color: #334155;">${tItem.service_name}</td>
                <td style="padding: 6px 0; text-align: center; font-size: 12px; font-weight: ${isAbnormal ? '700' : '400'}; color: ${isAbnormal ? '#ef4444' : '#0f172a'};">${displayVal}</td>
                <td style="padding: 6px 0; text-align: center; color: #475569; font-family: monospace; font-size: 10px;">${refVal}</td>
                <td style="padding: 6px 0; text-align: right; color: ${isAbnormal ? '#ef4444' : '#64748b'}; font-weight: ${isAbnormal ? '700' : '400'};">${flagText}—</td>
              </tr>
            `;
          }

          const pageBreakStyle = pIdx < targetItems.length - 1 ? 'page-break-after: always; break-after: page;' : '';

          return `
            <div class="report-single-page" style="${pageBreakStyle} padding-bottom: 10px;">
              <table class="report-layout-table" style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
                <thead>
                  <tr>
                    <td style="padding: 0; border: none;">
                      ${headerHtml}
                      ${patientCardHtml}
                    </td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="padding: 0; border: none;">
                      <div style="text-align: center; margin-top: 8px; margin-bottom: 12px;">
                        <h2 style="font-size: 14px; font-weight: 800; letter-spacing: 1px; margin: 0; color: #0f172a; text-transform: uppercase;">
                          ${deptTitle}
                        </h2>
                        <h3 style="font-size: 12px; font-weight: 700; text-decoration: underline; margin: 4px 0 0 0; text-transform: uppercase; color: #1e3a8a; letter-spacing: 0.5px;">
                          ${item.package_name ? `${item.package_name} — ` : ''}${tItem.service_name} (${tItem.service_code || 'TEST'})
                        </h3>
                      </div>

                      <div style="width: 100%; margin-bottom: 15px;">
                        <table style="width: 100%; border-collapse: collapse; margin-top: 4px; margin-bottom: 8px; font-size: 11px;">
                          <thead>
                            <tr style="border-bottom: 1.5px solid #0f172a; border-top: 1.5px solid #0f172a; text-align: left; font-size: 10px; color: #475569;">
                              <th style="padding: 6px 0; font-weight: 700; width: 35%; text-transform: uppercase;">Test Parameter</th>
                              <th style="padding: 6px 0; font-weight: 700; width: 20%; text-align: center; text-transform: uppercase;">Observed Value</th>
                              <th style="padding: 6px 0; font-weight: 700; width: 25%; text-align: center; text-transform: uppercase;">Reference Range</th>
                              <th style="padding: 6px 0; font-weight: 700; width: 20%; text-align: right; text-transform: uppercase;">Flag / Unit</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${paramRows}
                          </tbody>
                        </table>
                      </div>

                      ${signatureHtml}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          `;
        }).join('');
      } else {
        const findings = item.radiology_report?.findings || item.ultrasound_report?.findings || item.ecg_report?.findings || '—';
        const impression = item.radiology_report?.impression || item.ultrasound_report?.impression || item.ecg_report?.interpretation || '—';
        const conclusion = item.radiology_report?.conclusion || item.ultrasound_report?.recommendations || item.ecg_report?.recommendation || '';

        pagesContentHtml = `
          <div class="report-single-page" style="padding-bottom: 10px;">
            <table class="report-layout-table" style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
              <thead>
                <tr>
                  <td style="padding: 0; border: none;">
                    ${headerHtml}
                    ${patientCardHtml}
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 0; border: none;">
                    <div style="text-align: center; margin-top: 8px; margin-bottom: 12px;">
                      <h2 style="font-size: 14px; font-weight: 800; letter-spacing: 1px; margin: 0; color: #0f172a; text-transform: uppercase;">
                        ${deptTitle}
                      </h2>
                      <h3 style="font-size: 12px; font-weight: 700; text-decoration: underline; margin: 4px 0 0 0; text-transform: uppercase; color: #1e3a8a; letter-spacing: 0.5px;">
                        ${item.service_name}
                      </h3>
                    </div>

                    <div style="margin-top: 15px; display: flex; flex-direction: column; gap: 15px; font-size: 13px;">
                      <div>
                        <h4 style="margin: 0 0 6px 0; color: #475569; text-transform: uppercase; font-size: 12px;">Dictated Findings</h4>
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; white-space: pre-wrap; font-family: monospace;">${findings}</div>
                      </div>
                      <div>
                        <h4 style="margin: 0 0 4px 0; color: #475569; text-transform: uppercase; font-size: 12px;">Diagnostic Impression</h4>
                        <p style="margin: 0; font-weight: 700; color: #0f172a;">${impression}</p>
                      </div>
                      ${conclusion ? `
                        <div>
                          <h4 style="margin: 0 0 4px 0; color: #475569; text-transform: uppercase; font-size: 12px;">Conclusion / Recommendations</h4>
                          <p style="margin: 0; color: #334155;">${conclusion}</p>
                        </div>
                      ` : ''}
                      <div style="border-top: 1px solid #e2e8f0; padding-top: 10px;">
                        <h4 style="margin: 0 0 6px 0; color: #475569; text-transform: uppercase; font-size: 12px; font-weight: 700;">Interpretation</h4>
                        <p style="margin: 0; font-size: 12px; color: #334155; white-space: pre-wrap;">${impression !== '—' ? impression : 'Please correlate clinically.'}</p>
                      </div>
                    </div>

                    ${signatureHtml}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        `;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>DIAGNOSTIC REPORT - ${item.patient_name}</title>
            <style>
              @page { size: A4 portrait; margin: 10mm 15mm 12mm 15mm; }
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; line-height: 1.3; font-size: 12px; padding: 0; margin: 0; background: #ffffff; }
              .header-container { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
              .hospital-details { flex: 1; padding-left: 20px; }
              .hospital-name { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; }
              .hospital-sub { font-size: 11px; color: #475569; margin: 1px 0; }
              .divider-thick { border-bottom: 2px solid #0f172a; margin: 8px 0 12px 0; }
              
              @media print {
                html, body {
                  height: auto !important;
                  min-height: 0 !important;
                  max-height: none !important;
                  overflow: visible !important;
                  background: #ffffff !important;
                  margin: 0 !important;
                  padding: 0 !important;
                }
                .single-report-page {
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
                table.report-layout-table {
                  width: 100% !important;
                  border-collapse: collapse !important;
                  page-break-inside: auto !important;
                  break-inside: auto !important;
                }
                thead {
                  display: table-header-group !important;
                }
                tfoot {
                  display: table-footer-group !important;
                }
                .footer-signature {
                  margin-top: 25px !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
                h2, h3 { margin-top: 2px !important; margin-bottom: 2px !important; }
              }
            </style>
          </head>
          <body onload="window.print(); setTimeout(function() { window.close(); }, 500);">
            ${pagesContentHtml}
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const openAddServiceModal = () => {
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
      isActive: true,
      reportType: 'Structured',
      parameters: [],
      qualitativeInputType: 'Dropdown',
      qualitativeOptions: 'Positive, Negative, Equivocal',
      qualitativeNotes: '',
      techniqueTemplate: '',
      findingsTemplate: '',
      impressionTemplate: ''
    });
    setModalError('');
    setServiceModalOpen(true);
  };

  const openEditServiceModal = (s: any) => {
    setEditingService(s);
    const rType = s.report_type || 'Structured';
    
    let parsedParameters = (s.parameters || []).map((p: any) => {
      const pName = (p.name || '').trim().toLowerCase();
      let rType: 'parameter' | 'reference' | 'findings' = 'parameter';
      
      if (p.row_type || p.rowType) {
        rType = p.row_type || p.rowType;
      } else if (pName === 'findings' || pName === 'impression' || pName === 'technique' || pName === 'conclusion') {
        rType = 'findings';
      } else if (pName === 'reference range') {
        rType = 'reference';
      } else {
        rType = 'parameter';
      }

      return {
        name: p.name || '',
        unit: p.unit || '',
        referenceRange: p.reference_range !== undefined ? p.reference_range : (p.referenceRange || ''),
        inputType: p.input_type || p.inputType || (rType !== 'parameter' ? 'Text' : 'Number'),
        dropdownOptions: p.dropdown_options || p.dropdownOptions || '',
        minValue: p.min_value !== null && p.min_value !== undefined ? p.min_value.toString() : (p.minValue || ''),
        maxValue: p.max_value !== null && p.max_value !== undefined ? p.max_value.toString() : (p.maxValue || ''),
        ageGroup: p.age_group || p.ageGroup || 'Universal',
        gender: p.gender || 'Universal',
        refMinMale: p.ref_min_male !== null && p.ref_min_male !== undefined ? p.ref_min_male.toString() : (p.refMinMale || ''),
        refMaxMale: p.ref_max_male !== null && p.ref_max_male !== undefined ? p.ref_max_male.toString() : (p.refMaxMale || ''),
        refMinFemale: p.ref_min_female !== null && p.ref_min_female !== undefined ? p.ref_min_female.toString() : (p.refMinFemale || ''),
        refMaxFemale: p.ref_max_female !== null && p.ref_max_female !== undefined ? p.ref_max_female.toString() : (p.refMaxFemale || ''),
        refMinChild: p.ref_min_child !== null && p.ref_min_child !== undefined ? p.ref_min_child.toString() : (p.refMinChild || ''),
        refMaxChild: p.ref_max_child !== null && p.ref_max_child !== undefined ? p.ref_max_child.toString() : (p.refMaxChild || ''),
        rowType: rType
      };
    });

    let qualitativeInputType = 'Dropdown';
    let qualitativeOptions = 'Positive, Negative, Equivocal';
    let qualitativeNotes = s.normal_range || '';

    if (rType === 'Qualitative') {
      const resultParam = s.parameters?.find((p: any) => p.name === 'Result');
      if (resultParam) {
        qualitativeInputType = resultParam.input_type || 'Dropdown';
        qualitativeOptions = resultParam.dropdown_options || '';
      }
    }

    let techniqueTemplate = '';
    let findingsTemplate = '';
    let impressionTemplate = '';

    if (rType === 'Descriptive' && s.normal_range) {
      try {
        const parsed = JSON.parse(s.normal_range);
        techniqueTemplate = parsed.technique || '';
        findingsTemplate = parsed.findings || '';
        impressionTemplate = parsed.impression || '';
      } catch (e) {
        findingsTemplate = s.normal_range;
      }
    }

    setServiceForm({
      name: s.name,
      categoryId: s.category_id || '',
      serviceCode: s.service_code,
      price: parseFloat(s.price).toString(),
      gstPercentage: parseFloat(s.gst_percentage || '18').toString(),
      durationMinutes: parseInt(s.duration_minutes || '30').toString(),
      sampleRequired: s.sample_required || 'None',
      normalRange: s.normal_range || '',
      machineRequired: s.machine_required || '',
      homeCollectionAvailable: !!s.home_collection_available,
      emergencyAvailable: !!s.emergency_available,
      isActive: !!s.is_active,
      reportType: rType,
      parameters: parsedParameters,
      qualitativeInputType,
      qualitativeOptions,
      qualitativeNotes,
      techniqueTemplate,
      findingsTemplate,
      impressionTemplate
    });
    setModalError('');
    setServiceModalOpen(true);
  };

  const handleAddParameterRow = () => {
    setServiceForm(prev => ({
      ...prev,
      parameters: [...(prev.parameters || []), { 
        name: '', 
        unit: '', 
        referenceRange: '', 
        inputType: 'Number', 
        dropdownOptions: '',
        minValue: '',
        maxValue: '',
        ageGroup: 'Universal',
        gender: 'Universal',
        refMinMale: '',
        refMaxMale: '',
        refMinFemale: '',
        refMaxFemale: '',
        refMinChild: '',
        refMaxChild: '',
        rowType: 'parameter'
      }]
    }));
  };

  const handleAddReferenceRow = () => {
    setServiceForm(prev => ({
      ...prev,
      parameters: [...(prev.parameters || []), { 
        name: 'Reference Range', 
        unit: '', 
        referenceRange: 'Negative / Non-Reactive', 
        inputType: 'Text', 
        dropdownOptions: '',
        minValue: '',
        maxValue: '',
        ageGroup: 'Universal',
        gender: 'Universal',
        refMinMale: '',
        refMaxMale: '',
        refMinFemale: '',
        refMaxFemale: '',
        refMinChild: '',
        refMaxChild: '',
        rowType: 'reference'
      }]
    }));
  };

  const handleAddFindingsRow = () => {
    setServiceForm(prev => {
      const existing = prev.parameters || [];
      const hasFindings = existing.some((p: any) => p.rowType === 'findings' || p.name === 'Findings');
      const newRows = hasFindings ? [
        { 
          name: 'Impression', 
          unit: '', 
          referenceRange: 'Normal Chest X-Ray / Scan Study.', 
          inputType: 'Text', 
          dropdownOptions: '',
          minValue: '',
          maxValue: '',
          rowType: 'findings' as const
        }
      ] : [
        { 
          name: 'Findings', 
          unit: '', 
          referenceRange: 'Lungs are clear. Cardiac size normal. No focal lesion.', 
          inputType: 'Text', 
          dropdownOptions: '',
          minValue: '',
          maxValue: '',
          rowType: 'findings' as const
        },
        { 
          name: 'Impression', 
          unit: '', 
          referenceRange: 'Normal Chest X-Ray / Scan Study.', 
          inputType: 'Text', 
          dropdownOptions: '',
          minValue: '',
          maxValue: '',
          rowType: 'findings' as const
        }
      ];

      return {
        ...prev,
        parameters: [...existing, ...newRows]
      };
    });
  };

  const handleParameterChange = (index: number, field: string, value: string) => {
    setServiceForm(prev => {
      const updated = [...(prev.parameters || [])];
      const param = { ...updated[index], [field]: value };

      if (['refMinMale', 'refMaxMale', 'refMinFemale', 'refMaxFemale', 'refMinChild', 'refMaxChild'].includes(field)) {
        const parts = [];
        const mMin = param.refMinMale;
        const mMax = param.refMaxMale;
        const fMin = param.refMinFemale;
        const fMax = param.refMaxFemale;
        const cMin = param.refMinChild;
        const cMax = param.refMaxChild;

        if (mMin || mMax) parts.push(`M: ${mMin || 0}-${mMax || 0}`);
        if (fMin || fMax) parts.push(`F: ${fMin || 0}-${fMax || 0}`);
        if (cMin || cMax) parts.push(`Child: ${cMin || 0}-${cMax || 0}`);

        if (parts.length > 0) {
          if (!param.referenceRange || param.referenceRange.startsWith('M:') || param.referenceRange.startsWith('F:') || param.referenceRange.startsWith('Child:')) {
            param.referenceRange = parts.join(' | ');
          }
        }
      }

      updated[index] = param;
      return { ...prev, parameters: updated };
    });
  };

  const handleRemoveParameterRow = (index: number) => {
    setServiceForm(prev => ({
      ...prev,
      parameters: (prev.parameters || []).filter((_, i) => i !== index)
    }));
  };

  const openParamViewModal = (s: any) => {
    setSelectedParamService(s);
    setParamViewModalOpen(true);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!window.confirm('Are you sure you want to delete this service from the catalog?')) return;
    try {
      await api.delete(`/diagnostics/services/${serviceId}`);
      loadCatalogData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove service.');
    }
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');

    const finalParams = (serviceForm.parameters || []).map((p: any) => {
      let refRange = p.referenceRange !== undefined ? p.referenceRange.toString().trim() : (p.reference_range !== undefined ? p.reference_range.toString().trim() : '');
      let mMin = p.refMinMale !== undefined && p.refMinMale !== '' && p.refMinMale !== null ? p.refMinMale.toString().trim() : null;
      let mMax = p.refMaxMale !== undefined && p.refMaxMale !== '' && p.refMaxMale !== null ? p.refMaxMale.toString().trim() : null;
      let fMin = p.refMinFemale !== undefined && p.refMinFemale !== '' && p.refMinFemale !== null ? p.refMinFemale.toString().trim() : null;
      let fMax = p.refMaxFemale !== undefined && p.refMaxFemale !== '' && p.refMaxFemale !== null ? p.refMaxFemale.toString().trim() : null;
      let cMin = p.refMinChild !== undefined && p.refMinChild !== '' && p.refMinChild !== null ? p.refMinChild.toString().trim() : null;
      let cMax = p.refMaxChild !== undefined && p.refMaxChild !== '' && p.refMaxChild !== null ? p.refMaxChild.toString().trim() : null;

      if ((mMin || mMax || fMin || fMax || cMin || cMax) && (!refRange || refRange.startsWith('M:') || refRange.startsWith('F:') || refRange.startsWith('Child:'))) {
        const parts = [];
        if (mMin || mMax) parts.push(`M: ${mMin || 0}-${mMax || 0}`);
        if (fMin || fMax) parts.push(`F: ${fMin || 0}-${fMax || 0}`);
        if (cMin || cMax) parts.push(`Child: ${cMin || 0}-${cMax || 0}`);
        if (parts.length > 0) refRange = parts.join(' | ');
      }

      return {
        name: (p.name || '').trim(),
        unit: (p.unit || '').trim(),
        referenceRange: refRange,
        inputType: p.inputType || p.input_type || 'Number',
        dropdownOptions: p.dropdownOptions !== undefined ? p.dropdownOptions : (p.dropdown_options || ''),
        minValue: p.minValue !== undefined && p.minValue !== '' && p.minValue !== null ? p.minValue : null,
        maxValue: p.maxValue !== undefined && p.maxValue !== '' && p.maxValue !== null ? p.maxValue : null,
        ageGroup: p.ageGroup || p.age_group || 'Universal',
        gender: p.gender || 'Universal',
        refMinMale: mMin,
        refMaxMale: mMax,
        refMinFemale: fMin,
        refMaxFemale: fMax,
        refMinChild: cMin,
        refMaxChild: cMax,
        rowType: p.rowType || p.row_type || 'parameter'
      };
    });

    const payload = {
      name: serviceForm.name,
      categoryId: serviceForm.categoryId,
      serviceCode: serviceForm.serviceCode,
      price: parseFloat(serviceForm.price),
      gstPercentage: parseFloat(serviceForm.gstPercentage),
      durationMinutes: parseInt(serviceForm.durationMinutes),
      sampleRequired: serviceForm.sampleRequired,
      normalRange: serviceForm.normalRange,
      machineRequired: serviceForm.machineRequired,
      homeCollectionAvailable: serviceForm.homeCollectionAvailable,
      emergencyAvailable: serviceForm.emergencyAvailable,
      isActive: serviceForm.isActive,
      reportType: 'Structured',
      parameters: finalParams
    };

    try {
      if (editingService) {
        await api.put(`/diagnostics/services/${editingService.service_id}`, payload);
      } else {
        await api.post('/diagnostics/services', payload);
      }
      setServiceModalOpen(false);
      loadCatalogData();
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to save diagnostic service.');
    } finally {
      setModalLoading(false);
    }
  };

  const downloadCsvTemplate = () => {
    const headers = [
      'Test_Code', 'Test_Name', 'Category', 'Price_USD', 'Report_Format',
      'Parameter_Name', 'Unit', 'Ref_Min_Male', 'Ref_Max_Male', 'Ref_Min_Female',
      'Ref_Max_Female', 'Ref_Min_Child', 'Ref_Max_Child', 'Allowed_Values',
      'Default_Findings', 'Default_Impression'
    ];
    
    const rows = [
      ['CBC001', 'Complete Blood Count', 'Haematology', '35.00', 'STRUCTURED', 'Hemoglobin', 'g/dL', '13.5', '17.5', '12.0', '15.5', '11.0', '16.0', '', '', ''],
      ['CBC001', 'Complete Blood Count', 'Haematology', '35.00', 'STRUCTURED', 'Serum Creatinine', 'mg/dL', '0.74', '1.35', '0.59', '1.04', '0.20', '0.70', '', '', ''],
      ['CBC001', 'Complete Blood Count', 'Haematology', '35.00', 'STRUCTURED', 'WBC Total Count', 'cells/mcL', '4000', '11000', '4000', '11000', '5000', '14000', '', '', ''],
      ['DENGUE01', 'Dengue NS1 Rapid', 'Serology', '15.00', 'QUALITATIVE', 'Result', '', '', '', '', '', '', '', 'Positive, Negative, Equivocal', '', ''],
      ['XRAY001', 'Chest X-Ray PA', 'Radiology', '25.00', 'DESCRIPTIVE', '', '', '', '', '', '', '', '', '', 'Both lung fields demonstrate normal vascularity..', 'Normal chest radiograph.']
    ];
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${(val || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Diagnostic_Services_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      parseAndValidateCsv(text);
    };
    reader.readAsText(file);
  };

  const parseAndValidateCsv = (text: string) => {
    const lines = [];
    let currentLine = [];
    let currentField = '';
    let insideQuote = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (insideQuote) {
        if (char === '"') {
          if (nextChar === '"') {
            currentField += '"';
            i++;
          } else {
            insideQuote = false;
          }
        } else {
          currentField += char;
        }
      } else {
        if (char === '"') {
          insideQuote = true;
        } else if (char === ',') {
          currentLine.push(currentField.trim());
          currentField = '';
        } else if (char === '\r' || char === '\n') {
          currentLine.push(currentField.trim());
          if (currentLine.length > 1 || currentLine[0] !== '') {
            lines.push(currentLine);
          }
          currentLine = [];
          currentField = '';
          if (char === '\r' && nextChar === '\n') {
            i++;
          }
        } else {
          currentField += char;
        }
      }
    }
    if (currentField || currentLine.length > 0) {
      currentLine.push(currentField.trim());
      lines.push(currentLine);
    }
    
    if (lines.length < 2) {
      setImportErrors(['CSV file is empty or only contains headers.']);
      setImportPreview([]);
      return;
    }
    
    const dataLines = lines.slice(1);
    const errors: string[] = [];
    const groupedServices: { [code: string]: any } = {};
    
    dataLines.forEach((row, rowIdx) => {
      while (row.length < 16) row.push('');
      
      const testCode = row[0];
      const testName = row[1];
      const category = row[2];
      const priceStr = row[3];
      const format = (row[4] || '').toUpperCase();
      const paramName = row[5];
      const unit = row[6];
      const refMinMale = row[7];
      const refMaxMale = row[8];
      const refMinFemale = row[9];
      const refMaxFemale = row[10];
      const refMinChild = row[11];
      const refMaxChild = row[12];
      const allowedValues = row[13];
      const defaultFindings = row[14];
      const defaultImpression = row[15];
      
      const lineNum = rowIdx + 2;
      
      if (!testCode) {
        errors.push(`Row ${lineNum}: Missing Test_Code.`);
        return;
      }
      
      if (!groupedServices[testCode]) {
        if (!testName) errors.push(`Row ${lineNum}: Missing Test_Name.`);
        if (!category) errors.push(`Row ${lineNum}: Missing Category.`);
        if (!priceStr || isNaN(parseFloat(priceStr))) {
          errors.push(`Row ${lineNum}: Invalid or missing Price_USD ("${priceStr}").`);
        }
        if (format !== 'STRUCTURED' && format !== 'QUALITATIVE' && format !== 'DESCRIPTIVE') {
          errors.push(`Row ${lineNum}: Report_Format must be STRUCTURED, QUALITATIVE, or DESCRIPTIVE (found: "${format}").`);
        }
        
        groupedServices[testCode] = {
          service_code: testCode,
          name: testName,
          category: category,
          price: parseFloat(priceStr) || 0,
          report_type: format === 'STRUCTURED' ? 'Structured' : (format === 'QUALITATIVE' ? 'Qualitative' : 'Descriptive'),
          normal_range: '',
          parameters: [],
          qualitativeInputType: 'Dropdown',
          qualitativeOptions: allowedValues || 'Positive, Negative, Equivocal',
          techniqueTemplate: '',
          findingsTemplate: defaultFindings || '',
          impressionTemplate: defaultImpression || ''
        };
      }
      
      const service = groupedServices[testCode];
      
      if (service.report_type === 'Structured') {
        if (!paramName) {
          errors.push(`Row ${lineNum}: Parameter_Name is mandatory for STRUCTURED tests.`);
        } else {
          service.parameters.push({
            name: paramName,
            unit: unit || '',
            referenceRange: `${refMinMale || ''}-${refMaxMale || ''}`,
            inputType: 'Number',
            dropdownOptions: '',
            refMinMale: refMinMale ? refMinMale : null,
            refMaxMale: refMaxMale ? refMaxMale : null,
            refMinFemale: refMinFemale ? refMinFemale : null,
            refMaxFemale: refMaxFemale ? refMaxFemale : null,
            refMinChild: refMinChild ? refMinChild : null,
            refMaxChild: refMaxChild ? refMaxChild : null
          });
        }
      } else if (service.report_type === 'Qualitative') {
        service.normal_range = allowedValues || 'Positive, Negative';
        service.qualitativeInputType = allowedValues ? 'Dropdown' : 'Text';
        service.qualitativeOptions = allowedValues || 'Positive, Negative, Equivocal';
      } else if (service.report_type === 'Descriptive') {
        service.normal_range = JSON.stringify({
          technique: '',
          findings: defaultFindings || '',
          impression: defaultImpression || ''
        });
      }
    });
    
    setImportErrors(errors);
    setImportPreview(Object.values(groupedServices));
  };

  const handleCommitImport = async () => {
    setImportLoading(true);
    setError('');
    try {
      for (const service of importPreview) {
        let category = categories.find(c => c.name.toLowerCase() === service.category.toLowerCase());
        let catId = category?.category_id;
        
        if (!catId) {
          const catRes = await api.post('/diagnostics/categories', { name: service.category, description: `${service.category} Department` });
          catId = catRes.data.category_id || catRes.data.data?.category_id;
          const refreshCats = await api.get('/diagnostics/categories');
          setCategories(refreshCats.data.data || refreshCats.data);
        }
        
        const payload = {
          name: service.name,
          categoryId: catId,
          serviceCode: service.service_code,
          price: service.price,
          gstPercentage: 18,
          durationMinutes: 30,
          sampleRequired: service.report_type === 'Structured' ? 'Blood' : 'None',
          normalRange: service.normal_range,
          machineRequired: '',
          homeCollectionAvailable: false,
          emergencyAvailable: false,
          isActive: true,
          reportType: service.report_type,
          parameters: service.parameters
        };
        
        await api.post('/diagnostics/services', payload);
      }
      
      setImportModalOpen(false);
      setImportPreview([]);
      loadCatalogData();
      alert('Bulk Diagnostic Services imported successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to import bulk services.');
    } finally {
      setImportLoading(false);
    }
  };

  const filteredServices = services.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.service_code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === '' || s.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={28} color="var(--accent-primary)" />
            Diagnostics Catalog & Packages
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px' }}>
            Manage the list of laboratory tests, imaging services, and bundled health checkup packages
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {activeTab === 'reports' ? (
            <Button variant="secondary" onClick={loadOrders} icon={<RefreshCw size={14} />}>
              Refresh Reports
            </Button>
          ) : (
            <Button variant="secondary" onClick={loadCatalogData} icon={<RefreshCw size={14} />}>
              Refresh Catalog
            </Button>
          )}
          {activeTab === 'services' && (
            <Button variant="primary" onClick={openAddServiceModal} icon={<Plus size={14} />}>
              Add Test Service
            </Button>
          )}
          {activeTab === 'packages' && (
            <Button variant="primary" onClick={openAddPackageModal} icon={<Plus size={14} />}>
              Create Bundle Package
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Selector */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-primary)', gap: '8px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('services')}
          style={{
            padding: '8px 20px',
            background: activeTab === 'services' ? 'var(--bg-card)' : 'transparent',
            color: activeTab === 'services' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            border: activeTab === 'services' ? '1px solid var(--border-primary)' : '1px solid transparent',
            borderBottom: activeTab === 'services' ? '1px solid transparent' : '1px solid transparent',
            borderRadius: '8px 8px 0 0',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '-1px'
          }}
        >
          Individual Services ({services.length})
        </button>
        <button
          onClick={() => setActiveTab('packages')}
          style={{
            padding: '8px 20px',
            background: activeTab === 'packages' ? 'var(--bg-card)' : 'transparent',
            color: activeTab === 'packages' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            border: activeTab === 'packages' ? '1px solid var(--border-primary)' : '1px solid transparent',
            borderBottom: activeTab === 'packages' ? '1px solid transparent' : '1px solid transparent',
            borderRadius: '8px 8px 0 0',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '-1px'
          }}
        >
          Profiles/Package ({packages.length})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          style={{
            padding: '8px 20px',
            background: activeTab === 'reports' ? 'var(--bg-card)' : 'transparent',
            color: activeTab === 'reports' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            border: activeTab === 'reports' ? '1px solid var(--border-primary)' : '1px solid transparent',
            borderBottom: activeTab === 'reports' ? '1px solid transparent' : '1px solid transparent',
            borderRadius: '8px 8px 0 0',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '-1px'
          }}
        >
          Print Completed Reports
        </button>
      </div>

      {loading || (activeTab === 'reports' && ordersLoading) ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <RefreshCw size={28} className="spin" color="var(--accent-primary)" style={{ animation: 'spin 1.5s linear infinite' }} />
          <span style={{ color: 'var(--text-secondary)' }}>
            {activeTab === 'reports' ? 'Loading completed test reports...' : 'Loading catalog...'}
          </span>
        </div>
      ) : activeTab === 'services' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Action Bar (Top Navigation) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-primary)', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '280px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search test name/code..."
                  style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', paddingLeft: '36px', height: '36px', fontSize: '13px' }}
                />
              </div>
              <select
                className="select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', width: '180px', height: '36px', fontSize: '13px' }}
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={downloadCsvTemplate}
                style={{
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  height: '36px'
                }}
              >
                <span>📥</span>
                Download Excel Template
              </button>

              <label
                style={{
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  height: '36px',
                  margin: 0
                }}
              >
                <span>📦</span>
                Bulk Upload Services
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    handleFileUpload(e);
                    setImportModalOpen(true);
                  }}
                  style={{ display: 'none' }}
                />
              </label>

              <Button
                variant="primary"
                onClick={openAddServiceModal}
                icon={<Plus size={14} />}
                style={{ height: '36px', padding: '0 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                Add Individual Service
              </Button>
            </div>
          </div>

          <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
            <div className="table-responsive">
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-primary)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px' }}>Code</th>
                    <th style={{ padding: '12px 16px' }}>Test / Service Name</th>
                    <th style={{ padding: '12px 16px' }}>Department</th>
                    <th style={{ padding: '12px 16px' }}>Parameters</th>
                    <th style={{ padding: '12px 16px' }}>Sample Type</th>
                    <th style={{ padding: '12px 16px' }}>Price (Rs.)</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map((s) => (
                    <tr key={s.service_id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>{s.service_code}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{s.name}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: 'var(--bg-primary)', padding: '2px 8px', borderRadius: '50px', fontSize: '11px', fontWeight: 500 }}>
                          {s.category_name}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          onClick={() => openParamViewModal(s)}
                          style={{
                            background: s.parameters && s.parameters.length > 0 ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-primary)',
                            color: s.parameters && s.parameters.length > 0 ? '#3b82f6' : 'var(--text-muted)',
                            border: `1px solid ${s.parameters && s.parameters.length > 0 ? 'rgba(59, 130, 246, 0.3)' : 'var(--border-primary)'}`,
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                          title="Click to view or edit parameters"
                        >
                          <List size={12} />
                          {s.parameters && s.parameters.length > 0 ? `${s.parameters.length} Parameters` : '+ Add Parameters'}
                        </button>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{s.sample_required || 'None'}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>Rs. {parseFloat(s.price).toFixed(2)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ 
                          fontSize: '11px', padding: '2px 8px', borderRadius: '50px', fontWeight: 600,
                          background: s.is_active ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
                          color: s.is_active ? 'var(--accent-success)' : 'var(--accent-danger)'
                        }}>
                          {s.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => openEditServiceModal(s)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><Edit size={14} /></button>
                          <button onClick={() => handleDeleteService(s.service_id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent-danger)' }}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : activeTab === 'packages' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {packages.map((pkg) => (
            <Card key={pkg.package_id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px', padding: '18px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', gap: '14px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{pkg.name}</h3>
                      <span style={{ fontSize: '11px', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '2px 8px', borderRadius: '50px', fontWeight: 600 }}>
                        {pkg.services ? pkg.services.length : 0} Grouped Tests Included
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Set Profile Price</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-success)' }}>
                        Rs. {parseFloat(pkg.price).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div style={{ margin: '12px 0', display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '100px', overflowY: 'auto' }}>
                    {(pkg.services || []).map((s: any) => (
                      <span key={s.service_id} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Discount: Rs. {parseFloat(pkg.discount || '0').toFixed(2)}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => openEditPackageModal(pkg)}
                      style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', cursor: 'pointer', color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                      title="Edit Grouped Profile"
                    >
                      <Edit size={12} /> Edit
                    </button>
                    <button
                      onClick={() => handleDeletePackage(pkg.package_id)}
                      style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', cursor: 'pointer', color: 'var(--accent-danger)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                      title="Delete Profile"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', padding: '8px 12px', borderRadius: '8px', width: '100%', maxWidth: '340px' }}>
                <Search size={16} color="var(--text-muted)" />
                <input 
                  type="text" 
                  placeholder="Search patient name, MRN, or order number..." 
                  value={reportSearch} 
                  onChange={(e) => setReportSearch(e.target.value)} 
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', outline: 'none', fontSize: '13px' }}
                />
                {reportSearch && <button onClick={() => setReportSearch('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={14} /></button>}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontWeight: 600 }}>Print Mode:</span>
                <select 
                  className="select" 
                  value={printMode} 
                  onChange={(e) => setPrintMode(e.target.value as any)} 
                  style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', minHeight: 'auto', border: '1px solid var(--border-primary)', cursor: 'pointer' }}
                >
                  <option value="plain">Plain Paper (Full Header)</option>
                  <option value="letterhead">Pre-printed Letterhead (2.2" Gap, No Header)</option>
                </select>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Completed Reports: <strong>{getCompletedReports().length}</strong>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-primary)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px' }}>Order Ref</th>
                  <th style={{ padding: '12px 16px' }}>Patient Details</th>
                  <th style={{ padding: '12px 16px' }}>Test Name</th>
                  <th style={{ padding: '12px 16px' }}>Department</th>
                  <th style={{ padding: '12px 16px' }}>Verified Date</th>
                  <th style={{ padding: '12px 16px' }}>Doctor Sign-off</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {getCompletedReports().map((rep: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700 }}>{rep.order_number}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600 }}>{rep.patient_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>MRN: {rep.patient_mrn}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600 }}>{rep.service_name}</div>
                      {rep.package_name && (
                        <div style={{ fontSize: '10px', color: '#3b82f6', fontWeight: 600 }}>
                          [Profile: {rep.package_name}]
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: 'var(--bg-primary)', padding: '2px 8px', borderRadius: '50px', fontSize: '11px', fontWeight: 500 }}>
                        {rep.category_name}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {rep.verification?.verified_at ? new Date(rep.verification.verified_at).toLocaleDateString() : 'Today'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--accent-success)', fontWeight: 600 }}>
                      <CheckCircle size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      {rep.verification?.verified_by_name || 'Dr. Pathologist'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <Button variant="primary" size="sm" icon={<Printer size={12} />} onClick={() => handlePrintReport(rep)}>
                        Print PDF Report
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Service Add/Edit Modal */}
      {serviceModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', zIndex: 1000, overflowY: 'auto', padding: '40px 16px' }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '12px', width: '100%', maxWidth: '580px', padding: '24px', position: 'relative', margin: 'auto' }}>
            <button onClick={() => setServiceModalOpen(false)} style={{ position: 'absolute', right: '16px', top: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
              {editingService ? 'Edit Diagnostic Test Service' : 'Add New Diagnostic Test Service'}
            </h2>

            {modalError && (
              <div style={{ color: 'var(--accent-danger)', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleServiceSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Service Code *</label>
                    <input type="text" className="input" value={serviceForm.serviceCode} onChange={(e) => setServiceForm({ ...serviceForm, serviceCode: e.target.value })} required placeholder="e.g. CBC" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Service Name *</label>
                    <input type="text" className="input" value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} required placeholder="e.g. Complete Blood Count" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Department Category *</label>
                    <select className="select" value={serviceForm.categoryId} onChange={(e) => setServiceForm({ ...serviceForm, categoryId: e.target.value })} required style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                      <option value="">Select Department</option>
                      {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Price (Rs.) *</label>
                    <input type="number" className="input" value={serviceForm.price} onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })} required placeholder="350" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Turnaround (Mins)</label>
                    <input type="number" className="input" value={serviceForm.durationMinutes} onChange={(e) => setServiceForm({ ...serviceForm, durationMinutes: e.target.value })} placeholder="30" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Sample Required</label>
                    <input type="text" className="input" value={serviceForm.sampleRequired} onChange={(e) => setServiceForm({ ...serviceForm, sampleRequired: e.target.value })} placeholder="e.g. Blood, Urine, None" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Calibration Machine</label>
                    <input type="text" className="input" value={serviceForm.machineRequired} onChange={(e) => setServiceForm({ ...serviceForm, machineRequired: e.target.value })} placeholder="e.g. Hematology Auto" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>General Reference Range (Summary)</label>
                  <input type="text" className="input" value={serviceForm.normalRange} onChange={(e) => setServiceForm({ ...serviceForm, normalRange: e.target.value })} placeholder="e.g. See parameters list below" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={serviceForm.homeCollectionAvailable} onChange={(e) => setServiceForm({ ...serviceForm, homeCollectionAvailable: e.target.checked })} />
                    Home Collect
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={serviceForm.emergencyAvailable} onChange={(e) => setServiceForm({ ...serviceForm, emergencyAvailable: e.target.checked })} />
                    Emergency Lab
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={serviceForm.isActive} onChange={(e) => setServiceForm({ ...serviceForm, isActive: e.target.checked })} />
                    Active Status
                  </label>
                </div>

                {/* Individual Test Parameters Section */}
                <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-primary)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <List size={15} color="var(--accent-primary)" />
                      Individual Test Parameters ({serviceForm.parameters?.length || 0})
                    </label>

                    {/* 3 Side-by-Side Action Buttons */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={handleAddParameterRow}
                        style={{
                          background: 'var(--bg-primary)',
                          color: 'var(--accent-primary)',
                          border: '1px solid var(--border-primary)',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <Plus size={12} />
                        + Add Parameter
                      </button>

                      <button
                        type="button"
                        onClick={handleAddReferenceRow}
                        style={{
                          background: 'rgba(16,185,129,0.08)',
                          color: 'var(--accent-success)',
                          border: '1px solid rgba(16,185,129,0.3)',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <Plus size={12} />
                        + Add Reference
                      </button>

                      <button
                        type="button"
                        onClick={handleAddFindingsRow}
                        style={{
                          background: 'rgba(14,165,233,0.08)',
                          color: 'var(--accent-info)',
                          border: '1px solid rgba(14,165,233,0.3)',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <Plus size={12} />
                        + Add Findings/Impression
                      </button>
                    </div>
                  </div>

                  {serviceForm.parameters && serviceForm.parameters.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                      {serviceForm.parameters.map((p, pIdx) => {
                        
                        /* TYPE 1: REFERENCE PARAMETER ROW (+ Add Reference) */
                        if (p.rowType === 'reference') {
                          return (
                            <div key={pIdx} style={{ background: 'var(--bg-primary)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
                                
                                {/* Parameter Name / Title */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '180px', flex: 1 }}>
                                  <span style={{ fontSize: '11px', color: 'var(--accent-success)', fontWeight: 700 }}>Parameter Name / Title *</span>
                                  <input
                                    type="text"
                                    className="input"
                                    value={p.name}
                                    onChange={(e) => handleParameterChange(pIdx, 'name', e.target.value)}
                                    placeholder="e.g. Widal Test / Dengue IgG / Result Note"
                                    required
                                    style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '4px 8px', fontSize: '12px', height: '34px' }}
                                  />
                                </div>

                                {/* Reference Text Box */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '240px', flex: 2 }}>
                                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Reference Status / Value *</span>
                                  <input
                                    type="text"
                                    className="input"
                                    value={p.referenceRange}
                                    onChange={(e) => handleParameterChange(pIdx, 'referenceRange', e.target.value)}
                                    placeholder="e.g. Negative / Non-Reactive / 70 - 110 mg/dL"
                                    required
                                    style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '4px 8px', fontSize: '12px', height: '34px' }}
                                  />
                                </div>

                                {/* Remove Button */}
                                <div style={{ display: 'flex', alignItems: 'center', height: '34px', marginLeft: 'auto' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveParameterRow(pIdx)}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: '4px' }}
                                    title="Remove reference parameter"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>

                              </div>
                            </div>
                          );
                        }

                        /* TYPE 2: FINDINGS / IMPRESSION NARRATIVE ROW (+ Add Findings/Impression) */
                        if (p.rowType === 'findings') {
                          return (
                            <div key={pIdx} style={{ background: 'var(--bg-primary)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '11px', color: 'var(--accent-info)', fontWeight: 700 }}>Narrative Section Title *</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveParameterRow(pIdx)}
                                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: '4px' }}
                                  title="Remove narrative section"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>

                              <input
                                type="text"
                                className="input"
                                value={p.name}
                                onChange={(e) => handleParameterChange(pIdx, 'name', e.target.value)}
                                placeholder="e.g. Findings / Impression / Technique / Conclusion"
                                required
                                style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '4px 8px', fontSize: '12px', height: '34px' }}
                              />

                              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Default Narrative Text / Description Template</span>
                              <textarea
                                className="input"
                                rows={2}
                                value={p.referenceRange}
                                onChange={(e) => handleParameterChange(pIdx, 'referenceRange', e.target.value)}
                                placeholder="Pre-define default narrative findings or impression summary..."
                                style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '6px 8px', fontSize: '12px', width: '100%' }}
                              />
                            </div>
                          );
                        }

                        /* TYPE 3: STANDARD PARAMETER ROW (+ Add Parameter) */
                        return (
                          <div key={pIdx} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-end' }}>
                              
                              {/* Parameter Name */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '140px', flex: 2 }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Parameter Name *</span>
                                <input
                                  type="text"
                                  className="input"
                                  value={p.name}
                                  onChange={(e) => handleParameterChange(pIdx, 'name', e.target.value)}
                                  placeholder="e.g. Hemoglobin"
                                  required
                                  style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '4px 8px', fontSize: '12px', height: '32px' }}
                                />
                              </div>

                              {/* Unit */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '70px', flex: 1 }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Unit</span>
                                <input
                                  type="text"
                                  className="input"
                                  value={p.unit}
                                  onChange={(e) => handleParameterChange(pIdx, 'unit', e.target.value)}
                                  placeholder="e.g. g/dL"
                                  style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '4px 8px', fontSize: '12px', height: '32px' }}
                                />
                              </div>

                              {/* Type */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '90px', flex: 1 }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Type</span>
                                <select
                                  className="select"
                                  value={p.inputType || 'Number'}
                                  onChange={(e) => handleParameterChange(pIdx, 'inputType', e.target.value)}
                                  style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '4px 8px', fontSize: '12px', height: '32px' }}
                                >
                                  <option value="Number">Number</option>
                                  <option value="Dropdown">Dropdown</option>
                                  <option value="Text">Text</option>
                                </select>
                              </div>

                              {/* Dropdown Options (Conditional) */}
                              {p.inputType === 'Dropdown' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '140px', flex: 2 }}>
                                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Dropdown Options *</span>
                                  <input
                                    type="text"
                                    className="input"
                                    value={p.dropdownOptions || ''}
                                    onChange={(e) => handleParameterChange(pIdx, 'dropdownOptions', e.target.value)}
                                    placeholder="Options (e.g. Positive,Negative)"
                                    required
                                    style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '4px 8px', fontSize: '12px', height: '32px' }}
                                  />
                                </div>
                              )}

                              {/* Child Range */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '100px' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Child Ref Range</span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <input
                                    type="text"
                                    className="input"
                                    value={p.refMinChild || ''}
                                    onChange={(e) => handleParameterChange(pIdx, 'refMinChild', e.target.value)}
                                    placeholder="Min"
                                    style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '4px 8px', fontSize: '11px', height: '32px', width: '50px' }}
                                  />
                                  <input
                                    type="text"
                                    className="input"
                                    value={p.refMaxChild || ''}
                                    onChange={(e) => handleParameterChange(pIdx, 'refMaxChild', e.target.value)}
                                    placeholder="Max"
                                    style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '4px 8px', fontSize: '11px', height: '32px', width: '50px' }}
                                  />
                                </div>
                              </div>

                              {/* Universal Adult Ref Range */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '130px', flex: 1 }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Universal Adult Ref</span>
                                <input
                                  type="text"
                                  className="input"
                                  value={p.referenceRange || ''}
                                  onChange={(e) => handleParameterChange(pIdx, 'referenceRange', e.target.value)}
                                  placeholder="e.g. 13.5 - 17.5"
                                  style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '4px 8px', fontSize: '12px', height: '32px' }}
                                />
                              </div>

                              {/* Male Ref Range */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '100px' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Male Ref Range</span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <input
                                    type="text"
                                    className="input"
                                    value={p.refMinMale || ''}
                                    onChange={(e) => handleParameterChange(pIdx, 'refMinMale', e.target.value)}
                                    placeholder="Min"
                                    style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '4px 8px', fontSize: '11px', height: '32px', width: '50px' }}
                                  />
                                  <input
                                    type="text"
                                    className="input"
                                    value={p.refMaxMale || ''}
                                    onChange={(e) => handleParameterChange(pIdx, 'refMaxMale', e.target.value)}
                                    placeholder="Max"
                                    style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '4px 8px', fontSize: '11px', height: '32px', width: '50px' }}
                                  />
                                </div>
                              </div>

                              {/* Female Ref Range */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '100px' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Female Ref Range</span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <input
                                    type="text"
                                    className="input"
                                    value={p.refMinFemale || ''}
                                    onChange={(e) => handleParameterChange(pIdx, 'refMinFemale', e.target.value)}
                                    placeholder="Min"
                                    style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '4px 8px', fontSize: '11px', height: '32px', width: '50px' }}
                                  />
                                  <input
                                    type="text"
                                    className="input"
                                    value={p.refMaxFemale || ''}
                                    onChange={(e) => handleParameterChange(pIdx, 'refMaxFemale', e.target.value)}
                                    placeholder="Max"
                                    style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '4px 8px', fontSize: '11px', height: '32px', width: '50px' }}
                                  />
                                </div>
                              </div>

                              {/* Remove Button */}
                              <div style={{ display: 'flex', alignItems: 'center', height: '32px', marginLeft: 'auto' }}>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveParameterRow(pIdx)}
                                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: '4px' }}
                                  title="Remove parameter"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>

                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ background: 'var(--bg-primary)', border: '1px dashed var(--border-primary)', borderRadius: '6px', padding: '16px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                      No specific parameters configured yet. Click <strong>+ Add Parameter</strong> (standard test), <strong>+ Add Reference</strong> (reference range), or <strong>+ Add Findings/Impression</strong> (imaging/scans).
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px', borderTop: '1px solid var(--border-primary)', paddingTop: '16px' }}>
                  <Button variant="secondary" type="button" onClick={() => setServiceModalOpen(false)}>Cancel</Button>
                  <Button variant="primary" type="submit" loading={modalLoading}>Save Service & Parameters</Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Parameter View Modal */}
      {paramViewModalOpen && selectedParamService && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '12px', width: '100%', maxWidth: '560px', padding: '24px', position: 'relative' }}>
            <button onClick={() => setParamViewModalOpen(false)} style={{ position: 'absolute', right: '16px', top: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <List size={20} color="var(--accent-primary)" />
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {selectedParamService.name}
              </h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '0 0 16px 0' }}>
              Service Code: <strong>{selectedParamService.service_code}</strong> | Department: <strong>{selectedParamService.category_name}</strong>
            </p>

            {selectedParamService.parameters && selectedParamService.parameters.length > 0 ? (
              <div style={{ border: '1px solid var(--border-primary)', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px', maxHeight: '300px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-primary)', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--text-secondary)' }}>#</th>
                      <th style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Parameter Name</th>
                      <th style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Unit</th>
                      <th style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Reference Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedParamService.parameters.map((p: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                        <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{idx + 1}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{p.unit || '—'}</td>
                        <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: 'var(--accent-primary)' }}>
                          {(() => {
                            if (p.reference_range && p.reference_range.trim()) return p.reference_range;
                            const parts = [];
                            if (p.ref_min_male || p.ref_max_male) parts.push(`M: ${p.ref_min_male || 0}-${p.ref_max_male || 0}`);
                            if (p.ref_min_female || p.ref_max_female) parts.push(`F: ${p.ref_min_female || 0}-${p.ref_max_female || 0}`);
                            if (p.ref_min_child || p.ref_max_child) parts.push(`Child: ${p.ref_min_child || 0}-${p.ref_max_child || 0}`);
                            return parts.length > 0 ? parts.join(' | ') : '—';
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ background: 'var(--bg-primary)', border: '1px dashed var(--border-primary)', borderRadius: '8px', padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
                No individual parameters configured for this test service yet.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="secondary" onClick={() => setParamViewModalOpen(false)}>Close</Button>
              <Button variant="primary" icon={<Edit size={14} />} onClick={() => { setParamViewModalOpen(false); openEditServiceModal(selectedParamService); }}>Edit Service & Parameters</Button>
            </div>
          </div>
        </div>
      )}

      {/* Package Modal */}
      {packageModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', zIndex: 1000, overflowY: 'auto', padding: '40px 16px' }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '12px', width: '100%', maxWidth: '560px', padding: '24px', position: 'relative', margin: 'auto' }}>
            <button onClick={() => setPackageModalOpen(false)} style={{ position: 'absolute', right: '16px', top: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
              {editingPackageId ? 'Edit Grouped Profile / Package' : 'Create Grouped Profile / Package'}
            </h2>

            {modalError && (
              <div style={{ color: 'var(--accent-danger)', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handlePackageSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Profile / Package Name *</label>
                  <input type="text" className="input" value={packageForm.name} onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })} required placeholder="e.g. Comprehensive Executive Health Profile" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Set Package Price (Rs.) *</label>
                    <input type="number" className="input" value={packageForm.price} onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })} required placeholder="e.g. 2500" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Discount Amount (Rs.)</label>
                    <input type="number" className="input" value={packageForm.discount} onChange={(e) => setPackageForm({ ...packageForm, discount: e.target.value })} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Select Individual Services to Include in Package *</label>
                    <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                      Selected: {packageForm.selectedServices.length} Tests
                    </span>
                  </div>

                  <input 
                    type="text" 
                    className="input" 
                    placeholder="Search test services..." 
                    value={packageSearch} 
                    onChange={(e) => setPackageSearch(e.target.value)} 
                    style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', marginBottom: '8px', padding: '6px 10px', fontSize: '12px' }}
                  />

                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-primary)', borderRadius: '8px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--bg-primary)' }}>
                    {services
                      .filter(s => !packageSearch || s.name.toLowerCase().includes(packageSearch.toLowerCase()) || s.service_code.toLowerCase().includes(packageSearch.toLowerCase()))
                      .map(s => {
                        const isChecked = packageForm.selectedServices.includes(s.service_id);
                        return (
                          <label key={s.service_id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', background: isChecked ? 'rgba(14,165,233,0.08)' : 'transparent' }}>
                            <input type="checkbox" checked={isChecked} onChange={() => handleServiceSelectToggle(s.service_id)} />
                            <span style={{ fontWeight: isChecked ? 600 : 400 }}>{s.name} ({s.service_code})</span>
                            <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>Rs. {parseFloat(s.price).toFixed(2)}</span>
                          </label>
                        );
                      })}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px', borderTop: '1px solid var(--border-primary)', paddingTop: '16px' }}>
                  <Button variant="secondary" type="button" onClick={() => setPackageModalOpen(false)}>Cancel</Button>
                  <Button variant="primary" type="submit" loading={modalLoading}>
                    {editingPackageId ? 'Update Grouped Profile' : 'Save Grouped Profile'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {importModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', zIndex: 1000, overflowY: 'auto', padding: '40px 16px' }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '12px', width: '100%', maxWidth: '800px', padding: '24px', position: 'relative', margin: 'auto' }}>
            <button onClick={() => { setImportModalOpen(false); setImportPreview([]); setImportErrors([]); }} style={{ position: 'absolute', right: '16px', top: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📦</span> Bulk Import Diagnostics Catalog
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 20px 0' }}>
              Preview and verify diagnostic test records extracted from your template file before insertion.
            </p>

            {/* Error detection panel */}
            {importErrors.length > 0 && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', padding: '12px', marginBottom: '16px', maxHeight: '180px', overflowY: 'auto' }}>
                <h4 style={{ color: '#ef4444', margin: '0 0 6px 0', fontSize: '13px', fontWeight: 700 }}>
                  Validation Errors Found ({importErrors.length}) - Please fix template before importing:
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-primary)', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {importErrors.map((err, idx) => (
                    <li key={idx} style={{ color: 'var(--text-primary)' }}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {importErrors.length === 0 && importPreview.length > 0 && (
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--accent-success)', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: 'var(--accent-success)', fontSize: '13px', fontWeight: 600 }}>
                ✓ No errors found. All {importPreview.length} test service profiles are verified and ready for import!
              </div>
            )}

            {/* Live Preview List */}
            <div style={{ border: '1px solid var(--border-primary)', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px', background: 'var(--bg-primary)' }}>
              <div style={{ background: 'var(--bg-card)', padding: '10px 16px', borderBottom: '1px solid var(--border-primary)', fontWeight: 700, fontSize: '12px', color: 'var(--text-secondary)' }}>
                PREVIEWING EXTRACTED SERVICES ({importPreview.length})
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {importPreview.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
                    Select a CSV template file to begin validation preview.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-primary)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '8px 12px' }}>Code</th>
                        <th style={{ padding: '8px 12px' }}>Service Name</th>
                        <th style={{ padding: '8px 12px' }}>Department</th>
                        <th style={{ padding: '8px 12px' }}>Format</th>
                        <th style={{ padding: '8px 12px' }}>Price</th>
                        <th style={{ padding: '8px 12px' }}>Parameters</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 700 }}>{item.service_code}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 600 }}>{item.name}</td>
                          <td style={{ padding: '8px 12px' }}>{item.category}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{ fontSize: '10px', background: 'var(--bg-card)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
                              {item.report_type}
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px', fontWeight: 600 }}>${item.price.toFixed(2)}</td>
                          <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>
                            {item.report_type === 'Structured' ? `${item.parameters.length} params` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-primary)', paddingTop: '16px' }}>
              <Button variant="secondary" onClick={() => { setImportModalOpen(false); setImportPreview([]); setImportErrors([]); }}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleCommitImport} 
                loading={importLoading} 
                disabled={importErrors.length > 0 || importPreview.length === 0}
              >
                Import Verified Catalog
              </Button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
export default ServiceCatalog;
