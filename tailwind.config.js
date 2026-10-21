/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        page:    '#F8FAFC',
        surface: '#FFFFFF',
        panel:   '#F1F5F9',
        raised:  '#FFFFFF',

        accent: {
          DEFAULT:  '#2563EB',
          hover:    '#1D4ED8',
          light:    '#EFF6FF',
          border:   '#BFDBFE',
          text:     '#1D4ED8',
        },

        text: {
          primary:   '#0F172A',
          secondary: '#475569',
          muted:     '#94A3B8',
          disabled:  '#CBD5E1',
          inverse:   '#FFFFFF',
          accent:    '#2563EB',
        },

        border: {
          subtle:  '#F1F5F9',
          DEFAULT: '#E2E8F0',
          strong:  '#CBD5E1',
        },

        status: {
          safe:         '#059669',
          'safe-bg':    '#ECFDF5',
          'safe-border':'#A7F3D0',

          watch:         '#D97706',
          'watch-bg':    '#FFFBEB',
          'watch-border':'#FDE68A',

          warning:         '#EA580C',
          'warning-bg':    '#FFF7ED',
          'warning-border':'#FED7AA',

          danger:         '#DC2626',
          'danger-bg':    '#FEF2F2',
          'danger-border':'#FECACA',

          offline:         '#64748B',
          'offline-bg':    '#F8FAFC',
          'offline-border':'#E2E8F0',
        },

        connectivity: {
          '4g':    '#059669',
          '2g':    '#D97706',
          'lora':  '#EA580C',
          'sd':    '#DC2626',
        },

        danger: {
          DEFAULT: '#DC2626',
          light:   '#FEF2F2',
          border:  '#FECACA',
          text:    '#DC2626',
        },
        safe: {
          DEFAULT: '#059669',
          light:   '#ECFDF5',
          border:  '#A7F3D0',
          text:    '#059669',
        },
        caution: {
          DEFAULT: '#D97706',
          light:   '#FFFBEB',
          border:  '#FDE68A',
          text:    '#D97706',
        },
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },

      fontSize: {
        'xs':   ['11px', { lineHeight: '16px', letterSpacing: '0.01em' }],
        'sm':   ['12px', { lineHeight: '18px', letterSpacing: '0.005em' }],
        'base': ['13px', { lineHeight: '20px' }],
        'md':   ['14px', { lineHeight: '22px' }],
        'lg':   ['15px', { lineHeight: '24px' }],
        'xl':   ['16px', { lineHeight: '24px' }],
        '2xl':  ['18px', { lineHeight: '28px' }],
        '3xl':  ['22px', { lineHeight: '30px' }],
        '4xl':  ['28px', { lineHeight: '36px' }],
      },

      fontWeight: {
        normal:   '400',
        medium:   '500',
        semibold: '600',
        bold:     '700',
      },

      spacing: {
        sidebar: '220px',
        header:  '52px',
      },

      boxShadow: {
        card:   '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
        raised: '0 4px 6px -1px rgba(15,23,42,0.07), 0 2px 4px -2px rgba(15,23,42,0.05)',
        focus:  '0 0 0 3px rgba(37,99,235,0.12)',
        none:   'none',
      },

      borderRadius: {
        sm:      '4px',
        DEFAULT: '6px',
        md:      '8px',
        lg:      '10px',
        xl:      '12px',
        full:    '9999px',
      },

      animation: {
        'pulse-danger': 'pulseDanger 1.4s ease-in-out infinite',
        'fade-in':      'fadeIn 0.15s ease-out',
        'slide-down':   'slideDown 0.2s ease-out',
        'spin':         'spin 0.8s linear infinite',
      },

      keyframes: {
        pulseDanger: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.35' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },

      transitionDuration: {
        '100': '100ms',
        '120': '120ms',
        '150': '150ms',
        '200': '200ms',
      },
      transitionTimingFunction: {
        'out':    'cubic-bezier(0.0, 0.0, 0.2, 1)',
        'in':     'cubic-bezier(0.4, 0.0, 1, 1)',
        'in-out': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
