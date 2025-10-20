import { z } from 'zod';

// Esquema para el registro de usuarios
export const registerSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  name: z.string().min(1, 'El nombre es requerido'),
  phone_number: z.string().optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  name: z.string().min(1, 'El nombre es requerido'),
  phone_number: z.string().optional(),
});

// Esquema para el inicio de sesión
export const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

// Exportar los tipos inferidos de los esquemas
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export function validateRegister(input: RegisterInput) {
  return registerSchema.safeParse(input);
}

export function validateLogin(input: LoginInput) {
  return loginSchema.safeParse(input);
}

export function validateUpdateUser(input: unknown) {
  return updateUserSchema.partial().safeParse(input);
}
