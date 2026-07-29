import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Beaker, ShieldAlert, Printer, RefreshCw, AlertTriangle, FileText, CheckCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import api from '../../api/client';
import { ManasaLogoSvg, getQrSvgSync } from '../../utils/logoHelper';
import { resolvePatientReferenceRange } from '../../utils/referenceRangeResolver';

export const PublicReportView: React.FC = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<any>(null);
  const [hospitalSettings, setHospitalSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dueAlertOpen, setDueAlertOpen] = useState(false);
  const [dueAlertData, setDueAlertData] = useState<{ patientName: string; dueAmount: number; invoiceId?: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [reportRes, settingsRes] = await Promise.all([
        api.get(`/diagnostics/reports/public/${itemId}`),
        api.get('/admin/hospital-settings/public').catch(() => ({ data: { success: false } }))
      ]);

      if (reportRes.data.success) {
        setReport(reportRes.data.data);
      } else {
        setError('Report not found or not yet verified by clinician.');
      }

      if (settingsRes.data.success) {
        setHospitalSettings(settingsRes.data.data);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Unable to retrieve diagnostic test report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (itemId) {
      loadData();
    }
  }, [itemId]);

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

  const handlePrint = () => {
    const isOpPatient = (report?.patient_type || report?.patientType || 'OP').toUpperCase() === 'OP';
    const dueAmt = parseFloat(report?.due_amount !== undefined ? report.due_amount : 0);

    if (isOpPatient && dueAmt > 0) {
      setDueAlertData({
        patientName: report.patient_name || (report.first_name ? `${report.first_name} ${report.last_name || ''}`.trim() : 'Patient'),
        dueAmount: dueAmt,
        invoiceId: report.invoice_id
      });
      setDueAlertOpen(true);
      return;
    }
    window.print();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <RefreshCw size={36} className="spin" color="var(--accent-primary)" style={{ animation: 'spin 1.5s linear infinite' }} />
        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Retrieving digital laboratory report...</span>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)', padding: '20px' }}>
        <div style={{ textAlign: 'center', maxWidth: '420px', padding: '30px', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <AlertTriangle size={48} color="var(--accent-danger)" style={{ marginBottom: '16px' }} />
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Verification Error</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 20px 0', lineHeight: 1.5 }}>
            {error || 'This report link is invalid or has not yet been approved by the department clinical head.'}
          </p>
          <Button variant="primary" onClick={() => window.location.reload()} style={{ width: '100%' }}>Retry Verification</Button>
        </div>
      </div>
    );
  }

  const patientName = report.patient_name || (report.first_name ? `${report.first_name} ${report.last_name || ''}`.trim() : '—');
  const patientMrn = report.patient_mrn || report.medical_record_number || '—';
  
  const hasStructuredParameters = Boolean(
    (report.result_parameters && report.result_parameters.length > 0) ||
    (report.parameters && report.parameters.length > 0) ||
    (report.lab_result && report.lab_result.actual_result && report.lab_result.actual_result !== 'Multiple Values' && report.lab_result.actual_result !== '—') ||
    (report.package_items && report.package_items.some((pi: any) => 
      (pi.result_parameters && pi.result_parameters.length > 0) || 
      (pi.parameters && pi.parameters.length > 0) || 
      (pi.lab_result && pi.lab_result.actual_result)
    ))
  );
  const isLab = hasStructuredParameters;
  const hospitalName = hospitalSettings?.hospital_name || 'Telangana Diagnostics';
  const hospitalAddress = hospitalSettings?.hospital_address || 'Central Lab, IPM Campus, Narayanaguda, Hyd - 500029.';
  const phoneNumber = hospitalSettings?.phone_number || '040 - 68244555, 88012 33333';
  const website = hospitalSettings?.website || 'https://hannahhospitals.in';
  const email = hospitalSettings?.email || 'info@hannahhospitals.in';
  const gstin = hospitalSettings?.gstin || '36AABCU2450J1ZD';
  const licenseInfo = hospitalSettings?.license_info || 'PR-2026/8508';
  const logoUrl = hospitalSettings?.hospital_logo || hospitalSettings?.logo_url || hospitalSettings?.logo || null;

  const dateObj = new Date(report.created_at);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const formattedDate = `${pad(dateObj.getDate())}-${pad(dateObj.getMonth() + 1)}-${dateObj.getFullYear()} ${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())} ${dateObj.getHours() >= 12 ? 'PM' : 'AM'}`;

  const verifiedBy = report.verification?.verified_by_name || 'Dr. Priya Nair (Pathologist) M.D.';
  const verifiedDate = report.verification?.verified_at 
    ? new Date(report.verification.verified_at).toLocaleDateString() + ' ' + new Date(report.verification.verified_at).toLocaleTimeString()
    : formattedDate;

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
    'FASTING BLOOD SUGAR': '70-99 mg/dL'
  };

  const lr = report.lab_result || {};
  let finalParameters = report.result_parameters || [];
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

  const isHaematology = report.service_name?.toUpperCase().includes('BLOOD') || report.service_name?.toUpperCase().includes('HEM') || report.service_name?.toUpperCase().includes('CBC') || report.service_name?.toUpperCase().includes('CBP');
  
  // Determine department title for ALL test categories
  const getDeptTitle = () => {
    const catName = (report.category_name || '').toUpperCase();
    const svcName = (report.service_name || '').toUpperCase();
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
  const refHeader = isHaematology ? 'Normal Reference Range' : 'Biological Reference Interval';

  return (
    <div className="public-report-container" style={{ background: '#f1f5f9', minHeight: '100vh', padding: '20px 0', color: '#0f172a' }}>
      <style>{`
        @page {
          size: A4 portrait;
          margin: 10mm 15mm 12mm 15mm;
        }
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
          .no-print {
            display: none !important;
          }
          .public-report-container {
            background: #ffffff !important;
            padding: 0 !important;
            min-height: 0 !important;
          }
          .public-report-sheet {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          table.report-layout-table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
          }
          table.report-layout-table > tbody > tr > td {
            page-break-inside: auto !important;
            break-inside: auto !important;
          }
          thead {
            display: table-header-group !important;
          }
          tfoot {
            display: table-footer-group !important;
          }
          .test-group-block {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin-top: 14px !important;
            margin-bottom: 10px !important;
          }
          tr {
            page-break-inside: auto !important;
            break-inside: auto !important;
          }
          .footer-signature {
            margin-top: 25px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          h2, h3 { margin-top: 2px !important; margin-bottom: 2px !important; }
        }
      `}</style>

      {/* Action Bar (Hidden during printing) */}
      <div className="no-print" style={{ maxWidth: '800px', margin: '0 auto 16px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '12px 20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={20} color="#10b981" />
          <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>Clinically Verified Digital Copy</span>
        </div>
        <Button variant="primary" icon={<Printer size={14} />} onClick={handlePrint}>
          Print / Download PDF
        </Button>
      </div>

      {/* Render helper functions for Header and Signature */}
      {(() => {
        const renderHeaderAndPatientCard = () => (
          <thead style={{ display: 'table-header-group' }}>
            <tr>
              <td style={{ padding: 0, border: 'none' }}>
                {/* Hospital details */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '120px', verticalAlign: 'middle', padding: 0 }}>
                        {logoUrl ? (
                          <img 
                            src={logoUrl} 
                            alt={hospitalName} 
                            style={{ height: '70px', maxWidth: '140px', objectFit: 'contain', display: 'block' }} 
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                              const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'block';
                            }}
                          />
                        ) : null}
                        <div style={{ display: logoUrl ? 'none' : 'block' }}>
                          <ManasaLogoSvg size={70} />
                        </div>
                      </td>
                      <td style={{ verticalAlign: 'middle', paddingLeft: '15px', paddingRight: '15px' }}>
                        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0', lineHeight: 1.1 }}>{hospitalName}</h1>
                        <p style={{ fontSize: '11px', color: '#475569', margin: '1px 0' }}>{hospitalAddress}</p>
                        <p style={{ fontSize: '11px', color: '#475569', margin: '1px 0' }}>Phone: {phoneNumber} | Web: {website} | Email: {email}</p>
                        <p style={{ fontSize: '11px', color: '#475569', margin: '1px 0' }}><strong>GSTIN: {gstin}</strong></p>
                      </td>
                      <td style={{ width: '85px', verticalAlign: 'middle', textTransform: 'uppercase', padding: 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '4px', background: '#fff', textAlign: 'center', boxSizing: 'border-box' }}>
                          <div dangerouslySetInnerHTML={{ __html: getQrSvgSync(window.location.href, 58) }} />
                          <span style={{ fontSize: '6px', fontWeight: 'bold', color: '#64748b', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.2px' }}>VERIFY REPORT</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ borderBottom: '2.5px solid #0f172a', margin: '8px 0 14px 0' }} />

                {/* Metadata Patient Card Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '18px', fontSize: '12px', borderBottom: '2.5px solid #0f172a', paddingBottom: '10px' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '4px 0', fontWeight: 600, color: '#475569', width: '15%' }}>Patient Name:</td>
                      <td style={{ padding: '4px 0', fontWeight: 700, width: '35%', textTransform: 'uppercase' }}>{patientName}</td>
                      <td style={{ padding: '4px 0', fontWeight: 600, color: '#475569', width: '15%' }}>Ref. Doctor:</td>
                      <td style={{ padding: '4px 0', fontWeight: 700, width: '35%', textTransform: 'uppercase' }}>Dr. {report.doc_first} {report.doc_last}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 0', fontWeight: 600, color: '#475569' }}>Patient Id:</td>
                      <td style={{ padding: '4px 0', fontWeight: 700 }}>{patientMrn}</td>
                      <td style={{ padding: '4px 0', fontWeight: 600, color: '#475569' }}>Lab Id:</td>
                      <td style={{ padding: '4px 0', fontWeight: 700 }}>{report.item_id.substring(0, 8).toUpperCase()}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 0', fontWeight: 600, color: '#475569' }}>OP Id:</td>
                      <td style={{ padding: '4px 0', fontWeight: 700 }}>{report.order_number || 'HY-SVN-1225-00080'}</td>
                      <td style={{ padding: '4px 0', fontWeight: 600, color: '#475569' }}>Sample Collection Date:</td>
                      <td style={{ padding: '4px 0', fontWeight: 700 }}>{formattedDate}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 0', fontWeight: 600, color: '#475569' }}>Age/Gender:</td>
                      <td style={{ padding: '4px 0', fontWeight: 700 }}>{getAgeStr(report.birth_date || report.patient_birth_date, report.patient_age || report.age)} / {(report.gender || report.patient_gender || 'Male').toUpperCase()}</td>
                      <td style={{ padding: '4px 0', fontWeight: 600, color: '#475569' }}>Reporting Date & time:</td>
                      <td style={{ padding: '4px 0', fontWeight: 700 }}>{verifiedDate}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </thead>
        );

        const renderSignature = () => (
          <>
            <div className="footer-signature" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '40px', fontSize: '12px', color: '#475569', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <div>
                <p style={{ margin: 0, fontStyle: 'italic' }}>Please correlate clinically</p>
                <p style={{ margin: '6px 0 0 0' }}>Test Performed By : <strong style={{ color: '#0f172a' }}>{report.verification?.verified_by_name ? 'Pathology Lab Assistant' : 'clsowmya'}</strong></p>
              </div>
              <div style={{ textAlign: 'right', width: '220px' }}>
                <div style={{ fontFamily: 'Georgia, cursive', fontStyle: 'italic', color: '#1e3a8a', fontSize: '18px', fontWeight: 700, marginBottom: '2px' }}>
                  {verifiedBy.includes('Priya') ? 'Dr Priya Nair' : 'Dr Vidya Kedari'}
                </div>
                <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: '4px', fontWeight: 700, color: '#0f172a' }}>
                  {verifiedBy}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Consultant Pathologist
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: '11px', color: '#64748b', marginTop: '20px', fontWeight: 'bold', letterSpacing: '2px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              *** END OF REPORT ***
            </div>
          </>
        );

        if (isLab && report.package_id && report.package_items && report.package_items.length > 0) {
          return report.package_items.map((pkgItem: any, pIdx: number) => {
            const pLr = pkgItem.lab_result || {};
            let pParams = pkgItem.result_parameters || [];
            if ((!pParams || pParams.length === 0) && pLr.actual_result) {
              const parsed = parseConcatenatedResult(pLr.actual_result);
              if (parsed) {
                pParams = parsed.map((p: any, idx: number) => ({
                  parameter_id: `parsed-${idx}`,
                  parameter_name: p.name,
                  actual_value: p.value,
                  unit: p.unit,
                  reference_range: refRanges[p.name.toUpperCase()] || '',
                  status: 'Normal'
                }));
              }
            }

            return (
              <div key={pIdx} className="public-report-sheet single-report-page" style={{ 
                maxWidth: '800px', 
                margin: '0 auto 24px auto', 
                background: '#fff', 
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', 
                borderRadius: '12px', 
                padding: '30px 40px',
                border: '1px solid #e2e8f0',
                pageBreakAfter: pIdx < report.package_items.length - 1 ? 'always' : 'auto',
                breakAfter: pIdx < report.package_items.length - 1 ? 'page' : 'auto'
              }}>
                <table className="report-layout-table" style={{ width: '100%', borderCollapse: 'collapse', margin: 0, padding: 0 }}>
                  {renderHeaderAndPatientCard()}
                  <tbody>
                    <tr>
                      <td style={{ padding: 0, border: 'none' }}>
                        <div style={{ textAlign: 'center', marginTop: '10px', marginBottom: '15px' }}>
                          <h2 style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '1px', margin: 0, color: '#0f172a', textTransform: 'uppercase' }}>
                            {deptTitle}
                          </h2>
                          <h3 style={{ fontSize: '12px', fontWeight: 700, textDecoration: 'underline', margin: '4px 0 0 0', textTransform: 'uppercase', color: '#1e3a8a', letterSpacing: '0.5px' }}>
                            {report.package_name ? `${report.package_name} — ` : ''}{pkgItem.service_name} ({pkgItem.service_code || 'TEST'})
                          </h3>
                        </div>

                        <div className="test-group-block" style={{ marginTop: '14px', marginBottom: '8px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '4px', marginBottom: '8px', fontSize: '11px' }}>
                            <thead>
                              <tr style={{ borderTop: '1.5px solid #0f172a', borderBottom: '1.5px solid #0f172a', textAlign: 'left', fontSize: '10px', color: '#475569' }}>
                                <th style={{ padding: '6px 0', fontWeight: 700, width: '35%', textTransform: 'uppercase' }}>Test Parameter</th>
                                <th style={{ padding: '6px 0', fontWeight: 700, width: '20%', textAlign: 'center', textTransform: 'uppercase' }}>Observed Value</th>
                                <th style={{ padding: '6px 0', fontWeight: 700, width: '25%', textAlign: 'center', textTransform: 'uppercase' }}>Reference Range</th>
                                <th style={{ padding: '6px 0', fontWeight: 700, width: '20%', textAlign: 'right', textTransform: 'uppercase' }}>Flag / Unit</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pParams && pParams.length > 0 ? (
                                pParams.map((rp: any, idx: number) => {
                                  const name = rp.parameter_name || rp.name || '';
                                  const isHeader = name.toUpperCase() === 'DIFFERENTIAL LEUKOCYTE COUNT' || name.toUpperCase() === 'PHYSICAL EXAMINATION' || name.toUpperCase() === 'CHEMICAL EXAMINATION' || name.toUpperCase() === 'MICROSCOPIC EXAMINATION' || name.toUpperCase() === 'PERIPHERAL SMEAR';

                                  if (isHeader) {
                                    return (
                                      <tr key={idx} style={{ background: '#f8fafc' }}>
                                        <td colSpan={4} style={{ padding: '6px 0', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', color: '#1e3a8a', borderBottom: '1px solid #e2e8f0' }}>
                                          {name}
                                        </td>
                                      </tr>
                                    );
                                  }

                                  const paramDef = (pkgItem.parameters || report.parameters || []).find((p: any) =>
                                     (p.parameter_id && (p.parameter_id === rp.parameter_id || p.parameter_id === rp.parameterId)) ||
                                     (p.name && p.name.trim().toLowerCase() === (rp.parameter_name || rp.name || name || '').trim().toLowerCase())
                                   );
                                   const refVal = resolvePatientReferenceRange(paramDef || rp, report);
                                   const isAbnormal = (rp.status && rp.status !== 'Normal') || checkIsAbnormal(rp.actual_value || rp.actualValue || '', refVal);
                                   const flagText = rp.status && rp.status !== 'Normal' ? `${rp.status} / ` : (isAbnormal ? 'Abnormal / ' : '');
                                   const displayVal = rp.actual_value || rp.actualValue || '—';

                                  return (
                                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                      <td style={{ padding: '5px 0', fontWeight: 500, color: '#334155' }}>{name}</td>
                                      <td style={{ padding: '5px 0', textAlign: 'center', fontSize: '12px', fontWeight: isAbnormal ? '700' : '400', color: isAbnormal ? '#ef4444' : '#0f172a' }}>{displayVal}</td>
                                      <td style={{ padding: '5px 0', textAlign: 'center', color: '#475569', fontFamily: 'monospace', fontSize: '10px' }}>{refVal}</td>
                                      <td style={{ padding: '5px 0', textAlign: 'right', color: isAbnormal ? '#ef4444' : '#64748b', fontWeight: isAbnormal ? '700' : '400' }}>{flagText}{rp.unit || '—'}</td>
                                    </tr>
                                  );
                                })
                              ) : (
                                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '6px 0', fontWeight: 700, color: '#334155' }}>{pkgItem.service_name}</td>
                                  <td style={{ padding: '6px 0', textAlign: 'center', fontSize: '12px', fontWeight: pLr.status !== 'Normal' ? '700' : '400', color: pLr.status !== 'Normal' ? '#ef4444' : '#0f172a' }}>{pLr.actual_result || '—'}</td>
                                  <td style={{ padding: '6px 0', textAlign: 'center', color: '#475569', fontFamily: 'monospace', fontSize: '10px' }}>{pLr.reference_range || pkgItem.normal_range || '—'}</td>
                                  <td style={{ padding: '6px 0', textAlign: 'right', color: pLr.status !== 'Normal' ? '#ef4444' : '#64748b', fontWeight: pLr.status !== 'Normal' ? '700' : '400' }}>{pLr.status !== 'Normal' ? `${pLr.status} / —` : '—'}</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        {renderSignature()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          });
        }

        return (
          <div className="public-report-sheet single-report-page" style={{ 
            maxWidth: '800px', 
            margin: '0 auto', 
            background: '#fff', 
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', 
            borderRadius: '12px', 
            padding: '30px 40px',
            border: '1px solid #e2e8f0'
          }}>
            <table className="report-layout-table" style={{ width: '100%', borderCollapse: 'collapse', margin: 0, padding: 0 }}>
              {renderHeaderAndPatientCard()}
              <tbody>
                <tr>
                  <td style={{ padding: 0, border: 'none' }}>
                    <div style={{ marginBottom: '30px' }}>
                      {isLab ? (
                        <>
                          <div style={{ textAlign: 'center', marginTop: '10px', marginBottom: '15px' }}>
                            <h2 style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '1px', margin: 0, color: '#0f172a', textTransform: 'uppercase' }}>
                              {deptTitle}
                            </h2>
                            <h3 style={{ fontSize: '12px', fontWeight: 700, textDecoration: 'underline', margin: '4px 0 0 0', textTransform: 'uppercase', color: '#1e3a8a', letterSpacing: '0.5px' }}>
                              {report.service_name}
                            </h3>
                          </div>

                          {finalParameters.length > 0 ? (
                            <div className="test-group-block" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '12px' }}>
                                <thead>
                                   <tr style={{ borderTop: '1.5px solid #0f172a', borderBottom: '1.5px solid #0f172a', textAlign: 'left', fontSize: '11px', color: '#475569' }}>
                                     <th style={{ padding: '8px 0', fontWeight: 700, width: '35%', textTransform: 'uppercase' }}>Test Parameter</th>
                                     <th style={{ padding: '8px 0', fontWeight: 700, width: '20%', textAlign: 'center', textTransform: 'uppercase' }}>Observed Value</th>
                                     <th style={{ padding: '8px 0', fontWeight: 700, width: '25%', textAlign: 'center', textTransform: 'uppercase' }}>Reference Range</th>
                                     <th style={{ padding: '8px 0', fontWeight: 700, width: '20%', textAlign: 'right', textTransform: 'uppercase' }}>Flag / Unit</th>
                                   </tr>
                                </thead>
                                <tbody>
                                   {finalParameters.map((rp: any, idx: number) => {
                                     const name = rp.parameter_name || rp.name || '';
                                     const isHeader = name.toUpperCase() === 'DIFFERENTIAL LEUKOCYTE COUNT' || name.toUpperCase() === 'PHYSICAL EXAMINATION' || name.toUpperCase() === 'CHEMICAL EXAMINATION' || name.toUpperCase() === 'MICROSCOPIC EXAMINATION' || name.toUpperCase() === 'PERIPHERAL SMEAR';
                                     
                                     if (isHeader) {
                                       return (
                                         <tr key={idx} style={{ background: '#f8fafc' }}>
                                           <td colSpan={4} style={{ padding: '8px 0', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', color: '#1e3a8a', borderBottom: '1px solid #cbd5e1' }}>
                                              {name}
                                           </td>
                                         </tr>
                                       );
                                     }

                                      const paramDef = (report.parameters || []).find((p: any) =>
                                        (p.parameter_id && (p.parameter_id === rp.parameter_id || p.parameter_id === rp.parameterId)) ||
                                        (p.name && p.name.trim().toLowerCase() === (rp.parameter_name || rp.name || name || '').trim().toLowerCase())
                                      );
                                      const refName = paramDef?.ref_name || paramDef?.reference_range_name || (paramDef?.age_group && paramDef.age_group !== 'Universal' ? paramDef.age_group : '');
                                      const parameterDisplayName = refName ? `${name} (${refName})` : name;
                                      const refVal = resolvePatientReferenceRange(paramDef || rp, report);
                                      const isAbnormal = (rp.status && rp.status !== 'Normal') || checkIsAbnormal(rp.actual_value || rp.actualValue || '', refVal);
                                     const flagText = rp.status && rp.status !== 'Normal' ? `${rp.status} / ` : (isAbnormal ? 'Abnormal / ' : '');
                                     return (
                                       <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                         <td style={{ padding: '8px 0', fontWeight: 500 }}>{parameterDisplayName}</td>
                                         <td style={{ padding: '8px 0', textAlign: 'center' }}>
                                           <span style={{ fontSize: '13px', fontWeight: isAbnormal ? '700' : '400', color: isAbnormal ? '#ef4444' : '#0f172a' }}>{rp.actual_value || rp.actualValue || '—'}</span>
                                         </td>
                                         <td style={{ padding: '8px 0', textAlign: 'center', color: '#475569', fontFamily: 'monospace', fontSize: '11px' }}>{refVal}</td>
                                         <td style={{ padding: '8px 0', textAlign: 'right', color: isAbnormal ? '#ef4444' : '#64748b', fontWeight: isAbnormal ? '700' : '400' }}>
                                           {flagText}{rp.unit || '—'}
                                         </td>
                                      </tr>
                                     );
                                   })}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="test-group-block" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '12px' }}>
                                <thead>
                                  <tr style={{ borderTop: '1.5px solid #0f172a', borderBottom: '1.5px solid #0f172a', textAlign: 'left', fontSize: '11px', color: '#475569' }}>
                                    <th style={{ padding: '8px 0', fontWeight: 700, width: '35%', textTransform: 'uppercase' }}>Test Parameter</th>
                                    <th style={{ padding: '8px 0', fontWeight: 700, width: '20%', textAlign: 'center', textTransform: 'uppercase' }}>Observed Value</th>
                                    <th style={{ padding: '8px 0', fontWeight: 700, width: '25%', textAlign: 'center', textTransform: 'uppercase' }}>Reference Range</th>
                                    <th style={{ padding: '8px 0', fontWeight: 700, width: '20%', textAlign: 'right', textTransform: 'uppercase' }}>Flag / Unit</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '10px 0', fontWeight: 700 }}>{report.service_name}</td>
                                    <td style={{ padding: '10px 0', textAlign: 'center', fontWeight: report.lab_result?.status !== 'Normal' ? '700' : '400', color: report.lab_result?.status !== 'Normal' ? '#ef4444' : '#0f172a' }}>
                                      {report.lab_result?.actual_result || '—'}
                                    </td>
                                    <td style={{ padding: '10px 0', textAlign: 'center', fontFamily: 'monospace' }}>{report.lab_result?.reference_range || report.normal_range || '—'}</td>
                                    <td style={{ padding: '10px 0', textAlign: 'right', color: report.lab_result?.status !== 'Normal' ? '#ef4444' : '#64748b', fontWeight: report.lab_result?.status !== 'Normal' ? '700' : '400' }}>
                                      {report.lab_result?.status !== 'Normal' ? `${report.lab_result.status} / —` : '—'}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          )}
                          <div className="test-group-block" style={{ marginTop: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '10px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                            <h4 style={{ margin: '0 0 6px 0', color: '#475569', textTransform: 'uppercase', fontSize: '12px', fontWeight: 700 }}>Interpretation</h4>
                            <p style={{ margin: 0, fontSize: '12px', color: '#334155', whiteSpace: 'pre-wrap' }}>{report.lab_result?.remarks || report.lab_result?.interpretation || 'Within normal limits. Please correlate clinically.'}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ textAlign: 'center', marginTop: '10px', marginBottom: '15px' }}>
                            <h2 style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '1px', margin: 0, color: '#0f172a', textTransform: 'uppercase' }}>
                              {deptTitle}
                            </h2>
                            <h3 style={{ fontSize: '12px', fontWeight: 700, textDecoration: 'underline', margin: '4px 0 0 0', textTransform: 'uppercase', color: '#1e3a8a', letterSpacing: '0.5px' }}>
                              {report.service_name}
                            </h3>
                          </div>

                          <div className="test-group-block" style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '13px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                            <div>
                              <h4 style={{ margin: '0 0 6px 0', color: '#475569', textTransform: 'uppercase', fontSize: '12px' }}>Dictated Findings</h4>
                              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                                {report.radiology_report?.findings || report.ultrasound_report?.findings || report.ecg_report?.findings || '—'}
                              </div>
                            </div>
                            <div>
                              <h4 style={{ margin: '0 0 4px 0', color: '#475569', textTransform: 'uppercase', fontSize: '12px' }}>Diagnostic Impression</h4>
                              <p style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
                                {report.radiology_report?.impression || report.ultrasound_report?.impression || report.ecg_report?.interpretation || '—'}
                              </p>
                            </div>
                            {(report.radiology_report?.conclusion || report.ultrasound_report?.recommendations || report.ecg_report?.recommendation) && (
                              <div>
                                <h4 style={{ margin: '0 0 4px 0', color: '#475569', textTransform: 'uppercase', fontSize: '12px' }}>Conclusion / Recommendations</h4>
                                <p style={{ margin: 0, color: '#334155' }}>
                                  {report.radiology_report?.conclusion || report.ultrasound_report?.recommendations || report.ecg_report?.recommendation}
                                </p>
                              </div>
                            )}
                            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                              <h4 style={{ margin: '0 0 6px 0', color: '#475569', textTransform: 'uppercase', fontSize: '12px', fontWeight: 700 }}>Interpretation</h4>
                              <p style={{ margin: 0, fontSize: '12px', color: '#334155', whiteSpace: 'pre-wrap' }}>
                                {(report.radiology_report?.impression || report.ultrasound_report?.impression || report.ecg_report?.interpretation) || 'Please correlate clinically.'}
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {renderSignature()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })()}
      {/* OP Patient Due Payment Lock Alert Modal */}
      {dueAlertOpen && dueAlertData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-primary)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              padding: '20px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '10px', borderRadius: '12px', display: 'flex' }}>
                <AlertTriangle size={24} color="#ffffff" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Payment Pending</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', opacity: 0.9 }}>Report Print Lock Enforced</p>
              </div>
            </div>

            <div style={{ padding: '24px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-primary)', margin: 0, lineHeight: 1.6 }}>
                Payment Pending: Please collect the pending due amount (<strong>₹{dueAlertData.dueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>) before printing the report.
              </p>

              <div style={{
                marginTop: '20px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>OP Patient Due Amount</span>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-danger)' }}>₹{dueAlertData.dueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <span style={{ background: '#ef4444', color: '#ffffff', fontSize: '10px', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                  Lock Active
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <Button variant="secondary" onClick={() => setDueAlertOpen(false)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setDueAlertOpen(false);
                    navigate('/billing/invoices');
                  }}
                  style={{ background: '#2563eb', color: '#ffffff', fontWeight: 700 }}
                >
                  💰 Collect Remaining Bill
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PublicReportView;
