"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFilteredOpdRecords = exports.getOpdGrowthChart = exports.getOpdKpiSummary = void 0;
const database_1 = require("../../config/database");
/**
 * Helper to build doctor & payment WHERE SQL clauses
 */
const buildWhereFilters = (doctorId, paymentMethod, status) => {
    let where = "WHERE 1=1";
    const params = [];
    if (doctorId && doctorId !== 'ALL') {
        params.push(doctorId);
        where += ` AND a.doctor_id = $${params.length}`;
    }
    if (status && status !== 'ALL') {
        params.push(status);
        where += ` AND a.status = $${params.length}`;
    }
    if (paymentMethod && paymentMethod !== 'ALL') {
        params.push(`%${paymentMethod}%`);
        where += ` AND (i.payment_method ILIKE $${params.length} OR a.notes ILIKE $${params.length})`;
    }
    return { where, params };
};
/**
 * 1. KPI Summary Endpoint
 * Returns Today, Week, Month, Year OPD count & revenue
 */
const getOpdKpiSummary = async (req, res) => {
    try {
        const { doctorId, paymentMethod } = req.query;
        let docClause = "";
        const params = [];
        if (doctorId && doctorId !== 'ALL') {
            params.push(doctorId);
            docClause += ` AND a.doctor_id = $${params.length}`;
        }
        if (paymentMethod && paymentMethod !== 'ALL') {
            params.push(`%${paymentMethod}%`);
            docClause += ` AND (i.payment_method ILIKE $${params.length} OR a.notes ILIKE $${params.length})`;
        }
        const baseSql = `
      FROM appointments a
      LEFT JOIN doctor_profiles dp ON a.doctor_id = dp.doctor_id
      LEFT JOIN invoices i ON i.patient_id = a.patient_id AND DATE(i.created_at) = DATE(a.appointment_date)
      WHERE a.status != 'Cancelled' ${docClause}
    `;
        const summaryQuery = `
      SELECT 
        COUNT(CASE WHEN DATE(a.appointment_date) = CURRENT_DATE THEN 1 END) as today_count,
        SUM(CASE WHEN DATE(a.appointment_date) = CURRENT_DATE THEN (CASE WHEN a.notes ILIKE '%Free%' THEN 0 ELSE COALESCE(dp.consultation_fee, 500.00) END) ELSE 0 END) as today_revenue,

        COUNT(CASE WHEN a.appointment_date >= DATE_TRUNC('week', CURRENT_DATE) THEN 1 END) as week_count,
        SUM(CASE WHEN a.appointment_date >= DATE_TRUNC('week', CURRENT_DATE) THEN (CASE WHEN a.notes ILIKE '%Free%' THEN 0 ELSE COALESCE(dp.consultation_fee, 500.00) END) ELSE 0 END) as week_revenue,

        COUNT(CASE WHEN a.appointment_date >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as month_count,
        SUM(CASE WHEN a.appointment_date >= DATE_TRUNC('month', CURRENT_DATE) THEN (CASE WHEN a.notes ILIKE '%Free%' THEN 0 ELSE COALESCE(dp.consultation_fee, 500.00) END) ELSE 0 END) as month_revenue,

        COUNT(CASE WHEN a.appointment_date >= DATE_TRUNC('year', CURRENT_DATE) THEN 1 END) as year_count,
        SUM(CASE WHEN a.appointment_date >= DATE_TRUNC('year', CURRENT_DATE) THEN (CASE WHEN a.notes ILIKE '%Free%' THEN 0 ELSE COALESCE(dp.consultation_fee, 500.00) END) ELSE 0 END) as year_revenue
      ${baseSql}
    `;
        const result = await (0, database_1.query)(summaryQuery, params);
        const row = result.rows[0] || {};
        res.json({
            success: true,
            data: {
                today: {
                    totalBookings: parseInt(row.today_count || '0', 10),
                    totalRevenue: parseFloat(row.today_revenue || '0.00')
                },
                week: {
                    totalBookings: parseInt(row.week_count || '0', 10),
                    totalRevenue: parseFloat(row.week_revenue || '0.00')
                },
                month: {
                    totalBookings: parseInt(row.month_count || '0', 10),
                    totalRevenue: parseFloat(row.month_revenue || '0.00')
                },
                year: {
                    totalBookings: parseInt(row.year_count || '0', 10),
                    totalRevenue: parseFloat(row.year_revenue || '0.00')
                }
            }
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
exports.getOpdKpiSummary = getOpdKpiSummary;
/**
 * 2. Growth Chart & Comparison Endpoint
 */
const getOpdGrowthChart = async (req, res) => {
    try {
        const { doctorId, dateRange = 'This Week', startDate, endDate } = req.query;
        const docParams = [];
        let docClause = "";
        if (doctorId && doctorId !== 'ALL') {
            docParams.push(doctorId);
            docClause = ` AND a.doctor_id = $1`;
        }
        // A. Period-over-Period Comparative Stack
        const compSql = `
      SELECT 
        -- Today vs Yesterday
        COUNT(CASE WHEN DATE(a.appointment_date) = CURRENT_DATE THEN 1 END) as today_cnt,
        SUM(CASE WHEN DATE(a.appointment_date) = CURRENT_DATE THEN (CASE WHEN a.notes ILIKE '%Free%' THEN 0 ELSE COALESCE(dp.consultation_fee, 500.00) END) ELSE 0 END) as today_rev,
        COUNT(CASE WHEN DATE(a.appointment_date) = CURRENT_DATE - INTERVAL '1 day' THEN 1 END) as yest_cnt,
        SUM(CASE WHEN DATE(a.appointment_date) = CURRENT_DATE - INTERVAL '1 day' THEN (CASE WHEN a.notes ILIKE '%Free%' THEN 0 ELSE COALESCE(dp.consultation_fee, 500.00) END) ELSE 0 END) as yest_rev,

        -- This Week vs Last Week
        COUNT(CASE WHEN a.appointment_date >= DATE_TRUNC('week', CURRENT_DATE) THEN 1 END) as this_week_cnt,
        SUM(CASE WHEN a.appointment_date >= DATE_TRUNC('week', CURRENT_DATE) THEN (CASE WHEN a.notes ILIKE '%Free%' THEN 0 ELSE COALESCE(dp.consultation_fee, 500.00) END) ELSE 0 END) as this_week_rev,
        COUNT(CASE WHEN a.appointment_date >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '1 week' AND a.appointment_date < DATE_TRUNC('week', CURRENT_DATE) THEN 1 END) as last_week_cnt,
        SUM(CASE WHEN a.appointment_date >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '1 week' AND a.appointment_date < DATE_TRUNC('week', CURRENT_DATE) THEN (CASE WHEN a.notes ILIKE '%Free%' THEN 0 ELSE COALESCE(dp.consultation_fee, 500.00) END) ELSE 0 END) as last_week_rev,

        -- This Month vs Last Month
        COUNT(CASE WHEN a.appointment_date >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as this_month_cnt,
        SUM(CASE WHEN a.appointment_date >= DATE_TRUNC('month', CURRENT_DATE) THEN (CASE WHEN a.notes ILIKE '%Free%' THEN 0 ELSE COALESCE(dp.consultation_fee, 500.00) END) ELSE 0 END) as this_month_rev,
        COUNT(CASE WHEN a.appointment_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month' AND a.appointment_date < DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as last_month_cnt,
        SUM(CASE WHEN a.appointment_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month' AND a.appointment_date < DATE_TRUNC('month', CURRENT_DATE) THEN (CASE WHEN a.notes ILIKE '%Free%' THEN 0 ELSE COALESCE(dp.consultation_fee, 500.00) END) ELSE 0 END) as last_month_rev
      FROM appointments a
      LEFT JOIN doctor_profiles dp ON a.doctor_id = dp.doctor_id
      WHERE a.status != 'Cancelled' ${docClause}
    `;
        const compRes = await (0, database_1.query)(compSql, docParams);
        const c = compRes.rows[0] || {};
        const calcGrowth = (curr, prev) => {
            if (prev === 0)
                return curr > 0 ? 100 : 0;
            return parseFloat((((curr - prev) / prev) * 100).toFixed(1));
        };
        const todayCnt = parseInt(c.today_cnt || '0', 10);
        const yestCnt = parseInt(c.yest_cnt || '0', 10);
        const thisWeekCnt = parseInt(c.this_week_cnt || '0', 10);
        const lastWeekCnt = parseInt(c.last_week_cnt || '0', 10);
        const thisMonthCnt = parseInt(c.this_month_cnt || '0', 10);
        const lastMonthCnt = parseInt(c.last_month_cnt || '0', 10);
        const comparisons = {
            todayVsYesterday: {
                currentCount: todayCnt,
                prevCount: yestCnt,
                growthPct: calcGrowth(todayCnt, yestCnt),
                currentRevenue: parseFloat(c.today_rev || '0.00'),
                prevRevenue: parseFloat(c.yest_rev || '0.00')
            },
            weekVsLastWeek: {
                currentCount: thisWeekCnt,
                prevCount: lastWeekCnt,
                growthPct: calcGrowth(thisWeekCnt, lastWeekCnt),
                currentRevenue: parseFloat(c.this_week_rev || '0.00'),
                prevRevenue: parseFloat(c.last_week_rev || '0.00')
            },
            monthVsLastMonth: {
                currentCount: thisMonthCnt,
                prevCount: lastMonthCnt,
                growthPct: calcGrowth(thisMonthCnt, lastMonthCnt),
                currentRevenue: parseFloat(c.this_month_rev || '0.00'),
                prevRevenue: parseFloat(c.last_month_rev || '0.00')
            }
        };
        // B. Time-series Equalizer Chart Data
        let timeSeriesSql = "";
        const tsParams = [...docParams];
        if (dateRange === 'Today' || dateRange === 'Yesterday') {
            const dateFilter = dateRange === 'Today' ? 'CURRENT_DATE' : "CURRENT_DATE - INTERVAL '1 day'";
            timeSeriesSql = `
        SELECT 
          TO_CHAR(DATE_TRUNC('hour', a.appointment_date), 'HH12:00 AM') as label,
          EXTRACT(HOUR FROM a.appointment_date) as hour_num,
          COUNT(*) as count,
          SUM(CASE WHEN a.notes ILIKE '%Free%' THEN 0 ELSE COALESCE(dp.consultation_fee, 500.00) END) as revenue
        FROM appointments a
        LEFT JOIN doctor_profiles dp ON a.doctor_id = dp.doctor_id
        WHERE a.status != 'Cancelled' AND DATE(a.appointment_date) = ${dateFilter} ${docClause}
        GROUP BY DATE_TRUNC('hour', a.appointment_date), EXTRACT(HOUR FROM a.appointment_date)
        ORDER BY hour_num ASC
      `;
        }
        else if (dateRange === 'This Month' || dateRange === 'Last Month') {
            const monthFilter = dateRange === 'This Month' ? "DATE_TRUNC('month', CURRENT_DATE)" : "DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'";
            timeSeriesSql = `
        SELECT 
          'Day ' || TO_CHAR(a.appointment_date, 'DD (Dy)') as label,
          DATE(a.appointment_date) as day_date,
          COUNT(*) as count,
          SUM(CASE WHEN a.notes ILIKE '%Free%' THEN 0 ELSE COALESCE(dp.consultation_fee, 500.00) END) as revenue
        FROM appointments a
        LEFT JOIN doctor_profiles dp ON a.doctor_id = dp.doctor_id
        WHERE a.status != 'Cancelled' AND DATE_TRUNC('month', a.appointment_date) = ${monthFilter} ${docClause}
        GROUP BY DATE(a.appointment_date), TO_CHAR(a.appointment_date, 'DD (Dy)')
        ORDER BY day_date ASC
      `;
        }
        else if (dateRange === 'This Year') {
            timeSeriesSql = `
        SELECT 
          TO_CHAR(a.appointment_date, 'Mon YYYY') as label,
          EXTRACT(MONTH FROM a.appointment_date) as month_num,
          COUNT(*) as count,
          SUM(CASE WHEN a.notes ILIKE '%Free%' THEN 0 ELSE COALESCE(dp.consultation_fee, 500.00) END) as revenue
        FROM appointments a
        LEFT JOIN doctor_profiles dp ON a.doctor_id = dp.doctor_id
        WHERE a.status != 'Cancelled' AND DATE_TRUNC('year', a.appointment_date) = DATE_TRUNC('year', CURRENT_DATE) ${docClause}
        GROUP BY TO_CHAR(a.appointment_date, 'Mon YYYY'), EXTRACT(MONTH FROM a.appointment_date)
        ORDER BY month_num ASC
      `;
        }
        else {
            // Default: This Week / Last 7 Days
            timeSeriesSql = `
        SELECT 
          TO_CHAR(a.appointment_date, 'Dy (DD Mon)') as label,
          DATE(a.appointment_date) as day_date,
          COUNT(*) as count,
          SUM(CASE WHEN a.notes ILIKE '%Free%' THEN 0 ELSE COALESCE(dp.consultation_fee, 500.00) END) as revenue
        FROM appointments a
        LEFT JOIN doctor_profiles dp ON a.doctor_id = dp.doctor_id
        WHERE a.status != 'Cancelled' AND a.appointment_date >= CURRENT_DATE - INTERVAL '7 days' ${docClause}
        GROUP BY DATE(a.appointment_date), TO_CHAR(a.appointment_date, 'Dy (DD Mon)')
        ORDER BY day_date ASC
      `;
        }
        const tsRes = await (0, database_1.query)(timeSeriesSql, tsParams);
        const timeSeries = tsRes.rows.map(r => ({
            label: r.label,
            count: parseInt(r.count || '0', 10),
            revenue: parseFloat(r.revenue || '0.00')
        }));
        res.json({
            success: true,
            data: {
                comparisons,
                timeSeries
            }
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
exports.getOpdGrowthChart = getOpdGrowthChart;
/**
 * 3. Master Filterable Records Endpoint
 */
const getFilteredOpdRecords = async (req, res) => {
    try {
        const { doctorId = 'ALL', dateRange = 'ALL', paymentMethod = 'ALL', status = 'ALL', search = '', startDate, endDate, limit = '100', offset = '0' } = req.query;
        const limitNum = parseInt(limit, 10) || 100;
        const offsetNum = parseInt(offset, 10) || 0;
        const params = [];
        let whereClause = "WHERE 1=1";
        if (doctorId && doctorId !== 'ALL') {
            params.push(doctorId);
            whereClause += ` AND a.doctor_id = $${params.length}`;
        }
        if (status && status !== 'ALL') {
            params.push(status);
            whereClause += ` AND a.status = $${params.length}`;
        }
        if (paymentMethod && paymentMethod !== 'ALL') {
            params.push(`%${paymentMethod}%`);
            whereClause += ` AND (COALESCE(i.payment_method, 'Cash') ILIKE $${params.length} OR a.notes ILIKE $${params.length})`;
        }
        if (search && search.trim()) {
            const q = `%${search.trim()}%`;
            params.push(q);
            const pIdx = params.length;
            whereClause += ` AND (
        LOWER(CONCAT(p.first_name, ' ', p.last_name)) LIKE LOWER($${pIdx}) OR 
        LOWER(COALESCE(p.mrn, '')) LIKE LOWER($${pIdx}) OR 
        LOWER(COALESCE(p.phone, '')) LIKE LOWER($${pIdx}) OR 
        LOWER(CONCAT(u.first_name, ' ', u.last_name)) LIKE LOWER($${pIdx})
      )`;
        }
        // Date filtering (If 'ALL' or 'All', no date restriction is added!)
        if (dateRange === 'Today') {
            whereClause += ` AND DATE(a.appointment_date) = CURRENT_DATE`;
        }
        else if (dateRange === 'Yesterday') {
            whereClause += ` AND DATE(a.appointment_date) = CURRENT_DATE - INTERVAL '1 day'`;
        }
        else if (dateRange === 'This Week') {
            whereClause += ` AND a.appointment_date >= DATE_TRUNC('week', CURRENT_DATE)`;
        }
        else if (dateRange === 'This Month') {
            whereClause += ` AND a.appointment_date >= DATE_TRUNC('month', CURRENT_DATE)`;
        }
        else if (dateRange === 'This Year') {
            whereClause += ` AND a.appointment_date >= DATE_TRUNC('year', CURRENT_DATE)`;
        }
        else if (dateRange === 'Custom' && startDate && endDate) {
            params.push(startDate);
            whereClause += ` AND DATE(a.appointment_date) >= $${params.length}`;
            params.push(endDate);
            whereClause += ` AND DATE(a.appointment_date) <= $${params.length}`;
        }
        const countSql = `
      SELECT COUNT(*) as total
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.patient_id
      LEFT JOIN users u ON a.doctor_id = u.user_id
      LEFT JOIN invoices i ON i.patient_id = a.patient_id AND DATE(i.created_at) = DATE(a.appointment_date)
      ${whereClause}
    `;
        const countRes = await (0, database_1.query)(countSql, params);
        const total = parseInt(countRes.rows[0]?.total || '0', 10);
        const dataParams = [...params, limitNum, offsetNum];
        const dataSql = `
      SELECT a.*,
             COALESCE(p.first_name || ' ' || p.last_name, 'Unknown Patient') as patient_name,
             COALESCE(p.medical_record_number, '—') as medical_record_number,
             p.phone as patient_phone,
             p.date_of_birth,
             p.gender,
             p.age,
             COALESCE(u.first_name || ' ' || u.last_name, 'Doctor') as doctor_name,
             COALESCE(dp.department, 'General') as doctor_department,
             COALESCE(dp.consultation_fee, 500.00) as doctor_fee,
             CASE WHEN a.notes ILIKE '%Free%' THEN 0.00 ELSE COALESCE(dp.consultation_fee, 500.00) END as amount,
             COALESCE(i.payment_method, CASE WHEN a.notes ILIKE '%Free%' THEN 'Free Review' ELSE 'Cash' END) as payment_method,
             COALESCE(CAST(a.bill_no AS TEXT), CAST(i.invoice_id AS TEXT)) as bill_no,
             COALESCE(a.op_booked_by, 'Reception Desk') as op_booked_by,
             COALESCE(a.op_check_in_by, 'Reception Desk') as op_check_in_by
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.patient_id
      LEFT JOIN users u ON a.doctor_id = u.user_id
      LEFT JOIN doctor_profiles dp ON a.doctor_id = dp.doctor_id
      LEFT JOIN invoices i ON i.patient_id = a.patient_id AND DATE(i.created_at) = DATE(a.appointment_date)
      ${whereClause}
      ORDER BY a.appointment_date DESC, a.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
        const dataRes = await (0, database_1.query)(dataSql, dataParams);
        res.json({
            success: true,
            data: {
                records: dataRes.rows,
                pagination: {
                    total,
                    limit: limitNum,
                    offset: offsetNum,
                    totalPages: Math.ceil(total / limitNum)
                }
            }
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
exports.getFilteredOpdRecords = getFilteredOpdRecords;
//# sourceMappingURL=opdAnalytics.controller.js.map