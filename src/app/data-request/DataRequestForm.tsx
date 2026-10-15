"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Warning, IdentificationCard } from "@phosphor-icons/react";

export default function DataRequestForm() {
  const [formData, setFormData] = useState({
    requesterName: "",
    requesterRole: "parent" as "parent" | "teacher" | "student" | "guardian",
    email: "",
    phone: "",
    studentName: "",
    studentRollNo: "",
    schoolName: "",
    requestType: "access" as "access" | "correction" | "deletion" | "grievance",
    details: "",
    consentConfirmed: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ referenceId: string; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.consentConfirmed) {
      setError("Please confirm the verification and consent declaration checkbox.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/data-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || "Failed to submit request.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-card dark:bg-muted text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <Link
            href="/"
            className="text-sm font-bold text-foreground hover:underline flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <span className="font-mono text-sm text-muted-foreground dark:text-muted-foreground">
            DPDP Act 2023 Form
          </span>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted text-foreground text-sm font-mono font-bold rounded-[2px] border border-border">
            <IdentificationCard className="w-4 h-4 text-foreground" />
            <span>DATA PRINCIPAL EXERCISE OF RIGHTS</span>
          </div>
          <h1 className="font-serif text-3xl font-extrabold text-foreground">
            Data Access, Correction &amp; Deletion Request
          </h1>
          <p className="text-sm sm:text-sm text-foreground/80 dark:text-muted-foreground leading-relaxed">
            Parents, legal guardians, and school teachers can request access to, correction of, or permanent deletion of student records processed by ShikshaGap.
          </p>
        </div>

        {result ? (
          <div className="p-6 bg-[var(--status-good-bg)] border border-[var(--status-good-border)] rounded-[2px] space-y-3">
            <div className="flex items-center gap-2 text-foreground font-bold">
              <CheckCircle className="w-5 h-5 text-[var(--status-good)]" />
              <span className="text-base">Request Successfully Logged</span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {result.message}
            </p>
            <div className="p-3 bg-[var(--surface)] border border-border rounded-[2px] font-mono text-sm text-foreground">
              <div>Reference Tracking ID: <strong>{result.referenceId}</strong></div>
              <div className="text-sm text-muted-foreground mt-1">Please preserve this reference ID for any communication with our Privacy Officer.</div>
            </div>
            <button
              onClick={() => {
                setResult(null);
                setFormData({
                  requesterName: "",
                  requesterRole: "parent",
                  email: "",
                  phone: "",
                  studentName: "",
                  studentRollNo: "",
                  schoolName: "",
                  requestType: "access",
                  details: "",
                  consentConfirmed: false,
                });
              }}
              className="neo-btn neo-btn-secondary px-4 py-2 text-sm font-bold rounded-[2px]"
            >
              Submit Another Request
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 bg-[var(--surface)] border border-border rounded-[2px] space-y-4 text-sm">
            {/* Honeypot field */}
            <input
              type="text"
              name="portal_confirm_code"
              value={(formData as { honeypot?: string }).honeypot || ""}
              onChange={(e) => setFormData({ ...formData, ...{ honeypot: e.target.value } })}
              className="sr-only"
              tabIndex={-1}
              autoComplete="off"
            />

            {error && (
              <div className="p-3 bg-primary/15 border border-primary rounded-[2px] text-primary flex items-center gap-2">
                <Warning className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-foreground">Your Full Name *</label>
                <input
                  required
                  type="text"
                  value={formData.requesterName}
                  onChange={(e) => setFormData({ ...formData, requesterName: e.target.value })}
                  className="w-full h-9 px-3 bg-card border border-border rounded-[2px] text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Your Relationship to Student *</label>
                <select
                  value={formData.requesterRole}
                  onChange={(e) => setFormData({ ...formData, requesterRole: e.target.value as "parent" | "teacher" | "student" | "guardian" })}
                  className="w-full h-9 px-3 bg-card border border-border rounded-[2px] text-foreground"
                >
                  <option value="parent">Parent</option>
                  <option value="guardian">Legal Guardian</option>
                  <option value="teacher">Class Teacher / School Staff</option>
                  <option value="student">Student (if authorized)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-foreground">Email Address *</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full h-9 px-3 bg-card border border-border rounded-[2px] text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full h-9 px-3 bg-card border border-border rounded-[2px] text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="space-y-1">
                <label className="font-bold text-foreground">Student Full Name *</label>
                <input
                  required
                  type="text"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  className="w-full h-9 px-3 bg-card border border-border rounded-[2px] text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Roll Number</label>
                <input
                  type="text"
                  value={formData.studentRollNo}
                  onChange={(e) => setFormData({ ...formData, studentRollNo: e.target.value })}
                  className="w-full h-9 px-3 bg-card border border-border rounded-[2px] text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">School Name</label>
                <input
                  type="text"
                  value={formData.schoolName}
                  onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                  className="w-full h-9 px-3 bg-card border border-border rounded-[2px] text-foreground"
                />
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <label className="font-bold text-foreground">Type of Request *</label>
              <select
                value={formData.requestType}
                onChange={(e) => setFormData({ ...formData, requestType: e.target.value as "access" | "correction" | "deletion" | "grievance" })}
                className="w-full h-9 px-3 bg-card border border-border rounded-[2px] text-foreground"
              >
                <option value="access">Access: Request copy of all academic diagnostic records</option>
                <option value="correction">Correction: Rectify inaccurate student profile or roll number</option>
                <option value="deletion">Deletion: Permanently erase student records and logs</option>
                <option value="grievance">Grievance: Report privacy concern or unauthorized processing</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-foreground">Additional Context / Details</label>
              <textarea
                rows={3}
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                placeholder="Please describe any specific details to help us locate and verify the student record..."
                className="w-full p-2.5 bg-card border border-border rounded-[2px] text-foreground"
              />
            </div>

            {/* Unbundled, Unticked Consent Declaration */}
            <div className="pt-2 border-t border-border space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.consentConfirmed}
                  onChange={(e) => setFormData({ ...formData, consentConfirmed: e.target.checked })}
                  className="mt-0.5 rounded-[2px] border border-border"
                />
                <span className="text-sm text-foreground/80 leading-tight">
                  I confirm that I am the authorized parent, legal guardian, or school authority for this student, and I consent to the processing of this request in accordance with the ShikshaGap <Link href="/privacy" className="underline font-bold">Privacy Policy</Link>.
                </span>
              </label>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="neo-btn neo-btn-primary px-5 py-2.5 text-sm font-bold rounded-[2px] w-full sm:w-auto"
              >
                {isSubmitting ? "Submitting Request..." : "Submit Data Request"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
