import { z } from 'zod';

const combineDateWithDefaultTime = (dateString: string): Date => {
  const providedDate = new Date(`${dateString}T12:00:00.000Z`);
  return providedDate;
};

// Esquema para crear un reporte
export const reportSchema = z.object({
  category_id: z.string().transform((val) => Number(val)), // Convierte a número
  location_id: z.string().transform((val) => Number(val)),
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  status: z.enum(['perdido', 'encontrado', 'entregado']),
  date_lost_or_found: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
    .transform((dateString) => combineDateWithDefaultTime(dateString)),
  contact_method: z.string().min(1, 'El método de contacto es requerido'),
});

// Exportar tipos inferidos
export type CreateReportInput = z.infer<typeof reportSchema>;
export type UpdateReportInput = z.infer<typeof reportSchema>;

// Exportar funciones de validación
export function validateCreateReport(input: unknown) {
  return reportSchema.safeParse(input);
}

export function validateUpdateReport(input: unknown) {
  return reportSchema.partial().safeParse(input);
}
