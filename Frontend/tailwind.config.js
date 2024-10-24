/** @type {import('tailwindcss').Config} */
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
          '100%': {'background-position-x': '10000px'},
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
  plugins: [aspectRatio, addVariablesForColors, GridAndDotBackgrounds],
};

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
