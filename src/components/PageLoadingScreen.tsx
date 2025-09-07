import React from 'react';

const PageLoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        {/* Logo animado */}
        <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-6 animate-pulse">
          <span className="text-white font-bold text-lg">CC</span>
        </div>
        
        {/* Spinner animado */}
        <div className="w-12 h-12 mx-auto mb-4">
          <div className="w-full h-full border-4 border-muted rounded-full animate-spin border-t-primary"></div>
        </div>
        
        {/* Texto */}
        <h2 className="text-lg font-semibold mb-2 animate-fade-in">Carregando...</h2>
        <p className="text-muted-foreground text-sm animate-fade-in">Preparando a página</p>
        
        {/* Barra de progresso animada */}
        <div className="w-48 h-1 bg-muted rounded-full mx-auto mt-4 overflow-hidden">
          <div className="h-full bg-gradient-primary rounded-full animate-[loading-bar_1.5s_ease-in-out_infinite]"></div>
        </div>
      </div>
    </div>
  );
};

export default PageLoadingScreen;