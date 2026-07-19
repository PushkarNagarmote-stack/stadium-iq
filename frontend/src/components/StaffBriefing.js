import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import jsPDF from 'jspdf';
import { CSRF_HEADERS } from '../api';

const ROLES = ['Security Officer', 'Crowd Marshal', 'Medical Staff', 'Volunteer Coordinator', 'Gate Staff', 'VIP Host', 'Operations Manager', 'Transport Coordinator'];
const VENUES_LIST = ['MetLife Stadium, NJ', 'AT&T Stadium, TX', 'SoFi Stadium, CA', 'Estadio Azteca, Mexico City', 'BC Place, Vancouver', "Levi's Stadium, CA"];
const SHIFTS = ['Morning (06:00–14:00)', 'Afternoon (14:00–22:00)', 'Evening (18:00–02:00)', 'Match Day Full Shift', 'Pre-match Only', 'Post-match Only'];

function StaffBriefing({ api }) {
  const [role, setRole] = useState('');
  const [venue, setVenue] = useState('');
  const [shift, setShift] = useState('');
  const [specialEvents, setSpecialEvents] = useState('');
  const [briefing, setBriefing] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = useCallback(async () => {
    setError('');
    setBriefing('');
    if (!role || !venue || !shift) { setError('Please select a role, venue, and shift.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${api}/api/briefing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...CSRF_HEADERS },
        credentials: 'include',
        body: JSON.stringify({ role, venue, shift, special_events: specialEvents }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong.'); setLoading(false); return; }
      setBriefing(data.briefing);
    } catch {
      setError('Could not connect to server. Please try again.');
    }
    setLoading(false);
  }, [role, venue, shift, specialEvents, api]);

  const briefingLines = useMemo(
    () => (briefing ? briefing.split('\n').map((l) => l.trim()).filter(Boolean) : []),
    [briefing]
  );

  const handleSavePdf = useCallback(() => {
    const doc = new jsPDF();
    const marginX = 15;
    let y = 20;

    doc.setFontSize(18);
    doc.text('StadiumIQ Staff Briefing', marginX, y);
    y += 10;

    doc.setFontSize(11);
    doc.text(`Role: ${role}`, marginX, y);
    y += 7;
    doc.text(`Venue: ${venue}`, marginX, y);
    y += 7;
    doc.text(`Shift: ${shift}`, marginX, y);
    y += 12;

    doc.setFontSize(13);
    doc.text('Key Directives', marginX, y);
    y += 8;

    doc.setFontSize(11);
    const pageWidth = doc.internal.pageSize.getWidth() - marginX * 2;
    briefingLines.forEach((line) => {
      const wrapped = doc.splitTextToSize(`• ${line}`, pageWidth);
      wrapped.forEach((wLine) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(wLine, marginX, y);
        y += 7;
      });
    });

    const safeVenue = venue.replace(/[^a-z0-9]/gi, '-');
    doc.save(`briefing-${safeVenue}.pdf`);
  }, [role, venue, shift, briefingLines]);

  return (
    <main className="flex-grow p-container-margin w-full max-w-4xl mx-auto flex flex-col gap-lg">
      <header>
        <h2 className="font-headline-xl text-headline-xl text-on-surface">Staff Briefing Generator</h2>
        <p className="text-on-surface-variant mt-base">Configure role-specific intel and operational parameters for match-day deployments.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-md">
        <section className="md:col-span-5 glass-card rounded-xl p-md flex flex-col gap-sm">
          <div className="flex flex-col gap-base">
            <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="staff-role">Role</label>
            <div className="relative">
              <select
                id="staff-role"
                className="w-full bg-black border border-outline rounded-lg px-sm py-xs text-on-surface focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed appearance-none"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="">Select role...</option>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
            </div>
          </div>

          <div className="flex flex-col gap-base">
            <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="staff-venue">Venue</label>
            <div className="relative">
              <select
                id="staff-venue"
                className="w-full bg-black border border-outline rounded-lg px-sm py-xs text-on-surface focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed appearance-none"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
              >
                <option value="">Select venue...</option>
                {VENUES_LIST.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
            </div>
          </div>

          <div className="flex flex-col gap-base">
            <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="staff-shift">Shift</label>
            <div className="relative">
              <select
                id="staff-shift"
                className="w-full bg-black border border-outline rounded-lg px-sm py-xs text-on-surface focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed appearance-none"
                value={shift}
                onChange={(e) => setShift(e.target.value)}
              >
                <option value="">Select shift...</option>
                {SHIFTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
            </div>
          </div>

          <div className="flex flex-col gap-base">
            <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="special-events">Special Notes</label>
            <textarea
              id="special-events"
              className="w-full bg-black border border-outline rounded-lg px-sm py-xs text-on-surface focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed resize-none"
              rows={3}
              maxLength={500}
              placeholder="e.g. VIP arrival, extra security..."
              value={specialEvents}
              onChange={(e) => setSpecialEvents(e.target.value)}
            />
          </div>

          {error && (
            <div role="alert" aria-live="assertive" className="bg-error-container/20 border border-error/30 rounded-lg p-3 text-error font-body-md text-sm">
              {error}
            </div>
          )}

          <button
            className="mt-sm w-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm py-sm rounded-lg flex items-center justify-center gap-xs hover:bg-secondary-fixed-dim transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={handleGenerate}
            disabled={loading}
            aria-busy={loading}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">assignment</span>
            {loading ? 'Generating briefing...' : 'Generate My Briefing'}
          </button>
        </section>

        <section className="md:col-span-7 glass-card rounded-xl p-md flex flex-col gap-md relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-secondary-fixed opacity-10 blur-[50px] rounded-full pointer-events-none" />

          {loading && (
            <div className="flex flex-col gap-sm animate-pulse relative z-10">
              <div className="h-6 w-1/2 bg-surface-variant rounded" />
              <div className="h-4 w-1/3 bg-surface-variant rounded" />
              <div className="flex flex-col gap-xs mt-sm">
                <div className="h-10 bg-surface-container/50 rounded-lg" />
                <div className="h-10 bg-surface-container/50 rounded-lg" />
                <div className="h-10 bg-surface-container/50 rounded-lg" />
              </div>
            </div>
          )}

          {!loading && !briefing && (
            <div className="flex flex-col items-center justify-center text-center gap-sm py-xl relative z-10 border border-dashed border-white/10 rounded-lg h-full">
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant/50">shield_person</span>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">
                Fill in the role, venue, and shift, then generate a briefing to see it here.
              </p>
            </div>
          )}

          {!loading && briefing && (
            <>
              <div className="flex items-start justify-between border-b border-white/10 pb-sm relative z-10">
                <div>
                  <div className="flex items-center gap-xs mb-base">
                    <span className="material-symbols-outlined text-secondary-fixed">shield_person</span>
                    <h3 className="font-headline-md text-headline-md text-on-surface">{role}</h3>
                  </div>
                  <p className="text-on-surface-variant font-label-sm text-label-sm">{venue} • {shift}</p>
                </div>
                <span className="bg-secondary-fixed/10 text-secondary-fixed border border-secondary-fixed/30 px-xs py-[2px] rounded-full font-label-sm text-label-sm">
                  AI Generated
                </span>
              </div>

              <div className="flex flex-col gap-sm flex-grow relative z-10">
                <h4 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Key Directives</h4>
                <ul className="flex flex-col gap-xs">
                  {briefingLines.map((line, i) => (
                    <li key={i} className="flex items-start gap-sm bg-surface-container/50 p-sm rounded-lg border border-white/5">
                      <span className="material-symbols-outlined text-secondary-fixed text-[20px] mt-[2px]">check_circle</span>
                      <span className="text-on-surface">{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-end gap-sm mt-auto pt-sm border-t border-white/10 relative z-10">
                <button
                  className="px-sm py-xs border border-outline rounded-lg text-on-surface font-label-sm text-label-sm flex items-center gap-xs hover:bg-surface-variant transition-colors"
                  onClick={handleSavePdf}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  Save PDF
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

StaffBriefing.propTypes = {
  api: PropTypes.string.isRequired,
};

export default StaffBriefing;