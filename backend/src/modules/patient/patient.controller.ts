import { Response, NextFunction } from 'express';
import { ProtectedRequest } from '../../middleware/rbacHandler';
import { successResponse, errorResponse } from '../../utils/responseHelper';
import * as patientService from './patient.service';

export const create = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const patient = await patientService.createPatient(req.body);
    successResponse(res, patient, 'Patient registered successfully.', 201);
  } catch (error) {
    next(error);
  }
};

export const getAll = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, limit, offset } = req.query;
    const result = await patientService.getPatients({
      search: search as string,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const patient = await patientService.getPatientById(req.params.id as string);
    successResponse(res, patient);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const patient = await patientService.updatePatient(req.params.id as string, req.body);
    successResponse(res, patient, 'Patient updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const givePortalAccess = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await patientService.givePortalAccess(req.params.id as string);
    successResponse(res, result, 'Patient portal access granted successfully.', 200);
  } catch (error) {
    next(error);
  }
};

export const getTimeline = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const timeline = await patientService.getPatientFullTimeline(req.params.id as string);
    successResponse(res, timeline);
  } catch (error) {
    next(error);
  }
};

export const uploadAttachment = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const file = req.file;
    if (!file) {
      errorResponse(res, 'No file uploaded.', 400);
      return;
    }
    const attachment = await patientService.addPatientAttachment(
      req.params.id as string,
      file,
      {
        document_type: req.body.document_type || 'Other',
        description: req.body.description || '',
        document_date: req.body.document_date || null,
      },
      req.identity?.userId || null
    );
    successResponse(res, attachment, 'Attachment uploaded successfully.', 201);
  } catch (error) {
    next(error);
  }
};

export const getAttachments = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const attachments = await patientService.getPatientAttachments(req.params.id as string);
    successResponse(res, attachments);
  } catch (error) {
    next(error);
  }
};

export const deleteAttachment = async (req: ProtectedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await patientService.deletePatientAttachment(req.params.attachmentId as string);
    successResponse(res, null, 'Attachment deleted successfully.');
  } catch (error) {
    next(error);
  }
};

