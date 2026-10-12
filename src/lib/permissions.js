export const PERMISSIONS = {
  PATIENTS_VIEW: 'patients:view',
  PATIENTS_MANAGE: 'patients:manage',
  DOCTORS_VIEW: 'doctors:view',
  DOCTORS_VERIFY: 'doctors:verify',
  APPOINTMENTS_MANAGE: 'appointments:manage',
  PHARMACY_APPROVE_RX: 'pharmacy:approve_rx',
  PHARMACY_DISPATCH: 'pharmacy:dispatch',
  DIAGNOSTICS_MANAGE: 'diagnostics:manage',
  SOS_DISPATCH: 'sos:dispatch',
  FINANCE_SETTLEMENT: 'finance:settlement',
  SETTINGS_UPDATE: 'settings:update',
  USERS_MANAGE: 'users:manage',
};

export const ROLE_PERMISSIONS = {
  'Super Admin': Object.values(PERMISSIONS),
  'Operations Manager': [
    PERMISSIONS.PATIENTS_VIEW,
    PERMISSIONS.DOCTORS_VIEW,
    PERMISSIONS.APPOINTMENTS_MANAGE,
    PERMISSIONS.PHARMACY_DISPATCH,
    PERMISSIONS.DIAGNOSTICS_MANAGE,
    PERMISSIONS.SOS_DISPATCH,
  ],
  'Clinical Director': [
    PERMISSIONS.PATIENTS_VIEW,
    PERMISSIONS.DOCTORS_VIEW,
    PERMISSIONS.DOCTORS_VERIFY,
    PERMISSIONS.APPOINTMENTS_MANAGE,
    PERMISSIONS.PHARMACY_APPROVE_RX,
  ],
  'Pharmacy Lead': [
    PERMISSIONS.PHARMACY_APPROVE_RX,
    PERMISSIONS.PHARMACY_DISPATCH,
    PERMISSIONS.PATIENTS_VIEW,
  ],
  'Support Agent': [
    PERMISSIONS.PATIENTS_VIEW,
    PERMISSIONS.APPOINTMENTS_MANAGE,
    PERMISSIONS.SOS_DISPATCH,
  ],
};

export function hasPermission(role, permission) {
  const allowed = ROLE_PERMISSIONS[role] || [];
  return allowed.includes(permission);
}
