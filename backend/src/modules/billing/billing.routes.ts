import { Router } from 'express';
import * as ctrl from './invoice.controller';
import { validate } from '../../middleware/validator';
import { createInvoiceSchema, recordPaymentSchema } from './billing.schema';
import { authenticateJWT } from '../../middleware/authenticate';
import { enforceRBAC } from '../../middleware/rbacHandler';
import { auditLogger } from '../../middleware/auditLogger';

const router = Router();

router.get('/analytics', authenticateJWT, ctrl.getAnalytics);
router.get('/dashboard-stats', authenticateJWT, ctrl.getAnalytics);
router.post('/invoices', authenticateJWT, enforceRBAC(['Biller', 'Admin', 'Incharge']), validate(createInvoiceSchema), auditLogger('CREATE', 'Invoice'), ctrl.create);
router.get('/invoices', authenticateJWT, enforceRBAC(['Biller', 'Admin', 'Incharge']), ctrl.getAll);
router.get('/invoices/:id', authenticateJWT, enforceRBAC(['Biller', 'Admin', 'Patient', 'Pharmacist', 'Incharge']), ctrl.getById);
router.get('/patients/:patientId/invoices', authenticateJWT, enforceRBAC(['Biller', 'Admin', 'Patient', 'Doctor', 'Incharge']), ctrl.getPatientInvoices);
router.patch('/invoices/:id/payment', authenticateJWT, enforceRBAC(['Biller', 'Admin', 'Incharge']), validate(recordPaymentSchema), auditLogger('PAYMENT', 'Invoice'), ctrl.recordPayment);
router.post('/invoices/:id/payment', authenticateJWT, enforceRBAC(['Biller', 'Admin', 'Incharge']), validate(recordPaymentSchema), auditLogger('PAYMENT', 'Invoice'), ctrl.recordPayment);
router.post('/invoices/:id/payments', authenticateJWT, enforceRBAC(['Biller', 'Admin', 'Incharge']), validate(recordPaymentSchema), auditLogger('PAYMENT', 'Invoice'), ctrl.recordPayment);

router.post('/invoices/:id/cancel', authenticateJWT, enforceRBAC(['Biller', 'Admin', 'Incharge']), auditLogger('CANCEL', 'Invoice'), ctrl.cancel);
router.post('/invoices/:id/return', authenticateJWT, enforceRBAC(['Biller', 'Admin', 'Incharge']), auditLogger('RETURN', 'Invoice'), ctrl.returnInvoice);
router.post('/invoices/:id/update-status', authenticateJWT, enforceRBAC(['Biller', 'Admin', 'Incharge']), auditLogger('UPDATE_STATUS', 'Invoice'), ctrl.updateStatus);

export default router;
