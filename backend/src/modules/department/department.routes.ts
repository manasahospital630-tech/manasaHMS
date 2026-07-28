import { Router } from 'express';
import * as ctrl from './department.controller';
import { authenticateJWT } from '../../middleware/authenticate';
import { enforceRBAC } from '../../middleware/rbacHandler';

const router = Router();

router.get('/', ctrl.getDepartments);
router.post('/', authenticateJWT, enforceRBAC(['Admin', 'Incharge']), ctrl.createDepartment);
router.put('/:id', authenticateJWT, enforceRBAC(['Admin', 'Incharge']), ctrl.updateDepartment);
router.delete('/:id', authenticateJWT, enforceRBAC(['Admin', 'Incharge']), ctrl.deleteDepartment);

export default router;
