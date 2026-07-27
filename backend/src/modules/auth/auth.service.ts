import bcrypt from 'bcryptjs';
import { query } from '../../config/database';
import { generateToken } from '../../config/jwt';
import { RegisterInput, LoginInput } from './auth.schema';
import { AppError } from '../../middleware/errorHandler';
import { getUserPermissionMatrix } from '../admin/rbac.service';
import { v4 as uuidv4 } from 'uuid';

const SALT_ROUNDS = 12;

export const registerUser = async (input: RegisterInput) => {
  const cleanEmail = (input.email || '').trim().toLowerCase();

  const existingUser = await query('SELECT user_id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
  if (existingUser.rows.length > 0) {
    throw new AppError('A user with this email already exists.', 409);
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const userId = uuidv4();

  await query(
    `INSERT INTO users (user_id, email, password_hash, first_name, last_name, phone, role)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [userId, cleanEmail, passwordHash, input.firstName, input.lastName, input.phone || null, input.role]
  );

  const result = await query(
    `SELECT user_id, email, first_name, last_name, phone, role, is_active, created_at, updated_at
     FROM users WHERE user_id = $1`,
    [userId]
  );

  return result.rows[0];
};

export const loginUser = async (input: LoginInput) => {
  const cleanEmail = (input.email || '').trim().toLowerCase();
  const cleanPassword = (input.password || '').trim();

  const result = await query(
    'SELECT user_id, email, password_hash, first_name, last_name, role, is_active FROM users WHERE LOWER(email) = $1',
    [cleanEmail]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid email or password.', 401);
  }

  const user = result.rows[0];

  if (user.is_active === 0 || user.is_active === false || user.is_active === '0') {
    throw new AppError('Your account has been deactivated. Please contact an administrator.', 403);
  }

  const isPasswordValid = await bcrypt.compare(cleanPassword, user.password_hash);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password.', 401);
  }

  const token = generateToken({
    userId: user.user_id,
    role: user.role,
    email: user.email,
  });

  return {
    token,
    user: {
      user_id: user.user_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      permissions: await getUserPermissionMatrix(user.user_id)
    },
  };
};

export const getUserProfile = async (userId: string) => {
  const result = await query(
    `SELECT user_id, email, first_name, last_name, phone, role, is_active, created_at, updated_at
     FROM users WHERE user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found.', 404);
  }

  const user = result.rows[0];
  const permissions = await getUserPermissionMatrix(user.user_id);

  return {
    ...user,
    permissions
  };
};
