import { IUser } from '../models/userModel';
import {
  GlobalRestrictions,
  GlobalLimits,
} from '../services/admin/globalSettingsService';

export type RestrictionType =
  | 'aiDisabled'
  | 'createTodolistsDisabled'
  | 'createTasksDisabled'
  | 'loginDisabled';

export type GlobalOnlyRestrictionType = 'registerDisabled';

export type LimitType = 'maxTodolists' | 'maxTasks' | 'maxAIMessages';

/**
 * Check if a restriction is active for a user
 * Applies most restrictive rule: if either global or per-user disables, it's disabled
 */
export function checkRestriction(
  user: IUser | null,
  restrictionType: RestrictionType,
  globalRestrictions: GlobalRestrictions
): boolean {
  // Check global restriction first
  const globalRestricted = globalRestrictions[restrictionType] === true;

  // Check per-user restriction
  const userRestricted =
    user?.restrictions?.[restrictionType] === true;

  // Most restrictive applies: if either is true, restriction is active
  return globalRestricted || userRestricted;
}

/**
 * Check if a global-only restriction is active
 * Used for restrictions that don't make sense per-user (e.g., registerDisabled)
 */
export function checkGlobalRestriction(
  restrictionType: GlobalOnlyRestrictionType,
  globalRestrictions: GlobalRestrictions
): boolean {
  return globalRestrictions[restrictionType] === true;
}

/**
 * Get effective limit for a user
 * Applies most restrictive rule: returns the lower of global or per-user limit
 */
export function getEffectiveLimit(
  user: IUser | null,
  limitType: LimitType,
  globalLimits: GlobalLimits
): number | undefined {
  const globalLimit = globalLimits[limitType];
  const userLimit = user?.limits?.[limitType];

  // If both are undefined, no limit
  if (globalLimit === undefined && userLimit === undefined) {
    return undefined;
  }

  // If only one is set, return that
  if (globalLimit === undefined) {
    return userLimit;
  }
  if (userLimit === undefined) {
    return globalLimit;
  }

  // If both are set, return the lower (more restrictive) value
  return Math.min(globalLimit, userLimit);
}

/**
 * Check if user has reached a limit
 */
export function checkLimit(
  user: IUser | null,
  limitType: LimitType,
  currentCount: number,
  globalLimits: GlobalLimits
): boolean {
  const effectiveLimit = getEffectiveLimit(user, limitType, globalLimits);

  // No limit means unlimited
  if (effectiveLimit === undefined) {
    return false;
  }

  // Check if current count has reached or exceeded the limit
  return currentCount >= effectiveLimit;
}

