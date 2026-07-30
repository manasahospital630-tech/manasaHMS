import React from 'react';
import QRCode from 'qrcode';

export const getQrSvgSync = (text: string, sizePx = 58): string => {
  if (!text) {
    return `<svg viewBox="0 0 24 24" width="${sizePx}" height="${sizePx}" fill="none" stroke="#0f172a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`;
  }
  try {
    const qr = QRCode.create(text);
    const matrixSize = qr.modules.size;
    const data = qr.modules.data;
    let path = '';
    for (let r = 0; r < matrixSize; r++) {
      for (let c = 0; c < matrixSize; c++) {
        if (data[r * matrixSize + c]) {
          path += `M${c},${r}h1v1h-1z `;
        }
      }
    }
    return `<svg viewBox="0 0 ${matrixSize} ${matrixSize}" width="${sizePx}" height="${sizePx}" style="display: block;" xmlns="http://www.w3.org/2000/svg"><path d="${path}" fill="#0f172a"/></svg>`;
  } catch (e) {
    console.error('QR creation error:', e);
    return `<svg viewBox="0 0 24 24" width="${sizePx}" height="${sizePx}" fill="none" stroke="#0f172a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`;
  }
};

export const getManasaEmblemSvgString = (sizePx = 70): string => {
  return `
    <div style="display: flex; align-items: center; justify-content: center; width: ${sizePx}px; height: ${sizePx}px;">
      <svg width="${sizePx}" height="${sizePx}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 4 L90 22 V58 L50 94 L10 58 V22 Z" fill="url(#mh-grad-str)" stroke="#1E293B" stroke-width="2"/>
        <path d="M25 68 V32 L44 54 L63 32 V68" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M63 68 V32 L75 46" stroke="#38BDF8" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
        <defs>
          <linearGradient id="mh-grad-str" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stop-color="#0F172A"/>
            <stop offset="1" stop-color="#1E3A8A"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  `;
};

export const getResolvedLogoUrl = (logoUrlInput?: string | null): string | null => {
  if (!logoUrlInput || typeof logoUrlInput !== 'string') return null;
  const trimmed = logoUrlInput.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('data:image')) {
    return trimmed;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const origin = (typeof window !== 'undefined' && window.location.origin.includes('localhost'))
    ? 'http://localhost:5000'
    : (typeof window !== 'undefined' ? window.location.origin : '');

  return `${origin}${cleanPath}`;
};

export const getHospitalLogoHtml = (logoUrlInput?: string | null, heightPx = 70): string => {
  const fallbackSvg = getManasaEmblemSvgString(heightPx);
  const resolvedUrl = getResolvedLogoUrl(logoUrlInput);

  if (resolvedUrl) {
    const cleanFallback = fallbackSvg.replace(/"/g, '&quot;').replace(/\n/g, '');
    return `
      <div style="display: flex; align-items: center; justify-content: flex-start;">
        <img 
          src="${resolvedUrl}" 
          alt="Logo" 
          style="height: ${heightPx}px; max-width: 160px; object-fit: contain;" 
          onerror="this.onerror=null; this.outerHTML='${cleanFallback}';"
        />
      </div>
    `;
  }
  return fallbackSvg;
};

export const getQrCodeHeaderSyncHtml = (verifyUrl: string, s3QrUrl?: string, label = 'VERIFY REPORT'): string => {
  const fallbackSvg = getQrSvgSync(verifyUrl, 58);
  const cleanFallback = fallbackSvg.replace(/"/g, '&quot;').replace(/\n/g, '');
  const qrSrc = s3QrUrl && s3QrUrl.trim() !== '' ? s3QrUrl : `/uploads/qrcodes/qr_report.png`;

  return `
    <div class="qr-header-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 80px; height: 80px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 4px; background: #fff; text-align: center; box-sizing: border-box; flex-shrink: 0; margin-left: 20px;">
      <img 
        src="${qrSrc}" 
        alt="${label}" 
        style="width: 58px; height: 58px; display: block;" 
        onerror="this.onerror=null; this.outerHTML='${cleanFallback}';" 
      />
      <span style="font-size: 6px; font-weight: bold; color: #64748b; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.2px;">${label}</span>
    </div>
  `;
};

export const ManasaLogoSvg: React.FC<{ size?: number }> = ({ size = 70 }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 4 L90 22 V58 L50 94 L10 58 V22 Z" fill="url(#mh-grad-jsx)" stroke="#1E293B" strokeWidth="2"/>
      <path d="M25 68 V32 L44 54 L63 32 V68" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M63 68 V32 L75 46" stroke="#38BDF8" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
      <defs>
        <linearGradient id="mh-grad-jsx" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0F172A"/>
          <stop offset="1" stopColor="#1E3A8A"/>
        </linearGradient>
      </defs>
    </svg>
  </div>
);
