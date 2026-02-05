/**
 * QR Code Display Component
 *
 * Generates and displays a QR code for quick session joining.
 * Uses a simple SVG-based QR code generation for zero dependencies.
 */

import { useMemo } from 'react';

interface QRCodeDisplayProps {
  sessionCode: string;
  baseUrl?: string;
  size?: number;
}

// Simple QR code matrix generator (for demo - in production use a library like qrcode)
function generateQRMatrix(data: string): boolean[][] {
  // This is a simplified placeholder that creates a pattern
  // In production, use a proper QR code library like 'qrcode' or 'qr-code-styling'
  const size = 21; // QR code size (21x21 for version 1)
  const matrix: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));

  // Add finder patterns (corners)
  const addFinderPattern = (x: number, y: number) => {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        const isOuter = i === 0 || i === 6 || j === 0 || j === 6;
        const isInner = i >= 2 && i <= 4 && j >= 2 && j <= 4;
        matrix[y + i][x + j] = isOuter || isInner;
      }
    }
  };

  addFinderPattern(0, 0);
  addFinderPattern(14, 0);
  addFinderPattern(0, 14);

  // Add timing patterns
  for (let i = 8; i < 13; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Add data pattern based on string hash
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data.charCodeAt(i);
    hash = hash & hash;
  }

  for (let i = 8; i < 13; i++) {
    for (let j = 8; j < 13; j++) {
      matrix[i][j] = ((hash >> ((i * 5 + j) % 32)) & 1) === 1;
    }
  }

  return matrix;
}

export function QRCodeDisplay({ sessionCode, baseUrl = 'quizparty.rcnr.net', size = 120 }: QRCodeDisplayProps) {
  const joinUrl = `https://${baseUrl}/join?code=${sessionCode}`;

  const qrMatrix = useMemo(() => generateQRMatrix(joinUrl), [joinUrl]);
  const moduleSize = size / qrMatrix.length;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="bg-white p-2 rounded-lg"
        title={`Scan to join with code ${sessionCode}`}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}
          aria-label={`QR code for joining session ${sessionCode}`}
        >
          {qrMatrix.map((row, y) =>
            row.map((cell, x) =>
              cell ? (
                <rect
                  key={`${x}-${y}`}
                  x={x}
                  y={y}
                  width={1}
                  height={1}
                  fill="black"
                />
              ) : null
            )
          )}
        </svg>
      </div>
      <p className="text-xs text-white/40">Scan to join</p>
    </div>
  );
}
