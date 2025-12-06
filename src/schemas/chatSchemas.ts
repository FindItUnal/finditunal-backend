import { z } from 'zod';

export const createMessageSchema = z.object({
  message_text: z.string().min(1, 'El mensaje no puede estar vacio').max(2000, 'El mensaje es demasiado largo'),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
