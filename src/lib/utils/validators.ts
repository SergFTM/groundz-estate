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

export const updateProjectSchema = createProjectSchema.extend({
	description: z.string().min(10, 'Description must be at least 10 characters').optional().or(z.literal('')),
	imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal(''))
});

export const addUnitSchema = z.object({
	code: z.string().min(1, 'Unit code is required'),
	type: z.enum(['studio', '1bed', '2bed', '3bed', 'penthouse']),
	bedrooms: z.coerce.number().int().min(0, 'Bedrooms must be 0 or more'),
	floor: z.coerce.number().int('Floor must be a whole number').min(-5),
	areaSqm: z.coerce.number().positive('Area must be positive'),
	price: z.coerce.number().positive('Price must be positive').optional(),
	status: z.enum(['available', 'reserved', 'sold']).default('available')
});

export const documentActionSchema = z.object({
	id: z.string().uuid()
});

export const jobApplicationSchema = z.object({
	name: z.string().min(2, 'Name is required'),
	email: z.string().email('Invalid email address'),
	linkedinUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
	coverLetter: z.string().min(10, 'Please write at least a short message').optional(),
});

export const contactSchema = z.object({
	name: z.string().min(2, 'Name is required'),
	email: z.string().email('Invalid email address'),
	phone: z.string().min(7, 'Valid phone number required').optional().or(z.literal('')),
	message: z.string().min(10, 'Message must be at least 10 characters'),
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
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AddUnitInput = z.infer<typeof addUnitSchema>;
export type DocumentActionInput = z.infer<typeof documentActionSchema>;
export type JobApplicationInput = z.infer<typeof jobApplicationSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
