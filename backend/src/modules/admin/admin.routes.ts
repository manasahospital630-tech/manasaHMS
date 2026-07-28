import { Router } from 'express';
import * as ctrl from './admin.controller';
import { validate } from '../../middleware/validator';
import { createUserSchema, updateUserSchema, upsertDoctorProfileSchema } from './admin.schema';
import { authenticateJWT } from '../../middleware/authenticate';
import { enforceRBAC } from '../../middleware/rbacHandler';
import { auditLogger } from '../../middleware/auditLogger';

import * as buCtrl from './businessUnits.controller';

const router = Router();

// Business Units & Teams Architecture (MS CRM Architecture Alignment)
router.get('/v1/business-units', authenticateJWT, buCtrl.getBusinessUnits);
router.get('/business-units', authenticateJWT, buCtrl.getBusinessUnits);
router.post('/v1/business-units', authenticateJWT, enforceRBAC(['Admin']), auditLogger('CREATE', 'BusinessUnit'), buCtrl.createBusinessUnit);
router.post('/business-units', authenticateJWT, enforceRBAC(['Admin']), auditLogger('CREATE', 'BusinessUnit'), buCtrl.createBusinessUnit);
router.put('/v1/business-units/:id', authenticateJWT, enforceRBAC(['Admin']), auditLogger('UPDATE', 'BusinessUnit'), buCtrl.updateBusinessUnit);
router.put('/business-units/:id', authenticateJWT, enforceRBAC(['Admin']), auditLogger('UPDATE', 'BusinessUnit'), buCtrl.updateBusinessUnit);

router.get('/v1/teams', authenticateJWT, buCtrl.getTeams);
router.get('/teams', authenticateJWT, buCtrl.getTeams);
router.post('/v1/teams', authenticateJWT, enforceRBAC(['Admin']), auditLogger('CREATE', 'Team'), buCtrl.createTeam);
router.post('/teams', authenticateJWT, enforceRBAC(['Admin']), auditLogger('CREATE', 'Team'), buCtrl.createTeam);
router.put('/v1/teams/:id', authenticateJWT, enforceRBAC(['Admin']), auditLogger('UPDATE', 'Team'), buCtrl.updateTeam);
router.put('/teams/:id', authenticateJWT, enforceRBAC(['Admin']), auditLogger('UPDATE', 'Team'), buCtrl.updateTeam);
router.delete('/v1/teams/:id', authenticateJWT, enforceRBAC(['Admin']), auditLogger('DELETE', 'Team'), buCtrl.deleteTeam);
router.delete('/teams/:id', authenticateJWT, enforceRBAC(['Admin']), auditLogger('DELETE', 'Team'), buCtrl.deleteTeam);

router.get('/v1/teams/:id/members', authenticateJWT, buCtrl.getTeamMembers);
router.get('/teams/:id/members', authenticateJWT, buCtrl.getTeamMembers);
router.post('/v1/teams/:id/members', authenticateJWT, enforceRBAC(['Admin']), auditLogger('UPDATE', 'TeamMembers'), buCtrl.updateTeamMembers);
router.post('/teams/:id/members', authenticateJWT, enforceRBAC(['Admin']), auditLogger('UPDATE', 'TeamMembers'), buCtrl.updateTeamMembers);
router.post('/v1/teams/:id/roles', authenticateJWT, enforceRBAC(['Admin']), auditLogger('UPDATE', 'TeamRoles'), buCtrl.updateTeamRoles);
router.post('/teams/:id/roles', authenticateJWT, enforceRBAC(['Admin']), auditLogger('UPDATE', 'TeamRoles'), buCtrl.updateTeamRoles);

router.get('/users', authenticateJWT, ctrl.getUsers);
router.get('/users/:id/profile', authenticateJWT, ctrl.getStaffProfile);
router.get('/staff/profile/:id', authenticateJWT, ctrl.getStaffProfile);
router.post('/users', authenticateJWT, enforceRBAC(['Admin']), validate(createUserSchema), auditLogger('CREATE', 'User'), ctrl.createUser);
router.patch('/users/:id', authenticateJWT, enforceRBAC(['Admin']), validate(updateUserSchema), auditLogger('UPDATE', 'User'), ctrl.updateUser);
router.delete('/users/:id', authenticateJWT, enforceRBAC(['Admin']), auditLogger('DELETE', 'User'), ctrl.deleteUser);
router.get('/audit-log', authenticateJWT, enforceRBAC(['Admin']), ctrl.getAuditLog);
router.get('/dashboard-stats', authenticateJWT, enforceRBAC(['Admin', 'Management']), ctrl.getDashboardStats);
router.get('/consolidated-revenue', authenticateJWT, ctrl.getConsolidatedHospitalRevenue);
router.get('/v1/consolidated-revenue', authenticateJWT, ctrl.getConsolidatedHospitalRevenue);
router.get('/analytics/dashboard', authenticateJWT, ctrl.getConsolidatedHospitalRevenue);
router.get('/v1/analytics/dashboard', authenticateJWT, ctrl.getConsolidatedHospitalRevenue);
router.get('/analytics/consolidated-revenue', authenticateJWT, ctrl.getConsolidatedHospitalRevenue);
router.get('/v1/analytics/consolidated-revenue', authenticateJWT, ctrl.getConsolidatedHospitalRevenue);

router.get('/doctor-profiles', authenticateJWT, enforceRBAC(['Admin', 'Biller']), ctrl.getDoctorProfiles);
router.post('/doctor-profiles', authenticateJWT, enforceRBAC(['Admin', 'Biller']), validate(upsertDoctorProfileSchema), auditLogger('UPDATE', 'DoctorProfile'), ctrl.upsertDoctorProfile);

router.get('/hospital-settings/public', ctrl.getHospitalSettingsPublic);
router.get('/hospital-settings', authenticateJWT, enforceRBAC(['Admin', 'Receptionist', 'Biller', 'Pharmacist']), ctrl.getHospitalSettings);
router.put('/hospital-settings', authenticateJWT, enforceRBAC(['Admin']), auditLogger('UPDATE', 'HospitalSettings'), ctrl.updateHospitalSettings);

import * as rbacCtrl from './rbac.controller';

router.get('/modules', authenticateJWT, rbacCtrl.getModulesMaster);
router.get('/roles', authenticateJWT, rbacCtrl.getRoles);
router.get('/roles/:id', authenticateJWT, rbacCtrl.getRoleById);
router.post('/roles', authenticateJWT, enforceRBAC(['Admin']), auditLogger('CREATE', 'SecurityRole'), rbacCtrl.createRole);
router.put('/roles/:id', authenticateJWT, enforceRBAC(['Admin']), auditLogger('UPDATE', 'SecurityRole'), rbacCtrl.updateRole);
router.delete('/roles/:id', authenticateJWT, enforceRBAC(['Admin']), auditLogger('DELETE', 'SecurityRole'), rbacCtrl.deleteRole);

// Route registrations completed
export default router;
