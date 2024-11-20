/** @type {import('tailwindcss').Config} */
import forms from '@tailwindcss/forms';
import colors from 'tailwindcss/colors';
import defaultTheme from 'tailwindcss/defaultTheme';
import aspectRatio from '@tailwindcss/aspect-ratio';
import flattenColorPalette from 'tailwindcss/lib/util/flattenColorPalette';
import svgToDataUri from 'mini-svg-data-uri';

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      backgroundSize: {'size-200': '200% 200%'},
      backgroundPosition: {'pos-0': '0% 0%', 'pos-100': '100% 100%'},
      boxShadow: {'8xl': '0 0 30px 30px rgba(0, 0, 0, 0.20)'},
      animation: {
        border: 'border 7s linear infinite',
        shake: 'shake 8s ease-in-out infinite',
        scroll: 'scroll 180s linear infinite',
      },
      keyframes: {
        border: {'100%': {transform: 'rotate(-360deg)'}},
        shake: {
          '0%, 100%': {transform: 'translateY(0)'},
          '50%': {transform: 'translateY(-50px)'},
        },
        scroll: {
          '0%': {'background-position-x': '0'},
          '100%': {'background-position-x': '9600px'},
        },
      },
      colors: {
        primary: colors.indigo,
        neutral: colors.slate,
        success: colors.green,
        info: colors.yellow,
        alert: colors.red,
      },
    },
    fontFamily: {sans: ['Inter', ...defaultTheme.fontFamily.sans]},
  },
  plugins: [forms, aspectRatio, addVariablesForColors, GridAndDotBackgrounds, addCustomClasses],
};

function addCustomClasses({addComponents}) {
  addComponents({
    '.basic-style': {
      backgroundImage:
        'linear-gradient(to bottom,var(--tw-gradient-stops)); --tw-gradient-from: #4f46e5 var(--tw-gradient-from-position); --tw-gradient-to: rgba(79,70,229,0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from),var(--tw-gradient-to); --tw-gradient-to: #4338ca var(--tw-gradient-to-position); ',
    },
    '.pretty-style': {
      backgroundImage:
        'linear-gradient(to right,var(--tw-gradient-stops)); --tw-gradient-from: #0284c7 var(--tw-gradient-from-position); --tw-gradient-to: rgba(2,132,199,0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from),var(--tw-gradient-to); --tw-gradient-to: rgba(79,70,229,0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from),#4f46e5 var(--tw-gradient-via-position),var(--tw-gradient-to); --tw-gradient-via-position: 30%; --tw-gradient-to: #9333ea var(--tw-gradient-to-position);',
      color: 'transparent',
      backgroundClip: 'text',
      webkitBackgroundClip: 'text',
    },
    '.small-icon': {
      height: '2rem',
      width: '2rem',
      cursor: 'pointer',
      fill: 'currentColor',
      outline: 'none',
      transition: 'transform 0.5s',
    },
    '.small-aura': {
      borderRadius: '100%',
      backgroundColor: 'transparent',
      padding: '0.5rem',
      transition: 'background - color 0.5s',
    },
    '.small-aura:hover': {
      backgroundColor: 'rgba(153, 153, 153, 0.15)',
    },
    '.image-shadow': {
      filter: 'drop-shadow(0 5px 15px rgba(148, 163, 184, 0.15))',
      transition: 'all 0.5s',
    },
    '.image-shadow:hover': {
      filter: 'drop-shadow(10px 10px 25px rgba(148, 163, 184, 0.25))',
    },
    '.no-scrollbar': {
      msOverflowStyle: 'none',
      scrollbarWidth: 'none',
    },
    '.no-scrollbar::-webkit-scrollbar': {
      display: 'none',
    },
  });
}

function GridAndDotBackgrounds({matchUtilities, theme}) {
  matchUtilities(
    {
      'bg-grid': (value) => ({
        backgroundImage: `url("${svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="${value}"><path d="M0 .5H31.5V32"/></svg>`)}")`,
      }),
    },
    {values: flattenColorPalette(theme('backgroundColor')), type: 'color'},
  );
}

function addVariablesForColors({addBase, theme}) {
  let allColors = flattenColorPalette(theme('colors'));
  let newVars = Object.fromEntries(Object.entries(allColors).map(([key, val]) => [`--${key}`, val]));

  addBase({':root': newVars});
}
