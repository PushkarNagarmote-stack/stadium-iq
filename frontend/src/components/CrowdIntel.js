import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { CSRF_HEADERS } from '../api';

const VENUES_LIST = ['MetLife Stadium, NJ', 'AT&T Stadium, TX', 'SoFi Stadium, CA', 'Estadio Azteca, Mexico City', 'BC Place, Vancouver', "Levi's Stadium, CA"];
const ZONES_MAP = {
  'MetLife Stadium, NJ': ['North', 'South', 'East', 'West', 'VIP', 'Media', 'Concourse A', 'Concourse B'],
  'AT&T Stadium, TX': ['North', 'South', 'East', 'West', 'Club', 'Suite', 'Concourse 1', 'Concourse 2'],
  'SoFi Stadium, CA': ['100s', '200s', '300s', 'Field Level', 'Club', 'Concourse'],
  'Estadio Azteca, Mexico City': ['Norte', 'Sur', 'Oriente', 'Poniente', 'VIP'],
  'BC Place, Vancouver': ['Lower Bowl', 'Upper Bowl', 'Club', 'Suite', 'Concourse'],
  "Levi's Stadium, CA": ['North', 'South', 'East', 'West', 'Club', 'Suite'],
};

const getDensityConfig = (level) => {
  if (level <= 3) return { color: '#c3f400', bg: 'rgba(195,244,0,0.10)', border: 'rgba(195,244,0,0.4)', label: 'Low' };
  if (level <= 6) return { color: '#fcd34d', bg: 'rgba(252,211,77,0.10)', border: 'rgba(252,211,77,0.4)', label: 'Moderate' };
  if (level <= 8) return { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.5)', label: 'High' };
  return { color: '#ef4444', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.5)', label: 'Critical' };
};

function CrowdIntel({ api }) {
  const [venue, setVenue] = useState('');
  const [zone, setZone] = useState('');
  const [crowdLevel, setCrowdLevel] = useState(5);
  const [incident, setIncident] = useState('');
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);

  const config = getDensityConfig(crowdLevel);
  const availableZones = venue ? (ZONES_MAP[venue] || []) : [];

  const handleVenueChange = useCallback((v) => {
    setVenue(v);
    setZone('');
    setAdvice(null);
  }, []);

  const handleAcknowledge = useCallback(() => {
    setAcknowledged(true);
    setTimeout(() => {
      setAdvice(null);
      setAcknowledged(false);
    }, 1200);
  }, []);

  const handleGetAdvice = useCallback(async () => {
    setError('');
    setAdvice(null);
    if (!venue || !zone) { setError('Please select a venue and zone.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${api}/api/crowd-advice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...CSRF_HEADERS },
        credentials: 'include',
        body: JSON.stringify({ venue, zone, crowd_level: crowdLevel, incident }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong.'); setLoading(false); return; }
      setAdvice(data);
    } catch {
      setError('Could not connect to server. Please try again.');
    }
    setLoading(false);
  }, [venue, zone, crowdLevel, incident, api]);

  return (
    <main className="flex-grow w-full max-w-7xl mx-auto px-container-margin py-lg pb-32 bg-stadium-pattern relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary-fixed/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

      <div className="mb-lg">
        <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight mb-2">Crowd Intelligence</h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">Real-time density monitoring and AI-driven crowd control recommendations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-md">
        <div className="lg:col-span-5 flex flex-col gap-md">
          <div className="glass-panel rounded-xl p-md flex flex-col gap-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-surface-variant" />
            <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary-fixed">tune</span>
              Parameters
            </h2>

            <div className="flex flex-col gap-xs">
              <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider" htmlFor="crowd-venue">Venue</label>
              <div className="relative">
                <select
                  id="crowd-venue"
                  className="w-full bg-[#000000] border border-outline rounded-lg px-4 py-3 text-on-surface font-body-md appearance-none focus:outline-none focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed transition-all"
                  value={venue}
                  onChange={(e) => handleVenueChange(e.target.value)}
                >
                  <option value="">Select venue...</option>
                  {VENUES_LIST.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                  <span className="material-symbols-outlined text-on-surface-variant">expand_more</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider" htmlFor="crowd-zone">Zone</label>
              <div className="relative">
                <select
                  id="crowd-zone"
                  className="w-full bg-[#000000] border border-outline rounded-lg px-4 py-3 text-on-surface font-body-md appearance-none focus:outline-none focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed transition-all disabled:opacity-50"
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  disabled={!venue}
                >
                  <option value="">Select zone...</option>
                  {availableZones.map((z) => <option key={z} value={z}>{z}</option>)}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                  <span className="material-symbols-outlined text-on-surface-variant">expand_more</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-sm mt-4">
              <div className="flex justify-between items-end">
                <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider" htmlFor="crowd-level">Crowd Density</label>
                <span
                  className="px-3 py-1 rounded-full font-label-sm text-label-sm flex items-center gap-1"
                  style={{ color: config.color, background: config.bg, border: `1px solid ${config.border}` }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: config.color }} />
                  {crowdLevel}/10 — {config.label}
                </span>
              </div>
              <div className="py-4">
                <input
                  id="crowd-level"
                  type="range"
                  min={1}
                  max={10}
                  value={crowdLevel}
                  onChange={(e) => setCrowdLevel(Number(e.target.value))}
                  aria-valuemin={1}
                  aria-valuemax={10}
                  aria-valuenow={crowdLevel}
                  aria-valuetext={`${crowdLevel} out of 10, ${config.label} crowd density`}
                  className="w-full"
                />
                <div className="flex justify-between mt-2 font-label-sm text-label-sm text-on-surface-variant opacity-60">
                  <span>Low</span>
                  <span>Critical</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider" htmlFor="crowd-incident">Active Incident</label>
              <input
                id="crowd-incident"
                type="text"
                className="w-full bg-[#000000] border border-outline rounded-lg px-4 py-3 text-on-surface font-body-md focus:outline-none focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed transition-all"
                value={incident}
                onChange={(e) => setIncident(e.target.value)}
                maxLength={500}
                placeholder="e.g. Medical emergency at Gate B..."
              />
            </div>

            {error && (
              <div role="alert" aria-live="assertive" className="bg-error-container/20 border border-error/30 rounded-lg p-3 text-error font-body-md text-sm">
                {error}
              </div>
            )}

            <button
              className="mt-4 w-full py-4 rounded-lg font-label-sm text-label-sm uppercase tracking-wider font-bold transition-colors flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: config.color, color: '#081425', boxShadow: `0 0 15px ${config.color}66` }}
              onClick={handleGetAdvice}
              disabled={loading}
              aria-busy={loading}
              type="button"
            >
              <span className="material-symbols-outlined text-lg">sync</span>
              {loading ? 'Analyzing crowd data...' : 'Update Status'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col gap-md h-full">
          <div
            className="glass-panel rounded-xl h-full flex flex-col overflow-hidden relative"
            style={advice ? { border: `1px solid ${config.border}`, boxShadow: `0 0 20px ${config.bg}` } : undefined}
          >
            {loading && (
              <div className="p-md flex flex-col gap-md animate-pulse">
                <div className="h-6 w-1/2 bg-surface-variant rounded" />
                <div className="h-40 bg-surface-container/50 rounded-lg" />
                <div className="h-16 bg-surface-container/50 rounded-lg" />
              </div>
            )}

            {!loading && !advice && (
              <div className="flex-grow flex flex-col items-center justify-center text-center gap-sm p-md border border-dashed border-white/10 rounded-lg m-md">
                <span className="material-symbols-outlined text-[40px] text-on-surface-variant/50">analytics</span>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">
                  Select a venue, zone, and density level, then update status to see AI recommendations here.
                </p>
              </div>
            )}

            {!loading && advice && (
              <>
                <div className="p-md border-b" style={{ background: config.bg, borderColor: config.border }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-label-sm text-label-sm uppercase tracking-wider mb-1 flex items-center gap-2" style={{ color: config.color }}>
                        <span className="material-symbols-outlined text-base">warning</span>
                        {config.label === 'Critical' || config.label === 'High' ? 'Action Required' : 'Status Update'}
                      </div>
                      <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{advice.zone}</h3>
                    </div>
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl"
                      style={{ background: config.color, color: '#081425', boxShadow: `0 0 15px ${config.color}99` }}
                    >
                      {advice.crowd_level}
                    </div>
                  </div>
                </div>

                <div className="p-md flex-grow flex flex-col gap-lg">
                  <div>
                    <h4 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">AI Recommendation</h4>
                    <div className="bg-surface-container-high rounded-lg p-4 border border-outline-variant">
                      <p className="font-body-lg text-body-lg text-on-surface leading-relaxed whitespace-pre-wrap">
                        {advice.advice}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto grid grid-cols-2 gap-4">
                    <button
                      className="bg-transparent border border-outline text-on-surface py-3 rounded-lg font-label-sm text-label-sm uppercase tracking-wider font-bold hover:bg-surface-variant transition-colors"
                      onClick={() => setAdvice(null)}
                      type="button"
                    >
                      Dismiss
                    </button>
                    <button
                      className="text-black py-3 rounded-lg font-label-sm text-label-sm uppercase tracking-wider font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                      style={{ background: config.color, boxShadow: `0 0 15px ${config.color}66` }}
                      onClick={handleAcknowledge}
                      disabled={acknowledged}
                      type="button"
                    >
                      {acknowledged ? (
                        <>
                          <span className="material-symbols-outlined text-lg">check</span>
                          Acknowledged
                        </>
                      ) : (
                        'Acknowledge'
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

CrowdIntel.propTypes = {
  api: PropTypes.string.isRequired,
};

export default CrowdIntel;