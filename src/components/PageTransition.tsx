import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
}

const PageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('fade-in');

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('fade-out');
    }
  }, [location, displayLocation]);

  return (
    <div
      className={`transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        transitionStage === 'fade-out'
          ? 'opacity-0 transform translate-y-4 scale-[0.96]'
          : 'opacity-100 transform translate-y-0 scale-100'
      }`}
      onTransitionEnd={() => {
        if (transitionStage === 'fade-out') {
          setDisplayLocation(location);
          setTransitionStage('fade-in');
        }
      }}
    >
      <div className="animate-fade-in">
        {children}
      </div>
    </div>
  );
};

export default PageTransition;