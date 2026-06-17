import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain uppercase, lowercase and a digit',
      ),
    confirmNewPassword: z.string().min(1, 'Please confirm new password'),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: 'New password and confirmation do not match.',
    path: ['confirmNewPassword'],
  });

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export type LoginDto = z.infer<typeof LoginSchema>;
export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;
export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;
