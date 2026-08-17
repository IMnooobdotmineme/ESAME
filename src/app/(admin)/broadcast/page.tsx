"use client";

import { useMemo, useState } from "react";
import {
  Megaphone,
  Users,
  Building2,
  GraduationCap,
  School,
  UserSquare2,
  Search,
  Send,
  Check,
  AlertTriangle,
  Archive,
  ArchiveRestore,
  ArchiveX,
  Trash2,
} from "lucide-react";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import {
  ORG_DIRECTORY,
  TEACHER_DIRECTORY,
  TOTAL_STUDENTS,
  TOTAL_TEACHERS,
} from "@/lib/admin-directory-data";

type Audience =
  | "all_users"
  | "all_organizations"
  | "all_teachers"
  | "specific_organization"
  | "specific_teacher";

const AUDIENCE_OPTIONS: {
  value: Audience;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    value: "all_users",
    label: "All Users",
    description: "Every account on the platform — org admins, teachers, and students.",
    icon: Users,
  },
  {
    value: "all_organizations",
    label: "All Organizations",
    description: "Org admins across every registered organization.",
    icon: Building2,
  },
  {
    value: "all_teachers",
    label: "All Teachers",
    description: "Every teacher account, across every organization.",
    icon: GraduationCap,
  },
  {
    value: "specific_organization",
    label: "Specific Organization",
    description: "One organization's admin and all of its teachers.",
    icon: School,
  },
  {
    value: "specific_teacher",
    label: "Specific Teacher",
    description: "A single teacher account.",
    icon: UserSquare2,
  },
];

type Priority = "normal" | "urgent";

interface BroadcastHistoryEntry {
  id: string;
  subject: string;
  audienceLabel: string;
  recipients: number;
  priority: Priority;
  sentAt: string;
  archived?: boolean;
}

const INITIAL_HISTORY: BroadcastHistoryEntry[] = [
  {
    id: "bc-1",
    subject: "Scheduled maintenance this weekend",
    audienceLabel: "All Users",
    recipients: TOTAL_STUDENTS + TOTAL_TEACHERS + ORG_DIRECTORY.length,
    priority: "normal",
    sentAt: "Aug 9, 2026 · 3:12 PM",
  },
  {
    id: "bc-2",
    subject: "New anti-cheating policy rollout",
    audienceLabel: "All Teachers",
    recipients: TOTAL_TEACHERS,
    priority: "urgent",
    sentAt: "Aug 5, 2026 · 10:40 AM",
  },
];

export default function AdminBroadcastPage() {
  const [audience, setAudience] = useState<Audience>("all_users");
  const [orgId, setOrgId] = useState(ORG_DIRECTORY[0]?.id ?? "");
  const [orgSearch, setOrgSearch] = useState("");
  const [teacherId, setTeacherId] = useState(TEACHER_DIRECTORY[0]?.id ?? "");
  const [teacherSearch, setTeacherSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [history, setHistory] = useState<BroadcastHistoryEntry[]>(INITIAL_HISTORY);
  const [showArchivedHistory, setShowArchivedHistory] = useState(false);
  const [sentDialog, setSentDialog] = useState<{ open: boolean; entry?: BroadcastHistoryEntry }>({
    open: false,
  });

  const selectedOrg = ORG_DIRECTORY.find((o) => o.id === orgId);
  const selectedTeacher = TEACHER_DIRECTORY.find((t) => t.id === teacherId);

  const filteredOrgs = useMemo(
    () =>
      ORG_DIRECTORY.filter(
        (o) =>
          o.name.toLowerCase().includes(orgSearch.toLowerCase()) ||
          o.code.toLowerCase().includes(orgSearch.toLowerCase())
      ),
    [orgSearch]
  );

  const filteredTeachers = useMemo(
    () =>
      TEACHER_DIRECTORY.filter(
        (t) =>
          t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
          t.orgName.toLowerCase().includes(teacherSearch.toLowerCase())
      ),
    [teacherSearch]
  );

  const recipientCount = useMemo(() => {
    switch (audience) {
      case "all_users":
        return TOTAL_STUDENTS + TOTAL_TEACHERS + ORG_DIRECTORY.length;
      case "all_organizations":
        return ORG_DIRECTORY.length;
      case "all_teachers":
        return TOTAL_TEACHERS;
      case "specific_organization":
        return selectedOrg ? selectedOrg.teachersCount + selectedOrg.studentsCount + 1 : 0;
      case "specific_teacher":
        return selectedTeacher ? 1 : 0;
      default:
        return 0;
    }
  }, [audience, selectedOrg, selectedTeacher]);

  const audienceLabel = AUDIENCE_OPTIONS.find((a) => a.value === audience)?.label ?? "";

  const canSend =
    subject.trim().length > 0 &&
    message.trim().length > 0 &&
    (audience !== "specific_organization" || !!selectedOrg) &&
    (audience !== "specific_teacher" || !!selectedTeacher);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend) return;

    const label =
      audience === "specific_organization" && selectedOrg
        ? `Org: ${selectedOrg.name}`
        : audience === "specific_teacher" && selectedTeacher
        ? `Teacher: ${selectedTeacher.name}`
        : audienceLabel;

    const entry: BroadcastHistoryEntry = {
      id: `bc-${Date.now()}`,
      subject: subject.trim(),
      audienceLabel: label,
      recipients: recipientCount,
      priority,
      sentAt: new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    };

    setHistory((prev) => [entry, ...prev]);
    setSentDialog({ open: true, entry });
    setSubject("");
    setMessage("");
    setPriority("normal");
  }

  function toggleArchive(id: string) {
    setHistory((prev) =>
      prev.map((h) => (h.id === id ? { ...h, archived: !h.archived } : h))
    );
  }

  const visibleHistory = history.filter((h) => !!h.archived === showArchivedHistory);
  const archivedCount = history.filter((h) => h.archived).length;

  const [archiveAllConfirm, setArchiveAllConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BroadcastHistoryEntry | null>(null);

  function confirmArchiveAll() {
    const visibleIds = new Set(visibleHistory.map((h) => h.id));
    setHistory((prev) =>
      prev.map((h) => (visibleIds.has(h.id) ? { ...h, archived: true } : h))
    );
    setArchiveAllConfirm(false);
  }

  function confirmDeleteBroadcast() {
    if (!deleteTarget) return;
    setHistory((prev) => prev.filter((h) => h.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  return (
    <>
      <AdminTopbar
        title="Broadcast"
        description="Send announcements directly to users across the platform."
      />

      <main className="p-6 space-y-6">
        <form onSubmit={handleSend} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Compose */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-semibold text-navy-900">Audience</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AUDIENCE_OPTIONS.map(({ value, label, description, icon: Icon }) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => setAudience(value)}
                    className={cn(
                      "text-left rounded-xl border p-3.5 transition-colors",
                      audience === value
                        ? "border-sky-400 bg-sky-50/70 ring-1 ring-sky-200"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon
                        size={16}
                        className={audience === value ? "text-sky-600" : "text-slate-400"}
                      />
                      <span className="text-sm font-medium text-navy-900">{label}</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
                  </button>
                ))}
              </div>

              {audience === "specific_organization" && (
                <div className="pt-1 space-y-2">
                  <label className="text-xs font-medium text-slate-500 block">
                    Choose organization
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 h-9">
                    <Search size={14} className="text-slate-400" />
                    <input
                      value={orgSearch}
                      onChange={(e) => setOrgSearch(e.target.value)}
                      placeholder="Search organization or code..."
                      className="bg-transparent text-sm outline-none w-full placeholder:text-slate-400"
                    />
                  </div>
                  <div className="h-44 overflow-y-auto space-y-1.5 pr-1">
                    {filteredOrgs.map((o) => (
                      <button
                        type="button"
                        key={o.id}
                        onClick={() => setOrgId(o.id)}
                        className={cn(
                          "w-full text-left flex items-center gap-3 rounded-xl border px-3 py-2 transition-colors",
                          orgId === o.id
                            ? "border-sky-400 bg-sky-50/70"
                            : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        <div className="h-8 w-8 shrink-0 rounded-full bg-navy-900 text-white flex items-center justify-center text-xs font-semibold">
                          {o.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-navy-900 truncate">{o.name}</p>
                          <p className="text-xs text-slate-400 truncate">{o.code}</p>
                        </div>
                        {orgId === o.id && <Check size={15} className="text-sky-600 shrink-0" />}
                      </button>
                    ))}
                    {filteredOrgs.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-4">No organizations matched.</p>
                    )}
                  </div>
                </div>
              )}

              {audience === "specific_teacher" && (
                <div className="pt-1 space-y-2">
                  <label className="text-xs font-medium text-slate-500 block">
                    Choose teacher
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 h-9">
                    <Search size={14} className="text-slate-400" />
                    <input
                      value={teacherSearch}
                      onChange={(e) => setTeacherSearch(e.target.value)}
                      placeholder="Search teacher or organization..."
                      className="bg-transparent text-sm outline-none w-full placeholder:text-slate-400"
                    />
                  </div>
                  <div className="h-44 overflow-y-auto space-y-1.5 pr-1">
                    {filteredTeachers.map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => setTeacherId(t.id)}
                        className={cn(
                          "w-full text-left flex items-center gap-3 rounded-xl border px-3 py-2 transition-colors",
                          teacherId === t.id
                            ? "border-sky-400 bg-sky-50/70"
                            : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        <div className="h-8 w-8 shrink-0 rounded-full bg-navy-900 text-white flex items-center justify-center text-xs font-semibold">
                          {t.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-navy-900 truncate">{t.name}</p>
                          <p className="text-xs text-slate-400 truncate">{t.orgName}</p>
                        </div>
                        {teacherId === t.id && <Check size={15} className="text-sky-600 shrink-0" />}
                      </button>
                    ))}
                    {filteredTeachers.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-4">No teachers matched.</p>
                    )}
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-semibold text-navy-900">Message</h3>

              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Scheduled maintenance this weekend"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your announcement..."
                  rows={5}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 resize-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">Priority</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPriority("normal")}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors",
                      priority === "normal"
                        ? "border-navy-900 bg-navy-900 text-white"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    )}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority("urgent")}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors",
                      priority === "urgent"
                        ? "border-red-600 bg-red-600 text-white"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    )}
                  >
                    <AlertTriangle size={13} />
                    Urgent
                  </button>
                </div>
              </div>
            </Card>
          </div>

          {/* Summary / send */}
          <div className="space-y-6">
            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-semibold text-navy-900">Summary</h3>

              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-3">
                <div>
                  <p className="text-xs text-slate-400">Sending to</p>
                  <p className="text-sm font-medium text-navy-900 mt-0.5">
                    {audience === "specific_organization"
                      ? selectedOrg?.name ?? "—"
                      : audience === "specific_teacher"
                      ? selectedTeacher?.name ?? "—"
                      : audienceLabel}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Estimated recipients</p>
                  <p className="text-2xl font-semibold text-navy-900 mt-0.5">
                    {recipientCount.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant={priority === "urgent" ? "danger" : "neutral"}>
                    {priority === "urgent" ? "Urgent" : "Normal"} priority
                  </Badge>
                </div>
              </div>

              <Button type="submit" disabled={!canSend} className="w-full">
                <Send size={15} /> Send Broadcast
              </Button>
              {!canSend && (
                <p className="text-xs text-slate-400 text-center">
                  Add a subject and message to send.
                </p>
              )}
            </Card>
          </div>
        </form>

        {/* History */}
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Megaphone size={16} className="text-slate-400" />
              <h3 className="text-sm font-semibold text-navy-900">
                {showArchivedHistory ? "Archived Broadcasts" : "Recent Broadcasts"}
              </h3>
            </div>
            <button
              onClick={() => setShowArchivedHistory((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors",
                showArchivedHistory
                  ? "border-navy-900 bg-navy-900 text-white"
                  : "border-slate-200 text-slate-500 hover:border-slate-300"
              )}
            >
              <Archive size={13} />
              {showArchivedHistory ? "Viewing Archived" : "View Archived"}
              {archivedCount > 0 && !showArchivedHistory && (
                <span className="ml-0.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-slate-200 text-slate-600 text-[10px] font-semibold">
                  {archivedCount}
                </span>
              )}
            </button>
          </div>
          {!showArchivedHistory && (
            <div className="px-5 pt-3 pb-4 border-b border-slate-100">
              <button
                onClick={() => setArchiveAllConfirm(true)}
                disabled={visibleHistory.length === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border border-slate-200 text-slate-500 hover:border-slate-300 transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                <ArchiveX size={13} />
                Archive All
              </button>
            </div>
          )}
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-3 font-medium">Subject</th>
                <th className="px-5 py-3 font-medium">Audience</th>
                <th className="px-5 py-3 font-medium">Priority</th>
                <th className="px-5 py-3 font-medium text-right">Recipients</th>
                <th className="px-5 py-3 font-medium text-right">Sent</th>
                <th className="px-5 py-3 font-medium text-right">&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {visibleHistory.map((h) => (
                <tr key={h.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                  <td className="px-5 py-3.5 font-medium text-navy-900">{h.subject}</td>
                  <td className="px-5 py-3.5 text-slate-600">{h.audienceLabel}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant={h.priority === "urgent" ? "danger" : "neutral"}>
                      {h.priority === "urgent" ? "Urgent" : "Normal"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-right text-slate-600">
                    {h.recipients.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-right text-slate-400">{h.sentAt}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => toggleArchive(h.id)}
                        title={h.archived ? "Unarchive" : "Archive"}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                      >
                        {h.archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
                      </button>
                      {h.archived && (
                        <button
                          onClick={() => setDeleteTarget(h)}
                          title="Delete"
                          className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {visibleHistory.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-sm">
                    {showArchivedHistory ? "No archived broadcasts." : "No broadcasts sent yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </main>

      <Dialog
        open={sentDialog.open}
        onClose={() => setSentDialog({ open: false })}
        className="max-w-sm"
      >
        <div className="px-6 pt-8 pb-6 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Megaphone size={24} strokeWidth={2} />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-navy-900">Broadcast Sent</h2>
          <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
            Your message was sent to{" "}
            <span className="font-medium text-navy-900">
              {sentDialog.entry?.recipients.toLocaleString()}
            </span>{" "}
            recipient{sentDialog.entry?.recipients !== 1 ? "s" : ""} under{" "}
            <span className="font-medium text-navy-900">{sentDialog.entry?.audienceLabel}</span>.
          </p>
          <Button onClick={() => setSentDialog({ open: false })} className="mt-6 w-full">
            Done
          </Button>
        </div>
      </Dialog>

      <ConfirmDialog
        open={archiveAllConfirm}
        onClose={() => setArchiveAllConfirm(false)}
        onConfirm={confirmArchiveAll}
        title="Archive all visible broadcasts?"
        description={`This will archive ${visibleHistory.length} broadcast${
          visibleHistory.length !== 1 ? "s" : ""
        } currently shown. You can unarchive them later.`}
        confirmLabel="Archive All"
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteBroadcast}
        title="Delete broadcast?"
        description={`This will permanently delete "${deleteTarget?.subject}" from your broadcast history. This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </>
  );
}