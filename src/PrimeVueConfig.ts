import Aura from "@primeuix/themes/aura";
import { definePreset } from "@primeuix/themes";

const customPreset = definePreset(Aura, {
  semantic: {
    primary: {
      0: "{cyan.0}",
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
        errorText: {
          color: "{red.600}",
        },
        list: {
          option: {
            selectedBackground: "{highlight.focusBackground}",
            selectedFocusBackground: "{highlight.focusBackground}",
            selectedColor: "{highlight.focusColor}",
            selectedFocusColor: "{highlight.focusColor}",
          },
        },
        performance: {
          oral: {
            color: "white",
            background: "{sky.400}",
            border: "{sky.400}",
            text: "{sky.400}",
          },
          special: {
            color: "white",
            background: "{green.400}",
            border: "{green.400}",
            text: "{green.400}",
          },
          test: {
            color: "white",
            background: "{red.400}",
            border: "{red.400}",
            text: "{red.400}",
          },
        },
      },

      dark: {
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
        errorText: {
          color: "{red.500}",
        },
        list: {
          option: {
            selectedBackground: "{highlight.focusBackground}",
            selectedFocusBackground: "{highlight.focusBackground}",
            selectedColor: "{highlight.focusColor}",
            selectedFocusColor: "{highlight.focusColor}",
          },
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
  components: {
    tree: {
      node: {
        selectedBackground: "{highlight.focusBackground}",
        selectedColor: "{highlight.focusColor}",
      },
      nodeIcon: {
        selectedColor: "{highlight.focusColor}",
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
