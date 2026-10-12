'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ordersRepository } from '@/services/repositories';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { LoadingState } from '@/components/ui/LoadingState';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { useNotification } from '@/providers/AppProviders';
import {
  ArrowLeft,
  Pill,
  MapPin,
  Phone,
  FileText,
  Truck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  User,
  AlertCircle,
} from 'lucide-react';

export default function OrderDetailView({ orderId }) {
  const params = useParams();
  const currentId = orderId || params?.id;
  const router = useRouter();
  const { notify } = useNotification();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      if (!currentId) return;
      setLoading(true);
      const data = await ordersRepository.getById(currentId);
      setOrder(data);
      setLoading(false);
    }
    loadOrder();
  }, [currentId]);

  if (loading) {
    return <LoadingState message="Loading pharmacy order details..." />;
  }

  if (!order) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Order Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">No order found with ID {currentId}</p>
        <Link href="/pharmacy">
          <Button variant="outline" size="sm" icon={ArrowLeft}>
            Back to Pharmacy Hub
          </Button>
        </Link>
      </div>
    );
  }

  const handleUpdateStatus = async (nextStatus) => {
    const updated = await ordersRepository.update(order.id, { status: nextStatus });
    setOrder(updated);
    notify(`Order marked as: ${nextStatus}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/pharmacy">
            <Button variant="outline" size="sm" icon={ArrowLeft} className="h-9 w-9 p-0" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Order {order.orderNumber}
              </h1>
              <Badge status={order.status} size="sm" />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Placed on {order.orderDate} • Fulfillment Center: {order.assignedStoreName}
            </p>
          </div>
        </div>

        {/* Workflow actions */}
        <div className="flex flex-wrap items-center gap-2">
          {order.status === 'Pending Verification' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleUpdateStatus('Prescription Approved')}
            >
              Approve Prescription
            </Button>
          )}
          {order.status === 'Prescription Approved' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleUpdateStatus('Packing')}
            >
              Move to Packing
            </Button>
          )}
          {order.status === 'Packing' && (
            <Button
              variant="primary"
              size="sm"
              icon={Truck}
              onClick={() => handleUpdateStatus('Out for Delivery')}
            >
              Dispatch to Delivery Fleet
            </Button>
          )}
          {order.status === 'Out for Delivery' && (
            <Button
              variant="success"
              size="sm"
              icon={CheckCircle2}
              onClick={() => handleUpdateStatus('Delivered')}
            >
              Mark Delivered
            </Button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Items and Prescription */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title="Medicines & Prescriptions"
              subtitle={`${order.items?.length || 0} Products in Cart`}
            />
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {order.items?.map((item) => (
                  <div key={item.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{item.name}</span>
                        {item.requiresPrescription && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Rx Mandatory
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {item.dosage} • Qty: {item.quantity}
                      </p>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Order pricing summary */}
              <div className="p-4 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Delivery Charges</span>
                  <span>{order.deliveryFee === 0 ? 'FREE' : formatCurrency(order.deliveryFee)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 dark:text-slate-100 pt-2 border-t border-slate-200 dark:border-slate-700 text-sm">
                  <span>Total Amount Paid</span>
                  <span className="text-teal-600 dark:text-teal-400">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prescription Preview */}
          {order.prescriptionUrl && (
            <Card>
              <CardHeader
                title="Physician Prescription Document"
                subtitle="Uploaded by patient for mandatory drug verification"
              />
              <CardContent>
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 flex items-center justify-center p-2">
                  <img
                    src={order.prescriptionUrl}
                    alt="Prescription Document"
                    className="max-h-96 w-auto object-contain rounded-xl"
                  />
                </div>
                {order.pharmacistNotes && (
                  <div className="mt-4 p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 text-xs">
                    <strong>Pharmacist Verification Notes:</strong> {order.pharmacistNotes}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Patient & Delivery Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Patient Information" />
            <CardContent className="space-y-3 text-xs">
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Recipient</p>
                <Link
                  href={`/patients/${order.patientId}`}
                  className="font-bold text-teal-600 dark:text-teal-400 hover:underline text-sm"
                >
                  {order.patientName}
                </Link>
                <p className="text-slate-500 font-mono mt-0.5">{order.uhid}</p>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Contact Phone</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{order.patientPhone}</p>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Delivery Address</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                  {order.deliveryAddress}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Fulfillment & Logistics" />
            <CardContent className="space-y-3 text-xs">
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Fulfillment Store</p>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{order.assignedStoreName}</p>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Express Rider</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {order.deliveryPartnerName || 'Awaiting rider allocation'}
                </p>
                {order.deliveryPartnerPhone && (
                  <p className="text-slate-500 mt-0.5">{order.deliveryPartnerPhone}</p>
                )}
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Estimated Delivery</p>
                <p className="font-bold text-teal-600 dark:text-teal-400">
                  {order.estimatedDeliveryTime || '30 - 45 mins'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
