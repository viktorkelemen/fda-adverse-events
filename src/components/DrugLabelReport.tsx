import { useState } from "react";
import type { DrugLabelResult } from "../types";

interface Props {
  result: DrugLabelResult;
}

type SectionKey = "adverseReactions" | "warnings" | "contraindications" | "drugInteractions";

const sections: { key: SectionKey; title: string }[] = [
  { key: "adverseReactions", title: "Adverse Reactions" },
  { key: "warnings", title: "Warnings" },
  { key: "contraindications", title: "Contraindications" },
  { key: "drugInteractions", title: "Drug Interactions" },
];

export function DrugLabelReport({ result }: Props) {
  const [expanded, setExpanded] = useState<SectionKey | null>(
    result.adverseReactions ? "adverseReactions" : null
  );

  const hasAnyData = sections.some((s) => result[s.key]);

  if (!hasAnyData) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {result.drugName}
          </span>
          : No FDA label data found.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {result.brandName ?? result.drugName}
        </h3>
        {result.genericName && result.brandName && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {result.genericName}
          </p>
        )}
      </div>

      <div className="space-y-2">
        {sections.map(({ key, title }) => {
          const content = result[key];
          if (!content) return null;

          const isExpanded = expanded === key;

          return (
            <div
              key={key}
              className="border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpanded(isExpanded ? null : key)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                {title}
                <span className="text-gray-400 dark:text-gray-500 text-xs">
                  {isExpanded ? "collapse" : "expand"}
                </span>
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed prose-sm max-h-64 overflow-y-auto">
                  {content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
