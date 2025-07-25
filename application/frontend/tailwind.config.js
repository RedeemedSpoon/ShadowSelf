/** @type {import('tailwindcss').Config} */
import flattenColorPalette from 'tailwindcss/lib/util/flattenColorPalette';
import defaultTheme from 'tailwindcss/defaultTheme';
import aspectRatio from '@tailwindcss/aspect-ratio';
import svgToDataUri from 'mini-svg-data-uri';
import colors from 'tailwindcss/colors';
import forms from '@tailwindcss/forms';

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
        orbit: 'orbit 1.5s ease-in-out calc(var(--index) * 0.1s) infinite',
        progress: 'progress 30s linear infinite',
        sparkle: 'sparkle 12s linear calc(var(--delay) * 0.3s) infinite',
      },
      keyframes: {
        border: {'100%': {transform: 'rotate(-360deg)'}},
        progress: {
          '0%': {width: '0%'},
          '100%': {width: '100%'},
        },
        sparkle: {
          '40%': {opacity: '1'},
          '50%': {opacity: '0'},
          '60%': {opacity: '1'},
        },
        shake: {
          '0%, 100%': {transform: 'translateY(0)'},
          '50%': {transform: 'translateY(-50px)'},
        },
        scroll: {
          '0%': {'background-position-x': '0'},
          '100%': {'background-position-x': '9600px'},
        },
        orbit: {
          '0%': {transform: 'rotate(0deg)'},
          '80%': {transform: 'rotate(360deg)'},
          '100%': {transform: 'rotate(360deg)'},
        },
      },
      colors: {
        primary: colors.indigo,
        neutral: colors.slate,
      },
    },
    fontFamily: {
      sans: ['Inter', ...defaultTheme.fontFamily.sans],
      mono: ['Fira Code', ...defaultTheme.fontFamily.mono],
    },
  },
  plugins: [forms, aspectRatio, addVariablesForColors, GridAndDotBackgrounds, addCustomClasses],
};

function addCustomClasses({addComponents}) {
  addComponents({
    '.alt': {
      color: '#4f46e5',
      backgroundImage: 'none',
      boxShadow: 'none',
      '&:hover': {
        color: '#4338ca',
      },
    },
    '.basic-style': {
      backgroundImage: 'linear-gradient(to bottom, #4f46e5, #4338ca)',
    },
    '.pretty-style': {
      backgroundImage: 'linear-gradient(to right, #0284c7, #4f46e5 30%, #9333ea)',
      color: 'transparent',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
    },
    '.enable': {
      backgroundImage: 'linear-gradient(to bottom, var(--tw-gradient-stops));',
      '--tw-gradient-from': '#16a34a',
      '--tw-gradient-to': '#15803d',
      '--tw-gradient-stops': 'var(--tw-gradient-from), var(--tw-gradient-to)',
      boxShadow: '0 10px 15px rgba(22, 163, 74, 0.5)',
      '&:hover': {
        boxShadow: '0 10px 15px rgba(13, 148, 23, 0.5)',
      },
    },
    '.disable': {
      backgroundImage: 'linear-gradient(to bottom, var(--tw-gradient-stops));',
      '--tw-gradient-from': '#b91c1c',
      '--tw-gradient-to': '#991b1b',
      '--tw-gradient-stops': 'var(--tw-gradient-from), var(--tw-gradient-to)',
      boxShadow: '0 10px 15px rgba(185, 28, 28, 0.5)',
      '&:hover': {
        boxShadow: '0 10px 15px rgba(153, 27, 27, 0.5)',
      },
    },
    '.chosen': {
      backgroundColor: 'rgba(79, 57, 246, 0.65) !important',
      '&:hover': {
        opacity: '1 !important',
      },
    },
    '.hover-gradient-small': {
      backgroundSize: '150% 150%',
      backgroundPosition: '50% 50%',
      '&:hover': {
        backgroundPosition: '100% 100%',
      },
    },
    '.hover-gradient-large': {
      backgroundSize: '200% 200%',
      backgroundPosition: '0% 0%',
      '&:hover': {
        backgroundPosition: '100% 100%',
      },
      '&:disabled': {
        backgroundPosition: '0% 0%',
      },
    },
    '.hover-gradient-large-reverse': {
      backgroundSize: '200% 200%',
      backgroundPosition: '100% 100%',
      '&:hover': {
        backgroundPosition: '0% 0%',
      },
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
      filter: 'drop-shadow(0 5px 15px rgba(var(--shadow-color-rgb), 0.15))',
      transition: 'all 0.5s',
    },
    '.image-shadow:hover': {
      filter: 'drop-shadow(10px 10px 25px rgba(var(--shadow-color-rgb), 0.25))',
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
