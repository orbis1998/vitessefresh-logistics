import { createHash, randomBytes } from 'crypto';

// Fonctions de sécurité pour l'application

export class SecurityUtils {
  /**
   * Génère un token CSRF sécurisé
   */
  static generateCSRFToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Valide un token CSRF
   */
  static validateCSRFToken(token: string, sessionToken: string): boolean {
    return token === sessionToken;
  }

  /**
   * Hash un mot de passe avec un sel
   */
  static hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const actualSalt = salt || randomBytes(16).toString('hex');
    const hash = createHash('sha256')
      .update(password + actualSalt)
      .digest('hex');
    return { hash, salt: actualSalt };
  }

  /**
   * Vérifie un mot de passe
   */
  static verifyPassword(password: string, hash: string, salt: string): boolean {
    const { hash: computedHash } = this.hashPassword(password, salt);
    return computedHash === hash;
  }

  /**
   * Génère un token de réinitialisation sécurisé
   */
  static generateResetToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Vérifie si un token de réinitialisation est valide (non expiré)
   */
  static isValidResetToken(token: string, timestamp: number, maxAge: number = 3600000): boolean {
    return Date.now() - timestamp < maxAge;
  }

  /**
   * Nettoie les entrées utilisateur pour prévenir XSS
   */
  static sanitizeInput(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Valide la force d'un mot de passe
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Longueur
    if (password.length >= 8) score += 1;
    else feedback.push("Le mot de passe doit contenir au moins 8 caractères");

    // Complexité
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push("Ajoutez des lettres minuscules");

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push("Ajoutez des lettres majuscules");

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push("Ajoutez des chiffres");

    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    else feedback.push("Ajoutez des caractères spéciaux");

    return {
      isValid: score >= 4,
      score,
      feedback
    };
  }

  /**
   * Génère une session sécurisée
   */
  static generateSecureSession(): {
    sessionId: string;
    expiresAt: number;
  } {
    return {
      sessionId: randomBytes(32).toString('hex'),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 heures
    };
  }

  /**
   * Vérifie si une session est valide
   */
  static isSessionValid(expiresAt: number): boolean {
    return Date.now() < expiresAt;
  }

  /**
   * Rate limiting simple en mémoire
   */
  private static rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  static checkRateLimit(
    identifier: string, 
    maxAttempts: number = 5, 
    windowMs: number = 15 * 60 * 1000
  ): { allowed: boolean; remainingAttempts: number; resetTime: number } {
    const now = Date.now();
    const record = this.rateLimitMap.get(identifier);

    if (!record || now > record.resetTime) {
      // Nouvelle fenêtre ou reset
      this.rateLimitMap.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
      return { allowed: true, remainingAttempts: maxAttempts - 1, resetTime: now + windowMs };
    }

    if (record.count >= maxAttempts) {
      return { 
        allowed: false, 
        remainingAttempts: 0, 
        resetTime: record.resetTime 
      };
    }

    record.count++;
    return { 
      allowed: true, 
      remainingAttempts: maxAttempts - record.count, 
      resetTime: record.resetTime 
    };
  }

  /**
   * Validation des types de fichiers
   */
  static validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type);
  }

  /**
   * Validation de la taille des fichiers
   */
  static validateFileSize(file: File, maxSize: number): boolean {
    return file.size <= maxSize;
  }

  /**
   * Génère des headers de sécurité HTTP
   */
  static getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };
  }
}

// Middleware de sécurité pour les appels API
export const securityMiddleware = (req: any, res: any, next: any) => {
  // Ajouter les headers de sécurité
  const headers = SecurityUtils.getSecurityHeaders();
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Valider le token CSRF si nécessaire
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const csrfToken = req.headers['x-csrf-token'];
    const sessionToken = req.session?.csrfToken;
    
    if (!csrfToken || !SecurityUtils.validateCSRFToken(csrfToken, sessionToken)) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
  }

  next();
};

// Configuration CORS sécurisée
export const corsConfig = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://vitaexpress.com', 'https://www.vitaexpress.com']
    : ['http://localhost:3000', 'http://localhost:8080'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
};
