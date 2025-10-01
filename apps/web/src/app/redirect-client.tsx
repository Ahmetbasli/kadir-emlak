'use client';

import { useEffect } from 'react';

const SUPPORTED = ['en', 'tr', 'ru'] as const;

export default function RedirectClient() {
  useEffect(() => {
    const nav = navigator.language?.slice(0, 2).toLowerCase();
    const locale = (SUPPORTED as readonly string[]).includes(nav) ? nav : 'en';
    window.location.replace(`/${locale}`);
  }, []);
  return null;
}


