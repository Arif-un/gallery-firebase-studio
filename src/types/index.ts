
import type { Layout } from 'react-grid-layout';

export interface UploadedImage {
  id: string;
  src: string;
  name: string;
  width: number; // natural width
  height: number; // natural height
  type: string; // file type e.g. image/jpeg
  aiHint?: string; // Optional: keywords for AI image search
}

// ReactGridLayout.Layouts is an object with breakpoints as keys: {lg: Layout[], md: Layout[], ...}
// We'll manage a single layout array for simplicity, ResponsiveGridLayout can take this.
export type CustomLayoutItem = Layout;
