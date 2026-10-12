# MediUnify Super Admin Portal — Frontend Architecture

> **Platform**: MediUnify (Karnataka Regional Healthcare Operations)  
> **Phase**: Frontend Only (Future Node.js REST API-Ready Architecture)  
> **Framework**: Next.js 14 (App Router) + React 18 + Tailwind CSS (Pure JavaScript `.js` / `.jsx`)  
> **Design Tokens**: MediUnify Official Teal (`#00B894`), Navy (`#1E3A8A`), Aqua (`#00C2CB`), Coral (`#FF7F50`)  

---

## 1. Executive Overview

The **MediUnify Super Admin Portal** is an enterprise-grade healthcare management application designed for central oversight across patient care, doctor consultations, doorstep pharmacy, NABL diagnostic collections, 3T MRI & radiology, home nursing, medical equipment rentals, specialized fertility/IVF tracking, and 24x7 emergency ALS ambulance dispatches across Karnataka (Mysuru, Bengaluru, Hubballi-Dharwad, Mangaluru, and expanding regions).

### Current Development Phase: Frontend-Only
- Runs **100% locally** without requiring a live backend, database, or Express server.
- Uses realistic local mock repositories with in-memory caching and optional browser `localStorage` persistence.
- **Strictly preserves** MediUnify camelCase data schemas, UHID formats (e.g., `MU-84920`), and status enums.
- Built using JavaScript (`.js` / `.jsx`) files with full component-level reactivity and CSV table exports.

---

## 2. Directory Structure

```text
super admin/
├── public/
│   ├── images/
│   │   ├── mediunify-logo.png
│   │   └── mediunify-mark.png
│   ├── icons/
│   │   ├── icon.png
│   │   └── bot-icon.png
│   └── favicon.ico
│
├── src/
│   ├── app/
│   │   ├── layout.js
│   │   ├── page.js                  (Redirects to /dashboard)
│   │   ├── globals.css              (MediUnify CSS variables & pulse animations)
│   │   ├── not-found.js
│   │   │
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.js          (Staff sign-in with 1-click role simulation)
│   │   │
│   │   └── (admin)/
│   │       ├── layout.js            (Wraps AdminShell)
│   │       ├── dashboard/page.js    (Executive KPI metrics, charts, activity feed)
│   │       ├── patients/
│   │       │   ├── page.js          (Patient directory with UHID filters)
│   │       │   └── [id]/page.js     (Patient profile, family unit, order history)
│   │       ├── family-members/page.js
│   │       ├── appointments/page.js (Physical OPD consultations across clinics)
│   │       ├── video-consultations/page.js (Telehealth sessions & room links)
│   │       ├── doctors/page.js      (Physicians directory & KMC verification)
│   │       ├── pharmacy/
│   │       │   ├── page.js          (Prescription review queue & orders)
│   │       │   └── [id]/page.js     (Prescription image viewer & fulfillment)
│   │       ├── lab-tests/page.js    (Pathology tests & phlebotomist dispatch)
│   │       ├── radiology/page.js    (3T MRI, 128-Slice CT & Ultrasound scans)
│   │       ├── nursing/page.js      (Injection visits & 24x7 ICU nurse shifts)
│   │       ├── equipment-rentals/page.js (ICU beds, oxygen concentrators, BiPAP)
│   │       ├── fertility/page.js    (IVF/IUI cycle tracking & clinical milestones)
│   │       ├── emergency-sos/page.js(Real-time ALS ambulance dispatch & ER triage)
│   │       ├── memberships/page.js  (Care+ and Family Shield wellness passes)
│   │       ├── providers/page.js    (Empaneled hospitals, imaging hubs, pharmacies)
│   │       ├── city-operations/page.js (Mysuru, Bengaluru, Hubballi coverage)
│   │       ├── finance/page.js      (Wallet ledger, settlements & UPI collections)
│   │       ├── reports/page.js      (Monthly growth analytics & modality shares)
│   │       ├── admin-users/page.js  (RBAC staff accounts & permissions)
│   │       ├── audit-logs/page.js   (Security activity trail & tamper checks)
│   │       └── settings/page.js     (API mode toggle, commission rates, SLAs)
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AdminSidebar.js      (Collapsible branded navigation)
│   │   │   ├── AdminHeader.js       (City hub switcher, notifications, theme toggle)
│   │   │   ├── AdminShell.js        (Shell layout coordinator)
│   │   │   ├── Breadcrumbs.js       (Dynamic breadcrumb trail)
│   │   │   └── MobileNavigation.js  (Quick touch navigation bar)
│   │   ├── ui/
│   │   │   ├── Button.js
│   │   │   ├── Input.js
│   │   │   ├── Select.js
│   │   │   ├── Modal.js
│   │   │   ├── Badge.js
│   │   │   ├── Card.js
│   │   │   ├── Dropdown.js
│   │   │   ├── ConfirmDialog.js
│   │   │   ├── EmptyState.js
│   │   │   └── LoadingState.js
│   │   ├── tables/
│   │   │   ├── DataTable.js         (Sortable columns & zebra styling)
│   │   │   ├── TableToolbar.js      (Search, filters & CSV export)
│   │   │   └── Pagination.js        (Page numbers & rows per page)
│   │   ├── dashboard/
│   │   │   ├── StatCard.js          (KPI cards with trend pills)
│   │   │   ├── RevenueChart.js      (Area chart using Recharts)
│   │   │   ├── BookingChart.js      (Horizontal bar chart of modalities)
│   │   │   ├── RecentActivity.js    (Live events stream)
│   │   │   └── PendingTasks.js      (Action items requiring admin review)
│   │   └── forms/
│   │       ├── FormField.js
│   │       └── FormError.js
│   │
│   ├── data/
│   │   ├── mock/                    (Realistic Karnataka healthcare seed datasets)
│   │   └── navigation.js            (Categorized sitemap taxonomy)
│   │
│   ├── services/
│   │   ├── repositories/            (Base repository pattern & collection stores)
│   │   ├── mock/MockDataProvider.js (Singleton data store with reset capability)
│   │   └── exportService.js         (Client-side CSV generator)
│   │
│   ├── hooks/
│   │   ├── useDebounce.js
│   │   ├── useTheme.js
│   │   └── useLocalFilters.js       (Search, multi-filter, sort & pagination)
│   │
│   ├── lib/
│   │   ├── utils.js
│   │   ├── formatters.js            (INR currency, IST dates, phone numbers)
│   │   ├── constants.js             (Colors, status badge mappings, cities)
│   │   └── permissions.js           (Role-based access controls)
│   │
│   └── providers/
│       ├── AppProviders.js          (Toast notifications & global context)
│       └── ThemeProvider.js         (Light / Dark mode controller)
│
├── .env.example
├── .gitignore
├── jsconfig.json
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── tailwind.config.js
└── README.md
```

---

## 3. Brand Identity & Color Tokens

Configured in `tailwind.config.js` and `src/app/globals.css`:

```css
:root {
  --mediunify-teal: #00B894;
  --mediunify-navy: #1E3A8A;
  --mediunify-aqua: #00C2CB;
  --mediunify-green: #7BC96F;
  --mediunify-coral: #FF7F50;
  --mediunify-slate: #647488;
  --mediunify-background: #F7FAFC;
  --mediunify-white: #FFFFFF;
}
```

---

## 4. Future Backend (Node.js REST API) Migration Path

The portal uses a clean **Repository Abstraction Layer** (`src/services/repositories/`):
- UI components and pages interact **only** with methods like `appointmentsRepository.getAll()`, `ordersRepository.approvePrescription()`, or `doctorsRepository.verifyDoctor()`.
- Today, these repositories query `mockDataProvider`.
- When the backend Node.js / Express REST API is built, developers only have to update the implementation inside each file in `src/services/repositories/` to invoke `fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/...`)`.
- **Zero changes** will be needed in any page component or table!

---

## 5. Local Setup & Running Instructions

### Prerequisites
- Node.js >= 18.x (tested on v24.20.0)
- npm >= 9.x

### Run Development Server
```bash
# Navigate to the super admin folder
cd "x:/Mediunify 09-10-2026/super admin"

# Start Next.js development server
npm run dev
```

Open your browser to:
[http://localhost:3000](http://localhost:3000)

### Production Build & Validation
```bash
# Verify build correctness
npm run build

# Start production server
npm run start
```
