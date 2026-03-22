import { useState } from "react";
import type { Medication } from "../types";

interface Props {
  medications: Medication[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
}

export function MedicationInput({ medications, onAdd, onRemove }: Props) {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    const name = input.trim().toUpperCase();
    if (!name) return;
    if (medications.some((m) => m.name === name)) {
      setInput("");
      return;
    }
    onAdd(name);
    setInput("");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Enter medication name (e.g. Aspirin)"
          className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAdd}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Add
        </button>
      </div>

      {medications.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {medications.map((med) => (
            <span
              key={med.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium"
            >
              {med.name}
              <button
                onClick={() => onRemove(med.id)}
                className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
                aria-label={`Remove ${med.name}`}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
