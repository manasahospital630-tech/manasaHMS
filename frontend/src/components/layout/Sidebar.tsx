import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Home, Users, Calendar, UserPlus, Stethoscope, Pill, DollarSign, Settings, Activity, Heart, ClipboardList, FileText, Package, BarChart3, TrendingUp, Menu, X, ShoppingCart, Beaker, ShieldAlert, Building2 } from 'lucide-react';

interface NavItem {
  icon: any;
  label: string;
  path?: string;
  children?: { label: string; path: string }[];
}

const navByRole: Record<string, NavItem[]> = {
  Admin: [
    { icon: Home, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Building2, label: 'Departments', path: '/admin/departments' },
    { icon: Users, label: 'User Management', path: '/admin/users' },
    { icon: Users, label: 'Patients', path: '/reception/patients' },
    { icon: UserPlus, label: 'OP Check-in', path: '/reception/opcheckin' },
    { icon: UserPlus, label: 'Registration', path: '/reception/register' },
    { icon: Calendar, label: 'Appointments', path: '/reception/appointments' },
    { icon: ClipboardList, label: 'Check-in Queue', path: '/reception/queue' },
    {
      icon: Heart,
      label: 'IP Department',
      children: [
        { label: 'IP Admissions', path: '/inpatient/admission' },
        { label: 'IP Patients', path: '/inpatient/dashboard' },
        { label: 'Rooms & Wards', path: '/inpatient/beds' }
      ]
    },
    { icon: ShieldAlert, label: 'Emergency Care', path: '/doctor/emergency' },
    {
      icon: Beaker,
      label: 'Diagnostics',
      children: [
        { label: 'Dashboard', path: '/diagnostics/dashboard' },
        { label: 'Workspaces', path: '/diagnostics/workspaces' },
        { label: 'Service Catalog', path: '/diagnostics/catalog' },
        { label: 'Referrals', path: '/diagnostics/billing' },
        { label: 'Equipment & QC', path: '/diagnostics/equipment' }
      ]
    },
    { icon: Pill, label: 'Pharmacy', path: '/pharmacy/inventory' },
    { icon: ShoppingCart, label: 'Medicine Sales', path: '/pharmacy/sales' },
    { icon: DollarSign, label: 'Billing', path: '/billing/invoices' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ],
  Doctor: [
    { icon: Home, label: 'Dashboard', path: '/doctor/dashboard' },
    { icon: Users, label: 'Patients', path: '/reception/patients' },
    { icon: Calendar, label: 'Appointments', path: '/reception/queue' },
    {
      icon: Heart,
      label: 'IP Department',
      children: [
        { label: 'IP Admissions', path: '/inpatient/admission' },
        { label: 'IP Patients', path: '/inpatient/dashboard' },
        { label: 'Rooms & Wards', path: '/inpatient/beds' }
      ]
    },
    { icon: ShieldAlert, label: 'Emergency Care', path: '/doctor/emergency' },
    { icon: Stethoscope, label: 'Consultations', path: '/doctor/dashboard' },
    { icon: ClipboardList, label: 'Patient History', path: '/doctor/history' },
    {
      icon: Beaker,
      label: 'Diagnostics',
      children: [
        { label: 'Dashboard', path: '/diagnostics/dashboard' },
        { label: 'Workspaces', path: '/diagnostics/workspaces' },
        { label: 'Service Catalog', path: '/diagnostics/catalog' },
        { label: 'Referrals', path: '/diagnostics/billing' },
        { label: 'Equipment & QC', path: '/diagnostics/equipment' }
      ]
    },
  ],
  Nurse: [
    { icon: Activity, label: 'Triage Queue', path: '/nurse/triage' },
    { icon: Heart, label: 'Vitals', path: '/nurse/vitals' },
    {
      icon: Heart,
      label: 'IP Department',
      children: [
        { label: 'IP Admissions', path: '/inpatient/admission' },
        { label: 'IP Patients', path: '/inpatient/dashboard' },
        { label: 'Rooms & Wards', path: '/inpatient/beds' }
      ]
    },
    { icon: ShieldAlert, label: 'Emergency Care', path: '/doctor/emergency' },
    { icon: Users, label: 'Patients', path: '/reception/patients' },
  ],
  Receptionist: [
    { icon: UserPlus, label: 'Registration', path: '/reception/register' },
    { icon: Calendar, label: 'Appointments', path: '/reception/appointments' },
    { icon: ClipboardList, label: 'Check-in Queue', path: '/reception/queue' },
    {
      icon: Heart,
      label: 'IP Department',
      children: [
        { label: 'IP Admissions', path: '/inpatient/admission' },
        { label: 'IP Patients', path: '/inpatient/dashboard' },
        { label: 'Rooms & Wards', path: '/inpatient/beds' }
      ]
    },
    { icon: Users, label: 'Patients', path: '/reception/patients' },
    { icon: UserPlus, label: 'OP Check-in', path: '/reception/opcheckin' },
  ],
  Pharmacist: [
    { icon: Pill, label: 'Dispense', path: '/pharmacy/dispense' },
    { icon: Package, label: 'Inventory', path: '/pharmacy/inventory' },
    { icon: ShoppingCart, label: 'Medicine Sales', path: '/pharmacy/sales' },
  ],
  Biller: [
    { icon: FileText, label: 'Invoices', path: '/billing/invoices' },
    { icon: DollarSign, label: 'Payments', path: '/billing/payments' },
    { icon: Users, label: 'Patients', path: '/reception/patients' },
    { icon: UserPlus, label: 'OP Check-in', path: '/reception/opcheckin' },
    { icon: Stethoscope, label: 'Doctor Consultations', path: '/admin/consultations' },
  ],
  Patient: [
    { icon: Heart, label: 'Health Summary', path: '/patient-portal/health' },
    { icon: Calendar, label: 'My Appointments', path: '/patient-portal/appointments' },
  ],
  Management: [
    { icon: BarChart3, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: TrendingUp, label: 'Reports', path: '/admin/dashboard' },
  ],
  Incharge: [
    { icon: Home, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Users, label: 'Patients', path: '/reception/patients' },
    { icon: UserPlus, label: 'OP Check-in', path: '/reception/opcheckin' },
    { icon: UserPlus, label: 'Registration', path: '/reception/register' },
    { icon: Calendar, label: 'Appointments', path: '/reception/appointments' },
    { icon: ClipboardList, label: 'Check-in Queue', path: '/reception/queue' },
    {
      icon: Heart,
      label: 'IP Department',
      children: [
        { label: 'IP Admissions', path: '/inpatient/admission' },
        { label: 'IP Patients', path: '/inpatient/dashboard' },
        { label: 'Rooms & Wards', path: '/inpatient/beds' }
      ]
    },
    { icon: ShieldAlert, label: 'Emergency Care', path: '/doctor/emergency' },
    {
      icon: Beaker,
      label: 'Diagnostics',
      children: [
        { label: 'Dashboard', path: '/diagnostics/dashboard' },
        { label: 'Workspaces', path: '/diagnostics/workspaces' },
        { label: 'Service Catalog', path: '/diagnostics/catalog' },
        { label: 'Referrals', path: '/diagnostics/billing' },
        { label: 'Equipment & QC', path: '/diagnostics/equipment' }
      ]
    },
    { icon: Pill, label: 'Pharmacy', path: '/pharmacy/inventory' },
    { icon: ShoppingCart, label: 'Medicine Sales', path: '/pharmacy/sales' },
    { icon: DollarSign, label: 'Billing', path: '/billing/invoices' },
  ],
};

interface SidebarProps { collapsed: boolean; onToggle: () => void; }

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user } = useAuth();
  const baseItems = navByRole[user?.role || ''] || navByRole['Admin'];
  const permissions = (user as any)?.permissions || null;

  const pathToModuleKey: Record<string, string> = {
    '/admin/dashboard': 'dashboard',
    '/admin/users': 'admin_users',
    '/admin/settings': 'admin_master_config',
    '/reception/register': 'patients_reg',
    '/reception/patients': 'patients_history',
    '/reception/opcheckin': 'op_checkin',
    '/reception/appointments': 'appointments_booking',
    '/reception/queue': 'appointments_queues',
    '/doctor/emergency': 'emergency_mgmt',
    '/doctor/dashboard': 'doctor_opd',
    '/doctor/history': 'patient_timeline',
    '/inpatient/admission': 'ipd_admission',
    '/inpatient/dashboard': 'ipd_billing',
    '/inpatient/beds': 'ipd_billing',
    '/diagnostics/dashboard': 'diag_dashboard',
    '/diagnostics/workspaces': 'diag_workspaces',
    '/diagnostics/catalog': 'diag_catalog',
    '/diagnostics/billing': 'diag_ref_ranges',
    '/diagnostics/equipment': 'diag_equipment',
    '/pharmacy/inventory': 'pharmacy_inventory',
    '/pharmacy/dispense': 'pharmacy_sales',
    '/pharmacy/sales': 'pharmacy_sales',
    '/billing/invoices': 'billing_financials',
    '/billing/payments': 'billing_financials'
  };

  const isPathAllowed = (path?: string) => {
    if (!path) return true;
    // If no permissions matrix at all, allow everything (user has no RBAC assigned)
    if (!permissions || Object.keys(permissions).length === 0) return true;
    const modKey = pathToModuleKey[path];
    if (!modKey) return true;
    const perm = permissions[modKey];
    // No specific permission entry for this module → allow by default
    if (!perm) return true;
    // If explicitly hidden, never render in sidebar — applies to ALL roles including Admin
    if (perm.is_hidden) return false;
    return Boolean(perm.can_view);
  };

  const items = baseItems.map(item => {
    if (item.children) {
      const allowedChildren = item.children.filter(child => isPathAllowed(child.path));
      if (allowedChildren.length === 0) return null;
      return { ...item, children: allowedChildren };
    }
    if (!isPathAllowed(item.path)) return null;
    return item;
  }).filter(Boolean) as NavItem[];
  
  // Track expanded state of dropdown items
  const [expandedMenus, setExpandedMenus] = React.useState<Record<string, boolean>>({
    'IP Department': true,
    'Diagnostics': true
  });

  const toggleSubmenu = (label: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  return (
    <aside className={`sidebar ${collapsed ? '' : 'open'}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">M</div>
        {!collapsed && <span className="sidebar-brand">Manasa HMS</span>}
        {!collapsed && (
          <button className="btn btn-ghost btn-sm" onClick={onToggle} style={{ marginLeft: 'auto' }}>
            <X size={18} />
          </button>
        )}
      </div>
      <nav className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {items.map((item) => {
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = !!expandedMenus[item.label];

          if (hasChildren) {
            return (
              <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div 
                  className="sidebar-item" 
                  onClick={() => toggleSubmenu(item.label)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    <item.icon size={20} />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  {!collapsed && (
                    <span style={{ fontSize: '9px', color: 'var(--text-secondary)', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'none' }}>
                      ▶
                    </span>
                  )}
                </div>
                {isExpanded && !collapsed && (
                  <div style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: '1px solid var(--border-primary)', marginLeft: '22px', marginBottom: '4px' }}>
                    {item.children!.map((child) => (
                      <NavLink 
                        key={child.path} 
                        to={child.path} 
                        className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                        style={{ padding: '8px 12px', fontSize: '13px', minHeight: 'auto' }}
                        onClick={() => { if (window.innerWidth <= 1024) onToggle(); }}
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink 
              key={item.path! + item.label} 
              to={item.path!} 
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} 
              onClick={() => { if (window.innerWidth <= 1024) onToggle(); }}
            >
              <item.icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>
      {!collapsed && <div className="sidebar-overlay open" onClick={onToggle} />}
    </aside>
  );
};
