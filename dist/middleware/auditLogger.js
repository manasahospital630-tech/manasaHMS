"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogger = void 0;
const database_1 = require("../config/database");
const auditLogger = (action, resourceType) => {
    return async (req, res, next) => {
        // Capture the original json method to intercept the response
        const originalJson = res.json.bind(res);
        res.json = (body) => {
            // Only log on successful operations
            if (body && body.success) {
                const userId = req.identity?.userId || null;
                const resourceId = req.params.id || body?.data?.user_id || body?.data?.patient_id || body?.data?.appointment_id || body?.data?.encounter_id || body?.data?.invoice_id || body?.data?.prescription_id || body?.data?.item_id || null;
                const ipAddress = req.ip || req.socket.remoteAddress || null;
                const userAgent = req.headers['user-agent'] || null;
                // Build details object with relevant request info
                const details = {};
                if (req.method !== 'GET') {
                    details.method = req.method;
                    details.path = req.originalUrl;
                    // Exclude sensitive fields from the logged body
                    if (req.body) {
                        const sanitizedBody = { ...req.body };
                        delete sanitizedBody.password;
                        delete sanitizedBody.password_hash;
                        details.body = sanitizedBody;
                    }
                }
                // Fire-and-forget audit log insert — do not block the response
                (0, database_1.query)(`INSERT INTO audit_log (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`, [userId, action, resourceType, resourceId, JSON.stringify(details), ipAddress, userAgent]).catch((err) => {
                    console.error('Audit log insert failed:', err.message);
                });
            }
            return originalJson(body);
        };
        next();
    };
};
exports.auditLogger = auditLogger;
//# sourceMappingURL=auditLogger.js.map