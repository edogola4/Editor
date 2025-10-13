import { PaletteOptions } from '@mui/material/styles/createPalette';

declare module '@mui/material/styles' {
  interface PaletteColorOptions {
    blue?: string;
    green?: string;
    yellow?: string;
    red?: string;
    purple?: string;
    [key: string]: any;
  }

  interface PaletteOptions {
    accent?: PaletteColorOptions;
  }

  interface Palette {
    accent: PaletteColorOptions;
  }
}
