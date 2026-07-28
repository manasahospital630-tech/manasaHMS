import { Response, NextFunction } from 'express';
import { ProtectedRequest } from '../../middleware/rbacHandler';
import { successResponse } from '../../utils/responseHelper';
import * as adminService from './admin.service';

export const getUsers = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await adminService.getAllUsers({
      search: req.query.search as string,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined,
    });
    successResponse(res, result);
  } catch (error) { next(error); }
};

export const getStaffProfile = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const profile = await adminService.getStaffProfile(req.params.id as string);
    successResponse(res, profile);
  } catch (error) { next(error); }
};

export const createUser = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await adminService.createUser(req.body);
    successResponse(res, user, 'User created.', 201);
  } catch (error) { next(error); }
};

export const updateUser = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await adminService.updateUser(req.params.id as string, req.body);
    successResponse(res, user, 'User updated.');
  } catch (error) { next(error); }
};

export const deleteUser = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await adminService.deleteUser(req.params.id as string);
    successResponse(res, result, 'User deleted successfully.');
  } catch (error) { next(error); }
};

export const getAuditLog = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const logs = await adminService.getAuditLog({
      userId: req.query.userId as string,
      resourceType: req.query.resourceType as string,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined,
    });
    successResponse(res, logs);
  } catch (error) { next(error); }
};

export const getDoctorProfiles = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const profiles = await adminService.getDoctorProfiles();
    successResponse(res, profiles);
  } catch (error) { next(error); }
};

export const upsertDoctorProfile = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const profile = await adminService.upsertDoctorProfile(req.body);
    successResponse(res, profile, 'Doctor profile updated.');
  } catch (error) { next(error); }
};

export const getHospitalSettings = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await adminService.getHospitalSettings();
    successResponse(res, settings);
  } catch (error) { next(error); }
};

export const updateHospitalSettings = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await adminService.updateHospitalSettings(req.body);
    successResponse(res, settings, 'Hospital settings updated.');
  } catch (error) { next(error); }
};

export const getDashboardStats = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await adminService.getDashboardStats();
    successResponse(res, stats);
  } catch (error) { next(error); }
};

export const getConsolidatedHospitalRevenue = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const revenue = await adminService.getConsolidatedHospitalRevenue({
      period: (req.query.period || req.query.selectedTimeframe || req.query.timeframe) as string,
      selectedTimeframe: (req.query.selectedTimeframe || req.query.period || req.query.timeframe) as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    });
    successResponse(res, revenue);
  } catch (error) { next(error); }
};

export const getHospitalSettingsPublic = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await adminService.getHospitalSettings();
    const publicSettings = {
      hospital_name: settings.hospital_name,
      hospital_logo: settings.hospital_logo,
      logo_url: settings.hospital_logo,
      theme: settings.theme || 'dark',
      website: settings.website,
      hospital_address: settings.hospital_address,
      phone_number: settings.phone_number,
      email: settings.email,
      gstin: settings.gstin,
      license_info: settings.license_info
    };
    successResponse(res, publicSettings);
  } catch (error) { next(error); }
};

