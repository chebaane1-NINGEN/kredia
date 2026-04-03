import React from 'react';
import { Link, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { Home, ArrowLeft, AlertTriangle } from 'lucide-react';

interface ErrorPageProps {
  statusCode?: number;
  title?: string;
  message?: string;
}

const ErrorPage: React.FC<ErrorPageProps> = ({ 
  statusCode = 404, 
  title = "Page non trouvée",
  message = "La page que vous recherchez n'existe pas ou a été déplacée."
}) => {
  const error = useRouteError();
  
  // Determine error details from route error if available
  let displayStatusCode = statusCode;
  let displayTitle = title;
  let displayMessage = message;

  if (isRouteErrorResponse(error)) {
    displayStatusCode = error.status;
    displayTitle = error.statusText || title;
    displayMessage = error.data?.message || message;
  } else if (error instanceof Error) {
    displayStatusCode = 500;
    displayTitle = "Erreur serveur";
    displayMessage = error.message || "Une erreur inattendue s'est produite.";
  }

  const is404 = displayStatusCode === 404;
  const is500 = displayStatusCode >= 500;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center">
        {/* Error Illustration */}
        <div className="relative mb-8">
          <div className="w-40 h-40 mx-auto relative">
            {/* Background Circle */}
            <div className={`absolute inset-0 rounded-full ${is404 ? 'bg-primary-100' : is500 ? 'bg-danger/10' : 'bg-warning/10'}`}></div>
            
            {/* Animated Rings */}
            <div className="absolute inset-4 rounded-full border-4 border-dashed border-slate-200 animate-spin" style={{ animationDuration: '20s' }}></div>
            <div className="absolute inset-8 rounded-full border-4 border-dotted border-slate-300 animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }}></div>
            
            {/* Center Icon */}
            <div className={`absolute inset-0 flex items-center justify-center ${is404 ? 'text-primary-600' : is500 ? 'text-danger' : 'text-warning'}`}>
              {is404 ? (
                <span className="text-6xl font-black">404</span>
              ) : is500 ? (
                <AlertTriangle size={64} />
              ) : (
                <span className="text-6xl font-black">{displayStatusCode}</span>
              )}
            </div>
          </div>
        </div>

        {/* Error Content */}
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
          {displayTitle}
        </h1>
        <p className="text-lg text-slate-500 mb-8 max-w-md mx-auto">
          {displayMessage}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            to="/" 
            className="btn-primary py-3 px-8"
          >
            <Home size={18} />
            Retour à l'accueil
          </Link>
          
          <button 
            onClick={() => window.history.back()}
            className="btn-outline py-3 px-8"
          >
            <ArrowLeft size={18} />
            Page précédente
          </button>
        </div>

        {/* Additional Help */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-400 mb-4">
            Besoin d'aide ? Contactez notre équipe de support
          </p>
          <div className="flex items-center justify-center gap-6 text-sm">
            <a href="mailto:support@finova.com" className="text-primary-600 font-semibold hover:underline">
              support@finova.com
            </a>
            <span className="text-slate-300">|</span>
            <a href="tel:+33123456789" className="text-primary-600 font-semibold hover:underline">
              +33 1 23 45 67 89
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
