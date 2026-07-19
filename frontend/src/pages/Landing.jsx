import React from 'react';
import { Link } from 'react-router-dom';

function Landing() {
  return (
    <div className="bg-background text-on-surface font-body-md antialiased min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-mesh-pattern">
      <div
        className="absolute inset-0 z-0 opacity-40 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 50% -20%, rgba(195,244,0,0.15) 0%, transparent 60%)' }}
      />

      <main className="w-full max-w-7xl px-container-margin z-10 flex flex-col items-center pt-12 pb-24 h-full relative">
        <div className="flex flex-col items-center text-center space-y-6 mb-16 max-w-3xl">
          <div className="relative w-32 h-32 flex items-center justify-center mb-4">
            <div className="absolute inset-0 bg-secondary-fixed/20 rounded-full blur-2xl animate-pulse" />
            <span
              className="material-symbols-outlined text-[80px] text-secondary-fixed relative z-10 drop-shadow-[0_0_15px_rgba(195,244,0,0.8)]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              sports_soccer
            </span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight uppercase">
            StadiumIQ
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
            AI-Powered FIFA World Cup 2026 Experience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mb-16">
          <div className="glass-panel-hero rounded-xl p-6 flex flex-col items-center text-center space-y-4 hover:border-secondary-fixed/50 transition-colors group">
            <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center group-hover:bg-secondary-fixed/10 transition-colors">
              <span className="material-symbols-outlined text-primary-fixed group-hover:text-secondary-fixed transition-colors">
                language
              </span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface">Multilingual Assistant</h3>
            <p className="font-body-md text-body-md text-on-surface-variant text-sm">
              Real-time translation and guidance tailored to global fans navigating the venue.
            </p>
          </div>

          <div className="glass-panel-hero rounded-xl p-6 flex flex-col items-center text-center space-y-4 hover:border-secondary-fixed/50 transition-colors group">
            <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center group-hover:bg-secondary-fixed/10 transition-colors">
              <span className="material-symbols-outlined text-primary-fixed group-hover:text-secondary-fixed transition-colors">
                groups
              </span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface">Crowd Intelligence</h3>
            <p className="font-body-md text-body-md text-on-surface-variant text-sm">
              Predictive flow modeling to avoid bottlenecks and optimize your stadium path.
            </p>
          </div>

          <div className="glass-panel-hero rounded-xl p-6 flex flex-col items-center text-center space-y-4 hover:border-secondary-fixed/50 transition-colors group">
            <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center group-hover:bg-secondary-fixed/10 transition-colors">
              <span className="material-symbols-outlined text-primary-fixed group-hover:text-secondary-fixed transition-colors">
                admin_panel_settings
              </span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface">Staff Operations</h3>
            <p className="font-body-md text-body-md text-on-surface-variant text-sm">
              Command center integration for seamless incident response and logistics.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center space-y-6 w-full max-w-sm mt-auto">
          <Link
            to="/app"
            className="w-full py-4 px-8 bg-secondary-fixed text-on-secondary-fixed font-headline-md text-headline-md rounded-xl hover:bg-secondary-fixed-dim transition-colors glow-effect transform hover:scale-105 active:scale-95 duration-200 text-center"
          >
            Enter StadiumIQ
          </Link>
          <Link
            to="/login"
            className="font-label-sm text-label-sm text-on-surface-variant hover:text-secondary-fixed transition-colors uppercase tracking-widest"
          >
            For Staff? Sign In
          </Link>
        </div>
      </main>
    </div>
  );
}

export default Landing;