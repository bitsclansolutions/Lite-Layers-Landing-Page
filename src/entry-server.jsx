// Build-time renderer used by scripts/prerender.mjs. Not loaded in the browser,
// so the fast-refresh rule doesn't apply.
/* eslint-disable react-refresh/only-export-components */
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import AppRoutes from './AppRoutes';

export { getHead, headToHtml, PUBLIC_PATHS } from './seo/head';
export { GLOBAL_CSS } from './hooks/useGlobalStyles';
export { ALL_SEO_PAGES } from './data/seoPages';
export { SITE_URL } from './constants/site';

export function render(url) {
  return renderToString(
    <StaticRouter location={url}>
      <AppRoutes />
    </StaticRouter>,
  );
}
