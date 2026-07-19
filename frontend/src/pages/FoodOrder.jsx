import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { CSRF_HEADERS } from '../api';

const VENUES = [
  'MetLife Stadium, NJ', 'AT&T Stadium, TX', 'SoFi Stadium, CA',
  'Estadio Azteca, Mexico City', 'BC Place, Vancouver', "Levi's Stadium, CA",
];

function FoodOrder({ api }) {
  const [menu, setMenu] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState('');
  const [cart, setCart] = useState({}); // { [itemId]: quantity }
  const [venue, setVenue] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    const loadMenu = async () => {
      setMenuLoading(true);
      setMenuError('');
      try {
        const res = await fetch(`${api}/api/food/menu`);
        const data = await res.json();
        if (!res.ok) { setMenuError(data.error || 'Could not load the menu.'); setMenuLoading(false); return; }
        setMenu(data.menu || []);
      } catch {
        setMenuError('Could not connect to server. Please try again.');
      }
      setMenuLoading(false);
    };
    loadMenu();
  }, [api]);

  const categories = useMemo(() => {
    const seen = [];
    menu.forEach((item) => { if (!seen.includes(item.category)) seen.push(item.category); });
    return seen;
  }, [menu]);

  const menuById = useMemo(() => Object.fromEntries(menu.map((m) => [m.id, m])), [menu]);

  const cartEntries = useMemo(
    () => Object.entries(cart).filter(([, qty]) => qty > 0),
    [cart]
  );

  const total = useMemo(
    () => cartEntries.reduce((sum, [id, qty]) => sum + (menuById[id]?.price || 0) * qty, 0),
    [cartEntries, menuById]
  );

  const itemCount = cartEntries.reduce((sum, [, qty]) => sum + qty, 0);

  const adjustQty = useCallback((id, delta) => {
    setCart((prev) => {
      const next = Math.max(0, (prev[id] || 0) + delta);
      return { ...prev, [id]: next };
    });
  }, []);

  const handleCheckout = useCallback(async () => {
    setCheckoutError('');
    if (itemCount === 0) { setCheckoutError('Your cart is empty.'); return; }
    setCheckoutLoading(true);
    try {
      const res = await fetch(`${api}/api/food/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...CSRF_HEADERS },
        body: JSON.stringify({
          cart: cartEntries.map(([id, quantity]) => ({ id, quantity })),
          venue,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setCheckoutError(data.error || 'Checkout failed.'); setCheckoutLoading(false); return; }
      setConfirmation(data);
      setCart({});
    } catch {
      setCheckoutError('Could not connect to server. Please try again.');
    }
    setCheckoutLoading(false);
  }, [api, cartEntries, itemCount, venue]);

  if (confirmation) {
    return (
      <main className="flex-grow px-container-margin py-lg max-w-2xl mx-auto w-full flex flex-col items-center text-center gap-md">
        <span className="material-symbols-outlined text-[64px] text-secondary-fixed drop-shadow-[0_0_15px_rgba(195,244,0,0.5)]">
          check_circle
        </span>
        <h1 className="font-headline-xl text-headline-xl text-on-surface">Order Confirmed!</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">{confirmation.note}</p>

        <div className="glass-card rounded-xl p-md w-full text-left flex flex-col gap-sm mt-sm">
          <div className="flex justify-between items-center border-b border-white/10 pb-sm">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Order Number</span>
            <span className="font-headline-md text-headline-md text-secondary-fixed">{confirmation.order_number}</span>
          </div>
          <ul className="flex flex-col gap-xs">
            {confirmation.items.map((item) => (
              <li key={item.id} className="flex justify-between text-on-surface font-body-md">
                <span>{item.emoji} {item.name} × {item.quantity}</span>
                <span>${item.line_total.toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between items-center border-t border-white/10 pt-sm font-headline-md text-headline-md text-on-surface">
            <span>Total</span>
            <span>${confirmation.total.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={() => setConfirmation(null)}
          className="mt-sm bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm uppercase tracking-wider font-bold py-3 px-6 rounded-full glow-effect-hover transition-all"
          type="button"
        >
          Order More
        </button>
      </main>
    );
  }

  return (
    <main className="flex-grow px-container-margin py-lg max-w-5xl mx-auto w-full flex flex-col gap-md pb-32">
      <header>
        <h1 className="font-headline-xl text-headline-xl text-on-surface">Food & Beverage</h1>
        <p className="text-on-surface-variant font-body-md mt-base">Order ahead, skip the line, pick up at your gate.</p>
      </header>

      <div className="relative max-w-xs">
        <select
          aria-label="Pickup venue"
          className="w-full bg-black border border-outline rounded-lg px-3 py-2 text-on-surface appearance-none focus:outline-none focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
        >
          <option value="">Select pickup venue (optional)...</option>
          {VENUES.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
      </div>

      {menuError && (
        <div role="alert" aria-live="assertive" className="bg-error-container/20 border border-error/30 rounded-lg p-3 text-error font-body-md text-sm">
          {menuError}
        </div>
      )}

      {menuLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-sm animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-surface-container/50 rounded-xl" />
          ))}
        </div>
      )}

      {!menuLoading && !menuError && categories.map((category) => (
        <section key={category} className="flex flex-col gap-sm">
          <h2 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-sm">
            {menu.filter((item) => item.category === category).map((item) => {
              const qty = cart[item.id] || 0;
              return (
                <div key={item.id} className="glass-card rounded-xl p-sm flex items-center gap-sm">
                  <span className="text-[32px] shrink-0">{item.emoji}</span>
                  <div className="flex-grow min-w-0">
                    <p className="font-body-md text-body-md text-on-surface truncate">{item.name}</p>
                    <p className="font-label-sm text-label-sm text-secondary-fixed">${item.price.toFixed(2)}</p>
                  </div>
                  {qty === 0 ? (
                    <button
                      onClick={() => adjustQty(item.id, 1)}
                      className="bg-secondary-fixed/10 border border-secondary-fixed/40 text-secondary-fixed rounded-full w-9 h-9 flex items-center justify-center hover:bg-secondary-fixed/20 transition-colors shrink-0"
                      aria-label={`Add ${item.name}`}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px]">add</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => adjustQty(item.id, -1)}
                        className="bg-surface-variant/60 text-on-surface rounded-full w-8 h-8 flex items-center justify-center hover:bg-surface-variant transition-colors"
                        aria-label={`Remove one ${item.name}`}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">remove</span>
                      </button>
                      <span className="font-label-sm text-label-sm text-on-surface w-5 text-center">{qty}</span>
                      <button
                        onClick={() => adjustQty(item.id, 1)}
                        className="bg-secondary-fixed/10 border border-secondary-fixed/40 text-secondary-fixed rounded-full w-8 h-8 flex items-center justify-center hover:bg-secondary-fixed/20 transition-colors"
                        aria-label={`Add one more ${item.name}`}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {itemCount > 0 && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-container-margin z-40">
          <div className="glass-card rounded-xl p-md shadow-2xl flex flex-col gap-sm border border-secondary-fixed/30">
            {checkoutError && (
              <div role="alert" aria-live="assertive" className="text-error font-body-md text-sm">
                {checkoutError}
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="font-body-md text-body-md text-on-surface">
                {itemCount} item{itemCount !== 1 ? 's' : ''} — <span className="text-secondary-fixed font-medium">${total.toFixed(2)}</span>
              </span>
              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm uppercase tracking-wider font-bold py-2 px-5 rounded-full glow-effect-hover transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                aria-busy={checkoutLoading}
                type="button"
              >
                {checkoutLoading ? 'Placing order...' : 'Checkout'}
                {!checkoutLoading && <span className="material-symbols-outlined text-[18px]">shopping_cart_checkout</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

FoodOrder.propTypes = {
  api: PropTypes.string.isRequired,
};

export default FoodOrder;