declare module 'bwip-js' {
  export function toCanvas(
    canvas: HTMLCanvasElement,
    options: {
      bcid: string;
      text: string;
      scale?: number;
      height?: number;
      width?: number;
      includetext?: boolean;
      textxalign?: string;
    }
  ): Promise<HTMLCanvasElement>;
}

// Extensão para Fabric.js Canvas
declare global {
  namespace fabric {
    interface Canvas {
      selectionKey?: string | string[];
    }
  }
}
