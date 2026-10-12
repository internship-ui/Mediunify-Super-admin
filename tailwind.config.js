/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
    './src/app/**/*.{js,jsx}',
    './src/features/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        mediunify: {
          teal: '#00B894',
          'teal-dark': '#009b7c',
          'teal-light': '#E6F8F4',
          navy: '#1E3A8A',
          'navy-dark': '#132863',
          'navy-light': '#EEF2FF',
          aqua: '#00C2CB',
          'aqua-light': '#E5F9FA',
          green: '#7BC96F',
          'green-light': '#F1F9EF',
          coral: '#FF7F50',
          'coral-light': '#FFF0EB',
          slate: '#647488',
          'slate-light': '#F1F5F9',
          background: '#F7FAFC',
          white: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
        glow: '0 0 20px -3px rgba(0, 184, 148, 0.3)',
      },
    },
  },
  plugins: [],
};
