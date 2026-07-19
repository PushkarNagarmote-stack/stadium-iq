import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import venues from '../data/venues';

const COUNTRIES = [
  { code: 'All', label: 'All', flag: null },
  { code: 'USA', label: 'USA', flag: '🇺🇸' },
  { code: 'Mexico', label: 'Mexico', flag: '🇲🇽' },
  { code: 'Canada', label: 'Canada', flag: '🇨🇦' },
];

function badgeClasses(badge) {
  if (badge === 'Final') {
    return 'bg-error/10 border border-error text-error px-2 py-1 rounded-full font-label-sm text-label-sm backdrop-blur-md';
  }
  return 'bg-secondary-fixed/10 border border-secondary-fixed text-secondary-fixed px-2 py-1 rounded-full font-label-sm text-label-sm backdrop-blur-md';
}

function VenuesExplorer() {
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('All');

  const filtered = useMemo(() => {
    return venues.filter((v) => {
      const matchesCountry = country === 'All' || v.country === country;
      const matchesSearch =
        search.trim() === '' ||
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.city.toLowerCase().includes(search.toLowerCase());
      return matchesCountry && matchesSearch;
    });
  }, [search, country]);

  return (
    <main className="flex-grow px-container-margin py-lg max-w-7xl mx-auto w-full relative z-10 bg-pattern">
      <div className="mb-md">
        <h1 className="font-headline-xl text-headline-xl text-on-surface mb-sm">FIFA 2026 Venues</h1>

        <div className="relative w-full max-w-2xl mb-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            className="w-full bg-black/50 border border-outline-variant rounded-lg py-3 pl-10 pr-4 text-on-surface focus:outline-none focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed transition-colors"
            placeholder="Search stadiums, cities, or matches..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-sm">
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              onClick={() => setCountry(c.code)}
              className={
                country === c.code
                  ? 'px-4 py-2 rounded-full border border-secondary-fixed text-secondary-fixed bg-secondary-fixed/10 font-label-sm text-label-sm flex items-center gap-2 bloom-effect'
                  : 'px-4 py-2 rounded-full border border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-on-surface transition-colors font-label-sm text-label-sm flex items-center gap-2'
              }
            >
              {c.flag && <span>{c.flag}</span>} {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
        {filtered.map((venue) => (
          <div
            key={venue.id}
            className="glass-card-venue rounded-xl overflow-hidden flex flex-col group hover:border-secondary-fixed/50 transition-colors"
          >
            <div className="h-48 relative overflow-hidden bg-surface-container">
              <img
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                alt={venue.name}
                src={venue.heroImage}
              />
              <div className={`absolute top-2 right-2 ${badgeClasses(venue.matchBadge)}`}>
                {venue.matchBadge}
              </div>
            </div>
            <div className="p-4 flex-grow flex flex-col">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-1">{venue.name}</h3>
              <p className="text-on-surface-variant font-body-md mb-4">{venue.city}</p>
              <div className="grid grid-cols-2 gap-2 mb-4 mt-auto">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-lg">group</span>
                  <span className="font-label-sm text-label-sm">{venue.capacity}</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-lg">{venue.transportIcon}</span>
                  <span className="font-label-sm text-label-sm">{venue.transportLabel}</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant col-span-2">
                  <span className="material-symbols-outlined text-lg">accessible</span>
                  <span className="font-label-sm text-label-sm">{venue.accessibility}</span>
                </div>
              </div>
              <Link
                to={`/app/venues/${venue.id}`}
                className="w-full py-2 border border-white/20 rounded-lg text-on-surface hover:bg-white/5 transition-colors font-label-sm text-label-sm text-center"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-xl text-on-surface-variant font-body-md">
          No venues match your search.
        </div>
      )}
    </main>
  );
}

export default VenuesExplorer;