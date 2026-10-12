'use client';

import React, { useState, useEffect } from 'react';
import { appointmentsRepository } from '@/services/repositories';
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
  Video,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Download,
  Copy,
  Clock,
  User,
  Stethoscope,
  FileText,
  ShieldCheck,
  CheckCircle,
  Activity,
  Layers,
  Radio,
  Share2,
  Trash2,
} from 'lucide-react';

export default function VideoConsultationsPage() {
  const { notify } = useNotification();
  const [loading, setLoading] = useState(true);
  const [activeRecording, setActiveRecording] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'prescription' | 'technical'

  // Video playback simulation states
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTimeSec, setCurrentTimeSec] = useState(135); // 02:15
  const [totalTimeSec, setTotalTimeSec] = useState(1122); // 18:42
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

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
  } = useLocalFilters([], { defaultSortField: 'date', defaultSortDirection: 'desc' });

  useEffect(() => {
    async function loadVideoSessions() {
      setLoading(true);
      const res = await appointmentsRepository.getAll();
      const videoOnly = res.data.filter((a) => a.consultationType === 'Video Consultation');
      setData(videoOnly);
      setLoading(false);
    }
    loadVideoSessions();
  }, [setData]);

  // Video timer simulation when playing
  useEffect(() => {
    let timer;
    if (isPlaying && activeRecording) {
      timer = setInterval(() => {
        setCurrentTimeSec((prev) => {
          if (prev >= totalTimeSec) return 0;
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, activeRecording, totalTimeSec, playbackSpeed]);

  const handleOpenRecording = (row) => {
    setActiveRecording(row);
    setIsPlaying(true);
    setCurrentTimeSec(135);
    setTotalTimeSec(1122);
    setActiveTab('summary');
  };

  const handleCopyLink = (roomId) => {
    navigator.clipboard?.writeText(`https://meet.mediunify.org/room/${roomId}`);
    notify(`Copied encrypted room link: ${roomId}`);
  };

  const handleDownloadRecording = (row) => {
    notify(`Downloading encrypted HD session recording: ${row.appointmentRef}.mp4 (${row.recordingFileSize || '142 MB'})`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await appointmentsRepository.delete(deleteTarget.id);
      setData(data.filter((a) => a.id !== deleteTarget.id));
      notify(`Removed video consultation record ${deleteTarget.appointmentRef}`, 'success');
      setDeleteTarget(null);
      if (activeRecording?.id === deleteTarget.id) {
        setActiveRecording(null);
      }
    } catch (err) {
      notify('Failed to delete consultation record.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = () => {
    exportToCSV('mediunify_recorded_video_consultations', data, [
      { header: 'Booking Ref', accessorKey: 'appointmentRef' },
      { header: 'Patient Name', accessorKey: 'patientName' },
      { header: 'UHID', accessorKey: 'uhid' },
      { header: 'Doctor Name', accessorKey: 'doctorName' },
      { header: 'Specialization', accessorKey: 'specialization' },
      { header: 'Date', accessorKey: 'date' },
      { header: 'Time Slot', accessorKey: 'timeSlot' },
      { header: 'Room ID', accessorKey: 'videoRoomId' },
      { header: 'Recording Status', accessorKey: 'recordingStatus' },
      { header: 'Recording Duration', accessorKey: 'recordingDuration' },
      { header: 'Recording Size', accessorKey: 'recordingFileSize' },
      { header: 'Fee', accessorKey: 'fee' },
      { header: 'Status', accessorKey: 'status' },
    ]);
  };

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const columns = [
    {
      header: 'Session & Video Room',
      accessorKey: 'appointmentRef',
      cell: ({ row }) => (
        <div>
          <div className="flex items-center gap-1.5 font-bold text-teal-700 dark:text-teal-400">
            <Video className="w-3.5 h-3.5 text-teal-600" />
            <span>{row.appointmentRef}</span>
          </div>
          <p className="font-mono text-[10px] text-slate-400 mt-0.5">
            Room: {row.videoRoomId || `VID-${row.id}`}
          </p>
          <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{row.date} • {row.timeSlot}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Patient Details',
      accessorKey: 'patientName',
      cell: ({ row }) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100">{row.patientName}</span>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
            <span className="text-teal-600 dark:text-teal-400 font-bold">{row.uhid}</span>
            <span>•</span>
            <span>{row.patientPhone}</span>
          </div>
          <span className="text-[10px] text-slate-400">
            {row.patientAge ? `${row.patientAge}y • ${row.patientGender}` : ''}
          </span>
        </div>
      ),
    },
    {
      header: 'Attending Physician',
      accessorKey: 'doctorName',
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{row.doctorName}</span>
          <p className="text-[10px] text-slate-400">{row.specialization}</p>
          <p className="text-[10px] text-slate-500">{row.city}</p>
        </div>
      ),
    },
    {
      header: 'Video Fee',
      accessorKey: 'fee',
      cell: ({ row }) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(row.fee)}</span>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{row.paymentStatus}</p>
        </div>
      ),
    },
    {
      header: 'Call Recording Status',
      accessorKey: 'recordingStatus',
      cell: ({ row }) => {
        if (row.recordingStatus === 'Available') {
          return (
            <div className="space-y-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Recorded ({row.recordingDuration || '18m'})
              </span>
              <p className="text-[10px] text-slate-400 font-mono">
                {row.recordingFileSize || '142 MB MP4'}
              </p>
            </div>
          );
        }
        if (row.recordingStatus === 'In-Progress') {
          return (
            <div className="space-y-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/50 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                Live Recording ({row.recordingDuration})
              </span>
              <p className="text-[10px] text-slate-400 font-mono">Stream Active</p>
            </div>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
            Auto-Record on Start
          </span>
        );
      },
    },
    {
      header: 'Admin Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          {row.hasRecording ? (
            <Button
              variant="primary"
              size="sm"
              className="text-xs h-7 px-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-sm"
              onClick={() => handleOpenRecording(row)}
              title="Watch HD Session Recording"
            >
              <Play className="w-3 h-3 fill-current mr-1" />
              Watch Recording
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 px-2 text-slate-600 dark:text-slate-300"
              onClick={() => handleOpenRecording(row)}
              title="Test Virtual Telehealth Room"
            >
              Test Room
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900"
            onClick={() => handleCopyLink(row.videoRoomId || row.id)}
            title="Copy Encrypted Room Link"
          >
            <Copy className="w-3 h-3" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            title="Delete Video Consultation Record"
            onClick={() => setDeleteTarget(row)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Telemedicine & Recorded Video Consultations
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300 border border-teal-200">
              Admin Recording Vault
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Encrypted WebRTC telehealth rooms with 1080p recorded session archives, clinical transcripts, and prescription logs for administrative review.
          </p>
        </div>
      </div>

      {/* KPI Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Video Calls</span>
            <Video className="w-4 h-4 text-teal-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{data.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Scheduled & completed</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Recorded Archives</span>
            <Play className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {data.filter((d) => d.recordingStatus === 'Available').length}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Ready for admin playback</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Live In-Progress</span>
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {data.filter((d) => d.recordingStatus === 'In-Progress').length}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Recording in real-time</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Stored Time</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">1h 14m</p>
          <p className="text-[10px] text-slate-400 mt-0.5">AES-256 cloud encrypted</p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search video consultation by patient, doctor, room ID, symptoms..."
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          statusOptions={['Confirmed', 'Scheduled', 'In-Progress', 'Completed', 'Cancelled']}
          cityFilter={cityFilter}
          onCityChange={setCityFilter}
          onExport={handleExport}
          onReset={resetFilters}
        />

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

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          totalItems={totalRecords}
        />
      </div>

      {/* State-of-the-art Video Call Recording Player Modal */}
      {activeRecording && (
        <Modal
          isOpen={Boolean(activeRecording)}
          onClose={() => setActiveRecording(null)}
          title={`Telemedicine Session Recording — ${activeRecording.appointmentRef}`}
          subtitle={`Attending Doctor: ${activeRecording.doctorName} • Patient: ${activeRecording.patientName} (${activeRecording.uhid})`}
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>DISHA Compliant Recording Vault • Super Admin Audit Mode</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadRecording(activeRecording)}
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Download MP4 ({activeRecording.recordingFileSize || '142 MB'})
                </Button>
                <Button variant="primary" size="sm" onClick={() => setActiveRecording(null)}>
                  Close Player
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* The Video Player Screen */}
            <div className="relative aspect-video rounded-2xl bg-slate-950 flex flex-col justify-between text-white overflow-hidden border border-slate-800 shadow-2xl">
              {/* Video Overlay Top Header */}
              <div className="relative z-10 p-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-600/90 text-white font-bold text-[10px] tracking-wider uppercase">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    REC ARCHIVE
                  </span>
                  <span className="font-mono text-slate-300 text-[11px]">
                    Room: {activeRecording.videoRoomId || 'VID-ROOM-ACTIVE'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-300">
                  <span className="px-2 py-0.5 rounded bg-white/10 backdrop-blur-md">
                    {activeRecording.recordingQuality || '1080p Full HD'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/10 backdrop-blur-md">
                    256-bit AES Encrypted
                  </span>
                </div>
              </div>

              {/* Main Simulated Split Screen / Tele-Consultation View */}
              <div className="relative flex-1 grid grid-cols-2 gap-2 p-3 items-center">
                {/* Doctor View */}
                <div className="relative h-full rounded-xl bg-slate-900/90 border border-slate-800/80 flex flex-col items-center justify-center overflow-hidden group">
                  <div className="w-16 h-16 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center mb-2">
                    <Stethoscope className="w-8 h-8 text-teal-400" />
                  </div>
                  <span className="font-bold text-sm text-slate-100">{activeRecording.doctorName}</span>
                  <span className="text-[11px] text-teal-400 font-medium">{activeRecording.specialization}</span>

                  {/* Audio Activity Waveform */}
                  <div className="flex items-center gap-1 mt-3">
                    <span className="w-1 h-3 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="w-1 h-5 bg-emerald-400 rounded-full animate-bounce" />
                    <span className="w-1 h-4 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="w-1 h-6 bg-emerald-400 rounded-full animate-bounce" />
                    <span className="w-1 h-2 bg-emerald-400 rounded-full" />
                  </div>

                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] text-slate-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Physician Camera & Mic
                  </div>
                </div>

                {/* Patient View */}
                <div className="relative h-full rounded-xl bg-slate-900/90 border border-slate-800/80 flex flex-col items-center justify-center overflow-hidden">
                  <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center mb-2">
                    <User className="w-8 h-8 text-blue-400" />
                  </div>
                  <span className="font-bold text-sm text-slate-100">{activeRecording.patientName}</span>
                  <span className="text-[11px] text-slate-400 font-mono">UHID: {activeRecording.uhid}</span>

                  {/* Patient status */}
                  <div className="flex items-center gap-1 mt-3">
                    <span className="w-1 h-2 bg-blue-400 rounded-full" />
                    <span className="w-1 h-3 bg-blue-400 rounded-full animate-pulse" />
                    <span className="w-1 h-2 bg-blue-400 rounded-full" />
                  </div>

                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] text-slate-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Patient Mobile Video
                  </div>
                </div>

                {/* Center Watermark */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <span className="text-[10px] uppercase tracking-widest text-white/10 font-bold rotate-[-15deg]">
                    MediUnify Telemedicine Archive • {activeRecording.appointmentRef}
                  </span>
                </div>
              </div>

              {/* Video Player Scrubber & Bottom Controls */}
              <div className="relative z-10 p-3 bg-gradient-to-t from-black/95 via-black/80 to-transparent space-y-2">
                {/* Progress bar scrubber */}
                <div className="relative w-full h-1.5 bg-slate-700 rounded-full overflow-hidden cursor-pointer group">
                  <div
                    className="h-full bg-teal-500 transition-all duration-300 relative"
                    style={{ width: `${(currentTimeSec / totalTimeSec) * 100}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                {/* Controls Bar */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-8 h-8 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 flex items-center justify-center font-bold transition-all shadow-md"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>

                    <button
                      onClick={() => setCurrentTimeSec(0)}
                      className="text-slate-400 hover:text-white"
                      title="Rewind to start"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                    <div className="font-mono text-[11px] text-slate-300">
                      <span>{formatSeconds(currentTimeSec)}</span>
                      <span className="text-slate-500"> / </span>
                      <span>{formatSeconds(totalTimeSec)}</span>
                    </div>

                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="text-slate-400 hover:text-white"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Speed Selector */}
                    <div className="flex items-center gap-1 bg-white/10 rounded-lg p-0.5 text-[10px]">
                      {[1, 1.25, 1.5, 2].map((spd) => (
                        <button
                          key={spd}
                          onClick={() => setPlaybackSpeed(spd)}
                          className={`px-1.5 py-0.5 rounded font-mono ${
                            playbackSpeed === spd ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handleDownloadRecording(activeRecording)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300"
                      title="Download MP4"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabbed Clinical & Recording Intelligence */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === 'summary'
                      ? 'border-teal-600 text-teal-700 dark:text-teal-400 bg-white dark:bg-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  Clinical Notes & Milestones
                </button>
                <button
                  onClick={() => setActiveTab('prescription')}
                  className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === 'prescription'
                      ? 'border-teal-600 text-teal-700 dark:text-teal-400 bg-white dark:bg-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  e-Prescription Issued ({activeRecording.medicinesPrescribed?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('technical')}
                  className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === 'technical'
                      ? 'border-teal-600 text-teal-700 dark:text-teal-400 bg-white dark:bg-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Audit Trail & Technical Specs
                </button>
              </div>

              <div className="p-4">
                {/* Tab 1: Clinical Notes & Milestones */}
                {activeTab === 'summary' && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-800/40">
                      <span className="font-bold text-teal-900 dark:text-teal-200 text-xs block mb-1">
                        Doctor Clinical Evaluation & Consultation Summary:
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {activeRecording.aiClinicalSummary || 'Consultation conducted smoothly. Patient symptoms reviewed and treatment prescribed.'}
                      </p>
                    </div>

                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block mb-2">
                        Recorded Session Timeline & Key Milestones:
                      </span>
                      <div className="space-y-1.5">
                        {activeRecording.consultationMilestones?.map((m, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              const parts = m.time.split(':');
                              const secs = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
                              setCurrentTimeSec(secs);
                            }}
                            className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-teal-50 dark:hover:bg-teal-950/40 cursor-pointer transition-colors border border-slate-100 dark:border-slate-800"
                          >
                            <span className="font-mono font-bold text-teal-600 dark:text-teal-400 text-xs w-12 shrink-0">
                              {m.time}
                            </span>
                            <span className="text-slate-700 dark:text-slate-300 text-xs font-medium">
                              {m.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Prescription Issued */}
                {activeTab === 'prescription' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          Digital e-Prescription (Signed by {activeRecording.doctorName})
                        </span>
                        <p className="text-[11px] text-slate-400">
                          Prescription issued during virtual consultation on {activeRecording.date}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                        Signed with Digital Signature
                      </span>
                    </div>

                    {activeRecording.medicinesPrescribed && activeRecording.medicinesPrescribed.length > 0 ? (
                      <div className="space-y-2">
                        {activeRecording.medicinesPrescribed.map((med, index) => (
                          <div
                            key={index}
                            className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                          >
                            <div>
                              <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block">
                                {index + 1}. {med.name}
                              </span>
                              <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                                Dosage: {med.dosage}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/50">
                              Duration: {med.duration}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-xs italic py-4 text-center">
                        No medications prescribed in this session (Investigation / Advice only).
                      </p>
                    )}
                  </div>
                )}

                {/* Tab 3: Technical & Compliance Specs */}
                {activeTab === 'technical' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Resolution</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {activeRecording.recordingQuality || '1080p FHD'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Audio Stream</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {activeRecording.audioQuality || 'Opus 48kHz'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Bitrate</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {activeRecording.videoBitrate || '2.4 Mbps'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Packet Loss</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          0.00%
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">
                        Karnataka Telemedicine Compliance Certification:
                      </span>
                      <p className="text-slate-500">
                        Under DISHA (Digital Information Security in Healthcare Act) and Telemedicine Practice Guidelines (Board of Governors, NMC 2020), this encrypted video file is recorded with verified bilateral consent and archived under access-controlled super-admin audit logs.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Consultation Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete Telemedicine Session"
        description={`Are you sure you want to remove recorded video consultation ${deleteTarget?.appointmentRef} for patient ${deleteTarget?.patientName} with ${deleteTarget?.doctorName}? This action cannot be undone.`}
        confirmText="Confirm Delete"
      />
    </div>
  );
}
