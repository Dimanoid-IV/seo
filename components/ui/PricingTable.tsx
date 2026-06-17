import { Check, X } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { pricingComparison } from "@/data/pricing";

type PricingTableProps = {
  locale: Locale;
  title: string;
};

function renderCell(value: boolean | string) {
  if (typeof value === "string") {
    return <span className="text-sm font-medium text-slate-300">{value}</span>;
  }
  return value ? (
    <Check className="mx-auto h-5 w-5 text-cyan-400" />
  ) : (
    <X className="mx-auto h-5 w-5 text-slate-600" />
  );
}

export function PricingTable({ locale, title }: PricingTableProps) {
  return (
    <div className="mt-16">
      <h3 className="mb-8 text-center text-2xl font-bold text-white">{title}</h3>
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              {pricingComparison.headers[locale].map((header, i) => (
                <th
                  key={header}
                  className={`px-4 py-4 text-left font-semibold text-white ${
                    i === 0 ? "" : "text-center"
                  }`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pricingComparison.rows.map((row) => (
              <tr
                key={row.feature.en}
                className="border-b border-white/5 transition-colors hover:bg-white/[0.02]"
              >
                <td className="px-4 py-3 text-slate-300">{row.feature[locale]}</td>
                {row.values.map((val, i) => (
                  <td key={i} className="px-4 py-3 text-center">
                    {renderCell(val)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
