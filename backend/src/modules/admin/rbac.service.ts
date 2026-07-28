import { query } from '../../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface PermissionMatrixItem {
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

export interface CreateRoleInput {
  role_name: string;
  description?: string;
  permissions: PermissionMatrixItem[];
}

const toBoolean = (val: any): boolean => {
  if (val === true || val === 1 || val === '1' || val === 'true') return true;
  return false;
};

export const getModulesMaster = async () => {
  const result = await query(`
    SELECT module_id, module_key, module_name, category, parent_module_id, display_order
    FROM modules_master
    ORDER BY display_order ASC, module_name ASC
  `);
  return result.rows;
};

export const getRoles = async () => {
  const result = await query(`
    SELECT 
      r.role_id,
      r.role_name,
      r.description,
      r.is_system_role,
      r.is_active,
      r.created_at,
      r.updated_at,
      (SELECT COUNT(DISTINCT user_id) FROM user_roles ur WHERE ur.role_id = r.role_id) as user_count,
      (SELECT COUNT(DISTINCT module_id) FROM role_permissions rp WHERE rp.role_id = r.role_id AND (rp.can_view = 1 OR rp.can_view = true)) as viewable_modules_count
    FROM roles r
    ORDER BY r.is_system_role DESC, r.role_name ASC
  `);
  return result.rows;
};

export const getRoleById = async (roleId: string) => {
  const roleRes = await query(`SELECT * FROM roles WHERE role_id = $1`, [roleId]);
  if (roleRes.rows.length === 0) return null;

  const role = roleRes.rows[0];

  const permRes = await query(`
    SELECT 
      mm.module_id,
      mm.module_key,
      mm.module_name,
      mm.category,
      COALESCE(rp.can_view, 0) as can_view,
      COALESCE(rp.can_create, 0) as can_create,
      COALESCE(rp.can_edit, 0) as can_edit,
      COALESCE(rp.can_delete, 0) as can_delete,
      COALESCE(rp.can_append, 0) as can_append,
      COALESCE(rp.can_append_to, 0) as can_append_to,
      COALESCE(rp.is_hidden, 0) as is_hidden,
      COALESCE(rp.custom_permissions, '{}') as custom_permissions
    FROM modules_master mm
    LEFT JOIN role_permissions rp ON mm.module_id = rp.module_id AND rp.role_id = $1
    ORDER BY mm.display_order ASC
  `, [roleId]);

  const permissions = permRes.rows.map(p => {
    let custom_permissions = p.custom_permissions;
    if (typeof custom_permissions === 'string') {
      try {
        custom_permissions = JSON.parse(custom_permissions);
      } catch (e) {
        custom_permissions = {};
      }
    }
    return {
      ...p,
      can_view: toBoolean(p.can_view),
      can_create: toBoolean(p.can_create),
      can_edit: toBoolean(p.can_edit),
      can_delete: toBoolean(p.can_delete),
      can_append: toBoolean(p.can_append),
      can_append_to: toBoolean(p.can_append_to),
      is_hidden: toBoolean(p.is_hidden),
      custom_permissions: custom_permissions || {}
    };
  });

  return {
    ...role,
    permissions
  };
};

export const createRole = async (input: CreateRoleInput) => {
  const { role_name, description, permissions } = input;
  const roleId = uuidv4();

  await query(`
    INSERT INTO roles (role_id, role_name, description, is_system_role, is_active)
    VALUES ($1, $2, $3, false, true)
  `, [roleId, role_name, description || '']);

  if (permissions && Array.isArray(permissions)) {
    for (const p of permissions) {
      const hidden = toBoolean(p.is_hidden);
      const permId = uuidv4();
      await query(`
        INSERT INTO role_permissions (id, role_id, module_id, can_view, can_create, can_edit, can_delete, can_append, can_append_to, is_hidden, custom_permissions)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON DUPLICATE KEY UPDATE
          can_view = VALUES(can_view),
          can_create = VALUES(can_create),
          can_edit = VALUES(can_edit),
          can_delete = VALUES(can_delete),
          can_append = VALUES(can_append),
          can_append_to = VALUES(can_append_to),
          is_hidden = VALUES(is_hidden),
          custom_permissions = VALUES(custom_permissions),
          updated_at = NOW();
      `, [
        permId,
        roleId,
        p.module_id,
        hidden ? 0 : (toBoolean(p.can_view) ? 1 : 0),
        hidden ? 0 : (toBoolean(p.can_create) ? 1 : 0),
        hidden ? 0 : (toBoolean(p.can_edit) ? 1 : 0),
        hidden ? 0 : (toBoolean(p.can_delete) ? 1 : 0),
        hidden ? 0 : (toBoolean(p.can_append) ? 1 : 0),
        hidden ? 0 : (toBoolean(p.can_append_to) ? 1 : 0),
        hidden ? 1 : 0,
        JSON.stringify(hidden ? {} : (p.custom_permissions || {}))
      ]);
    }
  }

  return getRoleById(roleId);
};

export const updateRole = async (roleId: string, input: Partial<CreateRoleInput>) => {
  const { role_name, description, permissions } = input;

  if (role_name || description !== undefined) {
    await query(`
      UPDATE roles 
      SET role_name = COALESCE($1, role_name),
          description = COALESCE($2, description),
          updated_at = NOW()
      WHERE role_id = $3
    `, [role_name || null, description !== undefined ? description : null, roleId]);
  }

  if (permissions && Array.isArray(permissions)) {
    for (const p of permissions) {
      const hidden = toBoolean(p.is_hidden);
      const permId = uuidv4();
      await query(`
        INSERT INTO role_permissions (id, role_id, module_id, can_view, can_create, can_edit, can_delete, can_append, can_append_to, is_hidden, custom_permissions)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON DUPLICATE KEY UPDATE
          can_view = VALUES(can_view),
          can_create = VALUES(can_create),
          can_edit = VALUES(can_edit),
          can_delete = VALUES(can_delete),
          can_append = VALUES(can_append),
          can_append_to = VALUES(can_append_to),
          is_hidden = VALUES(is_hidden),
          custom_permissions = VALUES(custom_permissions),
          updated_at = NOW();
      `, [
        permId,
        roleId,
        p.module_id,
        hidden ? 0 : (toBoolean(p.can_view) ? 1 : 0),
        hidden ? 0 : (toBoolean(p.can_create) ? 1 : 0),
        hidden ? 0 : (toBoolean(p.can_edit) ? 1 : 0),
        hidden ? 0 : (toBoolean(p.can_delete) ? 1 : 0),
        hidden ? 0 : (toBoolean(p.can_append) ? 1 : 0),
        hidden ? 0 : (toBoolean(p.can_append_to) ? 1 : 0),
        hidden ? 1 : 0,
        JSON.stringify(hidden ? {} : (p.custom_permissions || {}))
      ]);
    }
  }

  return getRoleById(roleId);
};

export const deleteRole = async (roleId: string) => {
  const checkRes = await query(`
    SELECT is_system_role,
           (SELECT COUNT(*) FROM user_roles WHERE role_id = $1) as user_count
    FROM roles WHERE role_id = $1
  `, [roleId]);

  if (checkRes.rows.length === 0) {
    throw new Error('Role not found');
  }

  const { is_system_role, user_count } = checkRes.rows[0];

  if (is_system_role) {
    throw new Error('System roles cannot be deleted.');
  }

  if (parseInt(user_count) > 0) {
    throw new Error('Cannot delete role associated with active users. Reassign users first.');
  }

  await query(`DELETE FROM role_permissions WHERE role_id = $1`, [roleId]);
  await query(`DELETE FROM roles WHERE role_id = $1`, [roleId]);
  return { success: true };
};

export const getUserPermissionMatrix = async (userId: string) => {
  try {
    const res = await query(`
      SELECT 
        mm.module_key,
        MAX(CASE WHEN rp.can_view = 1 THEN 1 ELSE 0 END) as can_view,
        MAX(CASE WHEN rp.can_create = 1 THEN 1 ELSE 0 END) as can_create,
        MAX(CASE WHEN rp.can_edit = 1 THEN 1 ELSE 0 END) as can_edit,
        MAX(CASE WHEN rp.can_delete = 1 THEN 1 ELSE 0 END) as can_delete,
        MAX(CASE WHEN rp.can_append = 1 THEN 1 ELSE 0 END) as can_append,
        MAX(CASE WHEN rp.can_append_to = 1 THEN 1 ELSE 0 END) as can_append_to,
        MAX(CASE WHEN rp.is_hidden = 1 THEN 1 ELSE 0 END) as is_hidden
      FROM user_roles ur
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN modules_master mm ON rp.module_id = mm.module_id
      WHERE ur.user_id = $1
      GROUP BY mm.module_key
    `, [userId]);

    const matrix: Record<string, any> = {};
    res.rows.forEach(r => {
      matrix[r.module_key] = {
        can_view: toBoolean(r.is_hidden) ? false : toBoolean(r.can_view),
        can_create: toBoolean(r.is_hidden) ? false : toBoolean(r.can_create),
        can_edit: toBoolean(r.is_hidden) ? false : toBoolean(r.can_edit),
        can_delete: toBoolean(r.is_hidden) ? false : toBoolean(r.can_delete),
        can_append: toBoolean(r.is_hidden) ? false : toBoolean(r.can_append),
        can_append_to: toBoolean(r.is_hidden) ? false : toBoolean(r.can_append_to),
        is_hidden: toBoolean(r.is_hidden),
        custom_permissions: {}
      };
    });

    return matrix;
  } catch (err) {
    console.warn('Warning: getUserPermissionMatrix error (returning default matrix):', err);
    return {};
  }
};
