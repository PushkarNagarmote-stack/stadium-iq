import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

function MatchCard({ match }) {
  const isFinal = match.status === 'Final';
  return (
    <div className="glass-card rounded-xl p-md flex flex-col gap-sm">
      <div className="flex justify-between items-center">
        <span
          className={
            isFinal
              ? 'font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-variant/60 text-on-surface-variant uppercase tracking-wider'
              : 'font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-secondary-fixed/10 border border-secondary-fixed/30 text-secondary-fixed uppercase tracking-wider'
          }
        >
          {isFinal ? 'Final' : 'Scheduled'}
        </span>
        {match.round && (
          <span className="font-label-sm text-label-sm text-on-surface-variant">Round {match.round}</span>
        )}
      </div>

      <div className="flex items-center justify-between gap-sm">
        <span className="font-headline-md text-headline-md text-on-surface text-right flex-1 truncate">
          {match.home_team}
        </span>
        <span className="font-headline-lg-mobile text-headline-lg-mobile text-secondary-fixed px-sm shrink-0">
          {isFinal ? `${match.home_score} – ${match.away_score}` : 'vs'}
        </span>
        <span className="font-headline-md text-headline-md text-on-surface flex-1 truncate">
          {match.away_team}
        </span>
      </div>

      <div className="flex items-center justify-center gap-md text-on-surface-variant font-label-sm text-label-sm pt-xs border-t border-white/10 mt-xs">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">calendar_month</span>
          {match.date}{match.time ? ` • ${match.time.slice(0, 5)}` : ''}
        </span>
        {match.venue && (
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">location_on</span>
            {match.venue}
          </span>
        )}
      </div>
    </div>
  );
}

MatchCard.propTypes = {
  match: PropTypes.shape({
    home_team: PropTypes.string,
    away_team: PropTypes.string,
    home_score: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    away_score: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    date: PropTypes.string,
    time: PropTypes.string,
    venue: PropTypes.string,
    status: PropTypes.string,
    round: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
};

function MatchSchedule({ api }) {
  const [upcoming, setUpcoming] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${api}/api/schedule`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Could not load the schedule.'); setLoading(false); return; }
      setUpcoming(data.upcoming || []);
      setRecent(data.recent || []);
    } catch {
      setError('Could not connect to server. Please try again.');
    }
    setLoading(false);
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="flex-grow px-container-margin py-lg max-w-4xl mx-auto w-full flex flex-col gap-lg">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface">Match Schedule</h1>
          <p className="text-on-surface-variant font-body-md mt-base">FIFA World Cup 2026 fixtures and results.</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="bg-surface-container/60 border border-white/10 rounded-full p-2 text-on-surface-variant hover:text-secondary-fixed hover:border-secondary-fixed/40 transition-colors disabled:opacity-50"
          aria-label="Refresh schedule"
          type="button"
        >
          <span className={`material-symbols-outlined text-[20px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
        </button>
      </header>

      {error && (
        <div role="alert" aria-live="assertive" className="bg-error-container/20 border border-error/30 rounded-lg p-3 text-error font-body-md text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex flex-col gap-sm animate-pulse">
          <div className="h-32 bg-surface-container/50 rounded-xl" />
          <div className="h-32 bg-surface-container/50 rounded-xl" />
        </div>
      )}

      {!loading && !error && (
        <>
          <section className="flex flex-col gap-sm">
            <h2 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
              Upcoming Fixtures
            </h2>
            {upcoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center gap-sm py-lg border border-dashed border-white/10 rounded-lg">
                <span className="material-symbols-outlined text-[32px] text-on-surface-variant/50">event_busy</span>
                <p className="font-body-md text-body-md text-on-surface-variant">No upcoming fixtures right now.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
                {upcoming.map((m) => <MatchCard key={m.id} match={m} />)}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-sm">
            <h2 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
              Recent Results
            </h2>
            {recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center gap-sm py-lg border border-dashed border-white/10 rounded-lg">
                <span className="material-symbols-outlined text-[32px] text-on-surface-variant/50">history</span>
                <p className="font-body-md text-body-md text-on-surface-variant">No recent results yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
                {recent.map((m) => <MatchCard key={m.id} match={m} />)}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

MatchSchedule.propTypes = {
  api: PropTypes.string.isRequired,
};

export default MatchSchedule;