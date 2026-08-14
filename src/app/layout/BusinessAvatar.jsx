import { SmartProfitIsotype } from "../../components/SmartProfitMark";
import LogoImage from "../../components/LogoImage";

export default function BusinessAvatar({ business, className = "h-11 w-11 rounded-lg" }) {
  if (business?.logo_url) {
    return (
      <LogoImage
        url={business.logo_url}
        alt={business?.name || "Negocio"}
        className={className}
        imageClassName={`${className} object-contain bg-white p-1.5 ring-1 ring-emerald-900/10`}
        fallbackClassName="ring-1 ring-slate-200"
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-white p-1.5 ring-1 ring-emerald-900/10 ${className}`}
    >
      <SmartProfitIsotype className="h-full w-full object-contain" />
    </div>
  );
}
