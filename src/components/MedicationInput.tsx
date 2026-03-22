import { useEffect, useRef, useState } from "react";
import type { Medication } from "../types";
import { useDrugSuggestions } from "../hooks/useDrugSuggestions";

interface Props {
  medications: Medication[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
}

export function MedicationInput({ medications, onAdd, onRemove }: Props) {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { suggestions, loading } = useDrugSuggestions(input);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  useEffect(() => {
    return () => {
      if (blurTimeout.current) clearTimeout(blurTimeout.current);
    };
  }, []);

  const dropdownVisible =
    isFocused && input.trim().length >= 2 && (suggestions.length > 0 || loading);

  const addMedication = (name: string) => {
    const normalized = name.trim().toUpperCase();
    if (!normalized) return;
    if (medications.some((m) => m.name === normalized)) {
      setInput("");
      return;
    }
    onAdd(normalized);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!dropdownVisible || suggestions.length === 0) {
      if (e.key === "Enter") addMedication(input);
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((i) =>
          i < suggestions.length - 1 ? i + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((i) =>
          i > 0 ? i - 1 : suggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          addMedication(suggestions[selectedIndex]);
        } else {
          addMedication(input);
        }
        break;
      case "Escape":
        setIsFocused(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleFocus = () => {
    if (blurTimeout.current) clearTimeout(blurTimeout.current);
    setIsFocused(true);
  };

  const handleBlur = () => {
    blurTimeout.current = setTimeout(() => setIsFocused(false), 150);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setSelectedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="Enter medication name (e.g. Aspirin)"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            role="combobox"
            aria-expanded={dropdownVisible}
            aria-autocomplete="list"
            aria-activedescendant={
              selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined
            }
          />

          {dropdownVisible && (
            <ul
              role="listbox"
              className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden"
            >
              {loading && suggestions.length === 0 ? (
                <li className="px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400">
                  Searching...
                </li>
              ) : (
                suggestions.map((name, i) => (
                  <li
                    key={name}
                    id={`suggestion-${i}`}
                    role="option"
                    aria-selected={i === selectedIndex}
                    className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                      i === selectedIndex
                        ? "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200"
                        : "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      addMedication(name);
                    }}
                  >
                    {name}
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
        <button
          onClick={() => addMedication(input)}
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
