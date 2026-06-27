import React from 'react';
import { ScanFace } from 'lucide-react';

export default function AIRecognitionPage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '70vh',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: '#f0f9ff',
        padding: '2rem',
        borderRadius: '50%',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 6px -1px rgba(12, 165, 234, 0.1)'
      }}>
        <ScanFace size={64} color="#0CA5EA" />
      </div>
      
      <h1 style={{
        fontSize: '2rem',
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: '1rem'
      }}>
        Sistem AI Recognition
      </h1>
      
      <p style={{
        fontSize: '1.1rem',
        color: '#64748b',
        maxWidth: '500px',
        lineHeight: '1.6'
      }}>
        Fitur ini masih dalam tahap <strong>pengembangan</strong>. 
        Nantinya, Anda dapat menggunakan sistem pengenalan AI untuk mempercepat dan mempermudah pencatatan galon/barang secara otomatis.
      </p>

      <div style={{
        marginTop: '2rem',
        display: 'inline-block',
        padding: '0.5rem 1rem',
        backgroundColor: '#e2e8f0',
        color: '#475569',
        borderRadius: '2rem',
        fontSize: '0.875rem',
        fontWeight: '600'
      }}>
        Segera Hadir
      </div>
    </div>
  );
}
