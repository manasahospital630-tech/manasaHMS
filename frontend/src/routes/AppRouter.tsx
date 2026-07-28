import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { RoleProtectedRoute } from './RoleProtectedRoute';
import Login from '../pages/Login';
import Unauthorized from '../pages/Unauthorized';
import PatientRegistration from '../pages/reception/PatientRegistration';
import AppointmentBooking from '../pages/reception/AppointmentBooking';
import PatientsList from '../pages/reception/PatientsList';
import OPCheckIn from '../pages/reception/OPCheckIn';
import CheckInQueue from '../pages/reception/CheckInQueue';
import TriageQueue from '../pages/nurse/TriageQueue';
import VitalsCapture from '../pages/nurse/VitalsCapture';
import DoctorDashboard from '../pages/doctor/DoctorDashboard';
import ConsultationWorkspace from '../pages/doctor/ConsultationWorkspace';
import PatientHistory from '../pages/doctor/PatientHistory';
import EmergencyDashboard from '../pages/doctor/EmergencyDashboard';
import DispenseWorkstation from '../pages/pharmacy/DispenseWorkstation';
import InventoryManagement from '../pages/pharmacy/InventoryManagement';
import MedicineSales from '../pages/pharmacy/MedicineSales';
import InvoiceGenerator from '../pages/billing/InvoiceGenerator';
import PaymentProcessing from '../pages/billing/PaymentProcessing';
import UserManagement from '../pages/admin/UserManagement';
import DepartmentsManagement from '../pages/admin/DepartmentsManagement';
import StaffProfilePage from '../pages/admin/StaffProfilePage';
import SystemSettings from '../pages/admin/SystemSettings';
import HealthSummary from '../pages/patient-portal/HealthSummary';
import MyAppointments from '../pages/patient-portal/MyAppointments';
import DoctorConsultations from '../pages/admin/DoctorConsultations';
import EmergencyConsultation from '../pages/doctor/EmergencyConsultation';
import Home from '../pages/Home';
import { HMSDashboard } from '../pages/admin/HMSDashboard';
import { IPAdmissionWizard } from '../pages/inpatient/IPAdmissionWizard';
import { IPDashboard } from '../pages/inpatient/IPDashboard';
import { InpatientBeds } from '../pages/inpatient/InpatientBeds';
import DiagnosticsDashboard from '../pages/diagnostics/DiagnosticsDashboard';
import ServiceCatalog from '../pages/diagnostics/ServiceCatalog';
import TestOrders from '../pages/diagnostics/TestOrders';
import Workspaces from '../pages/diagnostics/Workspaces';
import ReferralsAndBilling from '../pages/diagnostics/ReferralsAndBilling';
import EquipmentAndQC from '../pages/diagnostics/EquipmentAndQC';
import PublicReportView from '../pages/diagnostics/PublicReportView';
import PatientProfile from '../pages/patient/PatientProfile';

const roleDefaultPaths: Record<string, string> = {
  Admin: '/admin/dashboard', Doctor: '/doctor/dashboard', Nurse: '/nurse/triage',
  Receptionist: '/reception/queue', Pharmacist: '/pharmacy/dispense', Biller: '/billing/invoices',
  Patient: '/patient-portal/health', Management: '/admin/dashboard',
};

const IndexRedirect = () => {
  const { user } = useAuth();
  return <Navigate to={roleDefaultPaths[user?.role || 'Patient'] || '/login'} replace />;
};

const AppRouter: React.FC = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Login />} />
    <Route path="/unauthorized" element={<Unauthorized />} />
    <Route path="/verify/reports/:itemId" element={<PublicReportView />} />
    <Route path="/verify/:itemId" element={<PublicReportView />} />
    <Route path="/reports/:itemId" element={<PublicReportView />} />
    <Route path="/public/reports/:itemId" element={<PublicReportView />} />

    <Route element={<RoleProtectedRoute permittedRoles={['Admin','Management','Doctor','Nurse','Receptionist','Pharmacist','Biller','Patient','Incharge']} />}>
      <Route element={<DashboardLayout />}>
        <Route path="dashboard" element={<IndexRedirect />} />

        <Route element={<RoleProtectedRoute permittedRoles={['Admin', 'Management', 'Incharge']} />}>
          <Route path="admin/dashboard" element={<HMSDashboard />} />
          <Route path="admin/departments" element={<DepartmentsManagement />} />
        </Route>

        <Route element={<RoleProtectedRoute permittedRoles={['Admin']} />}>
          <Route path="admin/users" element={<UserManagement />} />
          <Route path="admin/settings" element={<SystemSettings />} />
        </Route>

        <Route element={<RoleProtectedRoute permittedRoles={['Receptionist','Admin','Incharge']} />}>
          <Route path="reception/register" element={<PatientRegistration />} />
          <Route path="reception/appointments" element={<AppointmentBooking />} />
        </Route>
        <Route element={<RoleProtectedRoute permittedRoles={['Receptionist','Doctor','Nurse','Admin','Incharge']} />}>
          <Route path="reception/queue" element={<CheckInQueue />} />
        </Route>
        <Route element={<RoleProtectedRoute permittedRoles={['Receptionist','Doctor','Nurse','Admin','Biller','Pharmacist','Incharge']} />}>
          <Route path="reception/patients" element={<PatientsList />} />
        </Route>
        <Route element={<RoleProtectedRoute permittedRoles={['Receptionist','Biller','Admin','Incharge']} />}>
          <Route path="reception/opcheckin" element={<OPCheckIn />} />
        </Route>

        <Route element={<RoleProtectedRoute permittedRoles={['Doctor','Admin','Incharge']} />}>
          <Route path="doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="doctor/consultation/:appointmentId" element={<ConsultationWorkspace />} />
          <Route path="doctor/emergency/:encounterId" element={<EmergencyConsultation />} />
          <Route path="doctor/emergency" element={<EmergencyDashboard />} />
          <Route path="doctor/history" element={<PatientHistory />} />
        </Route>

        <Route element={<RoleProtectedRoute permittedRoles={['Nurse','Doctor','Admin']} />}>
          <Route path="nurse/triage" element={<TriageQueue />} />
          <Route path="nurse/vitals" element={<VitalsCapture />} />
          <Route path="nurse/vitals/:appointmentId" element={<VitalsCapture />} />
        </Route>

        <Route element={<RoleProtectedRoute permittedRoles={['Pharmacist','Admin','Incharge']} />}>
          <Route path="pharmacy/dispense" element={<DispenseWorkstation />} />
          <Route path="pharmacy/inventory" element={<InventoryManagement />} />
          <Route path="pharmacy/sales" element={<MedicineSales />} />
        </Route>

        <Route element={<RoleProtectedRoute permittedRoles={['Doctor','Nurse','Admin','Receptionist','Incharge']} />}>
          <Route path="inpatient/dashboard" element={<IPDashboard />} />
          <Route path="inpatient/admission" element={<IPAdmissionWizard />} />
          <Route path="inpatient/beds" element={<InpatientBeds />} />
        </Route>

        <Route element={<RoleProtectedRoute permittedRoles={['Biller','Admin','Incharge']} />}>
          <Route path="billing/invoices" element={<InvoiceGenerator />} />
          <Route path="billing/payments" element={<PaymentProcessing />} />
          <Route path="admin/consultations" element={<DoctorConsultations />} />
        </Route>

        <Route element={<RoleProtectedRoute permittedRoles={['Admin','Incharge','Doctor','Nurse','Biller']} />}>
          <Route path="diagnostics/dashboard" element={<DiagnosticsDashboard />} />
          <Route path="diagnostics/catalog" element={<ServiceCatalog />} />
          <Route path="diagnostics/orders" element={<TestOrders />} />
          <Route path="diagnostics/workspaces" element={<Workspaces />} />
          <Route path="diagnostics/billing" element={<ReferralsAndBilling />} />
          <Route path="diagnostics/equipment" element={<EquipmentAndQC />} />
        </Route>

        <Route element={<RoleProtectedRoute permittedRoles={['Receptionist','Doctor','Nurse','Admin','Biller','Pharmacist','Patient','Incharge']} />}>
          <Route path="patient/profile/:patientId" element={<PatientProfile />} />
          <Route path="staff/profile/:userId" element={<StaffProfilePage />} />
          <Route path="doctor/profile/:userId" element={<StaffProfilePage />} />
        </Route>

        <Route element={<RoleProtectedRoute permittedRoles={['Patient','Admin']} />}>
          <Route path="patient-portal/health" element={<HealthSummary />} />
          <Route path="patient-portal/appointments" element={<MyAppointments />} />
        </Route>
      </Route>
    </Route>
  </Routes>
);

export default AppRouter;
