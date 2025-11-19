import { z } from 'zod';

// Único campo editable por el usuario
export const updateUserSchema = z.object({
  phone_number: z
    .string({
      required_error: 'El número de teléfono es requerido',
    })
    .min(7, 'El número de teléfono debe tener al menos 7 caracteres')
    .max(20, 'El número de teléfono es demasiado largo')
    .optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export function validateUpdateUser(input: unknown) {
  return updateUserSchema.safeParse(input);
}
