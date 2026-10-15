import React from 'react';

/**
 * PageSkeleton — placeholder saat berpindah halaman (poin 9).
 * Skeleton bar/kartu abu dengan animasi shimmer.
 * CSS inline di komponen (JANGAN append ke index.css — file itu dikerjakan subagent lain secara paralel).
 */

const SKELETON_CSS = `
@keyframes swrSkShimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.swr-sk {
  background: linear-gradient(90deg, #eef2f6 25%, #e3e9f0 40%, #eef2f6 55%);
  background-size: 200% 100%;
  animation: swrSkShimmer 1.3s linear infinite;
  border-radius: 6px;
}
@media (prefers-reduced-motion: reduce) {
  .swr-sk { animation: none; }
}
`;

const BAR = (h: number, w: number | string): React.CSSProperties => ({
  height: h,
  width: typeof w === 'number' ? Math.min(w, 320) : w,
});

export const PageSkeleton: React.FC = () => {
  return (
    <div
      className="page-container"
      role="status"
      aria-label="Memuat halaman..."
      style={{ minHeight: 320 }}
    >
      <style>{SKELETON_CSS}</style>

      {/* Judul halaman */}
      <div style={{ marginBottom: 24 }}>
        <div className="swr-sk" style={{ ...BAR(22, 260), marginBottom: 10 }} />
        <div className="swr-sk" style={{ ...BAR(12, 'min(380px, 90%)') }} />
      </div>

      {/* Kartu statistik */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 20,
          marginBottom: 24,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: 18,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div className="swr-sk" style={{ ...BAR(11, 70), marginBottom: 12 }} />
            <div className="swr-sk" style={{ ...BAR(24, 100), marginBottom: 12 }} />
            <div className="swr-sk" style={{ ...BAR(10, 120) }} />
          </div>
        ))}
      </div>

      {/* Panel tabel */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, gap: 12 }}>
          <div className="swr-sk" style={{ ...BAR(16, 200) }} />
          <div className="swr-sk" style={{ ...BAR(34, 140), borderRadius: 8, flexShrink: 0 }} />
        </div>

        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 4px',
              borderBottom: i < 5 ? '1px solid #f1f5f9' : 'none',
            }}
          >
            <div className="swr-sk" style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0 }} />
            <div className="swr-sk" style={{ ...BAR(12, '34%') }} />
            <div className="swr-sk" style={{ ...BAR(12, '18%') }} />
            <div className="swr-sk" style={{ ...BAR(12, '12%'), marginLeft: 'auto', flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </div>
  );
};
