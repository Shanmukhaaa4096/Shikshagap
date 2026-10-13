'use client';

import React, { useState, useId } from 'react';
import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react';
import { SuccessIllustration } from '@/components/illustrations/StateIllustrations';

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
    <section id="pilot" className="border-b border-[#432623]/25 px-4 sm:px-8 py-12 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Letter to School Leaders */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-[#432623]/70 dark:text-[#FAF8E8]/70">
            <span className="text-[#DE2A35] font-bold">07</span>
            <span>/</span>
            <span>FIELD PARTNERSHIPS</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-4xl font-normal text-[#432623] dark:text-[#FAF8E8]">
            Request a Classroom Pilot
          </h2>
          <p className="text-sm text-[#432623]/80 dark:text-[#FAF8E8]/80 leading-relaxed">
            Government primary schools, headmasters, and cluster resource persons can request dedicated classroom onboarding support.
          </p>
          <div className="border-l-2 border-[#8ABB93] pl-4 py-2 space-y-2 text-sm font-mono text-[#432623]/70 dark:text-[#FAF8E8]/70">
            <div>Zero license fee for public schools.</div>
            <div>Includes physical printable templates.</div>
            <div>Built following DPDP Act 2023 principles.</div>
          </div>
        </div>

        {/* Right Column: Form or Confirmation Card */}
        <div className="lg:col-span-7">
          {pilotSuccess ? (
            <div className="border-2 border-[#8ABB93] p-6 sm:p-8 bg-[#FAF8E8] dark:bg-[#251614] text-center space-y-4 shadow-sm animate-in fade-in zoom-in-95 duration-300">
              <SuccessIllustration className="w-20 h-16 mx-auto mb-2" />
              
              <div className="text-sm font-mono uppercase tracking-widest text-[#432623] dark:text-[#FAF8E8] font-bold">
                Registration Confirmed
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#432623] dark:text-[#FAF8E8]">
                School Pilot Request Received
              </h3>

              {pilotReferenceId && (
                <div className="inline-block px-3 py-1 bg-[#8ABB93]/15 border border-[#8ABB93] font-mono text-sm text-[#432623] dark:text-[#FAF8E8] font-bold">
                  Reference ID: {pilotReferenceId}
                </div>
              )}

              <p className="text-sm text-[#432623]/80 dark:text-[#FAF8E8]/80 max-w-md mx-auto leading-relaxed">
                {pilotSuccess} Our academic team will verify school details and contact you to provision classroom diagnostic materials and printable worksheets.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/app"
                  className="w-full sm:w-auto min-h-[44px] px-6 bg-[#DE2A35] text-[#FAF8E8] text-sm font-mono uppercase font-bold inline-flex items-center justify-center gap-2 hover:bg-[#B51E28] transition-colors"
                >
                  <span>Assess Test (Start Assessment)</span>
                  <ArrowRight size={14} />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setPilotSuccess(null);
                    setPilotReferenceId(null);
                  }}
                  className="w-full sm:w-auto min-h-[44px] px-4 border border-[#432623]/30 dark:border-[#FAF8E8]/30 bg-transparent text-[#432623] dark:text-[#FAF8E8] text-sm font-mono uppercase hover:bg-[#F5F1BC] dark:hover:bg-[#311E1B] transition-colors cursor-pointer"
                >
                  Submit Another Request
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePilotSubmit} noValidate className="border-2 border-[#432623]/25 p-6 bg-[#FAF8E8] dark:bg-[#251614] space-y-4 shadow-xs">
              {/* Bot Honeypot */}
              <input
                type="text"
                name="school_url_confirm"
                value={pilotHoneypot}
                onChange={(e) => setPilotHoneypot(e.target.value)}
                className="sr-only"
                tabIndex={-1}
                autoComplete="off"
              />

              {/* School Name */}
              <div>
                <label htmlFor={schoolInputId} className="block text-sm font-mono uppercase text-[#432623]/70 dark:text-[#FAF8E8]/70 mb-1 font-bold">
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
                  className={`w-full min-h-[44px] px-3 border bg-[#FAF8E8] dark:bg-[#251614] text-sm font-mono ${
                    pilotFieldErrors.school
                      ? 'border-[#DE2A35] ring-1 ring-[#DE2A35]'
                      : 'border-[#432623]/25 focus:border-[#DE2A35]'
                  }`}
                />
                {pilotFieldErrors.school && (
                  <p className="text-sm font-mono text-[#B51E28] mt-1">{pilotFieldErrors.school}</p>
                )}
              </div>

              {/* Teacher Name */}
              <div>
                <label htmlFor={teacherInputId} className="block text-sm font-mono uppercase text-[#432623]/70 dark:text-[#FAF8E8]/70 mb-1 font-bold">
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
                  className={`w-full min-h-[44px] px-3 border bg-[#FAF8E8] dark:bg-[#251614] text-sm font-mono ${
                    pilotFieldErrors.teacher
                      ? 'border-[#DE2A35] ring-1 ring-[#DE2A35]'
                      : 'border-[#432623]/25 focus:border-[#DE2A35]'
                  }`}
                />
                {pilotFieldErrors.teacher && (
                  <p className="text-sm font-mono text-[#B51E28] mt-1">{pilotFieldErrors.teacher}</p>
                )}
              </div>

              {/* Class Range */}
              <div>
                <label htmlFor={classRangeInputId} className="block text-sm font-mono uppercase text-[#432623]/70 dark:text-[#FAF8E8]/70 mb-1 font-bold">
                  Class Range *
                </label>
                <select
                  id={classRangeInputId}
                  value={pilotClassRange}
                  onChange={(e) => setPilotClassRange(e.target.value)}
                  className="w-full min-h-[44px] px-3 border border-[#432623]/25 bg-[#FAF8E8] dark:bg-[#251614] text-sm font-mono"
                >
                  <option value="Classes 3 to 5">Classes 3 to 5 (Full support)</option>
                  <option value="Class 3">Class 3 only</option>
                  <option value="Class 4">Class 4 only</option>
                  <option value="Class 5">Class 5 only</option>
                  <option value="All Primary (Classes 1 to 5)">All Primary (Classes 1 to 5)</option>
                </select>
              </div>

              {/* Contact */}
              <div>
                <label htmlFor={contactInputId} className="block text-sm font-mono uppercase text-[#432623]/70 dark:text-[#FAF8E8]/70 mb-1 font-bold">
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
                  className={`w-full min-h-[44px] px-3 border bg-[#FAF8E8] dark:bg-[#251614] text-sm font-mono ${
                    pilotFieldErrors.contact
                      ? 'border-[#DE2A35] ring-1 ring-[#DE2A35]'
                      : 'border-[#432623]/25 focus:border-[#DE2A35]'
                  }`}
                />
                {pilotFieldErrors.contact && (
                  <p className="text-sm font-mono text-[#B51E28] mt-1">{pilotFieldErrors.contact}</p>
                )}
              </div>

              {/* Privacy Consent */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  id={consentInputId}
                  type="checkbox"
                  required
                  checked={pilotConsent}
                  onChange={(e) => {
                    setPilotConsent(e.target.checked);
                    if (pilotFieldErrors.consent) setPilotFieldErrors((prev) => ({ ...prev, consent: undefined }));
                  }}
                  className="mt-1"
                />
                <label htmlFor={consentInputId} className="text-sm text-[#432623]/70 dark:text-[#FAF8E8]/70 leading-tight">
                  I agree that this contact will be used strictly for school pilot onboarding in accordance with our{' '}
                  <Link href="/privacy" className="underline hover:text-[#432623] dark:hover:text-[#FAF8E8]">
                    Privacy Policy
                  </Link>.
                </label>
              </div>
              {pilotFieldErrors.consent && (
                <p className="text-sm font-mono text-[#B51E28]">{pilotFieldErrors.consent}</p>
              )}

              {/* General / Network Error */}
              {pilotError && (
                <div className="p-3 border border-[#DE2A35] bg-[#DE2A35]/15 text-[#B51E28] text-sm font-mono" role="alert">
                  {pilotError}
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="submit"
                  disabled={pilotLoading}
                  className="w-full sm:w-auto min-h-[44px] px-6 bg-[#DE2A35] text-[#FAF8E8] text-sm font-mono uppercase font-bold hover:bg-[#B51E28] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs focus-visible:outline-2 focus-visible:outline-[#DE2A35] flex items-center justify-center gap-2"
                >
                  {pilotLoading && (
                    <span className="w-3.5 h-3.5 border-2 border-[#FAF8E8] border-t-transparent rounded-full animate-spin"></span>
                  )}
                  <span>{pilotLoading ? 'Submitting...' : 'Submit Pilot Request'}</span>
                </button>
                <span className="text-sm text-[#432623]/60 dark:text-[#FAF8E8]/60 font-mono">
                  DPDP 2023 protected : Masked storage
                </span>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
