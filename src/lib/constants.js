export const BRAND_COLORS = {
  teal: '#00B894',
  navy: '#1E3A8A',
  aqua: '#00C2CB',
  green: '#7BC96F',
  coral: '#FF7F50',
  slate: '#647488',
  background: '#F7FAFC',
  white: '#FFFFFF',
};

export const OPERATIONAL_CITIES = [
  'All Cities',
  'Mysuru',
  'Bengaluru',
  'Hubballi-Dharwad',
  'Mangaluru',
  'Hassan',
  'Belagavi',
  'Davanagere',
];

export const STATUS_BADGE_VARIANTS = {
  // Doctor Payments & Settlement
  Paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200',
  'Partially Paid': 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200',
  Pending: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200',
  Settled: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200',

  // City & Service Availability
  Available: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200',
  Visible: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200',
  Hidden: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-300',
  Disabled: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200',
  'Coming Soon': 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200',

  // Registration Requests Workflow
  'Pending Review': 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200',
  'Additional Information Required': 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200',
  Approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200',

  // Appointment / General Status
  Confirmed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200',
  Scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200',
  'In-Progress': 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200',
  Completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200',
  Delivered: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200',
  Cancelled: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200',
  'No-Show': 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200',

  // Order Status
  'Pending Verification': 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200',
  'Prescription Approved': 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200',
  'Prescription Rejected': 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200',
  Processing: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200',
  Packing: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200',
  'Out for Delivery': 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200',

  // Verification
  Verified: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200',
  'Under Review': 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200',
  Rejected: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200',

  // User / Provider
  Active: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200',
  Inactive: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200',
  Suspended: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200',
  'On Leave': 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200',

  // Emergency SOS
  'Critical - Red': 'bg-red-500 text-white animate-sos-pulse border-red-600 font-bold',
  'Urgent - Amber': 'bg-amber-500 text-white border-amber-600 font-bold',
  'Routine - Green': 'bg-emerald-500 text-white border-emerald-600',
  'SOS Triggered': 'bg-red-600 text-white animate-sos-pulse border-red-700',
  'Ambulance Assigned': 'bg-blue-600 text-white border-blue-700',
  'En Route to Patient': 'bg-purple-600 text-white border-purple-700',
  'Patient Onboard': 'bg-indigo-600 text-white border-indigo-700',
  'Arrived at Hospital': 'bg-teal-600 text-white border-teal-700',
  'Handover Complete': 'bg-slate-600 text-white border-slate-700',

  // Diagnostics & Radiology
  'Sample Collected': 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200',
  'Processing in Lab': 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200',
  'Report Ready': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200',
  'Scan Scheduled': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200',
  'Scan Completed': 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200',
  'Report Published': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200',
};

export const ADMIN_ROLES = [
  'Super Admin',
  'Operations Manager',
  'Clinical Director',
  'Pharmacy Lead',
  'Support Agent',
];
