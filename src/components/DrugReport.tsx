import type { DrugEventResult } from "../types";

interface Props {
  result: DrugEventResult;
}

export function DrugReport({ result }: Props) {
  const maxCount = result.topReactions[0]?.count ?? 1;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {result.drugName}
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {result.totalReports.toLocaleString()} total reports
        </span>
      </div>

      <div className="space-y-2">
        {result.topReactions.map((reaction) => (
          <div key={reaction.term} className="group">
            <div className="flex items-center justify-between text-sm mb-0.5">
              <span className="text-gray-700 dark:text-gray-300 capitalize">
                {reaction.term.toLowerCase()}
              </span>
              <span className="text-gray-500 dark:text-gray-400 tabular-nums">
                {reaction.count.toLocaleString()}
              </span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all"
                style={{ width: `${(reaction.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
