import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary para capturar erros React e exibir fallback UI
 * 
 * Uso:
 * <ErrorBoundary>
 *   <SeuComponente />
 * </ErrorBoundary>
 */
class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log do erro para debugging
    logger.error('🚨 Erro capturado pelo Error Boundary', 'react', { 
      error, 
      componentStack: errorInfo.componentStack 
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Se houver fallback customizado, usar ele
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback padrão
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Componente de fallback para exibir quando há erro
 */
interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, errorInfo, onReset }) => {
  const navigate = useNavigate();
  const isDev = import.meta.env.DEV;

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#000000' }}>
      <div className="max-w-md w-full bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border p-6 text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle size={48} className="text-status-error" />
        </div>
        
        <h1 className="text-xl font-bold mb-2 text-light-text dark:text-dark-text">
          Ops! Algo deu errado
        </h1>
        
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-6">
          Ocorreu um erro inesperado. Por favor, tente recarregar a página ou voltar para o início.
        </p>

        {isDev && error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded text-left">
            <p className="text-xs font-mono text-red-400 mb-2">
              {error.name}: {error.message}
            </p>
            {errorInfo?.componentStack && (
              <details className="text-xs font-mono text-red-300">
                <summary className="cursor-pointer mb-2">Stack Trace</summary>
                <pre className="overflow-auto max-h-40 text-xs">
                  {errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={onReset}
            className="w-full p-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-semibold flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            Tentar Novamente
          </button>
          
          <button
            onClick={handleGoHome}
            className="w-full p-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg hover:bg-light-background dark:hover:bg-dark-background transition-colors flex items-center justify-center gap-2"
          >
            <Home size={18} />
            Voltar ao Início
          </button>
        </div>

        {isDev && (
          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-4">
            💡 Dica: Este erro só é visível em modo de desenvolvimento
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Wrapper funcional para ErrorBoundary com hooks
 */
const ErrorBoundary: React.FC<Props> = (props) => {
  return <ErrorBoundaryClass {...props} />;
};

export default ErrorBoundary;

