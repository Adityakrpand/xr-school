'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

const CarbohydrateTestLabViewer = dynamic(() => import('@/components/simulations/CarbohydrateTestLabViewer'), {
  ssr: false,
  loading: () => <div style={{ minHeight: '100vh', background: '#031018', color: '#e8f5ff', display: 'grid', placeItems: 'center' }}>Preparing the food science laboratory…</div>,
});

export default function CarbohydrateTestLabPage() {
  return <div style={{ position: 'relative' }}>
    <Link href="/simulations" style={{ position: 'absolute', top: 16, left: 16, zIndex: 20, padding: '7px 14px', borderRadius: 9, background: 'rgba(0,0,0,.55)', color: '#fff', textDecoration: 'none' }}>Back</Link>
    <CarbohydrateTestLabViewer />
  </div>;
}
