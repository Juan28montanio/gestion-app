import LogoImage from "../../components/LogoImage";
import { SmartProfitIsotype } from "../../components/SmartProfitMark";

export default function BusinessAvatar({ business, className = "h-11 w-11 rounded-2xl" }) {
  if (business?.logo_url) {
    return (
      <LogoImage
        url={business.logo_url}
        alt={business?.name || "Negocio"}
        className={className}
        imageClassName={`${className} object-contain bg-white p-1.5 ring-1 ring-slate-200`}
        fallbackClassName="ring-1 ring-slate-200"
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-[linear-gradient(180deg,#111827_0%,#1f2937_100%)] text-white ring-1 ring-slate-200 ${className}`}
    >
      <SmartProfitIsotype className="h-6 w-6" />
    </div>
  );
}
