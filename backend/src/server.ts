import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/environment';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import patientRoutes from './modules/patient/patient.routes';
import appointmentRoutes from './modules/appointment/appointment.routes';
import emrRoutes from './modules/emr/encounter.routes';
import pharmacyRoutes from './modules/pharmacy/pharmacy.routes';
import billingRoutes from './modules/billing/billing.routes';
import adminRoutes from './modules/admin/admin.routes';
import ipRoutes from './modules/inpatient/ip.routes';
import diagnosticsRoutes from './modules/diagnostics/diagnostics.routes';
import emergencyRoutes from './modules/emergency/emergency.routes';

// Global exception handlers to prevent 503 crashes on Hostinger / Phusion Passenger / PM2
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

const app = express();

// Security & parsing middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-is-human', 'x-path', 'x-method'],
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Ensure local uploads directory structure exists
const uploadsDir = path.join(process.cwd(), 'uploads');
const uploadSubDirs = ['images', 'documents', 'qrcodes'];
uploadSubDirs.forEach((subDir) => {
  const fullPath = path.join(uploadsDir, subDir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Serve static uploads directory
app.use('/uploads', express.static(uploadsDir));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      service: 'Manasa HMS API',
    },
  });
});

import opdAnalyticsRoutes from './modules/appointment/opdAnalytics.routes';

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/v1/queue', appointmentRoutes);
app.use('/api/queue', appointmentRoutes);
app.use('/api/v1/opd/dashboard', opdAnalyticsRoutes);
app.use('/api/opd/dashboard', opdAnalyticsRoutes);
app.use('/api/emr', emrRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/v1/analytics', adminRoutes);
app.use('/api/analytics', adminRoutes);
app.use('/api/inpatient', ipRoutes);
app.use('/api/diagnostics', diagnosticsRoutes);
app.use('/api/v1/emergency', emergencyRoutes);

// Serve static assets dynamically whenever index.html is available
const staticCandidates = [
  path.join(__dirname, '../../dist'),
  path.join(__dirname, '../dist'),
  path.join(__dirname, './dist'),
  __dirname,
  path.join(process.cwd(), 'dist'),
  path.join(process.cwd(), 'frontend/dist'),
  path.join(__dirname, '../../frontend/dist')
];

let frontendPath = '';
for (const cand of staticCandidates) {
  if (fs.existsSync(path.join(cand, 'index.html'))) {
    frontendPath = cand;
    break;
  }
}

if (frontendPath) {
  app.use(express.static(frontendPath));

  // Explicit root route handler
  app.get('/', (_req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });

  // For any non-API routes, serve index.html (React routing)
  app.get('*', (req, res, next) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    } else {
      next();
    }
  });
}

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found.',
  });
});

// Global error handler
app.use(errorHandler);

// Start server if not running on Vercel Serverless
if (!process.env.VERCEL) {
  const PORT = env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`\n🏥 Manasa HMS API Server`);
    console.log(`   Environment: ${env.NODE_ENV}`);
    console.log(`   Port: ${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health\n`);
  });
}

export default app;
