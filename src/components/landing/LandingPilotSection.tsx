'use client';

import React, { useState, useId } from 'react';
import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react';
import { SuccessIllustration } from '@/components/illustrations/StateIllustrations';
import { FlowerPetal, BotanicalLeaf, GiftBoxMotif } from '@/components/illustrations/FloralMotifs';

export function LandingPilotSection() {
  const [pilotSchool, setPilotSchool] = useState('');
  const [pilotTeacher, setPilotTeacher] = useState('');
  const [pilotClassRange, setPilotClassRange] = useState('Classes 3 to 5');
  const [pilotContact, setPilotContact] = useState('');
  const [pilotHoneypot, setPilotHoneypot] = useState('');
  const [pilotConsent, setPilotConsent] = useState(true);
  const [pilotLoading, setPilotLoading] = useState(false);
  const [pilotSuccess, setPilotSuccess] = useState<string | null>(null);
  const [pilotReferenceId, setPilotReferenceId] = useState<string | null>(null);
  const [pilotError, setPilotError] = useState<string | null>(null);
  const [pilotFieldErrors, setPilotFieldErrors] = useState<{
    school?: string;
    teacher?: string;
    contact?: string;
    consent?: string;
  }>({});

  const schoolInputId = useId();
  const teacherInputId = useId();
  const classRangeInputId = useId();
  const contactInputId = useId();
  const consentInputId = useId();

  const handlePilotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPilotError(null);
    setPilotSuccess(null);
    setPilotReferenceId(null);

    const errors: { school?: string; teacher?: string; contact?: string; consent?: string } = {};
    if (!pilotSchool.trim()) {
      errors.school = 'School name is required.';
    }
    if (!pilotTeacher.trim()) {
      errors.teacher = 'Teacher or headmaster name is required.';
    }
    const cleanContact = pilotContact.trim();
    if (!cleanContact) {
      errors.contact = 'Contact phone number or email address is required.';
    } else {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanContact);
      const isPhone = /^[6-9]\d{9}$/.test(cleanContact.replace(/[\s-+]/g, ''));
      if (!isEmail && !isPhone) {
        errors.contact = 'Please enter a valid 10-digit mobile number or email address.';
      }
    }
    if (!pilotConsent) {
      errors.consent = 'You must accept the privacy policy to submit a pilot request.';
    }

    if (Object.keys(errors).length > 0) {
      setPilotFieldErrors(errors);
      return;
    }

    setPilotFieldErrors({});
    setPilotLoading(true);

    try {
      const res = await fetch('/api/pilot-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName: pilotSchool.trim(),
          teacherName: pilotTeacher.trim(),
          classRange: pilotClassRange,
          contact: pilotContact.trim(),
          honeypot: pilotHoneypot,
          privacyConsent: pilotConsent,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit request.');
      }

      setPilotSuccess(data.message || 'Thank you! Your school pilot request has been registered.');
      setPilotReferenceId(data.referenceId || null);
      setPilotSchool('');
      setPilotTeacher('');
      setPilotContact('');
    } catch (err: unknown) {
      const msg = err instanceof TypeError && err.message.includes('fetch')
        ? 'Network request failed. Please check your internet connectivity and try again.'
        : err instanceof Error
        ? err.message
        : 'An unexpected error occurred while submitting.';
      setPilotError(msg);
    } finally {
      setPilotLoading(false);
    }
  };

  return (
    <section id="pilot" className="px-4 sm:px-8 py-14 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Letter to School Leaders */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-sans uppercase tracking-widest text-primary font-bold">
            <BotanicalLeaf size={16} />
            <span>07 / FIELD PARTNERSHIPS</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-4xl font-bold text-foreground">
            Request a Classroom Pilot
          </h2>
          <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed font-sans">
            Government primary schools, headmasters, and cluster resource persons can request dedicated classroom onboarding support.
          </p>
          <div className="rounded-[20px] border border-[#C7DDAE] bg-[#C7DDAE]/20 p-5 space-y-2.5 text-xs font-sans text-foreground/80">
            <div className="flex items-center gap-2 font-semibold">
              <GiftBoxMotif size={15} />
              <span>Zero license fee for public schools</span>
            </div>
            <div className="flex items-center gap-2 font-semibold">
              <FlowerPetal size={15} />
              <span>Includes physical printable templates &amp; manipulatives guide</span>
            </div>
            <div className="flex items-center gap-2 font-semibold">
              <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
              <span>Built following DPDP Act 2023 principles</span>
            </div>
          </div>
        </div>

        {/* Right Column: Form or Confirmation Card */}
        <div className="lg:col-span-7">
          {pilotSuccess ? (
            <div className="rounded-[28px] border-2 border-[#6CA24A]/40 p-6 sm:p-8 bg-[#FFF7E6] dark:bg-[#1C2817] text-center space-y-4 shadow-card animate-in fade-in zoom-in-95 duration-300">
              <SuccessIllustration className="w-20 h-16 mx-auto mb-2" />
              
              <div className="text-xs font-sans uppercase tracking-widest text-primary font-bold">
                Registration Confirmed
              </div>

              <h3 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
                School Pilot Request Received
              </h3>

              {pilotReferenceId && (
                <div className="inline-block px-4 py-1.5 rounded-full bg-[#C7DDAE]/40 border border-[#6CA24A]/40 font-mono text-xs text-foreground font-bold">
                  Reference ID: {pilotReferenceId}
                </div>
              )}

              <p className="text-xs sm:text-sm text-foreground/80 max-w-md mx-auto leading-relaxed font-sans">
                {pilotSuccess} Our academic team will verify school details and contact you to provision classroom diagnostic materials and printable worksheets.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/assessment"
                  className="rounded-full min-h-[46px] px-6 bg-accent text-accent-foreground text-xs font-sans uppercase font-bold inline-flex items-center justify-center gap-2 shadow-warm hover:bg-accent/90 transition-transform active:scale-95"
                >
                  <span>Assess Test (Start Assessment)</span>
                  <ArrowRight size={14} weight="bold" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setPilotSuccess(null);
                    setPilotReferenceId(null);
                  }}
                  className="rounded-full min-h-[46px] px-5 border border-[#C7DDAE] bg-transparent text-foreground text-xs font-sans uppercase font-bold hover:bg-[#C7DDAE]/30 transition-colors cursor-pointer"
                >
                  Submit Another Request
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePilotSubmit} noValidate className="rounded-[28px] border-2 border-[#C7DDAE] p-6 sm:p-8 bg-[#FFF7E6] dark:bg-[#1C2817] space-y-4 shadow-card">
              {/* Bot Honeypot */}
              <input
                type="text"
                name="school_url_confirm"
                value={pilotHoneypot}
                onChange={(e) => setPilotHoneypot(e.target.value)}
                className="sr-only"
                tabIndex={-1}
                autoComplete="off"
                aria-label="Security check, leave blank"
              />

              {/* School Name */}
              <div>
                <label htmlFor={schoolInputId} className="block text-xs font-sans uppercase text-muted-foreground mb-1.5 font-bold">
                  School Name *
                </label>
                <input
                  id={schoolInputId}
                  type="text"
                  required
                  value={pilotSchool}
                  onChange={(e) => {
                    setPilotSchool(e.target.value);
                    if (pilotFieldErrors.school) setPilotFieldErrors((prev) => ({ ...prev, school: undefined }));
                  }}
                  placeholder="e.g. MPPS Gandhi Nagar"
                  aria-invalid={!!pilotFieldErrors.school}
                  className={`w-full min-h-[46px] px-4 rounded-[14px] border bg-white dark:bg-[#162012] text-xs sm:text-sm font-sans ${
                    pilotFieldErrors.school
                      ? 'border-accent ring-1 ring-accent'
                      : 'border-[#C7DDAE] focus:border-primary'
                  }`}
                />
                {pilotFieldErrors.school && (
                  <p className="text-xs font-sans text-accent mt-1">{pilotFieldErrors.school}</p>
                )}
              </div>

              {/* Teacher Name */}
              <div>
                <label htmlFor={teacherInputId} className="block text-xs font-sans uppercase text-muted-foreground mb-1.5 font-bold">
                  Teacher or Headmaster Name *
                </label>
                <input
                  id={teacherInputId}
                  type="text"
                  required
                  value={pilotTeacher}
                  onChange={(e) => {
                    setPilotTeacher(e.target.value);
                    if (pilotFieldErrors.teacher) setPilotFieldErrors((prev) => ({ ...prev, teacher: undefined }));
                  }}
                  placeholder="e.g. Smt. Lakshmi Rao"
                  aria-invalid={!!pilotFieldErrors.teacher}
                  className={`w-full min-h-[46px] px-4 rounded-[14px] border bg-white dark:bg-[#162012] text-xs sm:text-sm font-sans ${
                    pilotFieldErrors.teacher
                      ? 'border-accent ring-1 ring-accent'
                      : 'border-[#C7DDAE] focus:border-primary'
                  }`}
                />
                {pilotFieldErrors.teacher && (
                  <p className="text-xs font-sans text-accent mt-1">{pilotFieldErrors.teacher}</p>
                )}
              </div>

              {/* Class Range */}
              <div>
                <label htmlFor={classRangeInputId} className="block text-xs font-sans uppercase text-muted-foreground mb-1.5 font-bold">
                  Class Range *
                </label>
                <select
                  id={classRangeInputId}
                  value={pilotClassRange}
                  onChange={(e) => setPilotClassRange(e.target.value)}
                  className="w-full min-h-[46px] px-4 rounded-[14px] border border-[#C7DDAE] bg-white dark:bg-[#162012] text-xs sm:text-sm font-sans"
                >
                  <option value="Classes 1 to 10">All Classes (Classes 1 to 10)</option>
                  <option value="Primary (Classes 1 to 5)">Primary Stage (Classes 1 to 5)</option>
                  <option value="Middle (Classes 6 to 8)">Middle Stage (Classes 6 to 8)</option>
                  <option value="Secondary (Classes 9 to 10)">Secondary Stage (Classes 9 to 10)</option>
                  <option value="Classes 3 to 5">Classes 3 to 5</option>
                </select>
              </div>

              {/* Contact */}
              <div>
                <label htmlFor={contactInputId} className="block text-xs font-sans uppercase text-muted-foreground mb-1.5 font-bold">
                  Teacher Contact (Phone or Email) *
                </label>
                <input
                  id={contactInputId}
                  type="text"
                  required
                  value={pilotContact}
                  onChange={(e) => {
                    setPilotContact(e.target.value);
                    if (pilotFieldErrors.contact) setPilotFieldErrors((prev) => ({ ...prev, contact: undefined }));
                  }}
                  placeholder="e.g. 9876543210 or teacher@school.edu"
                  aria-invalid={!!pilotFieldErrors.contact}
                  className={`w-full min-h-[46px] px-4 rounded-[14px] border bg-white dark:bg-[#162012] text-xs sm:text-sm font-sans ${
                    pilotFieldErrors.contact
                      ? 'border-accent ring-1 ring-accent'
                      : 'border-[#C7DDAE] focus:border-primary'
                  }`}
                />
                {pilotFieldErrors.contact && (
                  <p className="text-xs font-sans text-accent mt-1">{pilotFieldErrors.contact}</p>
                )}
              </div>

              {/* Privacy Consent */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  id={consentInputId}
                  type="checkbox"
                  required
                  checked={pilotConsent}
                  onChange={(e) => {
                    setPilotConsent(e.target.checked);
                    if (pilotFieldErrors.consent) setPilotFieldErrors((prev) => ({ ...prev, consent: undefined }));
                  }}
                  className="mt-1 accent-primary"
                />
                <label htmlFor={consentInputId} className="text-xs text-muted-foreground leading-tight font-sans">
                  I agree that this contact will be used strictly for school pilot onboarding in accordance with our{' '}
                  <Link href="/privacy" className="underline text-primary hover:text-primary/80 font-semibold">
                    Privacy Policy
                  </Link>.
                </label>
              </div>
              {pilotFieldErrors.consent && (
                <p className="text-xs font-sans text-accent">{pilotFieldErrors.consent}</p>
              )}

              {/* General / Network Error */}
              {pilotError && (
                <div className="p-3.5 rounded-[14px] border border-accent bg-accent/10 text-accent text-xs font-sans" role="alert">
                  {pilotError}
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="submit"
                  disabled={pilotLoading}
                  className="w-full sm:w-auto min-h-[46px] px-7 rounded-full bg-accent text-accent-foreground text-xs font-sans uppercase font-bold hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-warm focus-visible:outline-2 focus-visible:outline-ring flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                  {pilotLoading && (
                    <span className="w-3.5 h-3.5 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin"></span>
                  )}
                  <span>{pilotLoading ? 'Submitting...' : 'Submit Pilot Request'}</span>
                </button>
                <span className="text-xs text-muted-foreground font-sans">
                  Built following DPDP Act 2023 principles &bull; Masked storage
                </span>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
