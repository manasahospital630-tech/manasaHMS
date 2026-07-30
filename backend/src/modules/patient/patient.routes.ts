import { Router } from 'express';
import * as patientController from './patient.controller';
import { validate } from '../../middleware/validator';
import { createPatientSchema, updatePatientSchema } from './patient.schema';
import { authenticateJWT } from '../../middleware/authenticate';
import { enforceRBAC } from '../../middleware/rbacHandler';
import { auditLogger } from '../../middleware/auditLogger';
import { uploadMiddleware } from '../../utils/fileUpload';

const router = Router();

router.post('/', authenticateJWT, enforceRBAC(['Receptionist', 'Admin']), validate(createPatientSchema), auditLogger('CREATE', 'Patient'), patientController.create);
router.get('/', authenticateJWT, enforceRBAC(['Receptionist', 'Doctor', 'Nurse', 'Admin', 'Biller', 'Pharmacist']), patientController.getAll);
router.get('/:id', authenticateJWT, enforceRBAC(['Receptionist', 'Doctor', 'Nurse', 'Admin', 'Biller', 'Pharmacist']), patientController.getById);
router.get('/:id/timeline', authenticateJWT, enforceRBAC(['Receptionist', 'Doctor', 'Nurse', 'Admin', 'Biller', 'Pharmacist', 'Patient']), patientController.getTimeline);
router.put('/:id', authenticateJWT, enforceRBAC(['Admin']), validate(updatePatientSchema), auditLogger('UPDATE', 'Patient'), patientController.update);
router.post('/:id/portal-access', authenticateJWT, enforceRBAC(['Receptionist', 'Admin', 'Biller']), auditLogger('CREATE', 'PatientPortalAccess'), patientController.givePortalAccess);

// Patient Attachments
router.post('/:id/attachments', authenticateJWT, enforceRBAC(['Receptionist', 'Doctor', 'Nurse', 'Admin', 'Biller']), uploadMiddleware.single('file'), patientController.uploadAttachment);
router.get('/:id/attachments', authenticateJWT, enforceRBAC(['Receptionist', 'Doctor', 'Nurse', 'Admin', 'Biller', 'Pharmacist', 'Patient']), patientController.getAttachments);
router.delete('/:id/attachments/:attachmentId', authenticateJWT, enforceRBAC(['Receptionist', 'Admin']), patientController.deleteAttachment);

export default router;
