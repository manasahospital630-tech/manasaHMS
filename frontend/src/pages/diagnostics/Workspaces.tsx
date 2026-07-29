import React, { useState, useEffect } from 'react';
import { Beaker, ShieldAlert, Award, FileText, CheckCircle, RefreshCw, X, AlertTriangle, Upload, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import api from '../../api/client';
import { resolvePatientReferenceRange } from '../../utils/referenceRangeResolver';

export const Workspaces: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeWorkspace, setActiveWorkspace] = useState<'collection' | 'lab' | 'imaging' | 'verification'>('collection');

  // Modal Action States
  const [actionItem, setActionItem] = useState<any | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Form Fields
  const [containerType, setContainerType] = useState('EDTA Tube (Purple Top)');
  const [barcode, setBarcode] = useState('');
  
  // Lab result fields
  const [actualResult, setActualResult] = useState('');
  const [labStatus, setLabStatus] = useState('Normal');
  const [selectedMachineId, setSelectedMachineId] = useState('');
  
  // Imaging fields (Radiology, USG, ECG)
  const [findings, setFindings] = useState('');
  const [impression, setImpression] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [clinicalHistory, setClinicalHistory] = useState('');

  // Doctor verification fields
  const [verifyStatus, setVerifyStatus] = useState('Approved');
  const [verifyNotes, setVerifyNotes] = useState('');
  const [paramValues, setParamValues] = useState<{ [paramId: string]: string }>({});
  const [expandedPackages, setExpandedPackages] = useState<{ [key: string]: boolean }>({});
  const [pkgBarcodes, setPkgBarcodes] = useState<{ [container: string]: string }>({});

  const getSpecimenCategory = (sampleReq: string) => {
    const req = (sampleReq || '').toLowerCase().trim();
    if (!req || req === 'none' || req.includes('ecg')) {
      return 'Non-Sample / ECG';
    }
    if (req.includes('fluoride') || req.includes('grey') || req.includes('gray') || req.includes('glucose') || req.includes('rbs') || req.includes('fbs') || req.includes('ppbs')) {
      return 'Sodium Fluoride Tube (Grey Top)';
    }
    if (req.includes('edta') || req.includes('purple') || req.includes('blood') || req.includes('cbp') || req.includes('cbc')) {
      return 'EDTA Tube (Purple Top)';
    }
    if (req.includes('serum') || req.includes('red') || req.includes('plain') || req.includes('clot') || req.includes('biochem') || req.includes('lft') || req.includes('rft') || req.includes('electrolytes') || req.includes('widal')) {
      return 'Plain Tube (Red Top)';
    }
    if (req.includes('urine') || req.includes('cue')) {
      return 'Urine Sterile Container';
    }
    if (req.includes('stool')) {
      return 'Stool Collection Cup';
    }
    return 'Plain Tube (Red Top)';
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
    'NEUTROPHILS': '40 - 80%',
    'LYMPHOCYTES': '20 - 40%',
    'MONOCYTES': '2 - 10%',
    'EOSINOPHILS': '1 - 6%',
    'BASOPHILS': '1 - 2%',
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

  const getPatientReferenceRange = (p: any, patientAge: any, patientGender: string) => {
    return resolvePatientReferenceRange(p, { age: patientAge, gender: patientGender });
  };

  const getAbnormalStatus = (valStr: string, rangeStr: string): 'Normal' | 'Low' | 'High' => {
    if (!valStr || !rangeStr || rangeStr === '—' || rangeStr === '-') return 'Normal';
    const val = parseFloat(valStr.trim());
    if (isNaN(val)) return 'Normal';
    
    const rangeClean = rangeStr.replace(/\s+/g, ' ').trim();
    if (rangeClean.includes('-')) {
      const parts = rangeClean.split('-');
      const low = parseFloat(parts[0].trim());
      const high = parseFloat(parts[1].trim());
      if (!isNaN(low) && !isNaN(high)) {
        if (val < low) return 'Low';
        if (val > high) return 'High';
      }
    } else {
      if (rangeClean.startsWith('<=')) {
        const limit = parseFloat(rangeClean.substring(2).trim());
        if (!isNaN(limit) && val > limit) return 'High';
      } else if (rangeClean.startsWith('>=')) {
        const limit = parseFloat(rangeClean.substring(2).trim());
        if (!isNaN(limit) && val < limit) return 'Low';
      } else if (rangeClean.startsWith('<')) {
        const limit = parseFloat(rangeClean.substring(1).trim());
        if (!isNaN(limit) && val >= limit) return 'High';
      } else if (rangeClean.startsWith('>')) {
        const limit = parseFloat(rangeClean.substring(1).trim());
        if (!isNaN(limit) && val <= limit) return 'Low';
      }
    }
    return 'Normal';
  };

  const checkIsAbnormal = (valStr: string, rangeStr: string): boolean => {
    if (!valStr || !rangeStr || rangeStr === '—' || rangeStr === '-') return false;
    
    const valClean = valStr.trim();
    const rangeClean = rangeStr.replace(/\s+/g, ' ').trim();

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
    if (cleanRange.includes('-')) {
      const parts = cleanRange.split('-');
      const low = parseFloat(parts[0].trim());
      const high = parseFloat(parts[1].trim());
      if (!isNaN(low) && !isNaN(high)) {
        return val < low || val > high;
      }
    } else {
      if (cleanRange.startsWith('<=')) {
        const limit = parseFloat(cleanRange.substring(2).trim());
        if (!isNaN(limit)) return val > limit;
      } else if (cleanRange.startsWith('>=')) {
        const limit = parseFloat(cleanRange.substring(2).trim());
        if (!isNaN(limit)) return val < limit;
      } else if (cleanRange.startsWith('<')) {
        const limit = parseFloat(cleanRange.substring(1).trim());
        if (!isNaN(limit)) return val >= limit;
      } else if (cleanRange.startsWith('>')) {
        const limit = parseFloat(cleanRange.substring(1).trim());
        if (!isNaN(limit)) return val <= limit;
      }
    }
    return false;
  };

  const renderParameterInput = (p: any) => {
    const pKey = p.parameter_id || p.parameterId || p.name || 'param';
    const val = paramValues[pKey] !== undefined ? paramValues[pKey] : (p.name ? (paramValues[p.name] || '') : '');
    const iType = p.input_type || p.inputType || 'Number';
    
    if (iType === 'Dropdown') {
      const opts = (p.dropdown_options || p.dropdownOptions || '').split(',').map((opt: string) => opt.trim()).filter(Boolean);
      return (
        <select
          className="select"
          required
          value={val}
          onChange={(e) => {
            const newV = e.target.value;
            setParamValues((prev: any) => {
              const updated = { ...prev, [pKey]: newV };
              if (p.name) updated[p.name] = newV;
              return updated;
            });
          }}
          style={{ height: '28px', padding: '0 8px', fontSize: '12px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)', width: '100%', borderRadius: '6px' }}
        >
          <option value="">Select Result</option>
          {opts.map((opt: string) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }
    
    return (
      <input 
        type="text"
        className="input" 
        required
        value={val} 
        onChange={(e) => {
          const newV = e.target.value;
          setParamValues((prev: any) => {
            const updated = { ...prev, [pKey]: newV };
            if (p.name) updated[p.name] = newV;
            return updated;
          });
        }}
        placeholder={iType === 'Number' ? 'Numeric/Text Value' : 'Text Result'}
        style={{ height: '28px', padding: '4px 8px', fontSize: '12px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)', borderRadius: '6px', width: '100%' }}
      />
    );
  };

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

  const loadWorkspaceData = async () => {
    setLoading(true);
    try {
      const [ordersRes, machinesRes] = await Promise.all([
        api.get('/diagnostics/orders'),
        api.get('/diagnostics/machines')
      ]);
      if (ordersRes.data.success) setOrders(ordersRes.data.data);
      if (machinesRes.data.success) {
        setMachines(machinesRes.data.data);
        if (machinesRes.data.data.length > 0) {
          setSelectedMachineId(machinesRes.data.data[0].machine_id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, []);

  const openActionModal = (item: any) => {
    setActionItem(item);
    
    const isPkg = item.type === 'package';
    const firstItem = isPkg ? item.items[0] : item.item;
    
    setBarcode(`BAR-${Date.now().toString().substring(8)}`);
    setActualResult(firstItem?.lab_result?.actual_result || '');
    setLabStatus(firstItem?.lab_result?.status || 'Normal');
    setFindings('');
    setImpression('');
    setConclusion('');
    setClinicalHistory('');
    setVerifyStatus('Approved');
    setVerifyNotes('');
    setActionError('');

    // Pre-populate barcodes for packages if activeWorkspace is collection
    if (isPkg && activeWorkspace === 'collection') {
      const barcodes: { [container: string]: string } = {};
      const uniqueContainers = Array.from(new Set(item.items.map((i: any) => getSpecimenCategory(i.sample_required))));
      uniqueContainers.forEach((container: any, idx: number) => {
        barcodes[container] = `BAR-${container.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '')}-${Date.now().toString().substring(8)}-${idx + 1}`;
      });
      setPkgBarcodes(barcodes);
    }

    // Initialize parameter values
    const initialParams: { [key: string]: string } = {};
    const setVal = (pKey: string, pName: string, val: string) => {
      if (pKey) initialParams[pKey] = val;
      if (pName) initialParams[pName] = val;
    };

    if (isPkg) {
      item.items.forEach((pItem: any) => {
        if (pItem.result_parameters && Array.isArray(pItem.result_parameters) && pItem.result_parameters.length > 0) {
          pItem.result_parameters.forEach((rp: any) => {
            setVal(rp.parameter_id, rp.parameter_name || rp.name, rp.actual_value || '');
          });
        }
        if (pItem.parameters && Array.isArray(pItem.parameters)) {
          pItem.parameters.forEach((p: any) => {
            const existing = initialParams[p.parameter_id] || initialParams[p.name] || '';
            setVal(p.parameter_id, p.name, existing);
          });
        }
      });
    } else if (firstItem) {
      if (firstItem.result_parameters && Array.isArray(firstItem.result_parameters) && firstItem.result_parameters.length > 0) {
        firstItem.result_parameters.forEach((rp: any) => {
          setVal(rp.parameter_id, rp.parameter_name || rp.name, rp.actual_value || '');
        });
      }
      if (firstItem.parameters && Array.isArray(firstItem.parameters)) {
        firstItem.parameters.forEach((p: any) => {
          const existing = initialParams[p.parameter_id] || initialParams[p.name] || '';
          setVal(p.parameter_id, p.name, existing);
        });
      }
    }
    setParamValues(initialParams);
    setActionModalOpen(true);
  };

  const handleLoadBoilerplate = () => {
    if (!actionItem) return;
    const firstItem = actionItem.type === 'package' ? actionItem.items[0] : actionItem.item;
    if (!firstItem || !firstItem.normal_range) return;

    try {
      const template = JSON.parse(firstItem.normal_range);
      if (template.technique) {
        setFindings(`TECHNIQUE:\n${template.technique}\n\nFINDINGS:\n${template.findings || ''}`);
      } else {
        setFindings(template.findings || firstItem.normal_range);
      }
      if (template.impression) {
        setImpression(template.impression);
      }
    } catch (e) {
      setFindings(firstItem.normal_range);
    }
  };

  const handleSendCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError('');
    try {
      const itemsToVerify = actionItem.type === 'package' ? actionItem.items : [actionItem.item];
      for (const targetItem of itemsToVerify) {
        const payload = {
          itemId: targetItem.item_id,
          status: 'Correction',
          notes: verifyNotes || 'Requested clinician correction',
          digitalSignatureUsed: 'Dr. Pathologist Digital Approval Stamp'
        };
        await api.post('/diagnostics/results/verify', payload);
      }
      setActionModalOpen(false);
      loadWorkspaceData();
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Failed to submit correction request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError('');

    try {
      if (activeWorkspace === 'collection') {
        if (actionItem.type === 'package') {
          for (const targetItem of actionItem.items) {
            const container = getSpecimenCategory(targetItem.sample_required);
            const targetBarcode = pkgBarcodes[container] || barcode;
            const payload = {
              itemId: targetItem.item_id,
              containerType: container,
              barcode: targetBarcode,
              remarks: 'Grouped profile sample collection logged successfully'
            };
            await api.post('/diagnostics/samples/collect', payload);
          }
        } else {
          const payload = {
            itemId: actionItem.item.item_id,
            containerType,
            barcode,
            remarks: 'Sample collection logged successfully'
          };
          await api.post('/diagnostics/samples/collect', payload);
        }
      } else if (activeWorkspace === 'lab') {
        if (actionItem.type === 'package') {
          for (const targetItem of actionItem.items) {
            const hasParams = targetItem.parameters && Array.isArray(targetItem.parameters) && targetItem.parameters.length > 0;
            let submitActualResult = '';
            let submitParams = undefined;

            if (hasParams) {
              submitParams = targetItem.parameters.map((p: any) => {
                const activeRange = getPatientReferenceRange(p, actionItem.patientAge, actionItem.patientGender);
                const val = paramValues[p.parameter_id] || '';
                const pStatus = getAbnormalStatus(val, activeRange);
                return {
                  parameterId: p.parameter_id,
                  name: p.name,
                  unit: p.unit,
                  referenceRange: activeRange,
                  actualValue: val,
                  status: pStatus
                };
              });
              submitActualResult = submitParams.map((p: any) => `${p.name}: ${p.actualValue} ${p.unit || ''}`).join(', ');
            } else {
              submitActualResult = paramValues[`svc-${targetItem.item_id}`] || 'Normal';
            }

            let computedStatus = labStatus;
            if (submitParams) {
              if (submitParams.some((p: any) => p.status === 'High')) {
                computedStatus = 'High';
              } else if (submitParams.some((p: any) => p.status === 'Low')) {
                computedStatus = 'Low';
              }
            }

            const payload = {
              itemId: targetItem.item_id,
              actualResult: submitActualResult,
              referenceRange: targetItem.normal_range || 'Normal',
              status: computedStatus,
              machineId: selectedMachineId || null,
              remarks: 'Grouped profile lab values entered',
              parameters: submitParams
            };
            await api.post('/diagnostics/results/submit?type=lab', payload);
          }
        } else {
          const target = actionItem.item;
          const hasParams = target.parameters && Array.isArray(target.parameters) && target.parameters.length > 0;
          let submitActualResult = actualResult;
          let submitParams = undefined;

          if (hasParams) {
            submitParams = target.parameters.map((p: any) => {
              const activeRange = getPatientReferenceRange(p, actionItem.patientAge, actionItem.patientGender);
              const val = paramValues[p.parameter_id] || '';
              const pStatus = getAbnormalStatus(val, activeRange);
              return {
                parameterId: p.parameter_id,
                name: p.name,
                unit: p.unit,
                referenceRange: activeRange,
                actualValue: val,
                status: pStatus
              };
            });
            submitActualResult = submitParams.map((p: any) => `${p.name}: ${p.actualValue} ${p.unit || ''}`).join(', ');
          }

          let computedStatus = labStatus;
          if (submitParams) {
            if (submitParams.some((p: any) => p.status === 'High')) {
              computedStatus = 'High';
            } else if (submitParams.some((p: any) => p.status === 'Low')) {
              computedStatus = 'Low';
            }
          }

          const payload = {
            itemId: target.item_id,
            actualResult: submitActualResult,
            referenceRange: target.normal_range,
            status: computedStatus,
            machineId: selectedMachineId || null,
            remarks: 'Lab values entered',
            parameters: submitParams
          };
          await api.post('/diagnostics/results/submit?type=lab', payload);
        }
      } else if (activeWorkspace === 'imaging') {
        const target = actionItem.item;
        const isXray = target.category_name === 'Radiology';
        const isUsg = target.category_name === 'Ultrasound';
        
        if (isXray) {
          const payload = {
            itemId: target.item_id,
            findings,
            impression,
            conclusion,
            imageUrls: ['/scans/xray_stub.jpg']
          };
          await api.post('/diagnostics/results/submit?type=radiology', payload);
        } else if (isUsg) {
          const payload = {
            itemId: target.item_id,
            findings,
            impression,
            clinicalHistory,
            recommendations: conclusion
          };
          await api.post('/diagnostics/results/submit?type=ultrasound', payload);
        } else {
          // ECG
          const hasParams = target.parameters && Array.isArray(target.parameters) && target.parameters.length > 0;
          let submitParams = undefined;
          let submitFindings = findings;
          if (hasParams) {
            submitParams = target.parameters.map((p: any) => ({
              parameterId: p.parameter_id,
              name: p.name,
              unit: p.unit,
              referenceRange: p.reference_range,
              actualValue: paramValues[p.parameter_id] || ''
            }));
            submitFindings = submitParams.map((p: any) => `${p.name}: ${p.actualValue} ${p.unit || ''}`).join(', ');
          }

          const payload = {
            itemId: target.item_id,
            findings: submitFindings,
            interpretation: impression || 'ECG Analysis Completed',
            recommendation: conclusion,
            graphUrl: '/scans/ecg_graph.png',
            parameters: submitParams
          };
          await api.post('/diagnostics/results/submit?type=ecg', payload);
        }
      } else if (activeWorkspace === 'verification') {
        const itemsToVerify = actionItem.type === 'package' ? actionItem.items : [actionItem.item];
        for (const targetItem of itemsToVerify) {
          const payload = {
            itemId: targetItem.item_id,
            status: verifyStatus,
            notes: verifyNotes,
            digitalSignatureUsed: 'Dr. Pathologist Digital Approval Stamp'
          };
          await api.post('/diagnostics/results/verify', payload);
        }
      }

      setActionModalOpen(false);
      loadWorkspaceData();
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Failed to submit clinical workspace action.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter items in orders based on current workspace, preserving package grouping
  const getGroupedWorkspaceItems = () => {
    const groups: any[] = [];
    
    orders.forEach(o => {
      const matchingItems = (o.items || []).filter((item: any) => {
        const requiresSample = item.sample_required && item.sample_required !== 'None' && item.sample_required !== '';
        return (
          (activeWorkspace === 'collection' && requiresSample && item.status === 'Ordered') ||
          (activeWorkspace === 'lab' && requiresSample && item.status === 'SampleCollected') ||
          (activeWorkspace === 'imaging' && !requiresSample && (item.status === 'Ordered' || item.status === 'SampleCollected')) ||
          (activeWorkspace === 'verification' && item.status === 'Resulted')
        );
      });

      if (matchingItems.length === 0) return;

      const packageGroups: { [packageId: string]: any[] } = {};
      const standaloneItems: any[] = [];

      matchingItems.forEach((item: any) => {
        const fullItem = {
          ...item,
          order_id: o.order_id,
          patient_name: `${o.first_name} ${o.last_name}`,
          patient_mrn: o.medical_record_number,
          order_number: o.order_number,
          priority: o.priority,
          clinical_notes: o.clinical_notes,
          diagnosis: o.diagnosis,
          all_order_items: o.items || []
        };

        if (item.package_id) {
          if (!packageGroups[item.package_id]) {
            packageGroups[item.package_id] = [];
          }
          packageGroups[item.package_id].push(fullItem);
        } else {
          standaloneItems.push(fullItem);
        }
      });

      Object.keys(packageGroups).forEach(packageId => {
        const pItems = packageGroups[packageId];
        groups.push({
          type: 'package',
          orderId: o.order_id,
          orderNumber: o.order_number,
          patientName: `${o.first_name} ${o.last_name}`,
          patientMrn: o.medical_record_number,
          patientAge: o.patient_age || o.age,
          patientGender: o.patient_gender || o.gender,
          patient: {
            dob: o.patient_birth_date || o.birth_date,
            age: o.patient_age || o.age,
            gender: o.patient_gender || o.gender
          },
          priority: o.priority,
          clinicalNotes: o.clinical_notes,
          diagnosis: o.diagnosis,
          createdAt: o.created_at,
          packageId: packageId,
          packageName: pItems[0].package_name,
          items: pItems
        });
      });

      standaloneItems.forEach(item => {
        groups.push({
          type: 'standalone',
          orderId: o.order_id,
          orderNumber: o.order_number,
          patientName: `${o.first_name} ${o.last_name}`,
          patientMrn: o.medical_record_number,
          patientAge: o.patient_age || o.age,
          patientGender: o.patient_gender || o.gender,
          patient: {
            dob: o.patient_birth_date || o.birth_date,
            age: o.patient_age || o.age,
            gender: o.patient_gender || o.gender
          },
          priority: o.priority,
          clinicalNotes: o.clinical_notes,
          diagnosis: o.diagnosis,
          createdAt: o.created_at,
          item: item
        });
      });
    });

    return groups;
  };

  const workspaceItems = getGroupedWorkspaceItems();

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Beaker size={28} color="var(--accent-primary)" />
            Diagnostics Clinical Workspaces
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px' }}>
            Collect samples, input lab analyzer results, dictate scan findings & approve verifications
          </p>
        </div>
        <Button variant="secondary" onClick={loadWorkspaceData} icon={<RefreshCw size={14} />}>
          Refresh Queue
        </Button>
      </div>

      {/* Tabs Selector */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-primary)', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '2px' }}>
        {[
          { id: 'collection', label: 'Sample Collection Desk', count: orders.reduce((c, o) => c + (o.items || []).filter((i: any) => i.sample_required && i.sample_required !== 'None' && i.sample_required !== '' && i.status === 'Ordered').length, 0) },
          { id: 'lab', label: 'Laboratory Analyzer', count: orders.reduce((c, o) => c + (o.items || []).filter((i: any) => i.sample_required && i.sample_required !== 'None' && i.sample_required !== '' && i.status === 'SampleCollected').length, 0) },
          { id: 'imaging', label: 'Imaging Dept (X-Ray/USG/ECG)', count: orders.reduce((c, o) => c + (o.items || []).filter((i: any) => (!i.sample_required || i.sample_required === 'None' || i.sample_required === '') && (i.status === 'Ordered' || i.status === 'SampleCollected')).length, 0) },
          { id: 'verification', label: 'Pathologist Verification', count: orders.reduce((c, o) => c + (o.items || []).filter((i: any) => i.status === 'Resulted').length, 0) }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveWorkspace(tab.id as any)}
            style={{
              padding: '10px 18px',
              background: activeWorkspace === tab.id ? 'var(--bg-card)' : 'transparent',
              color: activeWorkspace === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
              border: activeWorkspace === tab.id ? '1px solid var(--border-primary)' : '1px solid transparent',
              borderBottom: activeWorkspace === tab.id ? '1px solid transparent' : '1px solid transparent',
              borderRadius: '8px 8px 0 0',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              marginBottom: '-3px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {tab.label}
            <span style={{ fontSize: '11px', background: tab.count > 0 ? 'var(--accent-danger)' : 'var(--bg-primary)', color: tab.count > 0 ? '#fff' : 'var(--text-muted)', padding: '2px 6px', borderRadius: '50px' }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <RefreshCw size={28} className="spin" color="var(--accent-primary)" style={{ animation: 'spin 1.5s linear infinite' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Loading active diagnostic queue...</span>
        </div>
      ) : workspaceItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '12px' }}>
          <CheckCircle size={48} color="var(--accent-success)" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: 0, fontWeight: 600 }}>Queue Clean & Completed</h3>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px' }}>
            There are no pending tasks waiting in this diagnostic workspace.
          </p>
        </div>
      ) : (
        <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-primary)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px' }}>Order Ref</th>
                  <th style={{ padding: '12px 16px' }}>Patient Info</th>
                  <th style={{ padding: '12px 16px' }}>Test requested</th>
                  <th style={{ padding: '12px 16px' }}>Priority</th>
                  <th style={{ padding: '12px 16px' }}>Clinical Indication</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Workspace Action</th>
                </tr>
              </thead>
              <tbody>
                {workspaceItems.map((group, idx) => {
                  const isPkg = group.type === 'package';
                  
                  if (isPkg) {
                    const isExpanded = expandedPackages[group.packageId] || false;
                    
                    // Group package items by specimen category for rendering
                    const sampleTypeGroups: { [container: string]: any[] } = {};
                    group.items.forEach((pItem: any) => {
                      const container = getSpecimenCategory(pItem.sample_required);
                      if (!sampleTypeGroups[container]) {
                        sampleTypeGroups[container] = [];
                      }
                      sampleTypeGroups[container].push(pItem);
                    });

                    return (
                      <React.Fragment key={`pkg-${group.packageId}-${idx}`}>
                        <tr style={{ borderBottom: '1px solid var(--border-primary)', background: 'rgba(59, 130, 246, 0.02)' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 700 }}>{group.orderNumber}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 600 }}>{group.patientName}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>MRN: {group.patientMrn}</div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              {group.packageName}
                              {group.items.some((i: any) => i.correction_required) && (
                                <span style={{ fontSize: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                  CORRECTION TAG
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                              <span style={{ fontSize: '10px', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                Package Profile ({group.items.length} Tests)
                              </span>
                              <button 
                                type="button"
                                onClick={() => setExpandedPackages({ ...expandedPackages, [group.packageId]: !isExpanded })}
                                style={{ fontSize: '11px', color: 'var(--accent-primary)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0, textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '2px' }}
                              >
                                {isExpanded ? <><ChevronUp size={12} /> Hide Included Tests</> : <><ChevronDown size={12} /> Show Included Tests</>}
                              </button>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ 
                              fontSize: '11px', padding: '2px 8px', borderRadius: '50px', fontWeight: 600,
                              background: group.priority === 'Emergency' ? 'rgba(244,63,94,0.12)' : 'rgba(100,116,139,0.1)',
                              color: group.priority === 'Emergency' ? 'var(--accent-danger)' : 'var(--text-secondary)'
                            }}>
                              {group.priority}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {group.diagnosis || group.clinicalNotes || 'Routine checkup'}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <Button variant="primary" size="sm" onClick={() => openActionModal(group)}>
                              {activeWorkspace === 'collection' && 'Collect Profile Samples'}
                              {activeWorkspace === 'lab' && 'Enter Group Results'}
                              {activeWorkspace === 'verification' && 'Review & Verify'}
                            </Button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={6} style={{ padding: '12px 24px', background: 'var(--bg-primary)', borderBottom: '1.5px solid var(--border-primary)' }}>
                              <div style={{ paddingLeft: '24px', borderLeft: '3px solid var(--accent-primary)' }}>
                                <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                  Test Parameters Grouped By Specimen Matrix / Container:
                                </div>
                                {Object.keys(sampleTypeGroups).map((container: string) => (
                                  <div key={container} style={{ marginBottom: '10px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: container.includes('Purple') ? '#a855f7' : container.includes('Red') ? '#ef4444' : container.includes('Grey') ? '#94a3b8' : '#3b82f6' }}></span>
                                      {container}
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingLeft: '14px' }}>
                                      {sampleTypeGroups[container].map((pItem: any) => (
                                        <div key={pItem.item_id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '6px', padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '160px' }}>
                                          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                                            {pItem.service_name}
                                            {pItem.correction_required && (
                                              <span style={{ fontSize: '9px', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1px 4px', borderRadius: '3px', fontWeight: 700 }}>
                                                Needs Correction
                                              </span>
                                            )}
                                          </div>
                                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Status: <span style={{ color: pItem.status === 'SampleCollected' ? 'var(--accent-success)' : 'var(--text-secondary)', fontWeight: 600 }}>{pItem.status}</span></div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  } else {
                    const standaloneItem = group.item;
                    return (
                      <tr key={`std-${standaloneItem.item_id}-${idx}`} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700 }}>{group.orderNumber}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600 }}>{group.patientName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>MRN: {group.patientMrn}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            {standaloneItem.service_name}
                            {standaloneItem.correction_required && (
                              <span style={{ fontSize: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                CORRECTION TAG
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Code: {standaloneItem.service_code} ({standaloneItem.category_name})</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ 
                            fontSize: '11px', padding: '2px 8px', borderRadius: '50px', fontWeight: 600,
                            background: group.priority === 'Emergency' ? 'rgba(244,63,94,0.12)' : 'rgba(100,116,139,0.1)',
                            color: group.priority === 'Emergency' ? 'var(--accent-danger)' : 'var(--text-secondary)'
                          }}>
                            {group.priority}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {group.diagnosis || group.clinicalNotes || 'Routine checkup'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <Button variant="primary" size="sm" onClick={() => openActionModal(group)}>
                            {activeWorkspace === 'collection' && 'Collect Sample'}
                            {activeWorkspace === 'lab' && 'Enter Results'}
                            {activeWorkspace === 'imaging' && 'Perform & Document'}
                            {activeWorkspace === 'verification' && 'Review & Verify'}
                          </Button>
                        </td>
                      </tr>
                    );
                  }
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Action Dialog Modal */}
      {actionModalOpen && actionItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', zIndex: 1000, overflowY: 'auto', padding: '40px 16px' }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '12px', width: '100%', maxWidth: actionItem.type === 'package' ? '640px' : '520px', padding: '24px', position: 'relative', margin: 'auto' }}>
            <button onClick={() => setActionModalOpen(false)} style={{ position: 'absolute', right: '16px', top: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
              {activeWorkspace === 'collection' && (actionItem.type === 'package' ? 'Phlebotomy Profile Sample Collection' : 'Phlebotomy Sample Collection')}
              {activeWorkspace === 'lab' && (actionItem.type === 'package' ? 'Grouped Profile Lab Result Entry' : 'Hematology & Biochemistry Entry')}
              {activeWorkspace === 'imaging' && 'Diagnostic Imaging Documentation'}
              {activeWorkspace === 'verification' && 'Sign-Off Report Verification'}
            </h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Patient: <strong>{actionItem.type === 'package' ? actionItem.patientName : actionItem.item.patient_name}</strong> | Test: <strong>{actionItem.type === 'package' ? actionItem.packageName : actionItem.item.service_name}</strong>
              {actionItem.type === 'package' && (
                <span style={{ color: '#3b82f6', fontWeight: 600, marginLeft: '6px' }}>[Package: {actionItem.packageName}]</span>
              )}
            </p>

            {actionError && (
              <div style={{ color: 'var(--accent-danger)', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
                {actionError}
              </div>
            )}

            <form onSubmit={handleActionSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* 1. Sample Collection Desk Form */}
                {activeWorkspace === 'collection' && (
                  <>
                    {actionItem.type === 'package' ? (
                      <>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                          Provide barcodes for each required specimen type/container in the package:
                        </div>
                        {Array.from(new Set(actionItem.items.map((i: any) => getSpecimenCategory(i.sample_required)))).map((container: any) => {
                          const matchingTests = actionItem.items.filter((i: any) => getSpecimenCategory(i.sample_required) === container);
                          return (
                            <div key={container} style={{ border: '1px solid var(--border-primary)', borderRadius: '8px', padding: '12px', marginBottom: '12px', background: 'var(--bg-primary)' }}>
                              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{container}</span>
                                <span style={{ fontSize: '11px', background: 'var(--accent-primary)', color: '#fff', padding: '1px 6px', borderRadius: '4px' }}>
                                  {matchingTests.length} {matchingTests.length === 1 ? 'Test' : 'Tests'}
                                </span>
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', marginBottom: '8px' }}>
                                Used for: {matchingTests.map((t: any) => t.service_name).join(', ')}
                              </div>
                              <div>
                                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Barcode Reference ID *</label>
                                <input
                                  type="text"
                                  className="input"
                                  required
                                  value={pkgBarcodes[container] || ''}
                                  onChange={(e) => setPkgBarcodes({ ...pkgBarcodes, [container]: e.target.value })}
                                  style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '13px', marginTop: '4px' }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </>
                    ) : (
                      <>
                        <div>
                          <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Container Tube Type *</label>
                          <select className="select" value={containerType} onChange={(e) => setContainerType(e.target.value)} required style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                            <option value="EDTA Tube (Purple Top)">EDTA Tube (Purple Top) - Hematology</option>
                            <option value="Plain Tube (Red Top)">Plain Tube (Red Top) - Serum/Biochemistry</option>
                            <option value="Sodium Fluoride (Grey Top)">Sodium Fluoride Tube (Grey Top) - Glucose</option>
                            <option value="Urine Sterile Container">Urine Sterile Container</option>
                            <option value="Stool Collection Cup">Stool Collection Cup</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Barcode Reference ID *</label>
                          <input type="text" className="input" value={barcode} onChange={(e) => setBarcode(e.target.value)} required style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'monospace' }} />
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* 2. Lab Results Entry Form */}
                {activeWorkspace === 'lab' && (
                  <>
                    {actionItem.type === 'package' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 700 }}>
                          Grouped Package Parameters ({actionItem.packageName}):
                        </div>
                        {actionItem.items.map((groupSvc: any) => (
                          <div key={groupSvc.item_id} style={{ border: '1px solid var(--border-primary)', borderRadius: '8px', padding: '12px', background: 'var(--bg-primary)' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', borderBottom: '1px solid var(--border-primary)', paddingBottom: '4px' }}>
                              {groupSvc.service_name} ({groupSvc.service_code})
                            </div>
                            {groupSvc.parameters && groupSvc.parameters.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1.2fr', gap: '8px', fontWeight: 'bold', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                  <span>PARAMETER</span>
                                  <span>VALUE *</span>
                                  <span>UNIT</span>
                                  <span>REF INTERVAL</span>
                                </div>
                                {groupSvc.parameters.map((p: any) => {
                                  const activeRange = getPatientReferenceRange(p, actionItem.patientAge, actionItem.patientGender);
                                  const isOut = checkIsAbnormal(paramValues[p.parameter_id] || '', activeRange);
                                  return (
                                    <div key={p.parameter_id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1.2fr', gap: '8px', alignItems: 'center', fontSize: '12px' }}>
                                      <span style={{ fontWeight: 600, color: isOut ? '#ef4444' : 'inherit' }}>
                                        {p.name} {isOut && <span style={{ fontWeight: 800, fontSize: '10px' }}>(ABNORMAL)</span>}
                                      </span>
                                      {renderParameterInput(p)}
                                      <span style={{ color: 'var(--text-muted)' }}>{p.unit || '-'}</span>
                                      <span style={{ color: isOut ? '#ef4444' : 'var(--text-secondary)', fontWeight: isOut ? '700' : '400', fontFamily: 'monospace' }}>{activeRange}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div>
                                <input 
                                  type="text" 
                                  className="input" 
                                  placeholder="Enter result value summary..."
                                  value={paramValues[`svc-${groupSvc.item_id}`] || ''} 
                                  onChange={(e) => setParamValues({ ...paramValues, [`svc-${groupSvc.item_id}`]: e.target.value })}
                                  style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '12px' }}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : actionItem.item.parameters && Array.isArray(actionItem.item.parameters) && actionItem.item.parameters.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--border-primary)', borderRadius: '8px', padding: '12px', background: 'var(--bg-primary)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1.2fr', gap: '8px', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid var(--border-primary)', paddingBottom: '6px', color: 'var(--text-secondary)' }}>
                          <span>PARAMETER</span>
                          <span>VALUE *</span>
                          <span>UNIT</span>
                          <span>REF INTERVAL</span>
                        </div>
                        {actionItem.item.parameters.map((p: any) => {
                          const activeRange = getPatientReferenceRange(p, actionItem.patientAge, actionItem.patientGender);
                          const isOut = checkIsAbnormal(paramValues[p.parameter_id] || '', activeRange);
                          return (
                            <div key={p.parameter_id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1.2fr', gap: '8px', alignItems: 'center', fontSize: '12px' }}>
                              <span style={{ fontWeight: 600, color: isOut ? '#ef4444' : 'inherit' }}>
                                {p.name} {isOut && <span style={{ fontWeight: 800, fontSize: '10px' }}>(ABNORMAL)</span>}
                              </span>
                              {renderParameterInput(p)}
                              <span style={{ color: 'var(--text-muted)' }}>{p.unit || '-'}</span>
                              <span style={{ color: isOut ? '#ef4444' : 'var(--text-secondary)', fontWeight: isOut ? '700' : '400', fontFamily: 'monospace' }}>{activeRange}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Analyzer Output Readings *</label>
                        <textarea className="input" rows={3} value={actualResult} onChange={(e) => setActualResult(e.target.value)} placeholder="e.g. Hemoglobin: 14.2 g/dL, WBC: 7,500/mcL" required style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Result Flag Status</label>
                        <select className="select" value={labStatus} onChange={(e) => setLabStatus(e.target.value)} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                          <option value="Normal">Normal Range</option>
                          <option value="Low">Low Value</option>
                          <option value="High">High Value</option>
                          <option value="Critical">Critical Alert Level</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Diagnostic Equipment</label>
                        <select className="select" value={selectedMachineId} onChange={(e) => setSelectedMachineId(e.target.value)} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                          <option value="">None / Manual Analysis</option>
                          {machines.map(m => <option key={m.machine_id} value={m.machine_id}>{m.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* 3. Imaging Department Form */}
                {activeWorkspace === 'imaging' && (
                  <>
                    {actionItem.item.parameters && Array.isArray(actionItem.item.parameters) && actionItem.item.parameters.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--border-primary)', borderRadius: '8px', padding: '12px', background: 'var(--bg-primary)', marginBottom: '10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1.2fr', gap: '8px', fontWeight: 'bold', fontSize: '11px', borderBottom: '1px solid var(--border-primary)', paddingBottom: '6px', color: 'var(--text-secondary)' }}>
                          <span>PARAMETER</span>
                          <span>VALUE *</span>
                          <span>UNIT</span>
                          <span>REF INTERVAL</span>
                        </div>
                        {actionItem.item.parameters.map((p: any) => (
                          <div key={p.parameter_id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1.2fr', gap: '8px', alignItems: 'center', fontSize: '12px' }}>
                            <span style={{ fontWeight: 600 }}>{p.name}</span>
                            {renderParameterInput(p)}
                            <span style={{ color: 'var(--text-muted)' }}>{p.unit || '-'}</span>
                            <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.reference_range || '-'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        {actionItem.item.category_name === 'Ultrasound' && (
                          <div>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Clinical History</label>
                            <input type="text" className="input" value={clinicalHistory} onChange={(e) => setClinicalHistory(e.target.value)} placeholder="Indication for scan" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                          </div>
                        )}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Dictated Findings *</label>
                            {((actionItem.type !== 'package' && actionItem.item.report_type === 'Descriptive') || 
                              (actionItem.type === 'package' && actionItem.items[0]?.report_type === 'Descriptive') ||
                              (actionItem.type !== 'package' && actionItem.item.normal_range && actionItem.item.normal_range.startsWith('{'))) && (
                              <button
                                type="button"
                                onClick={handleLoadBoilerplate}
                                style={{
                                  background: 'transparent',
                                  color: 'var(--accent-primary)',
                                  border: 'none',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: 0
                                }}
                              >
                                <FileText size={12} />
                                Load Boilerplate Template
                              </button>
                            )}
                          </div>
                          <textarea className="input" rows={3} value={findings} onChange={(e) => setFindings(e.target.value)} placeholder="Enter details of anatomy scanned..." required style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                        </div>
                      </>
                    )}
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Radiology/Sonology/ECG Impression *</label>
                      <input type="text" className="input" value={impression} onChange={(e) => setImpression(e.target.value)} placeholder="Clinical interpretation summary" required style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Recommendations / Conclusion</label>
                      <input type="text" className="input" value={conclusion} onChange={(e) => setConclusion(e.target.value)} placeholder="Follow up recommendations" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                    </div>
                  </>
                )}

                {/* 4. Pathologist/Doctor Verification Form */}
                {activeWorkspace === 'verification' && (
                  <>
                    <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: '8px', padding: '12px', marginBottom: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Resulted Data Findings:</h4>
                      {actionItem.type === 'package' ? (
                        actionItem.items.map((pkgItem: any) => {
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
                                reference_range: '-',
                                status: 'Normal'
                              }));
                            }
                          }

                          return (
                            <div key={pkgItem.item_id} style={{ marginBottom: '16px', borderBottom: '1px dashed var(--border-primary)', paddingBottom: '12px' }}>
                              <div style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '13px', marginBottom: '6px' }}>
                                {pkgItem.service_name} ({pkgItem.service_code})
                              </div>
                              <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr style={{ borderBottom: '1px solid var(--border-primary)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                                    <th style={{ padding: '6px 8px' }}>TEST PARAMETER</th>
                                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>OBSERVED VALUE</th>
                                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>FLAG / UNIT</th>
                                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>REFERENCE RANGE</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {pParams && pParams.length > 0 ? (
                                    pParams.map((rp: any, idx: number) => {
                                      const rpName = (rp.parameter_name || rp.name || '').toUpperCase();
                                      const refVal = rp.reference_range && rp.reference_range !== '-' ? rp.reference_range : (refRanges[rpName] || '—');
                                      const valClean = (rp.actual_value || rp.actualValue || '—').trim();
                                      const isAbnormal = (rp.status && rp.status !== 'Normal') || checkIsAbnormal(valClean, refVal);
                                      const flagUnitStr = isAbnormal ? `Abnormal / ${rp.unit || '%'}` : (rp.unit || '—');
                                      
                                      return (
                                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                                          <td style={{ padding: '6px 8px', fontWeight: 600 }}>{rp.parameter_name || rp.name || ''}</td>
                                          <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: isAbnormal ? '700' : '400', color: isAbnormal ? '#ef4444' : 'var(--text-primary)' }}>
                                            {valClean}
                                          </td>
                                          <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: isAbnormal ? '700' : '400', color: isAbnormal ? '#ef4444' : 'var(--text-secondary)' }}>
                                            {flagUnitStr}
                                          </td>
                                          <td style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--text-secondary)' }}>{refVal}</td>
                                        </tr>
                                      );
                                    })
                                  ) : (
                                    <tr>
                                      <td style={{ padding: '6px 8px', fontWeight: 600 }}>{pkgItem.service_name}</td>
                                      <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: pLr.status !== 'Normal' ? '700' : '400', color: pLr.status !== 'Normal' ? '#ef4444' : 'var(--text-primary)' }}>
                                        {pLr.actual_result || '—'}
                                      </td>
                                      <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: pLr.status !== 'Normal' ? '700' : '400', color: pLr.status !== 'Normal' ? '#ef4444' : 'var(--text-secondary)' }}>
                                        {pLr.status !== 'Normal' ? 'Abnormal / —' : '—'}
                                      </td>
                                      <td style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--text-secondary)' }}>{pLr.reference_range || pkgItem.normal_range || '—'}</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          );
                        })
                      ) : (
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '13px', marginBottom: '6px' }}>
                            {actionItem.item.service_name} ({actionItem.item.service_code})
                          </div>
                          {actionItem.item.category_name === 'Laboratory' ? (
                            (() => {
                              const sLr = actionItem.item.lab_result || {};
                              let sParams = actionItem.item.result_parameters || [];
                              
                              if ((!sParams || sParams.length === 0) && sLr.actual_result) {
                                const parsed = parseConcatenatedResult(sLr.actual_result);
                                if (parsed) {
                                  sParams = parsed.map((p: any, idx: number) => ({
                                    parameter_id: `parsed-${idx}`,
                                    parameter_name: p.name,
                                    actual_value: p.value,
                                    unit: p.unit,
                                    reference_range: '-',
                                    status: 'Normal'
                                  }));
                                }
                              }

                              return (
                                <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                                  <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-primary)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                                      <th style={{ padding: '6px 8px' }}>TEST PARAMETER</th>
                                      <th style={{ padding: '6px 8px', textAlign: 'center' }}>OBSERVED VALUE</th>
                                      <th style={{ padding: '6px 8px', textAlign: 'center' }}>FLAG / UNIT</th>
                                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>REFERENCE RANGE</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {sParams && sParams.length > 0 ? (
                                      sParams.map((rp: any, idx: number) => {
                                        const rpName = (rp.parameter_name || rp.name || '').toUpperCase();
                                        const paramDef = (actionItem.item?.parameters || []).find((p: any) =>
                                          (p.parameter_id && p.parameter_id === rp.parameter_id) ||
                                          (p.name && p.name.trim().toLowerCase() === (rp.parameter_name || rp.name || '').trim().toLowerCase())
                                        );
                                        const refVal = resolvePatientReferenceRange(paramDef || rp, actionItem.patient || { age: actionItem.patientAge, gender: actionItem.patientGender });
                                        const valClean = (rp.actual_value || rp.actualValue || '—').trim();
                                        const isAbnormal = (rp.status && rp.status !== 'Normal') || checkIsAbnormal(valClean, refVal);
                                        const flagUnitStr = isAbnormal ? `Abnormal / ${rp.unit || '%'}` : (rp.unit || '—');
                                        
                                        return (
                                          <tr key={idx} style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                                            <td style={{ padding: '6px 8px', fontWeight: 600 }}>{rp.parameter_name || rp.name || ''}</td>
                                            <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: isAbnormal ? '700' : '400', color: isAbnormal ? '#ef4444' : 'var(--text-primary)' }}>
                                              {valClean}
                                            </td>
                                            <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: isAbnormal ? '700' : '400', color: isAbnormal ? '#ef4444' : 'var(--text-secondary)' }}>
                                              {flagUnitStr}
                                            </td>
                                            <td style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--text-secondary)' }}>{refVal}</td>
                                          </tr>
                                        );
                                      })
                                    ) : (
                                      <tr>
                                        <td style={{ padding: '6px 8px', fontWeight: 600 }}>{actionItem.item.service_name}</td>
                                        <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: sLr.status !== 'Normal' ? '700' : '400', color: sLr.status !== 'Normal' ? '#ef4444' : 'var(--text-primary)' }}>
                                          {sLr.actual_result || '—'}
                                        </td>
                                        <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: sLr.status !== 'Normal' ? '700' : '400', color: sLr.status !== 'Normal' ? '#ef4444' : 'var(--text-secondary)' }}>
                                          {sLr.status !== 'Normal' ? 'Abnormal / —' : '—'}
                                        </td>
                                        <td style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--text-secondary)' }}>{sLr.reference_range || actionItem.item.normal_range || '—'}</td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              );
                            })()
                          ) : (
                            <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                              <div><strong>Findings:</strong></div>
                              <p style={{ margin: '4px 0 8px 0', whiteSpace: 'pre-wrap' }}>{actionItem.item.radiology_report?.findings || actionItem.item.ultrasound_report?.findings || actionItem.item.ecg_report?.findings || '—'}</p>
                              <div><strong>Impression:</strong></div>
                              <p style={{ margin: '4px 0 0 0', whiteSpace: 'pre-wrap' }}>{actionItem.item.radiology_report?.impression || actionItem.item.ultrasound_report?.impression || actionItem.item.ecg_report?.interpretation || '—'}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Sign-Off Status *</label>
                        <select className="select" value={verifyStatus} onChange={(e) => setVerifyStatus(e.target.value)} required style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                          <option value="Approved">Approve & Issue Final Report</option>
                          <option value="Rejected">Reject (Retest Required)</option>
                          <option value="PendingRetest">Request Sample Recollection</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Verification Notes / Comments</label>
                      <input type="text" className="input" value={verifyNotes} onChange={(e) => setVerifyNotes(e.target.value)} placeholder="Add clinician remarks..." style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px', borderTop: '1px solid var(--border-primary)', paddingTop: '16px' }}>
                  <Button variant="secondary" type="button" onClick={() => setActionModalOpen(false)}>Cancel</Button>
                  {activeWorkspace === 'verification' && (
                    <Button 
                      variant="secondary" 
                      type="button" 
                      onClick={(e) => handleSendCorrection(e)} 
                      loading={actionLoading}
                      style={{ background: 'var(--accent-warning, #f59e0b)', color: '#ffffff', fontWeight: 600 }}
                    >
                      Send for Correction
                    </Button>
                  )}
                  <Button variant="primary" type="submit" loading={actionLoading}>
                    {activeWorkspace === 'collection' && 'Log Collection'}
                    {activeWorkspace === 'lab' && 'Submit Results'}
                    {activeWorkspace === 'imaging' && 'Save Scan Findings'}
                    {activeWorkspace === 'verification' && 'Authorize Signature'}
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
export default Workspaces;
