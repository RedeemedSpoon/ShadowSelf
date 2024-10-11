/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors';
import defaultTheme from 'tailwindcss/defaultTheme';
import flattenColorPalette from 'tailwindcss/lib/util/flattenColorPalette';
import aspectRatio from '@tailwindcss/aspect-ratio';

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      animation: {
        'shake-up': 'shake-up-bottom 8s ease-in-out infinite',
      },
      keyframes: {
        'shake-up-bottom': {
          '0%, 100%': {
            transform: 'translateY(0)',
          },
          '50%': {
            transform: 'translateY(-50px)',
          },
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
    fontFamily: {
      sans: ['Inter', ...defaultTheme.fontFamily.sans],
    },
  },
  plugins: [aspectRatio, addVariablesForColors],
};

function addVariablesForColors({addBase, theme}) {
  let allColors = flattenColorPalette(theme('colors'));
  let newVars = Object.fromEntries(Object.entries(allColors).map(([key, val]) => [`--${key}`, val]));

  addBase({
    ':root': newVars,
  });
}
