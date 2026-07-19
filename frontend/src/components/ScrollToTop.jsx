import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scrolls the window to the top whenever the route changes.
 *
 * React Router does not reset scroll position between route changes
 * by default (unlike traditional multi-page sites), so without this,
 * navigating to a new page keeps whatever scroll position the previous
 * page was at.
 */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default ScrollToTop;
