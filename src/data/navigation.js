export const NAVIGATION_CATEGORIES = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: 'LayoutDashboard',
        description: 'Key performance indicators and platform overview',
      },
    ],
  },
  {
    title: 'Clinical & Patient Care',
    items: [
      {
        title: 'Patients',
        href: '/patients',
        icon: 'Users',
        badge: '6',
        description: 'Patient directory, UHIDs, and health profiles',
      },
      {
        title: 'Family Members',
        href: '/family-members',
        icon: 'HeartHandshake',
        description: 'Dependent family members registered under accounts',
      },
      {
        title: 'Doctor Appointments',
        href: '/appointments',
        icon: 'CalendarCheck',
        badge: '7',
        description: 'Physical OPD visits across network clinics',
      },
      {
        title: 'Video Consultations',
        href: '/video-consultations',
        icon: 'Video',
        description: 'Telemedicine sessions and virtual rooms',
      },
      {
        title: 'Doctors Directory',
        href: '/doctors',
        icon: 'Stethoscope',
        badge: '7',
        description: 'Verified physicians, OPD schedules, and credentials',
      },
      {
        title: 'Doctor Payments',
        href: '/doctor-payments',
        icon: 'CreditCard',
        badge: 'Payouts',
        badgeVariant: 'warning',
        description: 'Monthly doctor earnings, settlements, and payout management',
      },
      {
        title: 'Registration Requests',
        href: '/registration-requests',
        icon: 'UserCheck',
        badge: '6 Pending',
        badgeVariant: 'warning',
        description: 'New doctor & healthcare centre approval workflows',
      },
    ],
  },
  {
    title: 'Diagnostics & Pharmacy',
    items: [
      {
        title: 'Doorstep Pharmacy',
        href: '/pharmacy',
        icon: 'Pill',
        badge: '1 New Rx',
        badgeVariant: 'warning',
        description: 'Prescription verifications and 15-min deliveries',
      },
      {
        title: 'Pharmacy Delivery Boys',
        href: '/pharmacy-delivery',
        icon: 'Truck',
        description: 'Two-wheeler delivery staff, licences, and self-registration requests',
      },
      {
        title: 'Delivery Staff Payouts',
        href: '/delivery-payouts',
        icon: 'CreditCard',
        badge: 'Payouts',
        badgeVariant: 'warning',
        description: 'Delivery earnings, settlements, and IMPS/UPI payouts',
      },
      {
        title: 'Lab Pathology Tests',
        href: '/lab-tests',
        icon: 'FlaskConical',
        description: 'Blood tests, phlebotomists, and home collections',
      },
      {
        title: 'Lab Test Collectors',
        href: '/lab-collectors',
        icon: 'TestTube2',
        description: 'Certified phlebotomists and doorstep blood sample collection staff',
      },
      {
        title: 'Radiology & Scans',
        href: '/radiology',
        icon: 'ScanLine',
        description: '3T MRI, CT scans, Ultrasound, and X-Rays',
      },
      {
        title: 'Home Nursing',
        href: '/nursing',
        icon: 'UserCheck',
        description: 'Certified B.Sc/GNM nurses, shift rosters, and caregiver requests',
      },
      {
        title: 'Medical Equipment',
        href: '/equipment-rentals',
        icon: 'PackageCheck',
        description: 'Oxygen concentrators, ICU beds, and mobility provider network',
      },
    ],
  },
  {
    title: 'Specialized & Emergency',
    items: [
      {
        title: 'Surgery Care',
        href: '/surgeries',
        icon: 'Activity',
        badge: '8 Cases',
        description: 'Surgical patient details, procedures, and hospital coordination',
      },
      {
        title: 'Emergency SOS',
        href: '/emergency-sos',
        icon: 'AlertTriangle',
        badge: '1 Active',
        badgeVariant: 'danger',
        description: 'Live ALS ambulance dispatches and hospital triage',
      },
      {
        title: 'Memberships',
        href: '/memberships',
        icon: 'ShieldCheck',
        description: 'Care+, Family Shield, and Senior Gold wellness plans',
      },
    ],
  },
  {
    title: 'Network & Operations',
    items: [
      {
        title: 'Hospital & Partners',
        href: '/providers',
        icon: 'Building2',
        description: 'Empaneled hospitals, imaging hubs, and pharmacies',
      },
      {
        title: 'City Operations',
        href: '/city-operations',
        icon: 'MapPin',
        description: 'Mysuru, Bengaluru, Hubballi coverage and fleet hubs',
      },
      {
        title: 'Finance & Wallet',
        href: '/finance',
        icon: 'Wallet',
        description: 'Patient wallets, partner payouts, and settlements',
      },
      {
        title: 'Reports & Analytics',
        href: '/reports',
        icon: 'BarChart3',
        description: 'Modality breakdowns, clinical and revenue reports',
      },
    ],
  },
  {
    title: 'Governance & Security',
    items: [
      {
        title: 'Admin Users & Roles',
        href: '/admin-users',
        icon: 'ShieldAlert',
        description: 'Portal permissions and staff account management',
      },
      {
        title: 'Audit Logs',
        href: '/audit-logs',
        icon: 'FileText',
        description: 'Traceable administrative activity and security trail',
      },
      {
        title: 'System Settings',
        href: '/settings',
        icon: 'Settings',
        description: 'Platform configurations, API modes, and operational defaults',
      },
    ],
  },
];
