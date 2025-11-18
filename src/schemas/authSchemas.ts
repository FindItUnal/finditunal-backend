import { z } from 'zod';

// Solo se mantiene actualización de usuario (sin contraseñas)
export const updateUserSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  name: z.string().min(1, 'El nombre es requerido'),
  phone_number: z.string().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export function validateUpdateUser(input: unknown) {
  return updateUserSchema.partial().safeParse(input);
}
