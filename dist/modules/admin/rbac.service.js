"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserPermissionMatrix = exports.deleteRole = exports.updateRole = exports.createRole = exports.getRoleById = exports.getRoles = exports.getModulesMaster = void 0;
const database_1 = require("../../config/database");
const getModulesMaster = async () => {
    const result = await (0, database_1.query)(`
    SELECT module_id, module_key, module_name, category, parent_module_id, display_order
    FROM modules_master
    ORDER BY display_order ASC, module_name ASC
  `);
    return result.rows;
};
exports.getModulesMaster = getModulesMaster;
const getRoles = async () => {
    const result = await (0, database_1.query)(`
    SELECT 
      r.role_id,
      r.role_name,
      r.description,
      r.is_system_role,
      r.is_active,
      r.created_at,
      r.updated_at,
      (SELECT COUNT(DISTINCT user_id) FROM user_roles ur WHERE ur.role_id = r.role_id) as user_count,
      (SELECT COUNT(DISTINCT module_id) FROM role_permissions rp WHERE rp.role_id = r.role_id AND rp.can_view = true) as viewable_modules_count
    FROM roles r
    ORDER BY r.is_system_role DESC, r.role_name ASC
  `);
    return result.rows;
};
exports.getRoles = getRoles;
const getRoleById = async (roleId) => {
    const roleRes = await (0, database_1.query)(`SELECT * FROM roles WHERE role_id = $1`, [roleId]);
    if (roleRes.rows.length === 0)
        return null;
    const role = roleRes.rows[0];
    const permRes = await (0, database_1.query)(`
    SELECT 
      mm.module_id,
      mm.module_key,
      mm.module_name,
      mm.category,
      COALESCE(rp.can_view, false) as can_view,
      COALESCE(rp.can_create, false) as can_create,
      COALESCE(rp.can_edit, false) as can_edit,
      COALESCE(rp.can_delete, false) as can_delete,
      COALESCE(rp.can_append, false) as can_append,
      COALESCE(rp.can_append_to, false) as can_append_to,
      COALESCE(rp.is_hidden, false) as is_hidden,
      COALESCE(rp.custom_permissions, '{}'::jsonb) as custom_permissions
    FROM modules_master mm
    LEFT JOIN role_permissions rp ON mm.module_id = rp.module_id AND rp.role_id = $1
    ORDER BY mm.display_order ASC
  `, [roleId]);
    return {
        ...role,
        permissions: permRes.rows
    };
};
exports.getRoleById = getRoleById;
const createRole = async (input) => {
    const { role_name, description, permissions } = input;
    const roleRes = await (0, database_1.query)(`
    INSERT INTO roles (role_name, description, is_system_role, is_active)
    VALUES ($1, $2, false, true)
    RETURNING *
  `, [role_name, description || '']);
    const role = roleRes.rows[0];
    if (permissions && Array.isArray(permissions)) {
        for (const p of permissions) {
            const hidden = p.is_hidden || false;
            await (0, database_1.query)(`
        INSERT INTO role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, can_append, can_append_to, is_hidden, custom_permissions)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (role_id, module_id) DO UPDATE SET
          can_view = EXCLUDED.can_view,
          can_create = EXCLUDED.can_create,
          can_edit = EXCLUDED.can_edit,
          can_delete = EXCLUDED.can_delete,
          can_append = EXCLUDED.can_append,
          can_append_to = EXCLUDED.can_append_to,
          is_hidden = EXCLUDED.is_hidden,
          custom_permissions = EXCLUDED.custom_permissions;
      `, [
                role.role_id,
                p.module_id,
                hidden ? false : (p.can_view || false),
                hidden ? false : (p.can_create || false),
                hidden ? false : (p.can_edit || false),
                hidden ? false : (p.can_delete || false),
                hidden ? false : (p.can_append || false),
                hidden ? false : (p.can_append_to || false),
                hidden,
                JSON.stringify(hidden ? {} : (p.custom_permissions || {}))
            ]);
        }
    }
    return (0, exports.getRoleById)(role.role_id);
};
exports.createRole = createRole;
const updateRole = async (roleId, input) => {
    const { role_name, description, permissions } = input;
    if (role_name || description !== undefined) {
        await (0, database_1.query)(`
      UPDATE roles 
      SET role_name = COALESCE($1, role_name),
          description = COALESCE($2, description),
          updated_at = NOW()
      WHERE role_id = $3
    `, [role_name, description, roleId]);
    }
    if (permissions && Array.isArray(permissions)) {
        for (const p of permissions) {
            const hidden = p.is_hidden || false;
            await (0, database_1.query)(`
        INSERT INTO role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, can_append, can_append_to, is_hidden, custom_permissions)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (role_id, module_id) DO UPDATE SET
          can_view = EXCLUDED.can_view,
          can_create = EXCLUDED.can_create,
          can_edit = EXCLUDED.can_edit,
          can_delete = EXCLUDED.can_delete,
          can_append = EXCLUDED.can_append,
          can_append_to = EXCLUDED.can_append_to,
          is_hidden = EXCLUDED.is_hidden,
          custom_permissions = EXCLUDED.custom_permissions,
          updated_at = NOW();
      `, [
                roleId,
                p.module_id,
                hidden ? false : (p.can_view || false),
                hidden ? false : (p.can_create || false),
                hidden ? false : (p.can_edit || false),
                hidden ? false : (p.can_delete || false),
                hidden ? false : (p.can_append || false),
                hidden ? false : (p.can_append_to || false),
                hidden,
                JSON.stringify(hidden ? {} : (p.custom_permissions || {}))
            ]);
        }
    }
    return (0, exports.getRoleById)(roleId);
};
exports.updateRole = updateRole;
const deleteRole = async (roleId) => {
    const checkRes = await (0, database_1.query)(`
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
    await (0, database_1.query)(`DELETE FROM roles WHERE role_id = $1`, [roleId]);
    return { success: true };
};
exports.deleteRole = deleteRole;
const getUserPermissionMatrix = async (userId) => {
    try {
        const res = await (0, database_1.query)(`
      SELECT 
        mm.module_key,
        bool_or(COALESCE(rp.can_view, false)) as can_view,
        bool_or(COALESCE(rp.can_create, false)) as can_create,
        bool_or(COALESCE(rp.can_edit, false)) as can_edit,
        bool_or(COALESCE(rp.can_delete, false)) as can_delete,
        bool_or(COALESCE(rp.can_append, false)) as can_append,
        bool_or(COALESCE(rp.can_append_to, false)) as can_append_to,
        bool_or(COALESCE(rp.is_hidden, false)) as is_hidden,
        jsonb_object_agg(COALESCE(rp.module_id::text, 'default'), COALESCE(rp.custom_permissions, '{}'::jsonb)) as custom_permissions
      FROM user_roles ur
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN modules_master mm ON rp.module_id = mm.module_id
      WHERE ur.user_id = $1
      GROUP BY mm.module_key
    `, [userId]);
        const matrix = {};
        res.rows.forEach(r => {
            matrix[r.module_key] = {
                can_view: r.is_hidden ? false : r.can_view,
                can_create: r.is_hidden ? false : r.can_create,
                can_edit: r.is_hidden ? false : r.can_edit,
                can_delete: r.is_hidden ? false : r.can_delete,
                can_append: r.is_hidden ? false : r.can_append,
                can_append_to: r.is_hidden ? false : r.can_append_to,
                is_hidden: r.is_hidden,
                custom_permissions: r.custom_permissions
            };
        });
        return matrix;
    }
    catch (err) {
        console.warn('Warning: getUserPermissionMatrix error (returning default matrix):', err);
        return {};
    }
};
exports.getUserPermissionMatrix = getUserPermissionMatrix;
//# sourceMappingURL=rbac.service.js.map