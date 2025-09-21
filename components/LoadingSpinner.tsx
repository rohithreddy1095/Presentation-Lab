
import React from 'react';

interface LoadingSpinnerProps {
    small?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ small = false }) => {
  const sizeClasses = small ? 'h-5 w-5' : 'h-10 w-10';
  const borderClasses = small ? 'border-2' : 'border-4';

  return (
    <div
      className={`${sizeClasses} ${borderClasses} border-green-600 border-t-transparent rounded-full animate-spin`}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};
