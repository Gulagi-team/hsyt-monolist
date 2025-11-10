import React from 'react';
import PublicRecordViewer from './PublicRecordViewer';

const PublicShareRouter: React.FC = () => {
  // Simple router to detect public share URLs
  const path = window.location.pathname;
  const shareMatch = path.match(/^\/share\/([a-zA-Z0-9]+)$/);

  if (shareMatch) {
    const shareToken = shareMatch[1];
    return <PublicRecordViewer shareToken={shareToken} />;
  }

  // Return null - don't render anything for non-share URLs
  return null;
};

export default PublicShareRouter;
