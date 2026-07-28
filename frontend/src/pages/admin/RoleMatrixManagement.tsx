import React, { useState, useEffect } from 'react';
import { Shield, Plus, Edit2, Trash2, CheckSquare, Square, RefreshCw, CheckCircle, AlertCircle, Save, X, Search, Layers, Lock, UserCheck, EyeOff } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import api from '../../api/client';

interface PermissionItem {
  module_id: string;
  module_key: string;
  module_name: string;
  category: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_append: boolean;
  can_append_to: boolean;
  is_hidden: boolean;
  custom_permissions?: Record<string, boolean>;
}

interface RoleItem {
  role_id: string;
  role_name: string;
  description: string;
  is_system_role: boolean;
  is_active: boolean;
  user_count: number;
  viewable_modules_count: number;
  permissions?: PermissionItem[];
}

export const RoleMatrixManagement: React.FC = () => {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal / Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [permissionMatrix, setPermissionMatrix] = useState<PermissionItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [rolesRes, modulesRes] = await Promise.all([
        api.get('/admin/roles'),
        api.get('/admin/modules')
      ]);
      setRoles(rolesRes.data.data || []);
      setModules(modulesRes.data.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to load security roles and module permissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingRoleId(null);
    setRoleName('');
    setRoleDescription('');
    // Initialize matrix with default false for all master modules
    const initialMatrix: PermissionItem[] = modules.map(m => ({
      module_id: m.module_id,
      module_key: m.module_key,
      module_name: m.module_name,
      category: m.category,
      can_view: false,
      can_create: false,
      can_edit: false,
      can_delete: false,
      can_append: false,
      can_append_to: false,
      is_hidden: false,
      custom_permissions: {
        view_timeline: false,
        approve_bills: false,
        modify_clinical_notes: false,
        print_reports: false
      }
    }));
    setPermissionMatrix(initialMatrix);
    setIsModalOpen(true);
  };

  const openEditModal = async (role: RoleItem) => {
    setSaving(true);
    setError('');
    try {
      const res = await api.get(`/admin/roles/${role.role_id}`);
      const detailedRole = res.data.data;
      setEditingRoleId(role.role_id);
      setRoleName(detailedRole.role_name);
      setRoleDescription(detailedRole.description || '');

      const loadedPerms: PermissionItem[] = detailedRole.permissions || [];
      // Ensure all master modules exist in matrix
      const matrix: PermissionItem[] = modules.map(m => {
        const found = loadedPerms.find(p => p.module_id === m.module_id || p.module_key === m.module_key);
        return {
          module_id: m.module_id,
          module_key: m.module_key,
          module_name: m.module_name,
          category: m.category,
          can_view: found ? Boolean(found.can_view) : false,
          can_create: found ? Boolean(found.can_create) : false,
          can_edit: found ? Boolean(found.can_edit) : false,
          can_delete: found ? Boolean(found.can_delete) : false,
          can_append: found ? Boolean(found.can_append) : false,
          can_append_to: found ? Boolean(found.can_append_to) : false,
          is_hidden: found ? Boolean(found.is_hidden) : false,
          custom_permissions: found?.custom_permissions || {
            view_timeline: false,
            approve_bills: false,
            modify_clinical_notes: false,
            print_reports: false
          }
        };
      });

      setPermissionMatrix(matrix);
      setIsModalOpen(true);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch detailed role permissions.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!window.confirm(`Are you sure you want to delete custom security role '${roleName}'?`)) return;
    try {
      await api.delete(`/admin/roles/${roleId}`);
      setSuccessMsg(`Role '${roleName}' deleted successfully.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete custom security role.');
    }
  };

  const handleTogglePermission = (moduleId: string, field: keyof PermissionItem) => {
    setPermissionMatrix(prev => prev.map(item => {
      if (item.module_id === moduleId) {
        const currentVal = Boolean(item[field]);
        const newVal = !currentVal;
        // When toggling is_hidden ON: clear all other permissions
        if (field === 'is_hidden' && newVal === true) {
          return {
            ...item,
            is_hidden: true,
            can_view: false,
            can_create: false,
            can_edit: false,
            can_delete: false,
            can_append: false,
            can_append_to: false,
            custom_permissions: { view_timeline: false, approve_bills: false, modify_clinical_notes: false, print_reports: false }
          };
        }
        // When toggling a CRUD perm ON: auto-clear is_hidden
        if (field !== 'is_hidden' && newVal === true && item.is_hidden) {
          return { ...item, [field]: true, is_hidden: false };
        }
        return { ...item, [field]: newVal };
      }
      return item;
    }));
  };

  const handleToggleCustomPermission = (moduleId: string, customKey: string) => {
    setPermissionMatrix(prev => prev.map(item => {
      if (item.module_id === moduleId) {
        const existing = item.custom_permissions || {};
        return {
          ...item,
          custom_permissions: {
            ...existing,
            [customKey]: !existing[customKey]
          }
        };
      }
      return item;
    }));
  };

  const handleToggleRow = (moduleId: string, state: boolean) => {
    setPermissionMatrix(prev => prev.map(item => {
      if (item.module_id === moduleId) {
        return {
          ...item,
          can_view: state,
          can_create: state,
          can_edit: state,
          can_delete: state,
          can_append: state,
          can_append_to: state,
          is_hidden: false,
          custom_permissions: {
            view_timeline: state,
            approve_bills: state,
            modify_clinical_notes: state,
            print_reports: state
          }
        };
      }
      return item;
    }));
  };

  const handleToggleColumn = (field: keyof PermissionItem) => {
    const allChecked = permissionMatrix.every(item => Boolean(item[field]));
    const nextState = !allChecked;
    setPermissionMatrix(prev => prev.map(item => ({
      ...item,
      [field]: nextState
    })));
  };

  const handleSelectAll = () => {
    setPermissionMatrix(prev => prev.map(item => ({
      ...item,
      can_view: true,
      can_create: true,
      can_edit: true,
      can_delete: true,
      can_append: true,
      can_append_to: true,
      is_hidden: false,
      custom_permissions: {
        view_timeline: true,
        approve_bills: true,
        modify_clinical_notes: true,
        print_reports: true
      }
    })));
  };

  const handleDeselectAll = () => {
    setPermissionMatrix(prev => prev.map(item => ({
      ...item,
      can_view: false,
      can_create: false,
      can_edit: false,
      can_delete: false,
      can_append: false,
      can_append_to: false,
      is_hidden: false,
      custom_permissions: {
        view_timeline: false,
        approve_bills: false,
        modify_clinical_notes: false,
        print_reports: false
      }
    })));
  };

  const handleHideAll = () => {
    setPermissionMatrix(prev => prev.map(item => ({
      ...item,
      can_view: false, can_create: false, can_edit: false,
      can_delete: false, can_append: false, can_append_to: false,
      is_hidden: true,
      custom_permissions: { view_timeline: false, approve_bills: false, modify_clinical_notes: false, print_reports: false }
    })));
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      alert('Please enter a role name.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        role_name: roleName.trim(),
        description: roleDescription.trim(),
        permissions: permissionMatrix
      };

      if (editingRoleId) {
        await api.put(`/admin/roles/${editingRoleId}`, payload);
        setSuccessMsg(`Security Role '${roleName}' permissions updated successfully.`);
      } else {
        await api.post('/admin/roles', payload);
        setSuccessMsg(`New Custom Security Role '${roleName}' created successfully.`);
      }

      setTimeout(() => setSuccessMsg(''), 4000);
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save security role matrix.');
    } finally {
      setSaving(false);
    }
  };

  // Group modules by category for rendering matrix
  const categories = Array.from(new Set(permissionMatrix.map(p => p.category)));

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield color="var(--accent-primary)" size={24} />
            Security Roles & Granular Permissions Matrix (RBAC)
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0 0' }}>
            Define enterprise security roles, configure granular CRUD & scope permissions, and assign access matrices across HMS modules
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" icon={<RefreshCw size={14} />} onClick={loadData}>
            Refresh Matrix
          </Button>
          <Button variant="primary" icon={<Plus size={14} />} onClick={openCreateModal}>
            Create Security Role
          </Button>
        </div>
      </div>

      {successMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
          <CheckCircle size={18} />
          {successMsg}
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Role Cards List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
            <RefreshCw size={24} className="spin" color="var(--accent-primary)" style={{ animation: 'spin 1.5s linear infinite' }} />
          </div>
        ) : roles.map((role) => (
          <Card key={role.role_id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={18} color={role.is_system_role ? '#3b82f6' : '#10b981'} />
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>{role.role_name}</h3>
                </div>
                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '50px', fontWeight: 700, background: role.is_system_role ? 'rgba(59, 130, 246, 0.12)' : 'rgba(16, 185, 129, 0.12)', color: role.is_system_role ? '#3b82f6' : '#10b981', border: `1px solid ${role.is_system_role ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)'}` }}>
                  {role.is_system_role ? 'System Role' : 'Custom Role'}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 12px 0', minHeight: '36px', lineHeight: 1.4 }}>
                {role.description || 'Custom configured security role matrix.'}
              </p>
              <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <UserCheck size={13} color="var(--accent-primary)" />
                  <span><strong>{role.user_count}</strong> Active Users</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Layers size={13} color="var(--accent-primary)" />
                  <span><strong>{role.viewable_modules_count} / {modules.length}</strong> Modules Allowed</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-primary)', paddingTop: '12px' }}>
              <Button variant="secondary" size="sm" icon={<Edit2 size={13} />} onClick={() => openEditModal(role)} style={{ flex: 1 }}>
                Configure Permissions Matrix
              </Button>
              {!role.is_system_role && (
                <Button variant="secondary" size="sm" onClick={() => handleDeleteRole(role.role_id, role.role_name)} style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                  <Trash2 size={13} />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Permission Matrix Modal / Drawer */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '12px', width: '100%', maxWidth: '1100px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield color="var(--accent-primary)" size={20} />
                  {editingRoleId ? `Edit Permissions Matrix: ${roleName}` : 'Create Custom Security Role'}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Configure granular View, Create, Edit, Delete, Append, Append To, and Special Scopes for all modules
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>

            {/* Modal Content Form */}
            <form onSubmit={handleSaveRole} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
                
                {/* Role Details Header Inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '20px', background: 'var(--bg-card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-primary)' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Security Role Name *
                    </label>
                    <input 
                      type="text" 
                      className="input" 
                      required 
                      value={roleName} 
                      onChange={(e) => setRoleName(e.target.value)} 
                      placeholder="e.g. Chief Doctor / Billing Supervisor"
                      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} 
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Role Scope & Responsibilities Description
                    </label>
                    <input 
                      type="text" 
                      className="input" 
                      value={roleDescription} 
                      onChange={(e) => setRoleDescription(e.target.value)} 
                      placeholder="Summary of responsibilities and module access boundaries..."
                      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} 
                    />
                  </div>
                </div>

                {/* Matrix Action Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Button type="button" variant="secondary" size="sm" onClick={handleSelectAll}>
                      Select All Permissions
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={handleDeselectAll}>
                      Deselect All
                    </Button>
                    <Button type="button" variant="secondary" size="sm" icon={<EyeOff size={13} />} onClick={handleHideAll} style={{ color: '#f97316', borderColor: 'rgba(249,115,22,0.3)' }}>
                      Hide All Menus
                    </Button>
                  </div>
                  <div style={{ width: '260px', position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      className="input" 
                      value={searchFilter} 
                      onChange={(e) => setSearchFilter(e.target.value)} 
                      placeholder="Search module or category..."
                      style={{ paddingLeft: '32px', height: '32px', fontSize: '12px', background: 'var(--bg-card)' }}
                    />
                  </div>
                </div>

                {/* Granular Permission Matrix Table */}
                <div style={{ border: '1px solid var(--border-primary)', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-card)' }}>
                  <div className="table-responsive" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                    <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                        <tr style={{ textAlign: 'left', borderBottom: '1.5px solid var(--border-primary)' }}>
                          <th style={{ padding: '10px 14px', width: '260px' }}>MODULE / SUB-MODULE</th>
                          <th style={{ padding: '10px 8px', textTransform: 'uppercase', textAlign: 'center' }}>
                            <button type="button" onClick={() => handleToggleColumn('can_view')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700, fontSize: '11px' }}>
                              VIEW (READ)
                            </button>
                          </th>
                          <th style={{ padding: '10px 8px', textTransform: 'uppercase', textAlign: 'center' }}>
                            <button type="button" onClick={() => handleToggleColumn('can_create')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700, fontSize: '11px' }}>
                              CREATE (ADD)
                            </button>
                          </th>
                          <th style={{ padding: '10px 8px', textTransform: 'uppercase', textAlign: 'center' }}>
                            <button type="button" onClick={() => handleToggleColumn('can_edit')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700, fontSize: '11px' }}>
                              EDIT (MODIFY)
                            </button>
                          </th>
                          <th style={{ padding: '10px 8px', textTransform: 'uppercase', textAlign: 'center' }}>
                            <button type="button" onClick={() => handleToggleColumn('can_delete')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700, fontSize: '11px' }}>
                              DELETE
                            </button>
                          </th>
                          <th style={{ padding: '10px 8px', textTransform: 'uppercase', textAlign: 'center' }}>
                            <button type="button" onClick={() => handleToggleColumn('can_append')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700, fontSize: '11px' }}>
                              APPEND
                            </button>
                          </th>
                          <th style={{ padding: '10px 8px', textTransform: 'uppercase', textAlign: 'center' }}>
                            <button type="button" onClick={() => handleToggleColumn('can_append_to')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700, fontSize: '11px' }}>
                              APPEND TO
                            </button>
                          </th>
                          <th style={{ padding: '10px 8px', textTransform: 'uppercase', textAlign: 'center', color: '#f97316', fontWeight: 800, fontSize: '11px', whiteSpace: 'nowrap' }}>
                            <button type="button" onClick={() => handleToggleColumn('is_hidden')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#f97316', fontWeight: 800, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <EyeOff size={13} />
                              HIDE MENU
                            </button>
                          </th>
                          <th style={{ padding: '10px 14px', textTransform: 'uppercase', width: '220px' }}>SPECIAL SCOPES</th>
                          <th style={{ padding: '10px 8px', textAlign: 'center' }}>ROW TOGGLE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((category) => {
                          const catItems = permissionMatrix.filter(p => p.category === category && (
                            !searchFilter || 
                            p.module_name.toLowerCase().includes(searchFilter.toLowerCase()) || 
                            p.category.toLowerCase().includes(searchFilter.toLowerCase())
                          ));

                          if (catItems.length === 0) return null;

                          return (
                            <React.Fragment key={category}>
                              <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-primary)' }}>
                                <td colSpan={9} style={{ padding: '8px 14px', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent-primary)', letterSpacing: '0.5px' }}>
                                  {category}
                                </td>
                              </tr>
                              {catItems.map((p) => {
                                const isRowAll = p.can_view && p.can_create && p.can_edit && p.can_delete && p.can_append && p.can_append_to;
                                const rowStyle: React.CSSProperties = {
                                  borderBottom: '1px solid var(--border-primary)',
                                  background: p.is_hidden ? 'rgba(249,115,22,0.05)' : 'transparent',
                                  opacity: p.is_hidden ? 0.75 : 1
                                };
                                return (
                                  <tr key={p.module_id} style={rowStyle}>
                                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {p.is_hidden && <span title="Hidden from sidebar"><EyeOff size={13} color="#f97316" /></span>}
                                        {p.module_name}
                                      </div>
                                    </td>
                                    <td style={{ textAlign: 'center', padding: '8px' }}>
                                      <input 
                                        type="checkbox" 
                                        checked={p.can_view && !p.is_hidden} 
                                        disabled={p.is_hidden}
                                        onChange={() => handleTogglePermission(p.module_id, 'can_view')} 
                                        style={{ width: '16px', height: '16px', cursor: p.is_hidden ? 'not-allowed' : 'pointer', accentColor: 'var(--accent-primary)', opacity: p.is_hidden ? 0.4 : 1 }}
                                      />
                                    </td>
                                    <td style={{ textAlign: 'center', padding: '8px' }}>
                                      <input 
                                        type="checkbox" 
                                        checked={p.can_create && !p.is_hidden} 
                                        disabled={p.is_hidden}
                                        onChange={() => handleTogglePermission(p.module_id, 'can_create')} 
                                        style={{ width: '16px', height: '16px', cursor: p.is_hidden ? 'not-allowed' : 'pointer', accentColor: 'var(--accent-primary)', opacity: p.is_hidden ? 0.4 : 1 }}
                                      />
                                    </td>
                                    <td style={{ textAlign: 'center', padding: '8px' }}>
                                      <input 
                                        type="checkbox" 
                                        checked={p.can_edit && !p.is_hidden} 
                                        disabled={p.is_hidden}
                                        onChange={() => handleTogglePermission(p.module_id, 'can_edit')} 
                                        style={{ width: '16px', height: '16px', cursor: p.is_hidden ? 'not-allowed' : 'pointer', accentColor: 'var(--accent-primary)', opacity: p.is_hidden ? 0.4 : 1 }}
                                      />
                                    </td>
                                    <td style={{ textAlign: 'center', padding: '8px' }}>
                                      <input 
                                        type="checkbox" 
                                        checked={p.can_delete && !p.is_hidden} 
                                        disabled={p.is_hidden}
                                        onChange={() => handleTogglePermission(p.module_id, 'can_delete')} 
                                        style={{ width: '16px', height: '16px', cursor: p.is_hidden ? 'not-allowed' : 'pointer', accentColor: '#ef4444', opacity: p.is_hidden ? 0.4 : 1 }}
                                      />
                                    </td>
                                    <td style={{ textAlign: 'center', padding: '8px' }}>
                                      <input 
                                        type="checkbox" 
                                        checked={p.can_append && !p.is_hidden} 
                                        disabled={p.is_hidden}
                                        onChange={() => handleTogglePermission(p.module_id, 'can_append')} 
                                        style={{ width: '16px', height: '16px', cursor: p.is_hidden ? 'not-allowed' : 'pointer', accentColor: 'var(--accent-primary)', opacity: p.is_hidden ? 0.4 : 1 }}
                                      />
                                    </td>
                                    <td style={{ textAlign: 'center', padding: '8px' }}>
                                      <input 
                                        type="checkbox" 
                                        checked={p.can_append_to && !p.is_hidden} 
                                        disabled={p.is_hidden}
                                        onChange={() => handleTogglePermission(p.module_id, 'can_append_to')} 
                                        style={{ width: '16px', height: '16px', cursor: p.is_hidden ? 'not-allowed' : 'pointer', accentColor: 'var(--accent-primary)', opacity: p.is_hidden ? 0.4 : 1 }}
                                      />
                                    </td>
                                    {/* HIDE MENU Column */}
                                    <td style={{ textAlign: 'center', padding: '8px' }}>
                                      <input 
                                        type="checkbox" 
                                        checked={p.is_hidden} 
                                        onChange={() => handleTogglePermission(p.module_id, 'is_hidden')} 
                                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#f97316' }}
                                        title="Hide this module from sidebar navigation"
                                      />
                                    </td>
                                    <td style={{ padding: '8px 14px', opacity: p.is_hidden ? 0.4 : 1 }}>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {['view_timeline', 'approve_bills', 'modify_clinical_notes', 'print_reports'].map((customKey) => {
                                          const labelMap: Record<string, string> = {
                                            view_timeline: 'View Timeline',
                                            approve_bills: 'Approve Bills',
                                            modify_clinical_notes: 'Modify Notes',
                                            print_reports: 'Print Reports'
                                          };
                                          const isChecked = Boolean(p.custom_permissions?.[customKey]) && !p.is_hidden;
                                          return (
                                            <label key={customKey} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', cursor: p.is_hidden ? 'not-allowed' : 'pointer', background: isChecked ? 'rgba(59, 130, 246, 0.1)' : 'transparent', padding: '2px 6px', borderRadius: '4px', border: `1px solid ${isChecked ? 'rgba(59, 130, 246, 0.3)' : 'var(--border-primary)'}` }}>
                                              <input 
                                                type="checkbox" 
                                                checked={isChecked} 
                                                disabled={p.is_hidden}
                                                onChange={() => handleToggleCustomPermission(p.module_id, customKey)} 
                                                style={{ width: '12px', height: '12px' }}
                                              />
                                              <span>{labelMap[customKey]}</span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    </td>
                                    <td style={{ textAlign: 'center', padding: '8px' }}>
                                      <button 
                                        type="button" 
                                        onClick={() => handleToggleRow(p.module_id, !isRowAll)}
                                        disabled={p.is_hidden}
                                        style={{ background: 'transparent', border: 'none', cursor: p.is_hidden ? 'not-allowed' : 'pointer', color: isRowAll && !p.is_hidden ? '#10b981' : 'var(--text-muted)', opacity: p.is_hidden ? 0.4 : 1 }}
                                        title={isRowAll ? 'Deselect Row' : 'Select Row All'}
                                      >
                                        {isRowAll && !p.is_hidden ? <CheckSquare size={16} /> : <Square size={16} />}
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--bg-card)' }}>
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" icon={<Save size={14} />} disabled={saving}>
                  {saving ? 'Saving Matrix...' : 'Save Role Matrix'}
                </Button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
};

export default RoleMatrixManagement;
