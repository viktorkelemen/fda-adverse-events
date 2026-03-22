import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MedicationInput } from "../components/MedicationInput";
import { DrugReport } from "../components/DrugReport";
import { InteractionReport } from "../components/InteractionReport";

const mockSuggestions = { suggestions: [] as string[], loading: false };
vi.mock("../hooks/useDrugSuggestions", () => ({
  useDrugSuggestions: () => mockSuggestions,
}));

describe("MedicationInput", () => {
  it("calls onAdd with uppercased name when Add is clicked", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    const onRemove = vi.fn();

    render(
      <MedicationInput medications={[]} onAdd={onAdd} onRemove={onRemove} />
    );

    const input = screen.getByPlaceholderText(/enter medication/i);
    await user.type(input, "aspirin");
    await user.click(screen.getByText("Add"));

    expect(onAdd).toHaveBeenCalledWith("ASPIRIN");
  });

  it("calls onAdd when Enter is pressed", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();

    render(
      <MedicationInput medications={[]} onAdd={onAdd} onRemove={vi.fn()} />
    );

    const input = screen.getByPlaceholderText(/enter medication/i);
    await user.type(input, "ibuprofen{Enter}");

    expect(onAdd).toHaveBeenCalledWith("IBUPROFEN");
  });

  it("does not add empty names", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();

    render(
      <MedicationInput medications={[]} onAdd={onAdd} onRemove={vi.fn()} />
    );

    await user.click(screen.getByText("Add"));
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("does not add duplicate medications", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();

    render(
      <MedicationInput
        medications={[{ id: "1", name: "ASPIRIN" }]}
        onAdd={onAdd}
        onRemove={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText(/enter medication/i);
    await user.type(input, "aspirin");
    await user.click(screen.getByText("Add"));

    expect(onAdd).not.toHaveBeenCalled();
  });

  it("renders medication pills with remove buttons", () => {
    const medications = [
      { id: "1", name: "ASPIRIN" },
      { id: "2", name: "IBUPROFEN" },
    ];

    render(
      <MedicationInput
        medications={medications}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByText("ASPIRIN")).toBeInTheDocument();
    expect(screen.getByText("IBUPROFEN")).toBeInTheDocument();
    expect(screen.getByLabelText("Remove ASPIRIN")).toBeInTheDocument();
  });

  it("calls onRemove when remove button is clicked", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();

    render(
      <MedicationInput
        medications={[{ id: "abc", name: "ASPIRIN" }]}
        onAdd={vi.fn()}
        onRemove={onRemove}
      />
    );

    await user.click(screen.getByLabelText("Remove ASPIRIN"));
    expect(onRemove).toHaveBeenCalledWith("abc");
  });

  it("shows suggestion dropdown when suggestions are available", async () => {
    const user = userEvent.setup();
    mockSuggestions.suggestions = ["Aspirin", "Aspirin / Caffeine"];
    mockSuggestions.loading = false;

    render(
      <MedicationInput medications={[]} onAdd={vi.fn()} onRemove={vi.fn()} />
    );

    const input = screen.getByPlaceholderText(/enter medication/i);
    await user.type(input, "asp");

    expect(screen.getByText("Aspirin")).toBeInTheDocument();
    expect(screen.getByText("Aspirin / Caffeine")).toBeInTheDocument();

    mockSuggestions.suggestions = [];
  });

  it("adds medication when a suggestion is clicked", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    mockSuggestions.suggestions = ["Aspirin"];
    mockSuggestions.loading = false;

    render(
      <MedicationInput medications={[]} onAdd={onAdd} onRemove={vi.fn()} />
    );

    const input = screen.getByPlaceholderText(/enter medication/i);
    await user.type(input, "asp");
    await user.click(screen.getByText("Aspirin"));

    expect(onAdd).toHaveBeenCalledWith("ASPIRIN");

    mockSuggestions.suggestions = [];
  });

  it("shows loading indicator while fetching suggestions", async () => {
    const user = userEvent.setup();
    mockSuggestions.suggestions = [];
    mockSuggestions.loading = true;

    render(
      <MedicationInput medications={[]} onAdd={vi.fn()} onRemove={vi.fn()} />
    );

    const input = screen.getByPlaceholderText(/enter medication/i);
    await user.type(input, "asp");

    expect(screen.getByText("Searching...")).toBeInTheDocument();

    mockSuggestions.loading = false;
  });
});

describe("DrugReport", () => {
  it("renders drug name and total reports", () => {
    render(
      <DrugReport
        result={{
          drugName: "ASPIRIN",
          totalReports: 601477,
          topReactions: [
            { term: "NAUSEA", count: 500 },
            { term: "HEADACHE", count: 300 },
          ],
        }}
      />
    );

    expect(screen.getByText("ASPIRIN")).toBeInTheDocument();
    expect(screen.getByText("601,477 total reports")).toBeInTheDocument();
  });

  it("renders reaction terms lowercase with counts", () => {
    render(
      <DrugReport
        result={{
          drugName: "ASPIRIN",
          totalReports: 1000,
          topReactions: [{ term: "NAUSEA", count: 500 }],
        }}
      />
    );

    expect(screen.getByText("nausea")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();
  });

  it("renders empty state without errors", () => {
    const { container } = render(
      <DrugReport
        result={{
          drugName: "UNKNOWN",
          totalReports: 0,
          topReactions: [],
        }}
      />
    );

    expect(screen.getByText("UNKNOWN")).toBeInTheDocument();
    expect(container.querySelector(".space-y-2")?.children).toHaveLength(0);
  });
});

describe("InteractionReport", () => {
  it("renders green card when no co-reported events", () => {
    render(
      <InteractionReport
        result={{
          drugA: "ASPIRIN",
          drugB: "IBUPROFEN",
          coReportedReactions: [],
          coReportCount: 0,
        }}
      />
    );

    expect(
      screen.getByText(/no co-reported adverse events/i)
    ).toBeInTheDocument();
  });

  it("renders amber card with reactions when co-reports exist", () => {
    render(
      <InteractionReport
        result={{
          drugA: "ASPIRIN",
          drugB: "IBUPROFEN",
          coReportedReactions: [{ term: "BLEEDING", count: 150 }],
          coReportCount: 2000,
        }}
      />
    );

    expect(screen.getByText("ASPIRIN + IBUPROFEN")).toBeInTheDocument();
    expect(screen.getByText("2,000 co-reports")).toBeInTheDocument();
    expect(screen.getByText("bleeding")).toBeInTheDocument();
  });

  it("shows green card when reactions exist but coReportedReactions is empty", () => {
    // Edge case: coReportCount > 0 but reactions array empty
    render(
      <InteractionReport
        result={{
          drugA: "A",
          drugB: "B",
          coReportedReactions: [],
          coReportCount: 100,
        }}
      />
    );

    expect(
      screen.getByText(/no co-reported adverse events/i)
    ).toBeInTheDocument();
  });
});
