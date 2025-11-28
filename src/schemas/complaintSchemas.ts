import { z } from 'zod';

export const complaintReasons = ['spam', 'inappropriate', 'fraud', 'other'] as const;
export const complaintStatuses = ['pending', 'in_review', 'resolved', 'rejected'] as const;

export const createComplaintSchema = z.object({
  reason: z.enum(complaintReasons, {
    required_error: 'El motivo de la denuncia es obligatorio',
  }),
  description: z
    .string()
    .trim()
    .min(10, 'La descripci\u00f3n debe tener al menos 10 caracteres')
    .max(2000, 'La descripci\u00f3n no puede superar 2000 caracteres')
    .optional(),
});

export const updateComplaintStatusSchema = z
  .object({
    status: z.enum(complaintStatuses).optional(),
    admin_notes: z
      .string()
      .trim()
      .min(5, 'Las notas deben tener al menos 5 caracteres')
      .max(2000, 'Las notas no pueden superar 2000 caracteres')
      .optional(),
  })
  .refine((data) => data.status !== undefined || data.admin_notes !== undefined, {
    message: 'Debe enviar al menos un campo para actualizar',
    path: ['status'],
  });

export const complaintAdminActionSchema = z.object({
  admin_notes: z
    .string()
    .trim()
    .min(5, 'Las notas deben tener al menos 5 caracteres')
    .max(2000, 'Las notas no pueden superar 2000 caracteres'),
});

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;
export type UpdateComplaintStatusInput = z.infer<typeof updateComplaintStatusSchema>;
