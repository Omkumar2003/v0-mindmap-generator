// ./lib/mindmap-export.ts

import { toPng, toBlob } from 'html-to-image';
import { getNodesBounds, getViewportForBounds, Node } from 'reactflow';

/**
 * ============================================================================
 * MIND MAP EXPORT UTILITY - FINAL FIXED VERSION
 * ============================================================================
 */

const MIN_EXPORT_WIDTH = 1400;
const MIN_EXPORT_HEIGHT = 1000;

const PADDING = 200;

function prepareEdgesForExport() {

  // Edge container
  const edgeContainer = document.querySelector(
    '.react-flow__edges'
  ) as HTMLElement;

  if (edgeContainer) {
    edgeContainer.style.overflow = 'visible';
    edgeContainer.style.visibility = 'visible';
    edgeContainer.style.opacity = '1';
  }

  // SVG overflow fix
  document.querySelectorAll('svg').forEach((svg) => {
    const el = svg as SVGSVGElement;

    el.style.overflow = 'visible';
    el.style.visibility = 'visible';
  });

  // Force edge visibility
  document
    .querySelectorAll('.react-flow__edge-path')
    .forEach((edge) => {

      const el = edge as SVGPathElement;

      el.style.stroke = '#222';
      el.style.strokeWidth = '2px';
      el.style.fill = 'none';

      el.style.opacity = '1';
      el.style.visibility = 'visible';

      el.style.display = 'block';
    });
}

function getExportData(nodes: Node[]) {

  const bounds = getNodesBounds(nodes);

  // Dynamic export size
  const graphWidth = bounds.width + PADDING * 2;
  const graphHeight = bounds.height + PADDING * 2;

  const exportWidth = Math.max(
    MIN_EXPORT_WIDTH,
    graphWidth
  );

  const exportHeight = Math.max(
    MIN_EXPORT_HEIGHT,
    graphHeight
  );

  // Expanded bounds with padding
  const viewport = getViewportForBounds(
    {
      x: bounds.x - PADDING,
      y: bounds.y - PADDING,
      width: graphWidth,
      height: graphHeight,
    },
    exportWidth,
    exportHeight,
    0.1,
    2
  );

  return {
    exportWidth,
    exportHeight,
    viewport,
  };
}

export async function exportMindMapAsImage(
  nodes: Node[],
  fileName: string = 'mindmap'
): Promise<void> {

  const viewportElement = document.querySelector(
    '.react-flow__viewport'
  ) as HTMLElement;

  if (!viewportElement) {
    throw new Error('React Flow viewport not found.');
  }

  try {

    prepareEdgesForExport();

    const {
      exportWidth,
      exportHeight,
      viewport,
    } = getExportData(nodes);

    const dataUrl = await toPng(viewportElement, {

      backgroundColor: '#ffffff',

      width: exportWidth,
      height: exportHeight,

      pixelRatio: 2,

      cacheBust: true,
      skipFonts: true,

      style: {

        width: `${exportWidth}px`,
        height: `${exportHeight}px`,

        transform: `
          translate(${viewport.x}px, ${viewport.y}px)
          scale(${viewport.zoom})
        `,

        transformOrigin: '0 0',

        overflow: 'visible',

        // Edge vars
        '--xy-edge-stroke': '#222',
        '--xy-edge-stroke-width': '2px',

        // Node colors
        '--background': '#ffffff',
        '--foreground': '#000000',

        '--card': '#111827',
        '--card-foreground': '#ffffff',

        '--primary': '#111827',
        '--border': '#374151',

        fontFamily: 'sans-serif',

      } as any,

      filter: (node) => {

        const exclusionClasses = [
          'react-flow__controls',
          'react-flow__minimap',
          'react-flow__panel',
        ];

        return !exclusionClasses.some((cls) =>
          (node as HTMLElement)
            .classList
            ?.contains(cls)
        );
      },
    });

    const downloadLink = document.createElement('a');

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, 19);

    downloadLink.download =
      `${fileName}_${timestamp}.png`;

    downloadLink.href = dataUrl;

    document.body.appendChild(downloadLink);

    downloadLink.click();

    document.body.removeChild(downloadLink);

  } catch (error) {

    console.error(
      '[Export Utility] Capture failed:',
      error
    );

    throw error;
  }
}

export async function copyMindMapToClipboard(
  nodes: Node[]
): Promise<void> {

  const viewportElement = document.querySelector(
    '.react-flow__viewport'
  ) as HTMLElement;

  if (!viewportElement || nodes.length === 0) {
    return;
  }

  try {

    prepareEdgesForExport();

    const {
      exportWidth,
      exportHeight,
      viewport,
    } = getExportData(nodes);

    const blob = await toBlob(viewportElement, {

      backgroundColor: '#ffffff',

      width: exportWidth,
      height: exportHeight,

      pixelRatio: 2,

      cacheBust: true,
      skipFonts: true,

      style: {

        width: `${exportWidth}px`,
        height: `${exportHeight}px`,

        transform: `
          translate(${viewport.x +100}px, ${viewport.y}px)
          scale(${viewport.zoom})
        `,

        transformOrigin: '0 0',

        overflow: 'visible',

        '--xy-edge-stroke': '#222',
        '--xy-edge-stroke-width': '2px',

        fontFamily: 'sans-serif',

      } as any,
    });

    if (blob) {

      const data = [
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ];

      await navigator.clipboard.write(data);
    }

  } catch (error) {

    console.error(
      '[Export Utility] Clipboard copy failed:',
      error
    );

    throw error;
  }
}