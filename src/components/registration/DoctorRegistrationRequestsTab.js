'use client';

import React, { useState, useEffect } from 'react';
import { registrationRequestsRepository, doctorsRepository } from '@/services/repositories';
import { useLocalFilters } from '@/hooks/useLocalFilters';
import { TableToolbar } from '@/components/tables/TableToolbar';
import { DataTable } from '@/components/tables/DataTable';
import { Pagination } from '@/components/tables/Pagination';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { exportToCSV } from '@/services/exportService';
import { formatCurrency } from '@/lib/formatters';
import { useNotification } from '@/providers/AppProviders';
import {
  Stethoscope,
  Calendar,
  MapPin,
  Eye,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileText,
  Clock,
  Award,
} from 'lucide-react';

export function DoctorRegistrationRequestsTab({ onDoctorApproved, reviewer = { name: 'Namith Gowda', role: 'Super Admin' } }) {
  const { notify } = useNotification();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedApp, setSelectedApp] = useState(null);
  const [viewingDocument, setViewingDocument] = useState(null);

  // Approval
  const [approvalTarget, setApprovalTarget] = useState(null);
  const [isApproving, setIsApproving] = useState(false);

  // Rejection
  const [rejectionTarget, setRejectionTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Additional info
  const [infoTarget, setInfoTarget] = useState(null);
  const [infoRemarks, setInfoRemarks] = useState('');
  const [isRequestingInfo, setIsRequestingInfo] = useState(false);

  const {
    data,
    setData,
    paginatedData,
    totalRecords,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    cityFilter,
    setCityFilter,
    categoryFilter,
    setCategoryFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    sortField,
    sortDirection,
    setSortField,
    setSortDirection,
    resetFilters,
  } = useLocalFilters([], { defaultSortField: 'submissionDate', defaultSortDirection: 'desc' });

  const loadRequests = async () => {
    setLoading(true);
    try {
      const list = await registrationRequestsRepository.getDoctorRequests();
      setRequests(list);
      setData(list);
    } catch (err) {
      notify(`Failed to load doctor requests: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleActionPermissionCheck = () => {
    if (!registrationRequestsRepository.isAuthorized(reviewer)) {
      notify(
        `Action Restricted: User ${reviewer.name} (${reviewer.role}) does not have administrative permissions to approve or reject doctor registrations.`,
        'error'
      );
      return false;
    }
    return true;
  };

  // Confirm Approval
  const handleConfirmApproval = async () => {
    if (!approvalTarget) return;
    if (!handleActionPermissionCheck()) return;

    setIsApproving(true);
    try {
      const { request, doctor } = await registrationRequestsRepository.approveDoctorRequest(
        approvalTarget.id,
        reviewer
      );
      notify(`Approved Dr. ${request.doctorName} (${doctor.doctorCode})! Record activated in Doctor Management.`, 'success');
      setApprovalTarget(null);
      await loadRequests();
      if (onDoctorApproved) onDoctorApproved(doctor);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setIsApproving(false);
    }
  };

  // Confirm Rejection
  const handleConfirmRejection = async () => {
    if (!rejectionTarget || !rejectionReason.trim()) return;
    if (!handleActionPermissionCheck()) return;

    setIsRejecting(true);
    try {
      const updated = await registrationRequestsRepository.rejectDoctorRequest(
        rejectionTarget.id,
        rejectionReason,
        reviewer
      );
      notify(`Rejected application for Dr. ${updated.doctorName}. Retained in regulatory archive.`, 'warning');
      setRejectionTarget(null);
      setRejectionReason('');
      await loadRequests();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setIsRejecting(false);
    }
  };

  // Confirm Info Request
  const handleConfirmInfoRequest = async () => {
    if (!infoTarget || !infoRemarks.trim()) return;
    if (!handleActionPermissionCheck()) return;

    setIsRequestingInfo(true);
    try {
      const updated = await registrationRequestsRepository.requestDoctorAdditionalInfo(
        infoTarget.id,
        infoRemarks,
        reviewer
      );
      notify(`Requested clarification/documents from Dr. ${updated.doctorName}.`, 'success');
      setInfoTarget(null);
      setInfoRemarks('');
      await loadRequests();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setIsRequestingInfo(false);
    }
  };

  const handleExport = () => {
    exportToCSV('mediunify_doctor_registration_requests', data, [
      { header: 'Application ID', accessorKey: 'applicationId' },
      { header: 'Doctor Name', accessorKey: 'doctorName' },
      { header: 'Specialization', accessorKey: 'specialization' },
      { header: 'License No', accessorKey: 'medicalRegistrationNo' },
      { header: 'City', accessorKey: 'city' },
      { header: 'Phone', accessorKey: 'phone' },
      { header: 'Submission Date', accessorKey: 'submissionDate' },
      { header: 'Status', accessorKey: 'status' },
      { header: 'Rejection Reason', accessorKey: 'rejectionReason' },
    ]);
  };

  const columns = [
    {
      header: 'Application & Date',
      accessorKey: 'applicationId',
      cell: ({ row }) => (
        <div>
          <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400">
            {row.applicationId}
          </span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" /> {row.submissionDate}
          </p>
          <span className="text-[10px] text-slate-400">{row.registrationAuthority}</span>
        </div>
      ),
    },
    {
      header: 'Doctor Credentials',
      accessorKey: 'doctorName',
      cell: ({ row }) => (
        <div className="max-w-xs">
          <p className="font-bold text-slate-900 dark:text-slate-100">{row.doctorName}</p>
          <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium line-clamp-1">{row.qualifications}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{row.experienceYears} Years Exp</p>
        </div>
      ),
    },
    {
      header: 'Specialization & City',
      accessorKey: 'specialization',
      cell: ({ row }) => (
        <div>
          <span className="inline-block px-2 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50">
            {row.specialization}
          </span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400" /> {row.city}
          </p>
        </div>
      ),
    },
    {
      header: 'KMC License No',
      accessorKey: 'medicalRegistrationNo',
      cell: ({ row }) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            {row.medicalRegistrationNo}
          </span>
          <p className="text-[10px] text-slate-400 mt-1">{row.documents?.length || 0} Certificates</p>
        </div>
      ),
    },
    {
      header: 'Proposed Fees',
      cell: ({ row }) => (
        <div className="text-xs">
          <p className="text-slate-700 dark:text-slate-300">
            OPD: <strong className="text-slate-900 dark:text-slate-100">{formatCurrency(row.proposedInPersonFee || 0)}</strong>
          </p>
          <p className="text-slate-500 dark:text-slate-400">
            Video: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(row.proposedVideoFee || 0)}</strong>
          </p>
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => <Badge status={row.status} size="sm" />,
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-slate-600 hover:text-teal-600"
            title="View Application Details"
            onClick={() => setSelectedApp(row)}
          >
            <Eye className="w-4 h-4" />
          </Button>

          {row.status !== 'Approved' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              title="Approve & Empanel Doctor"
              onClick={() => {
                if (handleActionPermissionCheck()) {
                  setApprovalTarget(row);
                }
              }}
            >
              <CheckCircle2 className="w-4 h-4" />
            </Button>
          )}

          {row.status !== 'Rejected' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              title="Reject Application"
              onClick={() => {
                if (handleActionPermissionCheck()) {
                  setRejectionTarget(row);
                  setRejectionReason('');
                }
              }}
            >
              <XCircle className="w-4 h-4" />
            </Button>
          )}

          {row.status === 'Pending Review' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40"
              title="Request Additional Information"
              onClick={() => {
                if (handleActionPermissionCheck()) {
                  setInfoTarget(row);
                  setInfoRemarks('');
                }
              }}
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Table Toolbar */}
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search doctor by name, application ID, KMC license, specialization..."
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={['Pending Review', 'Additional Information Required', 'Approved', 'Rejected']}
        cityFilter={cityFilter}
        onCityChange={setCityFilter}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        categoryOptions={['Neurology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'General Medicine']}
        onExport={handleExport}
        onReset={resetFilters}
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={paginatedData}
        isLoading={loading}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={(field) => {
          setSortField(field);
          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        }}
      />

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        totalItems={totalRecords}
      />

      {/* Detail Modal */}
      {selectedApp && (
        <Modal
          isOpen={Boolean(selectedApp)}
          onClose={() => setSelectedApp(null)}
          title={`Doctor Application: ${selectedApp.applicationId}`}
          subtitle={`${selectedApp.doctorName} — ${selectedApp.specialization}`}
          maxWidth="max-w-3xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-slate-500">Submitted: {selectedApp.submissionDate}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedApp(null)}>
                  Close
                </Button>
                {selectedApp.status !== 'Approved' && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      if (handleActionPermissionCheck()) {
                        setApprovalTarget(selectedApp);
                        setSelectedApp(null);
                      }
                    }}
                  >
                    Approve Doctor
                  </Button>
                )}
                {selectedApp.status !== 'Rejected' && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      if (handleActionPermissionCheck()) {
                        setRejectionTarget(selectedApp);
                        setRejectionReason('');
                        setSelectedApp(null);
                      }
                    }}
                  >
                    Reject Application
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Badge status={selectedApp.status} />
                <span className="font-semibold">{selectedApp.status}</span>
              </div>
              <span className="font-mono font-bold text-teal-600">{selectedApp.medicalRegistrationNo}</span>
            </div>

            {selectedApp.rejectionReason && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300">
                <p className="font-bold">Rejection Reason:</p>
                <p className="mt-0.5">{selectedApp.rejectionReason}</p>
              </div>
            )}

            {selectedApp.additionalInfoRemarks && (
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300">
                <p className="font-bold">Information Query:</p>
                <p className="mt-0.5">{selectedApp.additionalInfoRemarks}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Specialization</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{selectedApp.specialization} ({selectedApp.subSpecialty})</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Qualifications</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{selectedApp.qualifications}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Phone & Email</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{selectedApp.phone}</p>
                <p className="text-slate-500">{selectedApp.email}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">City & Preferred Clinic</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{selectedApp.city}</p>
                <p className="text-slate-500 line-clamp-1">{selectedApp.preferredLocation}</p>
              </div>
            </div>

            <div>
              <h5 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Uploaded Certificates</h5>
              <div className="space-y-2">
                {(selectedApp.documents || []).map((doc) => (
                  <div
                    key={doc.id}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{doc.name}</p>
                      <p className="text-[10px] text-slate-500">{doc.type} • {doc.size} • {doc.fileNumber}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => setViewingDocument({ ...doc, applicantName: selectedApp.doctorName })}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1 text-teal-600" /> Preview
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <Modal
          isOpen={Boolean(viewingDocument)}
          onClose={() => setViewingDocument(null)}
          title={`Document Preview: ${viewingDocument.name}`}
          subtitle={`Applicant: ${viewingDocument.applicantName}`}
          maxWidth="max-w-md"
          footer={
            <Button variant="primary" size="sm" onClick={() => setViewingDocument(null)}>
              Done
            </Button>
          }
        >
          <div className="text-center p-6 space-y-3">
            <Award className="w-12 h-12 text-teal-600 mx-auto" />
            <p className="font-bold text-slate-800 dark:text-slate-200">{viewingDocument.name}</p>
            <p className="text-xs font-mono text-slate-500">File Ref: {viewingDocument.fileNumber}</p>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              {viewingDocument.status}
            </span>
          </div>
        </Modal>
      )}

      {/* Confirm Approval Dialog */}
      {approvalTarget && (
        <ConfirmDialog
          isOpen={Boolean(approvalTarget)}
          onClose={() => setApprovalTarget(null)}
          onConfirm={handleConfirmApproval}
          isLoading={isApproving}
          title={`Approve Doctor: ${approvalTarget.doctorName}`}
          description={`Are you sure you want to approve Dr. ${approvalTarget.doctorName} (License: ${approvalTarget.medicalRegistrationNo})? This will create an active doctor in the Doctor Management directory.`}
          confirmText="Confirm & Empanel"
          variant="primary"
        />
      )}

      {/* Reject Modal */}
      {rejectionTarget && (
        <Modal
          isOpen={Boolean(rejectionTarget)}
          onClose={() => setRejectionTarget(null)}
          title={`Reject Application: ${rejectionTarget.doctorName}`}
          maxWidth="max-w-md"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setRejectionTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmRejection}
                disabled={!rejectionReason.trim()}
                isLoading={isRejecting}
              >
                Confirm Rejection
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <p className="text-slate-500">
              The application will be archived with this rejection reason. It is not permanently deleted.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="State Medical Council mismatch, unverified degree, missing NOC..."
              rows={4}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs"
            />
          </div>
        </Modal>
      )}

      {/* Request Info Modal */}
      {infoTarget && (
        <Modal
          isOpen={Boolean(infoTarget)}
          onClose={() => setInfoTarget(null)}
          title={`Request Additional Info: ${infoTarget.doctorName}`}
          maxWidth="max-w-md"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setInfoTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmInfoRequest}
                disabled={!infoRemarks.trim()}
                isLoading={isRequestingInfo}
              >
                Send Request
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <p className="text-slate-500">
              Specify the documents or credentials required from the doctor.
            </p>
            <textarea
              value={infoRemarks}
              onChange={(e) => setInfoRemarks(e.target.value)}
              placeholder="e.g. Please provide renewed KMC 5-year registration copy..."
              rows={4}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
