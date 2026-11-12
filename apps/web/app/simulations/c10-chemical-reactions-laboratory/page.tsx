'use client';

import dynamic from 'next/dynamic';

const ChemicalReactionsLabViewer = dynamic(() => import('../../../components/simulations/ChemicalReactionsLabViewer'), { ssr: false });

export default function ChemicalReactionsLabPage() {
  return <ChemicalReactionsLabViewer />;
}
