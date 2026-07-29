"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBusinessUnit = exports.createBusinessUnit = exports.getBusinessUnits = exports.updateTeamRoles = exports.updateTeamMembers = exports.getTeamMembers = exports.deleteTeam = exports.updateTeam = exports.createTeam = exports.getTeams = exports.ensureTablesExist = void 0;
const database_1 = require("../../config/database");
const errorHandler_1 = require("../../middleware/errorHandler");
let tablesInitialized = false;
const ensureTablesExist = async () => {
    if (tablesInitialized)
        return;
    try {
        await (0, database_1.query)(`
      CREATE TABLE IF NOT EXISTS teams (
        team_id VARCHAR(50) PRIMARY KEY,
        team_name VARCHAR(100) NOT NULL,
        bu_id VARCHAR(50),
        category VARCHAR(50) DEFAULT 'Clinical',
        team_type VARCHAR(30) DEFAULT 'Owner',
        team_lead_id VARCHAR(50) REFERENCES users(user_id) ON DELETE SET NULL,
        status VARCHAR(20) DEFAULT 'Active',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE teams ALTER COLUMN bu_id DROP NOT NULL;
      ALTER TABLE teams ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Clinical';
      ALTER TABLE teams ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Active';
      ALTER TABLE teams ADD COLUMN IF NOT EXISTS description TEXT;

      CREATE TABLE IF NOT EXISTS team_members (
        team_id VARCHAR(50) REFERENCES teams(team_id) ON DELETE CASCADE,
        user_id VARCHAR(50) REFERENCES users(user_id) ON DELETE CASCADE,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (team_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS team_security_roles (
        team_id VARCHAR(50) REFERENCES teams(team_id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        PRIMARY KEY (team_id, role)
      );
    `);
        // Seed default teams if empty
        const countRes = await (0, database_1.query)('SELECT COUNT(*) FROM teams');
        if (parseInt(countRes.rows[0].count, 10) === 0) {
            await (0, database_1.query)(`
        INSERT INTO teams (team_id, team_name, category, team_type, status, description) VALUES
        ('TEAM-01', 'OPD Clinical Team', 'Clinical', 'Owner', 'Active', 'Outpatient doctors, consulting physicians, and reception staff'),
        ('TEAM-02', 'IPD Ward & Inpatient Team', 'Clinical', 'Owner', 'Active', 'Inpatient ward doctors, duty medical officers, and ward nurses'),
        ('TEAM-03', 'Emergency & Critical Care Team', 'Critical Care', 'Owner', 'Active', 'Emergency room doctors, ICU specialists, and trauma care nurses'),
        ('TEAM-04', 'Pathology & Diagnostics Team', 'Diagnostics', 'Owner', 'Active', 'Lab technicians, pathologists, and diagnostic imaging staff'),
        ('TEAM-05', 'Pharmacy & Dispensing Team', 'Pharmacy', 'Owner', 'Active', 'Pharmacists, dispensing staff, and inventory managers'),
        ('TEAM-06', 'Billing & Accounts Team', 'Administration', 'Owner', 'Active', 'Revenue accountants, cashier billers, and insurance desks'),
        ('TEAM-07', 'Front Desk & Reception Team', 'Operations', 'Owner', 'Active', 'Patient registration, appointment schedulers, and helpdesk'),
        ('TEAM-08', 'Hospital IT & Administration Team', 'IT & Infrastructure', 'Owner', 'Active', 'System administrators, IT support, and executive management')
        ON CONFLICT (team_id) DO NOTHING;
      `);
            await (0, database_1.query)(`
        INSERT INTO team_security_roles (team_id, role) VALUES
        ('TEAM-01', 'Doctor'), ('TEAM-01', 'Nurse'),
        ('TEAM-02', 'Doctor'), ('TEAM-02', 'Nurse'),
        ('TEAM-03', 'Doctor'), ('TEAM-03', 'Nurse'),
        ('TEAM-04', 'Incharge'),
        ('TEAM-05', 'Pharmacist'),
        ('TEAM-06', 'Biller'),
        ('TEAM-07', 'Receptionist'),
        ('TEAM-08', 'Admin')
        ON CONFLICT DO NOTHING;
      `);
        }
        tablesInitialized = true;
    }
    catch (err) {
        console.error('Failed to ensure Teams tables exist:', err);
    }
};
exports.ensureTablesExist = ensureTablesExist;
(0, exports.ensureTablesExist)();
const getTeams = async () => {
    await (0, exports.ensureTablesExist)();
    const res = await (0, database_1.query)(`
    SELECT 
      t.team_id, 
      t.team_name, 
      t.category,
      t.team_type, 
      t.team_lead_id,
      u.first_name || ' ' || u.last_name as team_lead_name,
      u.email as team_lead_email,
      u.role as team_lead_role,
      t.status,
      t.description,
      t.created_at,
      (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.team_id) as member_count,
      (SELECT ARRAY_AGG(tsr.role) FROM team_security_roles tsr WHERE tsr.team_id = t.team_id) as roles
    FROM teams t
    LEFT JOIN users u ON t.team_lead_id = u.user_id
    ORDER BY t.created_at ASC
  `);
    return res.rows.map(r => ({
        teamId: r.team_id,
        teamName: r.team_name,
        category: r.category || 'Clinical',
        teamType: r.team_type || 'Owner',
        teamLeadId: r.team_lead_id,
        teamLeadName: r.team_lead_name || 'Unassigned',
        teamLeadEmail: r.team_lead_email || '',
        teamLeadRole: r.team_lead_role || '',
        status: r.status || 'Active',
        description: r.description || '',
        createdAt: r.created_at,
        memberCount: parseInt(r.member_count, 10) || 0,
        roles: r.roles || []
    }));
};
exports.getTeams = getTeams;
const createTeam = async (data) => {
    await (0, exports.ensureTablesExist)();
    let teamId = data.teamId;
    if (!teamId) {
        const countRes = await (0, database_1.query)('SELECT COUNT(*) FROM teams');
        const num = parseInt(countRes.rows[0].count, 10) + 1;
        teamId = `TEAM-${String(num).padStart(2, '0')}`;
    }
    const res = await (0, database_1.query)(`INSERT INTO teams (team_id, team_name, category, team_type, team_lead_id, status, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`, [
        teamId,
        data.teamName,
        data.category || 'Clinical',
        data.teamType || 'Owner',
        data.teamLeadId || null,
        data.status || 'Active',
        data.description || null
    ]);
    if (data.roles && data.roles.length > 0) {
        for (const role of data.roles) {
            await (0, database_1.query)(`INSERT INTO team_security_roles (team_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [teamId, role]);
        }
    }
    return res.rows[0];
};
exports.createTeam = createTeam;
const updateTeam = async (teamId, data) => {
    await (0, exports.ensureTablesExist)();
    const res = await (0, database_1.query)(`UPDATE teams
     SET team_name = COALESCE($1, team_name),
         category = COALESCE($2, category),
         team_type = COALESCE($3, team_type),
         team_lead_id = $4,
         status = COALESCE($5, status),
         description = $6,
         updated_at = NOW()
     WHERE team_id = $7
     RETURNING *`, [
        data.teamName,
        data.category,
        data.teamType,
        data.teamLeadId || null,
        data.status,
        data.description || null,
        teamId
    ]);
    if (res.rows.length === 0)
        throw new errorHandler_1.AppError('Team not found', 404);
    if (data.roles) {
        await (0, database_1.query)(`DELETE FROM team_security_roles WHERE team_id = $1`, [teamId]);
        for (const role of data.roles) {
            await (0, database_1.query)(`INSERT INTO team_security_roles (team_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [teamId, role]);
        }
    }
    return res.rows[0];
};
exports.updateTeam = updateTeam;
const deleteTeam = async (teamId) => {
    await (0, exports.ensureTablesExist)();
    await (0, database_1.query)(`DELETE FROM teams WHERE team_id = $1`, [teamId]);
    return { success: true };
};
exports.deleteTeam = deleteTeam;
const getTeamMembers = async (teamId) => {
    await (0, exports.ensureTablesExist)();
    const assignedRes = await (0, database_1.query)(`
    SELECT u.user_id, u.first_name, u.last_name, u.email, u.role, u.employee_department
    FROM team_members tm
    JOIN users u ON tm.user_id = u.user_id
    WHERE tm.team_id = $1
    ORDER BY u.first_name ASC
  `, [teamId]);
    const availableRes = await (0, database_1.query)(`
    SELECT u.user_id, u.first_name, u.last_name, u.email, u.role, u.employee_department
    FROM users u
    WHERE u.role != 'Patient'
      AND u.user_id NOT IN (SELECT user_id FROM team_members WHERE team_id = $1)
    ORDER BY u.first_name ASC
  `, [teamId]);
    const rolesRes = await (0, database_1.query)(`SELECT role FROM team_security_roles WHERE team_id = $1`, [teamId]);
    return {
        assignedMembers: assignedRes.rows,
        availableUsers: availableRes.rows,
        securityRoles: rolesRes.rows.map(r => r.role)
    };
};
exports.getTeamMembers = getTeamMembers;
const updateTeamMembers = async (teamId, memberUserIds) => {
    await (0, exports.ensureTablesExist)();
    await (0, database_1.query)(`DELETE FROM team_members WHERE team_id = $1`, [teamId]);
    for (const uid of memberUserIds) {
        await (0, database_1.query)(`INSERT INTO team_members (team_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [teamId, uid]);
    }
    return { success: true, count: memberUserIds.length };
};
exports.updateTeamMembers = updateTeamMembers;
const updateTeamRoles = async (teamId, roles) => {
    await (0, exports.ensureTablesExist)();
    await (0, database_1.query)(`DELETE FROM team_security_roles WHERE team_id = $1`, [teamId]);
    for (const role of roles) {
        await (0, database_1.query)(`INSERT INTO team_security_roles (team_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [teamId, role]);
    }
    return { success: true, roles };
};
exports.updateTeamRoles = updateTeamRoles;
// Aliases for backward compatibility
exports.getBusinessUnits = exports.getTeams;
exports.createBusinessUnit = exports.createTeam;
exports.updateBusinessUnit = exports.updateTeam;
//# sourceMappingURL=businessUnits.service.js.map