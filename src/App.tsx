import { useState } from "react";
import type { Medication, DrugEventResult, DrugInteractionResult } from "./types";
import { fetchDrugEvents, fetchDrugInteraction } from "./api";
import { MedicationInput } from "./components/MedicationInput";
import { DrugReport } from "./components/DrugReport";
import { InteractionReport } from "./components/InteractionReport";

function App() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [drugResults, setDrugResults] = useState<DrugEventResult[]>([]);
  const [interactionResults, setInteractionResults] = useState<
    DrugInteractionResult[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMedication = (name: string) => {
    setMedications((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name },
    ]);
  };

  const removeMedication = (id: string) => {
    setMedications((prev) => prev.filter((m) => m.id !== id));
  };

  const analyze = async () => {
    if (medications.length === 0) return;

    setLoading(true);
    setError(null);
    setDrugResults([]);
    setInteractionResults([]);

    try {
      // Fetch individual drug reports (partial failures don't block results)
      const drugSettled = await Promise.allSettled(
        medications.map((m) => fetchDrugEvents(m.name))
      );
      const drugs: DrugEventResult[] = [];
      const failures: string[] = [];
      for (const result of drugSettled) {
        if (result.status === "fulfilled") {
          drugs.push(result.value);
        } else {
          failures.push(result.reason?.message ?? "Unknown error");
        }
      }
      setDrugResults(drugs);

      // Fetch pairwise interactions
      if (medications.length >= 2) {
        const interactionPromises: Promise<DrugInteractionResult>[] = [];
        for (let i = 0; i < medications.length; i++) {
          for (let j = i + 1; j < medications.length; j++) {
            interactionPromises.push(
              fetchDrugInteraction(medications[i].name, medications[j].name)
            );
          }
        }
        const interactionSettled = await Promise.allSettled(interactionPromises);
        const interactions: DrugInteractionResult[] = [];
        for (const result of interactionSettled) {
          if (result.status === "fulfilled") {
            interactions.push(result.value);
          } else {
            failures.push(result.reason?.message ?? "Unknown error");
          }
        }
        setInteractionResults(interactions);
      }

      if (failures.length > 0) {
        setError(`Some queries failed: ${failures.join(", ")}`);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch data from FDA"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            MedCheck
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Explore FDA adverse event reports for your medications
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8 flex-1 w-full">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Your Medications
          </h2>
          <MedicationInput
            medications={medications}
            onAdd={addMedication}
            onRemove={removeMedication}
          />
          <button
            onClick={analyze}
            disabled={medications.length === 0 || loading}
            className="mt-4 px-8 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Analyzing..." : "Analyze Adverse Events"}
          </button>
        </section>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-800 dark:text-red-200 text-sm">
            {error}
          </div>
        )}

        {drugResults.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Individual Drug Reports
            </h2>
            <div className="space-y-4">
              {drugResults.map((result) => (
                <DrugReport key={result.drugName} result={result} />
              ))}
            </div>
          </section>
        )}

        {interactionResults.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Drug Combination Reports
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Adverse events reported when both drugs were taken together. High
              co-report counts may indicate interaction risks worth discussing
              with your doctor.
            </p>
            <div className="space-y-4">
              {interactionResults.map((result) => (
                <InteractionReport
                  key={`${result.drugA}-${result.drugB}`}
                  result={result}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="max-w-4xl mx-auto px-4 pb-8 w-full">
        <div className="text-xs text-gray-400 dark:text-gray-600 border-t border-gray-200 dark:border-gray-800 pt-6">
          <p>
            Data sourced from the{" "}
            <a
              href="https://open.fda.gov/apis/drug/event/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-600 dark:hover:text-gray-400"
            >
              FDA Adverse Event Reporting System (FAERS)
            </a>
            . This tool is for informational purposes only and does not
            constitute medical advice. Always consult your healthcare provider.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
