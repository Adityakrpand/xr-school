'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
const ProteinTestLabViewer = dynamic(() => import('@/components/simulations/ProteinTestLabViewer'), { ssr: false, loading: () => <div style={{ minHeight: '100vh', background: '#050b17', color: '#fff', display: 'grid', placeItems: 'center' }}>Preparing the protein testing laboratory…</div> });
export default function ProteinTestLabPage() { return <div style={{ position: 'relative' }}><Link href="/simulations" style={{ position: 'absolute', top: 16, left: 16, zIndex: 20, padding: '7px 14px', borderRadius: 9, background: 'rgba(0,0,0,.55)', color: '#fff', textDecoration: 'none' }}>Back</Link><ProteinTestLabViewer /></div>; }
