import { query } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

export interface CreateDepartmentInput {
  departmentName: string;
  departmentCode?: string;
  description?: string;
}

export interface UpdateDepartmentInput {
  departmentName?: string;
  departmentCode?: string;
  description?: string;
  isActive?: boolean;
}

export const getAllDepartments = async () => {
  const result = await query(`
    SELECT 
      d.department_id,
      d.department_name,
      d.department_code,
      d.description,
      d.is_active,
      d.created_at,
      d.updated_at,
      COUNT(DISTINCT u.user_id) as member_count,
      COUNT(DISTINCT CASE WHEN u.role = 'Doctor' THEN u.user_id END) as doctor_count
    FROM departments d
    LEFT JOIN users u ON (
      LOWER(u.employee_department) = LOWER(d.department_name) OR 
      u.user_id IN (SELECT doctor_id FROM doctor_profiles dp WHERE LOWER(dp.department) = LOWER(d.department_name))
    )
    GROUP BY d.department_id, d.department_name, d.department_code, d.description, d.is_active, d.created_at, d.updated_at
    ORDER BY d.department_name ASC
  `);

  return result.rows.map(row => ({
    departmentId: row.department_id,
    departmentName: row.department_name,
    departmentCode: row.department_code || '',
    description: row.description || '',
    isActive: row.is_active === 1 || row.is_active === true,
    memberCount: parseInt(row.member_count, 10) || 0,
    doctorCount: parseInt(row.doctor_count, 10) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
};

export const createDepartment = async (input: CreateDepartmentInput) => {
  const cleanName = (input.departmentName || '').trim();
  if (!cleanName) throw new AppError('Department name is required.', 400);

  const existing = await query('SELECT department_id FROM departments WHERE LOWER(department_name) = LOWER($1)', [cleanName]);
  if (existing.rows.length > 0) throw new AppError('Department with this name already exists.', 409);

  const deptId = uuidv4();
  const code = (input.departmentCode || cleanName.substring(0, 4).toUpperCase()).trim();
  const desc = (input.description || '').trim();

  await query(`
    INSERT INTO departments (department_id, department_name, department_code, description, is_active)
    VALUES ($1, $2, $3, $4, TRUE)
  `, [deptId, cleanName, code, desc]);

  const result = await query('SELECT * FROM departments WHERE department_id = $1', [deptId]);
  return result.rows[0];
};

export const updateDepartment = async (id: string, input: UpdateDepartmentInput) => {
  const existing = await query('SELECT department_id, department_name FROM departments WHERE department_id = $1', [id]);
  if (existing.rows.length === 0) throw new AppError('Department not found.', 404);

  const fields: string[] = [];
  const params: any[] = [];

  if (input.departmentName !== undefined && input.departmentName.trim()) {
    const cleanName = input.departmentName.trim();
    const dup = await query('SELECT department_id FROM departments WHERE LOWER(department_name) = LOWER($1) AND department_id != $2', [cleanName, id]);
    if (dup.rows.length > 0) throw new AppError('Another department with this name already exists.', 409);

    params.push(cleanName);
    fields.push(`department_name = $${params.length}`);
  }

  if (input.departmentCode !== undefined) {
    params.push(input.departmentCode.trim());
    fields.push(`department_code = $${params.length}`);
  }

  if (input.description !== undefined) {
    params.push(input.description.trim());
    fields.push(`description = $${params.length}`);
  }

  if (input.isActive !== undefined) {
    params.push(input.isActive);
    fields.push(`is_active = $${params.length}`);
  }

  if (fields.length > 0) {
    params.push(id);
    await query(`UPDATE departments SET ${fields.join(', ')} WHERE department_id = $${params.length}`, params);
  }

  const result = await query('SELECT * FROM departments WHERE department_id = $1', [id]);
  return result.rows[0];
};

export const deleteDepartment = async (id: string) => {
  await query('UPDATE departments SET is_active = FALSE WHERE department_id = $1', [id]);
  return { success: true };
};
