import { useState, useCallback } from 'react';
import { SecurityUtils } from '@/lib/security';

interface UseRateLimitOptions {
  maxAttempts?: number;
  windowMs?: number;
  identifier?: string;
}

interface RateLimitState {
  allowed: boolean;
  remainingAttempts: number;
  resetTime: number;
  isBlocked: boolean;
  blockTimeLeft: number;
}

export const useRateLimit = (options: UseRateLimitOptions = {}) => {
  const {
    maxAttempts = 5,
    windowMs = 15 * 60 * 1000, // 15 minutes
    identifier = 'default'
  } = options;

  const [state, setState] = useState<RateLimitState>({
    allowed: true,
    remainingAttempts: maxAttempts,
    resetTime: Date.now() + windowMs,
    isBlocked: false,
    blockTimeLeft: 0
  });

  const checkLimit = useCallback(() => {
    const result = SecurityUtils.checkRateLimit(identifier, maxAttempts, windowMs);
    const isBlocked = !result.allowed;
    const blockTimeLeft = isBlocked ? Math.max(0, result.resetTime - Date.now()) : 0;

    setState({
      allowed: result.allowed,
      remainingAttempts: result.remainingAttempts,
      resetTime: result.resetTime,
      isBlocked,
      blockTimeLeft
    });

    return result;
  }, [identifier, maxAttempts, windowMs]);

  const resetLimit = useCallback(() => {
    setState({
      allowed: true,
      remainingAttempts: maxAttempts,
      resetTime: Date.now() + windowMs,
      isBlocked: false,
      blockTimeLeft: 0
    });
  }, [maxAttempts, windowMs]);

  return {
    ...state,
    checkLimit,
    resetLimit
  };
};
