/**
 * Certificate Generator
 * Generates downloadable recovery certificates for milestone achievements
 */

import { Habit } from './types';

export interface Certificate {
  id: string;
  habitName: string;
  streakLength: number;
  awardedDate: string;
  recipientName: string;
}

/**
 * Check if a habit has earned a 7-day streak certificate
 * Returns certificate data if earned, null otherwise
 */
export function checkStreakCertificate(habit: Habit, recipientName: string): Certificate | null {
  // Award certificate at 7-day streak milestones
  const streakMilestones = [7, 14, 21, 30, 50, 100];

  if (streakMilestones.includes(habit.streak)) {
    return {
      id: `cert_${habit.id}_${habit.streak}_${Date.now()}`,
      habitName: habit.name,
      streakLength: habit.streak,
      awardedDate: new Date().toISOString().split('T')[0],
      recipientName,
    };
  }

  return null;
}

/**
 * Generate SVG certificate as data URI
 * Can be embedded in img tag or converted to PDF
 */
export function generateCertificateSVG(cert: Certificate): string {
  const width = 1200;
  const height = 800;

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f8f9fa;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#e9ecef;stop-opacity:1" />
        </linearGradient>
        <pattern id="dots" x="20" y="20" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="1" fill="#dee2e6" opacity="0.5"/>
        </pattern>
      </defs>

      <rect width="${width}" height="${height}" fill="url(#bgGradient)"/>
      <rect width="${width}" height="${height}" fill="url(#dots)"/>

      <!-- Border -->
      <rect x="40" y="40" width="${width - 80}" height="${height - 80}" fill="none" stroke="#2c3e50" stroke-width="4" rx="10"/>
      <rect x="50" y="50" width="${width - 100}" height="${height - 100}" fill="none" stroke="#e8a87c" stroke-width="2" rx="5"/>

      <!-- Decorative corners -->
      <circle cx="70" cy="70" r="8" fill="#e8a87c"/>
      <circle cx="${width - 70}" cy="70" r="8" fill="#e8a87c"/>
      <circle cx="70" cy="${height - 70}" r="8" fill="#e8a87c"/>
      <circle cx="${width - 70}" cy="${height - 70}" r="8" fill="#e8a87c"/>

      <!-- Title -->
      <text x="${width / 2}" y="120" font-size="48" font-weight="bold" text-anchor="middle" fill="#2c3e50" font-family="Georgia, serif">
        🏆 Recovery Certificate
      </text>

      <!-- Subtitle -->
      <text x="${width / 2}" y="170" font-size="24" text-anchor="middle" fill="#555" font-family="Georgia, serif">
        Awarded for Commitment to Growth
      </text>

      <!-- Certificate Body -->
      <text x="${width / 2}" y="280" font-size="18" text-anchor="middle" fill="#666" font-family="Georgia, serif">
        This certifies that
      </text>

      <!-- Recipient Name -->
      <text x="${width / 2}" y="360" font-size="42" font-weight="bold" text-anchor="middle" fill="#2c3e50" font-family="Georgia, serif">
        ${escapeXml(cert.recipientName)}
      </text>

      <!-- Achievement Text -->
      <text x="${width / 2}" y="440" font-size="18" text-anchor="middle" fill="#666" font-family="Georgia, serif">
        has successfully maintained a
      </text>

      <!-- Streak Badge -->
      <circle cx="${width / 2}" cy="530" r="50" fill="#27ae60"/>
      <text x="${width / 2}" y="535" font-size="36" font-weight="bold" text-anchor="middle" fill="white" font-family="Arial, sans-serif">
        ${cert.streakLength}
      </text>
      <text x="${width / 2}" y="565" font-size="14" text-anchor="middle" fill="white" font-family="Arial, sans-serif">
        Day Streak
      </text>

      <!-- Habit Name -->
      <text x="${width / 2}" y="630" font-size="18" text-anchor="middle" fill="#666" font-family="Georgia, serif">
        with the habit:
      </text>

      <text x="${width / 2}" y="680" font-size="28" font-weight="bold" text-anchor="middle" fill="#2c3e50" font-family="Georgia, serif">
        "${escapeXml(cert.habitName)}"
      </text>

      <!-- Date -->
      <text x="${width / 2}" y="750" font-size="14" text-anchor="middle" fill="#999" font-family="Arial, sans-serif">
        ${formatDate(cert.awardedDate)}
      </text>

      <!-- Decorative line -->
      <line x1="200" y1="700" x2="${width - 200}" y2="700" stroke="#e8a87c" stroke-width="2"/>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Escape XML special characters for safe SVG embedding
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Format date for display on certificate
 */
function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/**
 * Download certificate as PNG (requires canvas API - browser only)
 */
export async function downloadCertificateAsImage(cert: Certificate, filename: string): Promise<void> {
  try {
    const svgData = generateCertificateSVG(cert);

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('Could not get canvas context');

    // Load SVG as image
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);

      // Download as PNG
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `${filename}.png`;
      link.click();
    };
    img.onerror = () => {
      throw new Error('Failed to load SVG image');
    };
    img.src = svgData;
  } catch (error) {
    console.error('Failed to download certificate:', error);
    throw error;
  }
}

/**
 * Get displayed achievement text for streak length
 */
export function getStreakAchievementText(streakLength: number): string {
  const achievements: Record<number, string> = {
    7: '🎯 You\'ve built momentum!',
    14: '💪 You\'re unstoppable!',
    21: '🔥 Three weeks of pure dedication!',
    30: '🏆 A full month of commitment!',
    50: '⭐ 50 days and counting!',
    100: '👑 100 days! You\'re a legend!',
  };

  return achievements[streakLength] || `🎉 ${streakLength} days of excellence!`;
}
