import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const adminLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const campaignCreateSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(200),
  description: z.string().max(1000).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  emailSubject: z.string().max(500).optional(),
  landingPage: z.string().max(500).optional(),
  trackingEnabled: z.boolean().default(true),
  status: z.enum(['DRAFT', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'ARCHIVED']).default('DRAFT'),
});

export const campaignUpdateSchema = campaignCreateSchema.partial();

export const participantCreateSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  employeeEmail: z.string().email('Valid email is required'),
  department: z.string().min(1, 'Department is required'),
});

export const participantBulkCreateSchema = z.object({
  participants: z.array(participantCreateSchema).min(1).max(1000),
});

export const trackingVisitSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const trackingLoginAttemptSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  email: z.string().email().optional(),
  // NOTE: password field is intentionally NOT in this schema
  // Any password data is discarded before validation
});

export const trackingReportSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});
