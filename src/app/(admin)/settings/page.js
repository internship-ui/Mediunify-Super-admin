'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useNotification } from '@/providers/AppProviders';
import { mockDataProvider } from '@/services/mock/MockDataProvider';
import {
  Settings,
  Server,
  Percent,
  Siren,
  Bell,
  Database,
  RotateCcw,
  Save,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function SettingsPage() {
  const { notify } = useNotification();
  const [saving, setSaving] = useState(false);

  // Settings State
  const [config, setConfig] = useState({
    // API & Architecture
    apiMode: 'mock',
    apiBaseUrl: 'http://localhost:5000/api/v1',
    mockLatencyMs: '150',

    // Commissions
    doctorCommission: '10',
    hospitalCommission: '12',
    pharmacyCommission: '8',
    labCommission: '15',

    // Emergency SOS
    ambulanceSlaMinutes: '12',
    autoDispatchEnabled: true,
    emergencySoundAlert: true,

    // Regional
    defaultCity: 'Mysuru',
    smsGateway: 'Karix Telecom Karnataka',
  });

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      notify('Platform settings updated successfully.');
    }, 400);
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all mock records to the initial platform seed state?')) {
      mockDataProvider.resetAll();
      notify('Demo data reset to factory default.');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            System & Operations Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure future backend Node.js REST API connectivity, commission splits, emergency SLA parameters, and regional defaults.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={RotateCcw}
          onClick={handleResetData}
          className="text-xs"
        >
          Reset Demo Data
        </Button>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Backend API Integration */}
        <Card>
          <CardHeader
            title="Future Node.js REST API Integration"
            subtitle="Switch between current offline mock repositories and future live production API"
            action={
              <span className="flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-full border border-teal-200">
                <Sparkles className="w-3.5 h-3.5" /> Frontend Architecture Ready
              </span>
            }
          />
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Data Provider Mode"
                value={config.apiMode}
                onChange={(e) => setConfig({ ...config, apiMode: e.target.value })}
                options={[
                  { label: 'Local Mock Data (Current Frontend Demonstration)', value: 'mock' },
                  { label: 'Live Node.js REST API (Future Backend Mode)', value: 'rest' },
                ]}
              />
              <Input
                label="Simulated Repository Latency (ms)"
                type="number"
                value={config.mockLatencyMs}
                onChange={(e) => setConfig({ ...config, mockLatencyMs: e.target.value })}
              />
            </div>

            <Input
              label="Future REST API Base URL (When Server Deployed)"
              placeholder="e.g. http://localhost:5000/api/v1"
              value={config.apiBaseUrl}
              onChange={(e) => setConfig({ ...config, apiBaseUrl: e.target.value })}
              helperText="The repository layer in src/services/repositories/ is designed for easy drop-in replacement with fetch() when the backend is ready."
            />
          </CardContent>
        </Card>

        {/* Platform Commission Splits */}
        <Card>
          <CardHeader
            title="Platform Commission Rates"
            subtitle="Revenue share retained by MediUnify on service transactions"
          />
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Input
                label="Doctor OPD Fee (%)"
                type="number"
                value={config.doctorCommission}
                onChange={(e) => setConfig({ ...config, doctorCommission: e.target.value })}
              />
              <Input
                label="Hospital Inpatient (%)"
                type="number"
                value={config.hospitalCommission}
                onChange={(e) => setConfig({ ...config, hospitalCommission: e.target.value })}
              />
              <Input
                label="Pharmacy Orders (%)"
                type="number"
                value={config.pharmacyCommission}
                onChange={(e) => setConfig({ ...config, pharmacyCommission: e.target.value })}
              />
              <Input
                label="Diagnostic Labs (%)"
                type="number"
                value={config.labCommission}
                onChange={(e) => setConfig({ ...config, labCommission: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Emergency SOS & Fleet Parameters */}
        <Card>
          <CardHeader
            title="Emergency SOS Response Parameters"
            subtitle="Ambulance dispatch SLAs and critical patient triage triggers"
          />
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="ALS Ambulance Target SLA (Minutes)"
                type="number"
                value={config.ambulanceSlaMinutes}
                onChange={(e) => setConfig({ ...config, ambulanceSlaMinutes: e.target.value })}
              />
              <Select
                label="Primary Regional Operations Hub"
                value={config.defaultCity}
                onChange={(e) => setConfig({ ...config, defaultCity: e.target.value })}
                options={['Mysuru', 'Bengaluru', 'Hubballi-Dharwad', 'Mangaluru', 'Belagavi']}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={config.autoDispatchEnabled}
                  onChange={(e) => setConfig({ ...config, autoDispatchEnabled: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>Auto-route nearest ALS ambulance for Red Triage SOS</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={config.emergencySoundAlert}
                  onChange={(e) => setConfig({ ...config, emergencySoundAlert: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>Audible siren alert on incoming emergency SOS</span>
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={saving}
            icon={Save}
          >
            Save Configuration Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
