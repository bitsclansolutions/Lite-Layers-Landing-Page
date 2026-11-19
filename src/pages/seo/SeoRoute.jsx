// Picks the right template for an SEO URL, or shows the 404 page.
import { useLocation } from 'react-router-dom';
import { getSeoPage } from '../../data/seoPages';
import ProductSeoPage from './ProductSeoPage';
import HubSeoPage from './HubSeoPage';
import NotFoundPage from '../NotFoundPage';

export default function SeoRoute() {
  const { pathname } = useLocation();
  const page = getSeoPage(pathname.replace(/\/+$/, ''));
  if (!page) return <NotFoundPage />;
  // key resets scroll-dependent state when moving between two pages of the same template
  return page.kind === 'product'
    ? <ProductSeoPage key={page.slug} page={page} />
    : <HubSeoPage key={page.slug} page={page} />;
}
