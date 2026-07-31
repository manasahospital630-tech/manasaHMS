import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Steps, Button, Form, Input, Select, Card, message } from 'antd';
import { ArrowLeft, ArrowRight, CheckCircle, Bed, Printer, LayoutDashboard, Grid } from 'lucide-react';
import api from '../../api/client';

const { Option } = Select;

export const IPAdmissionWizard: React.FC = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [form] = Form.useForm();
    const [isEmergency, setIsEmergency] = useState(false);

    const [beds, setBeds] = useState<any[]>([]);
    const [patientOptions, setPatientOptions] = useState<any[]>([]);
    
    // Receipt Printing State
    const [admissionSuccessData, setAdmissionSuccessData] = useState<any | null>(null);

    const handlePatientSearch = async (value: string) => {
        if (value.length > 2) {
            try {
                const res = await api.get(`/patients?search=${value}`);
                setPatientOptions(res.data.data.patients || []);
            } catch (error) {
                console.error('Failed to fetch patients', error);
            }
        } else {
            setPatientOptions([]);
        }
    };

    useEffect(() => {
        // Fetch all beds
        api.get('/inpatient/beds')
            .then(r => {
                const fetchedBeds = r.data.data || [];
                setBeds(fetchedBeds);
                
                // Read query params to prefill bed if redirected from floor map
                const queryParams = new URLSearchParams(window.location.search);
                const bedId = queryParams.get('bedId');
                const wardName = queryParams.get('wardName');
                const bedNum = queryParams.get('bedNum');

                if (bedId) {
                    form.setFieldsValue({ 
                        targetWard: bedId 
                    });
                    message.info(`Pre-allocated Bed ${bedNum || ''} in ${wardName || 'Ward'}`);
                }
            })
            .catch(() => {});
    }, [form]);

    const handleFormSubmission = async (values: any) => {
        try {
            const user = JSON.parse(localStorage.getItem('hms_user') || '{}');
            const doctorId = user.user_id || user.userId || user.id || 'u-doc-01';
            
            const payload = {
                admissionType: values.admissionType,
                admittingDoctorId: doctorId,
                targetBedId: values.targetWard, 
                reasonForAdmission: values.reason || values.chiefComplaint || 'Clinical admission requirement',
                ...(values.admissionType === 'Emergency' ? {
                    firstName: values.firstName,
                    lastName: values.lastName,
                    emergencyContact: values.emergencyContact,
                    chiefComplaint: values.reason || 'Emergency Admittance',
                } : {
                    patientId: values.patientId,
                })
            };

            const endpoint = values.admissionType === 'Emergency' 
                ? '/inpatient/admit/emergency' 
                : '/inpatient/admit/routine';
            
            const res = await api.post(endpoint, payload);
            
            // Extract details for the print receipt
            const targetBed = beds.find(b => b.bed_id === values.targetWard);
            let patientName = '';
            
            if (values.admissionType === 'Emergency') {
                patientName = `${values.firstName} ${values.lastName}`;
            } else {
                const patient = patientOptions.find(p => p.patient_id === values.patientId);
                patientName = patient ? `${patient.first_name} ${patient.last_name}` : 'Selected Patient';
            }

            const invoiceId = res.data.data.invoice_id || '';

            setAdmissionSuccessData({
                patientName,
                invoiceId,
                wardName: targetBed?.ward_name || 'General Ward',
                bedNum: targetBed?.bed_number || 'TBD',
                doctorName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Staff Physician'
            });

            message.success('Inpatient Admission generated successfully! Fee receipt ready.');
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || err.message || 'Failed to process admission';
            message.error(errorMsg);
        }
    };

    const handlePrint = () => {
        if (!admissionSuccessData) return;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Admission Receipt - Hannah HMS</title>
                        <style>
                            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
                            .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 20px; margin-bottom: 30px; }
                            .header h1 { margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px; }
                            .header p { margin: 5px 0 0 0; color: #64748b; font-size: 14px; }
                            .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                            .meta-block { display: flex; flex-direction: column; }
                            .meta-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
                            .meta-value { font-size: 14px; font-weight: 700; margin-top: 4px; color: #1e293b; }
                            .table { width: 100%; border-collapse: collapse; margin-bottom: 40px; margin-top: 10px; }
                            .table th { text-align: left; padding: 12px; border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 11px; text-transform: uppercase; }
                            .table td { padding: 16px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155; }
                            .total { text-align: right; font-size: 18px; font-weight: 800; color: #0f172a; border-top: 2px solid #cbd5e1; padding-top: 15px; }
                            .footer { text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 20px; margin-top: 50px; color: #94a3b8; font-size: 12px; }
                            @media print {
                                body { padding: 20px; }
                                button { display: none; }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h1>HANNAH HMS</h1>
                            <p>Hospital & Medical Services Inpatient Department</p>
                        </div>
                        <div class="meta">
                            <div class="meta-block">
                                <span class="meta-label">Patient Name</span>
                                <span class="meta-value">${admissionSuccessData.patientName}</span>
                            </div>
                            <div class="meta-block">
                                <span class="meta-label">Receipt Number</span>
                                <span class="meta-value">REC-${admissionSuccessData.invoiceId ? admissionSuccessData.invoiceId.substring(0, 8).toUpperCase() : 'N/A'}</span>
                            </div>
                            <div class="meta-block" style="margin-top: 15px;">
                                <span class="meta-label">Allocated Ward & Bed</span>
                                <span class="meta-value">${admissionSuccessData.wardName} - Bed ${admissionSuccessData.bedNum}</span>
                            </div>
                            <div class="meta-block" style="margin-top: 15px;">
                                <span class="meta-label">Date & Time</span>
                                <span class="meta-value">${new Date().toLocaleString()}</span>
                            </div>
                            <div class="meta-block" style="margin-top: 15px;">
                                <span class="meta-label">Admitting Consultant</span>
                                <span class="meta-value">Dr. ${admissionSuccessData.doctorName}</span>
                            </div>
                        </div>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th>Category</th>
                                    <th style="text-align: right;">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Inpatient Care Admission Intake Fee</td>
                                    <td>Admission Services</td>
                                    <td style="text-align: right; font-weight: 700; color: #0f172a;">Rs. 1,000.00</td>
                                </tr>
                            </tbody>
                        </table>
                        <div class="total">
                            Total Paid: Rs. 1,000.00
                        </div>
                        <div class="footer">
                            Official Receipt of Payment. Thank you for choosing Hannah HMS.<br/>
                            This receipt is generated automatically upon patient admittance clearance.
                        </div>
                        <script>
                            window.onload = function() {
                                window.print();
                                setTimeout(function() { window.close(); }, 500);
                            };
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    if (admissionSuccessData) {
        return (
            <div style={{ color: 'var(--text-primary)', maxWidth: '600px', margin: '40px auto' }}>
                <Card
                    style={{ 
                        background: 'var(--bg-card)', 
                        border: '1px solid var(--border-primary)', 
                        borderRadius: '12px',
                        textAlign: 'center',
                        padding: '30px'
                    }}
                >
                    <CheckCircle size={64} color="var(--accent-success)" style={{ margin: '0 auto 20px auto' }} />
                    <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                        Admission Confirmed
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                        Patient <strong>{admissionSuccessData.patientName}</strong> has been admitted to <strong>{admissionSuccessData.wardName} (Bed {admissionSuccessData.bedNum})</strong>.
                    </p>

                    <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: '8px', padding: '16px', marginBottom: '30px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Intake Admission Fee:</span>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Rs. 1,000.00</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Payment Status:</span>
                            <span style={{ fontWeight: 700, color: 'var(--accent-success)' }}>PAID (Cash)</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Receipt Number:</span>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                                REC-{admissionSuccessData.invoiceId ? admissionSuccessData.invoiceId.substring(0, 8).toUpperCase() : 'N/A'}
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <Button 
                            type="primary" 
                            size="large"
                            onClick={handlePrint}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', height: '45px', fontSize: '15px' }}
                        >
                            <Printer size={18} /> Print Admission Receipt
                        </Button>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                            <Button 
                                onClick={() => navigate('/inpatient/dashboard')}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', height: '40px' }}
                            >
                                <LayoutDashboard size={16} /> IP Patients List
                            </Button>
                            <Button 
                                onClick={() => navigate('/inpatient/beds')}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', height: '40px' }}
                            >
                                <Grid size={16} /> Ward Census Map
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    const validateStep = async () => {
        try {
            const fieldsToValidate: string[] = [];
            if (currentStep === 0) {
                fieldsToValidate.push('admissionType');
                if (isEmergency) {
                    fieldsToValidate.push('firstName', 'lastName');
                } else {
                    fieldsToValidate.push('patientId');
                }
            } else if (currentStep === 1) {
                fieldsToValidate.push('targetWard', 'reason');
            }
            await form.validateFields(fieldsToValidate);
            setCurrentStep(currentStep + 1);
        } catch (e) {
            console.error('Validation failed for step', currentStep, e);
        }
    };

    return (
        <div style={{ color: 'var(--text-primary)', maxWidth: '800px', margin: '0 auto' }}>
            <Card 
                title={<span style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 700 }}>Clinical IP Intake & Admission Console</span>}
                style={{ 
                    background: 'var(--bg-card)', 
                    border: '1px solid var(--border-primary)', 
                    borderRadius: '12px'
                }}
            >
                <Steps 
                    current={currentStep} 
                    style={{ marginBottom: 30 }} 
                    className="custom-steps"
                    items={[
                        { title: <span style={{ color: 'var(--text-primary)' }}>Intake Profile</span> },
                        { title: <span style={{ color: 'var(--text-primary)' }}>Ward & Bed</span> },
                        { title: <span style={{ color: 'var(--text-primary)' }}>Verification</span> }
                    ]}
                />

                <Form form={form} layout="vertical" onFinish={handleFormSubmission} requiredMark={false}>
                    {/* STEP 0: Intake Profile */}
                    <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
                        <Form.Item name="admissionType" label={<span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Admission Priority Classification</span>} rules={[{ required: true, message: 'Please select admission priority' }]}>
                            <Select onChange={(val) => setIsEmergency(val === 'Emergency')} style={{ width: '100%' }}>
                                <Option value="Routine_IP">Routine IP Admission (Planned Check-In)</Option>
                                <Option value="Emergency">Critical Emergency Case Admission</Option>
                            </Select>
                        </Form.Item>
                        
                        {!isEmergency && (
                            <Form.Item name="patientId" label={<span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Search Existing Patient (Name, Mobile, MRN)</span>} rules={[{ required: !isEmergency, message: 'Please select a patient' }]}>
                                <Select
                                    showSearch
                                    placeholder="Type at least 3 characters to search..."
                                    defaultActiveFirstOption={false}
                                    showArrow={false}
                                    filterOption={false}
                                    onSearch={handlePatientSearch}
                                    notFoundContent={null}
                                >
                                    {patientOptions.map(p => (
                                        <Option key={p.patient_id} value={p.patient_id}>
                                            {p.first_name} {p.last_name} - {p.medical_record_number} ({p.phone || 'No Phone'})
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        )}

                        {isEmergency && (
                            <Card 
                                type="inner" 
                                title={<span style={{ color: 'var(--accent-danger)', fontWeight: 600 }}>Fast-Track Emergency Intake Fields</span>} 
                                style={{ 
                                    background: 'rgba(244,63,94,0.03)', 
                                    border: '1px solid rgba(244,63,94,0.15)',
                                    marginBottom: '16px',
                                    borderRadius: '8px'
                                }}
                            >
                                <Form.Item name="firstName" label={<span style={{ color: 'var(--text-secondary)' }}>First Name</span>} rules={[{ required: isEmergency, message: 'First name is required' }]}><Input style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} /></Form.Item>
                                <Form.Item name="lastName" label={<span style={{ color: 'var(--text-secondary)' }}>Last Name</span>} rules={[{ required: isEmergency, message: 'Last name is required' }]}><Input style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} /></Form.Item>
                                <Form.Item name="emergencyContact" label={<span style={{ color: 'var(--text-secondary)' }}>Emergency Contact Number</span>}><Input style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} /></Form.Item>
                            </Card>
                        )}
                    </div>

                    {/* STEP 1: Ward & Bed Allocation */}
                    <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
                        <Form.Item name="targetWard" label={<span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Destination Care Area Allocation</span>} rules={[{ required: true, message: 'Please select a care unit bed' }]}>
                            <Select placeholder="Select a Care Unit">
                                {beds.map(b => (
                                    <Option key={b.bed_id} value={b.bed_id} disabled={b.status !== 'Available'}>
                                        {b.ward_name} - Bed {b.bed_number} ({b.status})
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item name="reason" label={<span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Primary Medical Reason for Admission</span>} rules={[{ required: true, min: 5, message: 'Reason must be at least 5 characters' }]}>
                            <Input.TextArea rows={4} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} />
                        </Form.Item>
                    </div>
                    
                    {/* STEP 2: Verification */}
                    <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
                        <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-primary)', borderRadius: '8px' }}>
                            <CheckCircle size={48} color="var(--accent-success)" style={{ marginBottom: '16px' }} />
                            <h3 style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Review Admission Details</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Verify that the patient information and assigned ward are correct before finalizing.</p>
                            {isEmergency && <p style={{ color: 'var(--accent-danger)', fontWeight: 700, fontSize: '12px', marginTop: '10px' }}>Emergency Fast-Track creates a new patient record automatically.</p>}
                        </div>
                    </div>

                    <div style={{ marginTop: 30, display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-primary)', paddingTop: '20px' }}>
                        {currentStep > 0 ? (
                            <Button 
                                onClick={() => setCurrentStep(currentStep - 1)}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <ArrowLeft size={16} /> Back
                            </Button>
                        ) : <div />}
                        
                        {currentStep < 2 ? (
                            <Button 
                                type="primary" 
                                onClick={validateStep}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                Continue <ArrowRight size={16} />
                            </Button>
                        ) : (
                            <Button 
                                type="primary" 
                                htmlType="submit" 
                                danger={isEmergency}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                Finalize Admittance
                            </Button>
                        )}
                    </div>
                </Form>
            </Card>
        </div>
    );
};
export default IPAdmissionWizard;
