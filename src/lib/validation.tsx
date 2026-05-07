import { z } from "zod";

// Schémas de validation pour les formulaires
export const loginSchema = z.object({
  email: z.string().email("Email invalide").min(1, "L'email est requis"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères")
});

export const registerSchema = z.object({
  email: z.string().email("Email invalide").min(1, "L'email est requis"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre"),
  confirmPassword: z.string().min(1, "La confirmation du mot de passe est requise"),
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  phone: z.string().regex(/^\+243[1-9]\d{8}$/, "Numéro de téléphone invalide (format: +243 XXX XXX XXXX)")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"]
});

export const orderSchema = z.object({
  pickupAddress: z.string().min(5, "L'adresse de ramassage est requise"),
  deliveryAddress: z.string().min(5, "L'adresse de livraison est requise"),
  recipientName: z.string().min(2, "Le nom du destinataire est requis"),
  recipientPhone: z.string().regex(/^\+243[1-9]\d{8}$/, "Numéro de téléphone invalide"),
  packageType: z.enum(["document", "colis", "nourriture", "autre"]),
  packageWeight: z.number().min(0.1, "Le poids doit être supérieur à 0").max(50, "Le poids ne peut dépasser 50kg"),
  packageDescription: z.string().min(10, "La description doit contenir au moins 10 caractères"),
  deliveryType: z.enum(["standard", "express", "prioritaire"]),
  specialInstructions: z.string().optional()
});

export const contactSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide").min(1, "L'email est requis"),
  phone: z.string().regex(/^\+243[1-9]\d{8}$/, "Numéro de téléphone invalide"),
  subject: z.string().min(3, "Le sujet doit contenir au moins 3 caractères"),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères")
});

// Types TypeScript dérivés des schémas
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type OrderFormData = z.infer<typeof orderSchema>;
export type ContactFormData = z.infer<typeof contactSchema>;

// Fonctions de validation
export const validateForm = <T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; errors?: Record<string, string> } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          errors[err.path[0] as string] = err.message;
        }
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: "Erreur de validation" } };
  }
};

// Fonctions de sécurité
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+243[1-9]\d{8}$/;
  return phoneRegex.test(phone);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Constantes de sécurité
export const SECURITY_CONFIG = {
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  passwordMinLength: 8,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
};
