"use client";

import { useEffect, useMemo, useState } from "react";
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
  Eye,
} from "lucide-react";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

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
  message?: string;
  audienceLabel: string;
  recipients: number;
  priority: Priority;
  sentAt: string;
  isArchived?: boolean;
}

interface OrgDirectoryItem {
  id: string;
  name: string;
  email?: string;
  teachersCount: number;
}

interface TeacherDirectoryItem {
  id: string;
  name: string;
  email: string;
  orgId: string;
  orgName: string;
}

interface DirectoryTotals {
  organizations: number;
  teachers: number;
  students: number;
  allUsers: number;
}

export default function AdminBroadcastPage() {
  const [audience, setAudience] = useState<Audience>("all_users");
  const [orgDirectory, setOrgDirectory] = useState<OrgDirectoryItem[]>([]);
  const [teacherDirectory, setTeacherDirectory] = useState<TeacherDirectoryItem[]>([]);
  const [totals, setTotals] = useState<DirectoryTotals>({
    organizations: 0,
    teachers: 0,
    students: 0,
    allUsers: 0,
  });

  const [orgId, setOrgId] = useState("");
  const [orgSearch, setOrgSearch] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");

  const [history, setHistory] = useState<BroadcastHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showArchivedHistory, setShowArchivedHistory] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<BroadcastHistoryEntry | null>(null);

  const [sentDialog, setSentDialog] = useState<{ open: boolean; entry?: BroadcastHistoryEntry }>({
    open: false,
  });

  async function loadData() {
    try {
      const res = await fetch("/api/admin/broadcast");
      if (res.ok) {
        const json = await res.json();
        setOrgDirectory(json.directories?.organizations || []);
        setTeacherDirectory(json.directories?.teachers || []);
        setTotals(
          json.directories?.totals || {
            organizations: 0,
            teachers: 0,
            students: 0,
            allUsers: 0,
          }
        );
        setHistory(json.broadcasts || []);

        if (json.directories?.organizations?.length > 0 && !orgId) {
          setOrgId(json.directories.organizations[0].id);
        }
        if (json.directories?.teachers?.length > 0 && !teacherId) {
          setTeacherId(json.directories.teachers[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load broadcast data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const selectedOrg = orgDirectory.find((o) => o.id === orgId);
  const selectedTeacher = teacherDirectory.find((t) => t.id === teacherId);

  const filteredOrgs = useMemo(
    () =>
      orgDirectory.filter(
        (o) =>
          o.name.toLowerCase().includes(orgSearch.toLowerCase()) ||
          (o.email && o.email.toLowerCase().includes(orgSearch.toLowerCase()))
      ),
    [orgDirectory, orgSearch]
  );

  const filteredTeachers = useMemo(
    () =>
      teacherDirectory.filter(
        (t) =>
          t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
          t.email.toLowerCase().includes(teacherSearch.toLowerCase()) ||
          t.orgName.toLowerCase().includes(teacherSearch.toLowerCase())
      ),
    [teacherDirectory, teacherSearch]
  );

  const recipientCount = useMemo(() => {
    switch (audience) {
      case "all_users":
        return totals.allUsers;
      case "all_organizations":
        return totals.organizations;
      case "all_teachers":
        return totals.teachers;
      case "specific_organization":
        return selectedOrg ? selectedOrg.teachersCount + 1 : 0;
      case "specific_teacher":
        return selectedTeacher ? 1 : 0;
      default:
        return 0;
    }
  }, [audience, totals, selectedOrg, selectedTeacher]);

  const audienceLabel = AUDIENCE_OPTIONS.find((a) => a.value === audience)?.label ?? "";

  const canSend =
    subject.trim().length > 0 &&
    message.trim().length > 0 &&
    (audience !== "specific_organization" || !!selectedOrg) &&
    (audience !== "specific_teacher" || !!selectedTeacher) &&
    !sending;

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend) return;

    setSending(true);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim(),
          audience,
          orgId: audience === "specific_organization" ? orgId : null,
          teacherId: audience === "specific_teacher" ? teacherId : null,
          priority,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Failed to send broadcast.");
        return;
      }

      const newEntry: BroadcastHistoryEntry = json.broadcast;
      setHistory((prev) => [newEntry, ...prev]);
      setSentDialog({ open: true, entry: newEntry });
      setSubject("");
      setMessage("");
      setPriority("normal");
    } catch (err) {
      console.error("Error sending broadcast:", err);
      alert("Network error sending broadcast.");
    } finally {
      setSending(false);
    }
  }

  async function toggleArchive(id: string) {
    const target = history.find((h) => h.id === id);
    if (!target) return;
    const nextArchived = !target.isArchived;

    // Optimistic
    setHistory((prev) =>
      prev.map((h) => (h.id === id ? { ...h, isArchived: nextArchived } : h))
    );

    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          action: nextArchived ? "archive" : "unarchive",
        }),
      });
      if (!res.ok) {
        // Revert
        setHistory((prev) =>
          prev.map((h) => (h.id === id ? { ...h, isArchived: !nextArchived } : h))
        );
        alert("Failed to update broadcast archive state.");
      }
    } catch (err) {
      console.error("Archive error:", err);
    }
  }

  const visibleHistory = history.filter((h) => !!h.isArchived === showArchivedHistory);
  const archivedCount = history.filter((h) => h.isArchived).length;

  const [archiveAllConfirm, setArchiveAllConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BroadcastHistoryEntry | null>(null);

  async function confirmArchiveAll() {
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "archive_all" }),
      });
      if (res.ok) {
        setHistory((prev) => prev.map((h) => ({ ...h, isArchived: true })));
      }
    } catch (err) {
      console.error("Archive all error:", err);
    } finally {
      setArchiveAllConfirm(false);
    }
  }

  async function confirmDeleteBroadcast() {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;

    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: targetId }),
      });

      if (res.ok) {
        setHistory((prev) => prev.filter((h) => h.id !== targetId));
      } else {
        alert("Failed to delete broadcast record.");
      }
    } catch (err) {
      console.error("Delete broadcast error:", err);
      alert("Network error deleting broadcast.");
    } finally {
      setDeleteTarget(null);
    }
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
                      placeholder="Search organization by name..."
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
                          <p className="text-xs text-slate-400 truncate">
                            {o.teachersCount} teacher{o.teachersCount !== 1 ? "s" : ""}
                          </p>
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
                      placeholder="Search teacher by name, email or org..."
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
                          {t.name.split(" ").map((n) => n[0]).join("").slice(0, 2) || t.email.slice(0, 2).toUpperCase()}
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
                    {loading ? "..." : recipientCount.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant={priority === "urgent" ? "danger" : "neutral"}>
                    {priority === "urgent" ? "Urgent" : "Normal"} priority
                  </Badge>
                </div>
              </div>

              <Button type="submit" disabled={!canSend} className="w-full">
                <Send size={15} /> {sending ? "Sending..." : "Send Broadcast"}
              </Button>
              {!canSend && !sending && (
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
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-sm">
                    Loading broadcast history...
                  </td>
                </tr>
              ) : (
                visibleHistory.map((h) => (
                  <tr key={h.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => setSelectedDetail(h)}
                        className="text-left group/item block"
                      >
                        <p className="font-medium text-navy-900 group-hover/item:text-sky-600 transition-colors">
                          {h.subject}
                        </p>
                        {h.message && (
                          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5 max-w-sm">
                            {h.message}
                          </p>
                        )}
                      </button>
                    </td>
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
                          onClick={() => setSelectedDetail(h)}
                          title="View Message Details"
                          className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-sky-50 text-slate-400 hover:text-sky-600 transition-colors"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => toggleArchive(h.id)}
                          title={h.isArchived ? "Unarchive" : "Archive"}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {h.isArchived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(h)}
                          title="Delete"
                          className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {!loading && visibleHistory.length === 0 && (
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

      {/* Broadcast Sent Modal */}
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

      {/* Broadcast Message Details Modal */}
      <Dialog
        open={!!selectedDetail}
        onClose={() => setSelectedDetail(null)}
        className="max-w-lg"
      >
        {selectedDetail && (
          <div className="p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Megaphone size={20} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-navy-900 leading-snug">
                    {selectedDetail.subject}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sent on {selectedDetail.sentAt}
                  </p>
                </div>
              </div>
              <Badge variant={selectedDetail.priority === "urgent" ? "danger" : "neutral"}>
                {selectedDetail.priority === "urgent" ? "Urgent" : "Normal"}
              </Badge>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Announcement Message
              </label>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm text-navy-900 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                {selectedDetail.message || selectedDetail.subject}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
              <div className="bg-white border border-slate-200 rounded-xl p-3">
                <p className="text-slate-400 font-medium">Target Audience</p>
                <p className="text-sm font-semibold text-navy-900 mt-0.5">
                  {selectedDetail.audienceLabel}
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-3">
                <p className="text-slate-400 font-medium">Total Recipients</p>
                <p className="text-sm font-semibold text-navy-900 mt-0.5">
                  {selectedDetail.recipients.toLocaleString()} recipients
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  toggleArchive(selectedDetail.id);
                  setSelectedDetail((prev) =>
                    prev ? { ...prev, isArchived: !prev.isArchived } : null
                  );
                }}
              >
                {selectedDetail.isArchived ? (
                  <>
                    <ArchiveRestore size={14} /> Unarchive
                  </>
                ) : (
                  <>
                    <Archive size={14} /> Archive
                  </>
                )}
              </Button>
              <Button size="sm" onClick={() => setSelectedDetail(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
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