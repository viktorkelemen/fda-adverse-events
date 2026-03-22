import type { DrugInteractionResult } from "../types";

interface Props {
  result: DrugInteractionResult;
}

export function InteractionReport({ result }: Props) {
  if (result.coReportCount === 0) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-4">
        <p className="text-green-800 dark:text-green-200 text-sm">
          <span className="font-medium">{result.drugA}</span> +{" "}
          <span className="font-medium">{result.drugB}</span>: No co-reported
          adverse events found in FAERS.
        </p>
      </div>
    );
  }

  const maxCount = result.coReportedReactions[0]?.count ?? 1;

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
          {result.drugA} + {result.drugB}
        </h3>
        <span className="text-sm text-amber-700 dark:text-amber-300">
          {result.coReportCount.toLocaleString()} co-reports
        </span>
      </div>

      <div className="space-y-2">
        {result.coReportedReactions.map((reaction) => (
          <div key={reaction.term}>
            <div className="flex items-center justify-between text-sm mb-0.5">
              <span className="text-amber-800 dark:text-amber-200 capitalize">
                {reaction.term.toLowerCase()}
              </span>
              <span className="text-amber-600 dark:text-amber-400 tabular-nums">
                {reaction.count.toLocaleString()}
              </span>
            </div>
            <div className="h-2 bg-amber-100 dark:bg-amber-800/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 dark:bg-amber-400 rounded-full"
                style={{ width: `${(reaction.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
