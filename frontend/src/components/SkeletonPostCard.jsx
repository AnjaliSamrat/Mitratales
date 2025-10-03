import React from 'react';

export default function SkeletonPostCard() {
  return (
    <div className="post-card skeleton-card">
      <div className="post-header">
        <div className="skeleton-avatar" />
        <div className="post-meta" style={{width: '100%'}}>
          <div className="skeleton-line" style={{width: '30%'}} />
          <div className="skeleton-line" style={{width: '18%'}} />
        </div>
      </div>
      <div className="skeleton-line" style={{width: '95%'}} />
      <div className="skeleton-line" style={{width: '88%'}} />
      <div className="skeleton-line" style={{width: '92%'}} />
      <div className="post-actions" style={{marginTop: 8}}>
        <div className="skeleton-pill" />
        <div className="skeleton-pill" />
      </div>
    </div>
  );
}
