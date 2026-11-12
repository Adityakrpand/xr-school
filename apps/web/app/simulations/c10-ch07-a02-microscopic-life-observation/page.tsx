'use client';

import dynamic from 'next/dynamic';

const MicroscopicLifeObservationViewer = dynamic(
  () => import('@/components/simulations/MicroscopicLifeObservationViewer'),
  { ssr: false },
);

export default function MicroscopicLifeObservationPage() {
  return <MicroscopicLifeObservationViewer />;
}
