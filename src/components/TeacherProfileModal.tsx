"use client";

import { useState, useEffect } from "react";
import {
  User,
  Buildings,
  Phone,
  Envelope,
  ShieldCheck,
  Trash,
  X,
  Check,
  WarningCircle,
  CircleNotch,
  FloppyDisk,
  SignOut,
  Info,
} from "@phosphor-icons/react";

interface TeacherProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => void;
}

interface TeacherProfileData {
  id: string;
  email: string;
  fullName: string;
  institutionName: string;
  gradesTaught: string[];
  subjectsTaught: string[];
  designation?: string;
  phone: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  status: string;
  createdAt?: string;
}

const AVAILABLE_GRADES = [
  { id: "class_3", label: "Class 3 (Foundational)" },
  { id: "class_4", label: "Class 4 (Intermediate)" },
  { id: "class_5", label: "Class 5 (Preparatory)" },
];

export function TeacherProfileModal({ isOpen, onClose, onSignOut }: TeacherProfileModalProps) {
  const [profile, setProfile] = useState<TeacherProfileData | null>(null);
  const [fullName, setFullName] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [gradesTaught, setGradesTaught] = useState<string[]>([]);
  const [designation, setDesignation] = useState("teacher");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Deletion modal state
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    fetch("/api/auth/profile")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load profile.");
        return res.json();
      })
      .then((data) => {
        if (data.user) {
          setProfile(data.user);
          setFullName(data.user.fullName || data.user.name || "");
          setInstitutionName(data.user.institutionName || "");
          setGradesTaught(data.user.gradesTaught || ["class_5"]);
          setDesignation(data.user.designation || "teacher");
        }
      })
      .catch((err) => {
        setErrorMessage(err.message || "Failed to fetch profile information.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSaveSuccess(false);
    setSaving(true);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          institutionName: institutionName.trim(),
          gradesTaught,
          designation,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to save profile changes.");
      } else {
        setSaveSuccess(true);
        if (data.user) {
          setProfile(data.user);
        }
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch {
      setErrorMessage("Network error while updating profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);

    if (deleteConfirmText.trim() !== "DELETE") {
      setDeleteError('Please type "DELETE" to confirm account termination.');
      return;
    }

    setDeleteLoading(true);
    try {
      const res = await fetch("/api/auth/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmation: "DELETE",
          password: deletePassword,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteError(data.error || "Failed to delete account.");
        setDeleteLoading(false);
      } else {
        // Clear local storage and redirect to home
        try {
          localStorage.clear();
        } catch {
          // ignore
        }
        window.location.href = "/?message=account_deleted";
      }
    } catch {
      setDeleteError("Network error. Please try again.");
      setDeleteLoading(false);
    }
  };

  const toggleGrade = (gradeId: string) => {
    if (gradesTaught.includes(gradeId)) {
      if (gradesTaught.length > 1) {
        setGradesTaught(gradesTaught.filter((g) => g !== gradeId));
      }
    } else {
      setGradesTaught([...gradesTaught, gradeId]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <User size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Teacher Account & Profile
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verified educator profile under India DPDP Act 2023
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
              <CircleNotch size={24} className="animate-spin text-indigo-600" />
              <p className="text-xs">Loading teacher account details...</p>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-rose-800 dark:text-rose-200 text-xs">
                  <WarningCircle size={16} className="shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-emerald-800 dark:text-emerald-200 text-xs">
                  <Check size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              {/* Verified Contact Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-start gap-2.5">
                  <Envelope size={16} className="text-slate-500 shrink-0 mt-0.5" />
                  <div className="overflow-hidden">
                    <div className="font-semibold text-slate-700 dark:text-slate-300">Email Address</div>
                    <div className="font-mono text-slate-600 dark:text-slate-400 truncate">
                      {profile?.email}
                    </div>
                    <span className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <Check size={12} /> Verified
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Phone size={16} className="text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-slate-700 dark:text-slate-300">Phone Number</div>
                    <div className="font-mono text-slate-600 dark:text-slate-400">
                      {profile?.phone || "N/A (Demo Account)"}
                    </div>
                    {profile?.phone && (
                      <span className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <Check size={12} /> Verified via SMS OTP
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Edit Form */}
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Teacher Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={saving}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    School / Educational Institution
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      disabled={saving}
                      className="w-full px-3.5 py-2 pl-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    />
                    <Buildings size={16} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Designation
                    </label>
                    <select
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      disabled={saving}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      <option value="teacher">Class Teacher</option>
                      <option value="senior_teacher">Senior Teacher</option>
                      <option value="headmaster">Headmaster / Headmistress</option>
                      <option value="principal">School Principal</option>
                      <option value="coordinator">Academic Coordinator</option>
                      <option value="other">Other Educational Staff</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Assigned Grades
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {AVAILABLE_GRADES.map((g) => {
                        const active = gradesTaught.includes(g.id);
                        return (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => toggleGrade(g.id)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition ${
                              active
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400"
                            }`}
                          >
                            {g.label.split(" ")[1]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition"
                  >
                    {saving ? <CircleNotch size={14} className="animate-spin" /> : <FloppyDisk size={14} />}
                    Save Changes
                  </button>
                </div>
              </form>

              {/* Privacy Notice Notice */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Info size={14} className="text-indigo-500" /> Data Protection Notice (DPDP Act 2023)
                </div>
                <p>
                  Your teacher contact details are strictly utilized for identity verification, session authorization,
                  and educational assessment delivery. Student diagnostic results are encrypted and restricted to your
                  authorized institution.
                </p>
              </div>

              {/* Account Actions: Sign Out & Delete */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onSignOut}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <SignOut size={14} />
                  Sign Out
                </button>

                <button
                  type="button"
                  onClick={() => setIsDeleting(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                >
                  <Trash size={14} />
                  Delete Teacher Account
                </button>
              </div>
            </>
          )}
        </div>

        {/* Account Deletion Sub-Modal */}
        {isDeleting && (
          <div className="absolute inset-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                  <ShieldCheck size={20} />
                  <h3 className="text-sm font-bold">Permanently Delete Account</h3>
                </div>
                <button
                  onClick={() => setIsDeleting(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                This action is <strong>irreversible</strong>. In compliance with your DPDP right to erasure, your teacher
                profile, credentials, verification tokens, and associated classroom progress will be purged.
              </p>

              {deleteError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                  <WarningCircle size={16} className="shrink-0 text-rose-600" />
                  <span>{deleteError}</span>
                </div>
              )}

              <form onSubmit={handleDeleteAccount} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Enter your account password to authorize deletion
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    disabled={deleteLoading}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Type <strong>DELETE</strong> in all caps to confirm
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="DELETE"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    disabled={deleteLoading}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDeleting(false)}
                    disabled={deleteLoading}
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={deleteLoading}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition flex items-center gap-1.5"
                  >
                    {deleteLoading ? <CircleNotch size={14} className="animate-spin" /> : <Trash size={14} />}
                    Confirm & Delete Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
