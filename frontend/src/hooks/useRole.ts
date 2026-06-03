/**
 * Role utilities for UI-level permission gating.
 * All definitive access control is enforced by the backend.
 * These helpers only show/hide UI elements.
 */

export type AppRole =
  | 'ADMIN'
  | 'INPUTTER'
  | 'INPUTTER_HO'
  | 'APPROVER'
  | 'APPROVER_HO'
  | 'BRAND'
  | 'BRAND_MANAGER';

/** Returns the current user's role from localStorage (uppercased). */
export function useRole(): AppRole {
  return (localStorage.getItem('user_role') || '').toUpperCase() as AppRole;
}

/** BRAND and ADMIN can create/edit master data (channels, categories, locations, items, content). */
export function canManageMasterData(role: string): boolean {
  return ['ADMIN', 'BRAND'].includes(role.toUpperCase());
}

/** INPUTTER, INPUTTER_HO, BRAND, and ADMIN can create new registrations. */
export function canCreateRegistration(role: string): boolean {
  return ['ADMIN', 'INPUTTER', 'INPUTTER_HO', 'BRAND'].includes(role.toUpperCase());
}

/** APPROVER and APPROVER_HO handle the supervisor review step. */
export function canApproveAsSupervisor(role: string): boolean {
  return ['ADMIN', 'APPROVER', 'APPROVER_HO'].includes(role.toUpperCase());
}

/** BRAND handles the brand intake step. */
export function canHandleBrandIntake(role: string): boolean {
  return ['ADMIN', 'BRAND'].includes(role.toUpperCase());
}

/** BRAND_MANAGER handles the final brand manager approval step. */
export function canApproveBrandManager(role: string): boolean {
  return ['ADMIN', 'BRAND_MANAGER'].includes(role.toUpperCase());
}

/** Only ADMIN can access user management. */
export function isAdmin(role: string): boolean {
  return role.toUpperCase() === 'ADMIN';
}
