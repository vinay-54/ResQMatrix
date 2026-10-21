import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[IDMS Error Boundary]', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]
                      px-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-[#FEF2F2] flex items-center
                        justify-center mb-4">
          <AlertTriangle size={22} className="text-[#DC2626]" />
        </div>
        <h2 className="text-[16px] font-semibold text-[#0F172A] mb-2">
          Something went wrong
        </h2>
        <p className="text-[13px] text-[#64748B] max-w-sm mb-6 leading-relaxed">
          An unexpected error occurred in this section. Your data is safe.
        </p>
        {this.state.error?.message && (
          <div className="mb-5 px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0]
                          rounded-lg max-w-sm w-full text-left">
            <p className="text-[10px] font-mono text-[#94A3B8] break-all">
              {this.state.error.message}
            </p>
          </div>
        )}
        <button
          onClick={() => this.setState({ hasError: false, error: null })}
          className="flex items-center gap-2 px-4 py-2 bg-[#0F172A] text-white
                     text-[13px] font-semibold rounded-lg hover:bg-[#1E293B]
                     transition-colors"
        >
          <RefreshCw size={14} />
          Try again
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
