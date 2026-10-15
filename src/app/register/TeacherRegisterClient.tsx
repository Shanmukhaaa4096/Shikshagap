"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Envelope,
  Phone,
  Buildings,
  Lock,
  Eye,
  EyeSlash,
  WarningCircle,
  GraduationCap,
  ShieldCheck,
  CheckCircle,
} from "@phosphor-icons/react";

export default function TeacherRegisterClient() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: "",
    institutionName: "",
    gradesTaught: ["class_3", "class_4", "class_5"] as string[],
    subjectsTaught: ["Mathematics"] as string[],
    otherSubject: "",
    designation: "teacher" as
      | "teacher"
      | "senior_teacher"
      | "headmaster"
      | "principal"
      | "coordinator"
      | "other",
    countryCode: "+91",
    phone: "",
    email: "",
    password: "",
    age: "",
    privacyConsent: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const availableGrades = [
    { id: "class_3", label: "Class 3 (Primary)" },
    { id: "class_4", label: "Class 4 (Primary)" },
    { id: "class_5", label: "Class 5 (Upper Primary Prep)" },
  ];

  const standardSubjects = [
    "Mathematics",
    "Science / EVS",
    "English",
    "Regional Language (Hindi/Telugu/Tamil)",
  ];

  const designations = [
    { value: "teacher", label: "Primary / SGT Teacher" },
    { value: "senior_teacher", label: "Senior Teacher / School Assistant" },
    { value: "coordinator", label: "Academic Coordinator / CRCC" },
    { value: "headmaster", label: "Headmaster / Headmistress" },
    { value: "principal", label: "School Principal" },
    { value: "other", label: "Other Educational Staff" },
  ];

  const toggleGrade = (gradeId: string) => {
    setFormData((prev) => {
      const exists = prev.gradesTaught.includes(gradeId);
      if (exists) {
        if (prev.gradesTaught.length === 1) return prev; // Keep at least one
        return { ...prev, gradesTaught: prev.gradesTaught.filter((g) => g !== gradeId) };
      }
      return { ...prev, gradesTaught: [...prev.gradesTaught, gradeId] };
    });
  };

  const toggleSubject = (sub: string) => {
    setFormData((prev) => {
      const exists = prev.subjectsTaught.includes(sub);
      if (exists) {
        return { ...prev, subjectsTaught: prev.subjectsTaught.filter((s) => s !== sub) };
      }
      return { ...prev, subjectsTaught: [...prev.subjectsTaught, sub] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.fullName.trim() || !formData.institutionName.trim()) {
      setErrorMessage("Please fill in your full name and institution name.");
      return;
    }

    if (!formData.email.trim() || !formData.phone.trim()) {
      setErrorMessage("Both email address and mobile number are required.");
      return;
    }

    if (formData.password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (formData.gradesTaught.length === 0) {
      setErrorMessage("Please select at least one class taught.");
      return;
    }

    if (!formData.privacyConsent) {
      setErrorMessage("You must accept the DPDP Act 2023 privacy notice to create an account.");
      return;
    }

    setIsLoading(true);

    try {
      const finalSubjects = [...formData.subjectsTaught];
      if (formData.otherSubject.trim() && !finalSubjects.includes(formData.otherSubject.trim())) {
        finalSubjects.push(formData.otherSubject.trim());
      }

      const payload = {
        fullName: formData.fullName.trim(),
        institutionName: formData.institutionName.trim(),
        gradesTaught: formData.gradesTaught,
        subjectsTaught: finalSubjects,
        designation: formData.designation,
        countryCode: formData.countryCode,
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        password: formData.password,
        age: formData.age ? parseInt(formData.age, 10) : undefined,
        privacyConsent: true,
      };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Registration failed. Please check your inputs.");
        setIsLoading(false);
        return;
      }

      // Success: redirect to verification page
      router.push(
        `/verify?email=${encodeURIComponent(data.email)}&phone=${encodeURIComponent(data.phone)}&sent=true`
      );
    } catch {
      setErrorMessage("Network connection error. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-8 font-sans">
      <div className="w-full max-w-2xl mx-auto my-6">
        {/* Header Container */}
        <div className="border border-border bg-card text-card-foreground p-6 sm:p-8 rounded-[2px] shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-border">
            <div>
              <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-foreground hover:underline">
                ShikshaGap
              </Link>
              <h1 className="text-sm font-bold uppercase tracking-widest text-foreground/80 dark:text-muted-foreground mt-1">
                Teacher Account Registration
              </h1>
            </div>
            <div className="border border-border px-2.5 py-1 text-xs font-mono uppercase bg-muted text-foreground">
              Official Educator Portal
            </div>
          </div>

          <p className="text-sm text-foreground/80 dark:text-muted-foreground mb-6 leading-relaxed">
            Create an institutional teacher profile to run adaptive learning diagnostics, isolate prerequisite gaps, and receive automated pedagogical action plans.
          </p>

          {errorMessage && (
            <div
              role="alert"
              className="mb-6 p-3 border border-[var(--status-urgent-border)] bg-[var(--status-urgent-bg)] text-foreground text-sm flex items-start gap-2 rounded-[2px]"
            >
              <WarningCircle size={18} className="text-[var(--status-urgent)] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[var(--status-urgent)]">Registration Error: </span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name & School */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fullName" className="block text-xs font-mono uppercase tracking-wider text-foreground/80 dark:text-muted-foreground mb-1">
                  Full Name <span className="text-[var(--status-urgent)]">*</span>
                </label>
                <div className="relative">
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Smt. Lakshmi Devi"
                    className="w-full min-h-[44px] bg-card border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary rounded-[2px]"
                  />
                  <User size={18} className="absolute right-3 top-3 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div>
                <label htmlFor="institutionName" className="block text-xs font-mono uppercase tracking-wider text-foreground/80 dark:text-muted-foreground mb-1">
                  School / Institution Name <span className="text-[var(--status-urgent)]">*</span>
                </label>
                <div className="relative">
                  <input
                    id="institutionName"
                    type="text"
                    required
                    value={formData.institutionName}
                    onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                    placeholder="MPPS Rampur Primary School"
                    className="w-full min-h-[44px] bg-card border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary rounded-[2px]"
                  />
                  <Buildings size={18} className="absolute right-3 top-3 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Phone & Country Code */}
            <div>
              <label htmlFor="phone" className="block text-xs font-mono uppercase tracking-wider text-foreground/80 dark:text-muted-foreground mb-1">
                Mobile Phone Number (for SMS OTP) <span className="text-[var(--status-urgent)]">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.countryCode}
                  onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                  aria-label="Country code"
                  className="min-h-[44px] bg-card border border-border px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary rounded-[2px]"
                >
                  <option value="+91">🇮🇳 India (+91)</option>
                  <option value="+1">🇺🇸 USA (+1)</option>
                  <option value="+44">🇬🇧 UK (+44)</option>
                  <option value="+977">🇳🇵 Nepal (+977)</option>
                  <option value="+880">🇧🇩 Bangladesh (+880)</option>
                </select>
                <div className="relative flex-1">
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full min-h-[44px] bg-card border border-border px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary rounded-[2px]"
                  />
                  <Phone size={18} className="absolute right-3 top-3 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                A 6-digit SMS verification code will be sent to this mobile number.
              </p>
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-xs font-mono uppercase tracking-wider text-foreground/80 dark:text-muted-foreground mb-1">
                Institutional or Personal Email Address <span className="text-[var(--status-urgent)]">*</span>
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="teacher@school.gov.in"
                  className="w-full min-h-[44px] bg-card border border-border px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary rounded-[2px]"
                />
                <Envelope size={18} className="absolute right-3 top-3 text-muted-foreground pointer-events-none" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                A verification link and code will be sent to this address.
              </p>
            </div>

            {/* Grades Taught */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-foreground/80 dark:text-muted-foreground mb-2">
                Classes / Grades Taught <span className="text-[var(--status-urgent)]">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {availableGrades.map((grade) => {
                  const isSelected = formData.gradesTaught.includes(grade.id);
                  return (
                    <button
                      type="button"
                      key={grade.id}
                      onClick={() => toggleGrade(grade.id)}
                      className={`min-h-[44px] p-2.5 border text-xs font-mono text-left flex items-center justify-between rounded-[2px] transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/10 text-foreground font-bold"
                          : "border-border bg-card text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <span>{grade.label}</span>
                      {isSelected && <CheckCircle size={16} className="text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Designation & Age */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="designation" className="block text-xs font-mono uppercase tracking-wider text-foreground/80 dark:text-muted-foreground mb-1">
                  Designation / Role (Optional)
                </label>
                <select
                  id="designation"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value as any })}
                  className="w-full min-h-[44px] bg-card border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary rounded-[2px]"
                >
                  {designations.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="age" className="block text-xs font-mono uppercase tracking-wider text-foreground/80 dark:text-muted-foreground mb-1">
                  Age (Optional)
                </label>
                <input
                  id="age"
                  type="number"
                  min={18}
                  max={100}
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="e.g. 34"
                  className="w-full min-h-[44px] bg-card border border-border px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary rounded-[2px]"
                />
              </div>
            </div>

            {/* Subjects Taught */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-foreground/80 dark:text-muted-foreground mb-2">
                Subjects Taught (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {standardSubjects.map((sub) => {
                  const isSelected = formData.subjectsTaught.includes(sub);
                  return (
                    <button
                      type="button"
                      key={sub}
                      onClick={() => toggleSubject(sub)}
                      className={`min-h-[36px] px-3 py-1.5 border text-xs font-mono rounded-[2px] transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/10 text-foreground font-bold"
                          : "border-border bg-card text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={formData.otherSubject}
                onChange={(e) => setFormData({ ...formData, otherSubject: e.target.value })}
                placeholder="Other subject (e.g., Social Studies, Art)..."
                className="w-full min-h-[40px] bg-card border border-border px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary rounded-[2px]"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-mono uppercase tracking-wider text-foreground/80 dark:text-muted-foreground mb-1">
                Account Password <span className="text-[var(--status-urgent)]">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimum 8 characters"
                  className="w-full min-h-[44px] bg-card border border-border px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary rounded-[2px] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Privacy Notice & Consent */}
            <div className="p-4 bg-muted/50 border border-border rounded-[2px] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground font-mono uppercase">
                <ShieldCheck size={18} className="text-primary" />
                <span>Privacy &amp; DPDP Act 2023 Notice</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                ShikshaGap collects your name, institution, contact details, and teaching preferences strictly to deliver pedagogical diagnostic services. We never sell educator data, never request Aadhaar or identity cards, and safeguard student assessment records under India’s DPDP Act 2023. You may request account deletion or data export at any time.
              </p>
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-foreground pt-1">
                <input
                  type="checkbox"
                  required
                  checked={formData.privacyConsent}
                  onChange={(e) => setFormData({ ...formData, privacyConsent: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span>
                  I confirm that I am a school educator or administrator and agree to the{" "}
                  <Link href="/privacy" target="_blank" className="text-primary hover:underline font-bold">
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link href="/terms" target="_blank" className="text-primary hover:underline font-bold">
                    Terms of Service
                  </Link>
                  .
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[48px] bg-primary text-primary-foreground font-mono font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-opacity disabled:opacity-50 rounded-[2px]"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  <span>Registering Teacher Account...</span>
                </>
              ) : (
                <span>Complete Registration &amp; Verify</span>
              )}
            </button>
          </form>

          {/* Existing Account Footer */}
          <div className="mt-6 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
            <span>Already have an account?</span>
            <Link href="/login" className="font-bold text-foreground hover:underline">
              Log in to Staff Portal &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
