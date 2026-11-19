// Keeps <head> in sync with the current route during client-side navigation.
// The prerendered HTML already has the right tags for the first page load.
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getHead } from '../../seo/head';

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!href) { el?.remove(); return; }
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
}

function setJsonLd(data) {
  let el = document.getElementById('ld-json');
  if (!data) { el?.remove(); return; }
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = 'ld-json';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export default function SeoHead() {
  const { pathname } = useLocation();
  useEffect(() => {
    const h = getHead(pathname);
    document.title = h.title;
    setMeta('name', 'description', h.description);
    setMeta('name', 'robots', h.robots);
    setMeta('property', 'og:title', h.ogTitle);
    setMeta('property', 'og:description', h.ogDescription);
    setMeta('property', 'og:image', h.ogImage);
    if (h.canonical) setMeta('property', 'og:url', h.canonical);
    setCanonical(h.canonical);
    setJsonLd(h.jsonLd);
  }, [pathname]);
  return null;
}
