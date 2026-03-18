import Aura from "@primeuix/themes/aura";
import { definePreset } from "@primeuix/themes";

const customPreset = definePreset(Aura, {
  semantic: {
    primary: {
      0: "#ffffff",
      50: "{cyan.50}",
      100: "{cyan.100}",
      200: "{cyan.200}",
      300: "{cyan.300}",
      400: "{cyan.400}",
      500: "{cyan.500}",
      600: "{cyan.600}",
      700: "{cyan.700}",
      800: "{cyan.800}",
      900: "{cyan.900}",
      950: "{cyan.950}",
    },

    colorScheme: {
      light: {
        surface: {
          0: "#ffffff",
          50: "{zinc.50}",
          100: "{zinc.100}",
          200: "{zinc.200}",
          300: "{zinc.300}",
          400: "{zinc.400}",
          500: "{zinc.500}",
          600: "{zinc.600}",
          700: "{zinc.700}",
          800: "{zinc.800}",
          900: "{zinc.900}",
          950: "{zinc.950}",
        },
        primary: {
          color: "{primary.500}",
          contrastColor: "#ffffff",
          hoverColor: "{primary.600}",
          activeColor: "{primary.700}",
        },
        highlight: {
          background: "{primary.50}",
          focusBackground: "{primary.100}",
          color: "{primary.700}",
          focusColor: "{primary.800}",
        },
        focusRing: {
          color: "color-mix(in srgb, {primary.500}, transparent 70%)",
        },
        performance: {
          oral: {
            color: "white",
            background: "lightskyblue",
            border: "lightskyblue",
            text: "lightskyblue",
          },
          special: {
            color: "white",
            background: "lightgreen",
            border: "lightgreen",
            text: "lightgreen",
          },
          test: {
            color: "white",
            background: "lightcoral",
            border: "lightcoral",
            text: "lightcoral",
          },
        },
      },

      dark: {
        surface: {
          0: "#ffffff",
          50: "{zinc.50}",
          100: "{zinc.100}",
          200: "{zinc.200}",
          300: "{zinc.300}",
          400: "{zinc.400}",
          500: "{zinc.500}",
          600: "{zinc.600}",
          700: "{zinc.700}",
          800: "{zinc.800}",
          900: "{zinc.900}",
          950: "{zinc.950}",
        },
        primary: {
          color: "{primary.400}",
          contrastColor: "{surface.900}",
          hoverColor: "{primary.300}",
          activeColor: "{primary.200}",
        },
        highlight: {
          background: "color-mix(in srgb, {primary.400}, transparent 84%)",
          focusBackground: "color-mix(in srgb, {primary.400}, transparent 76%)",
          color: "rgba(255,255,255,.87)",
          focusColor: "rgba(255,255,255,.87)",
        },
        focusRing: {
          color: "color-mix(in srgb, {primary.400}, transparent 70%)",
        },
        performance: {
          oral: {
            color: "white",
            background: "{sky.600}",
            border: "{sky.600}",
            text: "{sky.600}",
          },
          special: {
            color: "white",
            background: "{green.600}",
            border: "{green.600}",
            text: "{green.600}",
          },
          test: {
            color: "white",
            background: "{red.600}",
            border: "{red.600}",
            text: "{red.600}",
          },
        },
      },
    },
  },
});

export const config = {
  ripple: true,
  theme: {
    preset: customPreset,
    options: {
      prefix: "p",
      darkModeSelector: ".my-app-dark",
      cssLayer: false,
    },
  },
};
