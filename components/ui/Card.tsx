import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = "", hover = false }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${hover ? 'transition-transform hover:-translate-y-1 hover:shadow-md' : ''} ${className}`}>
      {children}
    </div>
  );
};