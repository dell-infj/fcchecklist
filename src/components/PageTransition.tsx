import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PageLoadingScreen from './PageLoadingScreen';

interface PageTransitionProps {
  children: React.ReactNode;
}

const PageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('fade-in');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (location !== displayLocation) {
      setIsLoading(true);
      setTransitionStage('fade-out');
    }
  }, [location, displayLocation]);

  const handleTransitionEnd = () => {
    if (transitionStage === 'fade-out') {
      // Simula um pequeno delay de carregamento para mostrar a animação
      setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('fade-in');
        setIsLoading(false);
      }, 600);
    }
  };

  // Mostra a tela de loading durante a transição
  if (isLoading && transitionStage === 'fade-out') {
    return <PageLoadingScreen />;
  }

  return (
    <div
      className={`transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        transitionStage === 'fade-out'
          ? 'opacity-0 transform translate-y-4 scale-[0.96]'
          : 'opacity-100 transform translate-y-0 scale-100'
      }`}
      onTransitionEnd={handleTransitionEnd}
    >
      <div className="animate-fade-in">
        {children}
      </div>
    </div>
  );
};

export default PageTransition;