import { z } from 'zod';

export const loginSchema = z.object({
	email: z.string().email('Invalid email address'),
	password: z.string().min(6, 'Password must be at least 6 characters')
});

export const registerSchema = z.object({
	name: z.string().min(2, 'Name must be at least 2 characters'),
	email: z.string().email('Invalid email address'),
	password: z.string().min(6, 'Password must be at least 6 characters'),
	role: z.enum(['buyer', 'investor', 'agent']).default('buyer')
});

export const newsletterSchema = z.object({
	email: z.string().email('Invalid email address'),
	gdprConsent: z.string().refine((v) => v === 'on', { message: 'Consent is required' })
});

export const brochureSchema = z.object({
	name: z.string().min(2, 'Name is required'),
	email: z.string().email('Invalid email address'),
	phone: z.string().min(7, 'Valid phone number is required'),
	project: z.string().min(1, 'Please select a project')
});

export const callBookingSchema = z.object({
	name: z.string().min(2, 'Name is required'),
	phone: z.string().min(7, 'Valid phone number is required'),
	timeSlot: z.enum(['morning', 'afternoon', 'evening']),
	message: z.string().optional()
});

export const quizSchema = z.object({
	timing: z.string().min(1),
	purpose: z.string().min(1),
	budget: z.string().min(1),
	installment: z.string().min(1),
	name: z.string().min(2, 'Name is required'),
	phone: z.string().min(7, 'Phone is required')
});

export const updateLeadSchema = z.object({
	tag: z.enum(['hot', 'warm', 'cold']).optional(),
	status: z.enum(['new', 'contacted', 'converted', 'lost']).optional(),
	agentId: z.string().uuid().optional().or(z.literal('')),
	name: z.string().min(1).optional(),
	phone: z.string().min(7).optional()
});

export const updateRoleSchema = z.object({
	role: z.enum(['buyer', 'investor', 'agent', 'internal_team'])
});

export const createProjectSchema = z.object({
	name: z.string().min(2, 'Project name is required'),
	slug: z.string().min(2, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
	location: z.string().min(2, 'Location is required'),
	status: z.enum(['active', 'coming_soon', 'completed'])
});

export const documentActionSchema = z.object({
	id: z.string().uuid()
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type NewsletterInput = z.infer<typeof newsletterSchema>;
export type BrochureInput = z.infer<typeof brochureSchema>;
export type CallBookingInput = z.infer<typeof callBookingSchema>;
export type QuizInput = z.infer<typeof quizSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type DocumentActionInput = z.infer<typeof documentActionSchema>;
