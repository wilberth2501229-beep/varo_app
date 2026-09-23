/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Old Money Palette - Warm, Elegant, Sophisticated
        'gold': {
          50: '#FEF8F0',
          100: '#FDF1E1',
          200: '#F5E6D3',
          300: '#E8D4BB',
          400: '#D4B896',
          500: '#B8956A', // Primary Gold Dust
          600: '#A89968',
          700: '#8B7355',
          800: '#6B5643',
          900: '#4A3D2E',
        },
        'cream': {
          50: '#FAFAF8',
          100: '#F8F7F5',
          200: '#F5E6D3', // Deep Cream
          300: '#F0DEC5',
          400: '#E8D4BB',
          500: '#DFC8AD',
        },
        'charcoal': {
          50: '#F3F2F0',
          100: '#E8E6E2',
          200: '#D4CFC8',
          300: '#A89A8F',
          400: '#8B8680',
          500: '#6B6560',
          600: '#4A4A4A',
          700: '#3E3A34', // Charcoal Warm
          800: '#2A2925',
          900: '#1A1815',
        },
        'forest': {
          50: '#F0F4F2',
          100: '#E0E9E5',
          200: '#C1D3CB',
          300: '#A2BDAD',
          400: '#8BA899', // Sage Muted
          500: '#5A8079',
          600: '#4A7268',
          700: '#2A3F35', // Forest Heritage
          800: '#1F2E28',
          900: '#151D19',
        },
        'burgundy': {
          50: '#F5F0F0',
          100: '#EADCE0',
          200: '#D4B3B8',
          300: '#C9A399', // Rose Dust
          400: '#A88080',
          500: '#8B6D6D',
          600: '#8B5555',
          700: '#8B4545', // Burgundy Elegant
          800: '#6B3434',
          900: '#4A2323',
        },
        'bronze': {
          50: '#FDFBF7',
          100: '#FAF5EC',
          200: '#F5ECDF',
          300: '#E8DCC9',
          400: '#D4B896',
          500: '#C4A880',
          600: '#A89968', // Bronze Subtle
          700: '#8B8265',
          800: '#6B6452',
          900: '#4A4438',
        },
        'taupe': {
          50: '#F5F3F1',
          100: '#E8E4DF',
          200: '#D4CBBF',
          300: '#B8A99E',
          400: '#A89A8F',
          500: '#8B8680', // Taupe Medium
          600: '#7A7670',
          700: '#6B6560',
          800: '#4A4440',
          900: '#2A2620',
        },
      },
      backgroundColor: {
        'old-money-bg': '#FAFAF8',
        'old-money-card': '#F5E6D3',
        'old-money-sidebar': '#2A3F35',
      },
      textColor: {
        'old-money-primary': '#3E3A34',
        'old-money-secondary': '#8B8680',
        'old-money-light': '#F5E6D3',
      },
      borderColor: {
        'old-money': '#A89968',
      },
    },
  },
  plugins: [],
}