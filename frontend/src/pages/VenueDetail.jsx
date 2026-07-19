import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import venues from '../data/venues';

const DEFAULT_ZONES = [
  { label: 'North', sectors: 'Sectors A-D' },
  { label: 'South', sectors: 'Sectors E-H' },
  { label: 'East', sectors: 'Sectors I-L' },
  { label: 'West', sectors: 'Sectors M-P' },
];
const DEFAULT_GATES = ['1', '2', '3', '4', '5', '6', '...', '10'];
const DEFAULT_TRANSPORT = [
  { icon: 'directions_bus', color: 'blue', name: 'Shuttle Service', detail: 'Runs from downtown every 15 min on match day' },
  { icon: 'directions_car', color: 'teal', name: 'Parking Lots', detail: 'On-site lots open 4 hours before kickoff' },
];
const TRANSPORT_ICON_STYLES = {
  blue: 'bg-blue-500/20 text-blue-400',
  teal: 'bg-teal-500/20 text-teal-400',
};

function VenueDetail() {
  const { venueId } = useParams();
  const navigate = useNavigate();
  const venue = venues.find((v) => v.id === venueId);

  if (!venue) {
    return (
      <main className="flex-grow flex flex-col items-center justify-center px-container-margin py-xl text-center">
        <p className="font-headline-md text-headline-md text-on-surface mb-sm">Venue not found</p>
        <Link to="/app/venues" className="text-secondary-fixed font-label-sm text-label-sm">
          Back to Venues
        </Link>
      </main>
    );
  }

  const zones = venue.zones || DEFAULT_ZONES;
  const gates = venue.gates || DEFAULT_GATES;
  const transport = venue.transport || DEFAULT_TRANSPORT;
  const matchType = venue.matchType || venue.matchBadge;
  const locationTag = venue.locationTag || venue.city.split(',')[0];

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-container-margin md:px-lg pt-4 md:pt-8 flex flex-col gap-md md:gap-lg pb-8">
      <button
        onClick={() => navigate(-1)}
        className="md:hidden flex items-center gap-1 text-on-surface-variant hover:text-secondary-fixed transition-colors self-start"
        type="button"
      >
        <span className="material-symbols-outlined">arrow_back</span>
        <span className="font-label-sm text-label-sm">Venues</span>
      </button>

      <section
        className="relative w-full rounded-2xl overflow-hidden glass-panel group min-h-[300px] md:min-h-[450px] flex flex-col justify-end bg-surface-container-high"
      >
        <div
          className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url('${venue.heroImage}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface/60 to-transparent z-10" />

        <div className="relative z-20 p-md md:p-lg flex flex-col gap-sm w-full">
          <div className="flex flex-wrap items-center gap-xs mb-xs">
            <span className="bg-surface-variant/80 backdrop-blur-md border border-outline/30 text-on-surface font-label-sm text-label-sm px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
              <span className="material-symbols-outlined text-[16px] text-secondary-fixed">location_on</span>
              {locationTag}
            </span>
            <span className="bg-secondary-fixed/10 backdrop-blur-md border border-secondary-fixed/50 text-secondary-fixed font-label-sm text-label-sm px-3 py-1 rounded-full flex items-center gap-1 shadow-[0_0_10px_rgba(195,244,0,0.15)]">
              <span className="material-symbols-outlined text-[16px]">sports_soccer</span>
              {matchType}
            </span>
          </div>
          <h1 className="font-headline-xl text-headline-xl font-bold text-white tracking-tight drop-shadow-lg">
            {venue.name}
          </h1>
          <div className="flex items-center gap-md text-on-surface-variant font-body-md text-body-md mt-2">
            <div className="flex items-center gap-xs">
              <span className="material-symbols-outlined text-tertiary">groups</span>
              <span>Capacity: <strong className="text-white">{venue.capacity}</strong></span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md w-full">
        <div className="glass-panel rounded-xl p-md flex flex-col gap-sm relative overflow-hidden group hover:border-secondary-fixed/30 transition-colors duration-300 bg-surface-container-high">
          <div className="flex items-center gap-sm z-10">
            <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-primary-fixed">
              <span className="material-symbols-outlined">my_location</span>
            </div>
            <h2 className="font-headline-md text-headline-md font-semibold text-on-surface">Zones</h2>
          </div>
          <div className="z-10 mt-2 grid grid-cols-2 gap-2">
            {zones.map((zone) => (
              <div key={zone.label} className="bg-surface/50 border border-outline/20 rounded-lg p-3 text-center hover:bg-surface-variant transition-colors">
                <span className="font-label-sm text-label-sm text-on-surface-variant block uppercase tracking-wider mb-1">{zone.label}</span>
                <span className="font-body-md text-body-md text-white font-medium">{zone.sectors}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-md flex flex-col gap-sm relative overflow-hidden group hover:border-secondary-fixed/30 transition-colors duration-300 bg-surface-container-high">
          <div className="flex items-center gap-sm z-10">
            <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-primary-fixed">
              <span className="material-symbols-outlined">door_open</span>
            </div>
            <h2 className="font-headline-md text-headline-md font-semibold text-on-surface">Gates</h2>
          </div>
          <div className="z-10 mt-2 flex-1 flex flex-col justify-center">
            <div className="flex flex-wrap gap-2">
              {gates.map((gate, i) => (
                <span
                  key={`${gate}-${i}`}
                  className={`bg-surface/50 border border-outline/20 rounded-md px-3 py-1.5 font-label-sm text-label-sm text-white ${gate === '...' ? 'opacity-60' : ''}`}
                >
                  {gate}
                </span>
              ))}
            </div>
            <div className="mt-4 p-3 bg-secondary-fixed/5 border border-secondary-fixed/20 rounded-lg flex items-start gap-2">
              <span className="material-symbols-outlined text-secondary-fixed text-[18px] mt-0.5">info</span>
              <p className="font-body-md text-body-md text-on-surface text-sm">
                Gate allocation depends on your ticket sector. Check digital ticket for exact entrance.
              </p>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-md flex flex-col gap-sm relative overflow-hidden group hover:border-secondary-fixed/30 transition-colors duration-300 md:col-span-2 lg:col-span-1 bg-surface-container-high">
          <div className="flex items-center gap-sm z-10">
            <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-primary-fixed">
              <span className="material-symbols-outlined">train</span>
            </div>
            <h2 className="font-headline-md text-headline-md font-semibold text-on-surface">Transport</h2>
          </div>
          <div className="z-10 mt-2 flex flex-col gap-3">
            {transport.map((t) => (
              <div key={t.name} className="bg-surface/50 border border-outline/20 rounded-lg p-3 flex items-center gap-3">
                <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${TRANSPORT_ICON_STYLES[t.color] || 'bg-surface-variant text-on-surface-variant'}`}>
                  <span className="material-symbols-outlined text-[20px]">{t.icon}</span>
                </div>
                <div>
                  <p className="font-body-md text-body-md text-white font-medium">{t.name}</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">{t.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-md flex flex-col gap-sm relative overflow-hidden group hover:border-secondary-fixed/30 transition-colors duration-300 md:col-span-2 lg:col-span-3 bg-surface-container-high">
          <div className="flex items-center gap-sm z-10">
            <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-primary-fixed">
              <span className="material-symbols-outlined">accessible</span>
            </div>
            <h2 className="font-headline-md text-headline-md font-semibold text-on-surface">Accessibility</h2>
          </div>
          <div className="z-10 mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-secondary-fixed mt-0.5">check_circle</span>
              <div>
                <h3 className="font-body-md text-body-md text-white font-medium mb-1">Ramp Access</h3>
                <p className="font-body-md text-body-md text-on-surface-variant text-sm">
                  Wheelchair accessible ramps are available at all public entrance gates, providing seamless entry to the main concourse.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-secondary-fixed mt-0.5">elevator</span>
              <div>
                <h3 className="font-body-md text-body-md text-white font-medium mb-1">Elevators Available</h3>
                <p className="font-body-md text-body-md text-on-surface-variant text-sm">
                  Dedicated elevators service all tiers for fans with mobility requirements. Priority access granted with appropriate ticketing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="w-full flex justify-center">
        <Link
          to="/app"
          state={{ prefillVenue: venue.name }}
          className="w-full max-w-md bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm uppercase font-bold py-4 px-6 rounded-full shadow-[0_0_20px_rgba(195,244,0,0.4)] hover:bg-secondary-fixed-dim hover:shadow-[0_0_25px_rgba(195,244,0,0.6)] transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 group"
        >
          <span className="material-symbols-outlined group-hover:rotate-12 transition-transform duration-300">auto_awesome</span>
          Ask AI about this venue
        </Link>
      </div>
    </main>
  );
}

export default VenueDetail;