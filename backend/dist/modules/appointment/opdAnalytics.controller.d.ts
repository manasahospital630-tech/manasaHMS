import { Request, Response } from 'express';
/**
 * 1. KPI Summary Endpoint
 * Returns Today, Week, Month, Year OPD count & revenue
 */
export declare const getOpdKpiSummary: (req: Request, res: Response) => Promise<void>;
/**
 * 2. Growth Chart & Comparison Endpoint
 */
export declare const getOpdGrowthChart: (req: Request, res: Response) => Promise<void>;
/**
 * 3. Master OPD Filterable Records Grid Endpoint
 * Returns paginated, searchable, multi-filtered OPD records with patient identity & billing info
 */
export declare const getOpdMasterRecords: (req: Request, res: Response) => Promise<void>;
export declare const getFilteredOpdRecords: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=opdAnalytics.controller.d.ts.map