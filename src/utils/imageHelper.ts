export function getCompatibleImageUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();

  // Check if it's a Google Drive URL
  if (
    trimmed.includes('drive.google.com') ||
    trimmed.includes('docs.google.com') ||
    trimmed.includes('googleusercontent.com')
  ) {
    let fileId = '';

    // Format 1: /file/d/FILE_ID/
    const fileDRegex = /\/file\/d\/([a-zA-Z0-9_-]+)/;
    const matchD = trimmed.match(fileDRegex);
    if (matchD && matchD[1]) {
      fileId = matchD[1];
    }

    // Format 2: ?id=FILE_ID or &id=FILE_ID
    if (!fileId) {
      const idRegex = /[?&]id=([a-zA-Z0-9_-]+)/;
      const matchId = trimmed.match(idRegex);
      if (matchId && matchId[1]) {
        fileId = matchId[1];
      }
    }

    // Format 3: googleusercontent.com/d/FILE_ID
    if (!fileId) {
      const lhDRegex = /googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/;
      const matchLhD = trimmed.match(lhDRegex);
      if (matchLhD && matchLhD[1]) {
        fileId = matchLhD[1];
      }
    }

    if (fileId) {
      // Return the cookieless googleusercontent direct link format
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
  }

  return trimmed;
}

export function convertGoogleDriveUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();

  if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
    const fileDRegex = /\/file\/d\/([a-zA-Z0-9_-]+)/;
    const matchD = trimmed.match(fileDRegex);
    if (matchD && matchD[1]) {
      return `https://drive.google.com/uc?export=view&id=${matchD[1]}`;
    }

    const idRegex = /[?&]id=([a-zA-Z0-9_-]+)/;
    const matchId = trimmed.match(idRegex);
    if (matchId && matchId[1]) {
      return `https://drive.google.com/uc?export=view&id=${matchId[1]}`;
    }
  }
  return trimmed;
}
