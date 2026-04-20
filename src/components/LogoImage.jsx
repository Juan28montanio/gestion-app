import { useEffect, useMemo, useState } from "react";
import { SmartProfitIsotype } from "./SmartProfitMark";
import { buildLogoUrlCandidates } from "../utils/logoUrl";

export default function LogoImage({
  url,
  alt,
  className = "",
  imageClassName = "",
  fallbackClassName = "",
}) {
  const candidates = useMemo(() => buildLogoUrlCandidates(url), [url]);
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [url]);

  const currentSrc = candidates[candidateIndex] || "";

  if (!currentSrc) {
    return (
      <div
        className={`flex items-center justify-center bg-[linear-gradient(180deg,#111827_0%,#1f2937_100%)] text-white ${className} ${fallbackClassName}`}
      >
        <SmartProfitIsotype className="h-6 w-6" />
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      onError={() => {
        setCandidateIndex((current) =>
          current < candidates.length - 1 ? current + 1 : current
        );
      }}
      className={imageClassName || className}
    />
  );
}

