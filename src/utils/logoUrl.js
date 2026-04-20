function extractGoogleDriveFileId(url) {
  if (!url) {
    return "";
  }

  const trimmed = String(url).trim();

  const patterns = [
    /drive\.google\.com\/file\/d\/([^/]+)/i,
    /drive\.google\.com\/open\?id=([^&]+)/i,
    /drive\.google\.com\/uc\?(?:export=[^&]+&)?id=([^&]+)/i,
    /drive\.google\.com\/thumbnail\?id=([^&]+)/i,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname.includes("drive.google.com")) {
      const id = parsed.searchParams.get("id");
      if (id) {
        return id;
      }
    }
  } catch {
    return "";
  }

  return "";
}

export function normalizeLogoUrl(url) {
  const trimmed = String(url || "").trim();
  if (!trimmed) {
    return "";
  }

  const googleDriveId = extractGoogleDriveFileId(trimmed);
  if (googleDriveId) {
    return `https://drive.google.com/thumbnail?id=${googleDriveId}&sz=w1200`;
  }

  return trimmed;
}

export function buildLogoUrlCandidates(url) {
  const trimmed = String(url || "").trim();
  if (!trimmed) {
    return [];
  }

  const googleDriveId = extractGoogleDriveFileId(trimmed);
  if (googleDriveId) {
    return [
      `https://drive.google.com/thumbnail?id=${googleDriveId}&sz=w1200`,
      `https://drive.google.com/uc?export=view&id=${googleDriveId}`,
      `https://lh3.googleusercontent.com/d/${googleDriveId}=w1200`,
      trimmed,
    ];
  }

  return [trimmed];
}

export async function validateLogoUrl(url, timeoutMs = 5000) {
  const candidates = buildLogoUrlCandidates(url);
  if (!candidates.length) {
    return { ok: true, resolvedUrl: "" };
  }

  for (const candidate of candidates) {
    const result = await new Promise((resolve) => {
      const image = new Image();
      const timeoutId = window.setTimeout(() => {
        image.onload = null;
        image.onerror = null;
        resolve(false);
      }, timeoutMs);

      image.onload = () => {
        window.clearTimeout(timeoutId);
        resolve(true);
      };

      image.onerror = () => {
        window.clearTimeout(timeoutId);
        resolve(false);
      };

      image.src = candidate;
    });

    if (result) {
      return { ok: true, resolvedUrl: candidate };
    }
  }

  return {
    ok: false,
    resolvedUrl: "",
    message:
      "No pudimos cargar el logo con ese enlace. Verifica que la imagen sea publica y accesible sin iniciar sesion.",
  };
}
