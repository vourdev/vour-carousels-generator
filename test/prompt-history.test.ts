import { describe, it, expect } from "vitest";

/** Pure helper function replicating the prompt history navigation logic */
export function navigateHistory({
  key,
  currentValue,
  promptHistory,
  historyIndex,
  draftInput,
}: {
  key: "ArrowUp" | "ArrowDown";
  currentValue: string;
  promptHistory: string[];
  historyIndex: number;
  draftInput: string;
}): { nextValue: string; nextIndex: number; nextDraft: string } {
  if (key === "ArrowUp") {
    if (promptHistory.length === 0) {
      return { nextValue: currentValue, nextIndex: historyIndex, nextDraft: draftInput };
    }

    if (historyIndex === -1) {
      const nextIndex = 0;
      const nextValue = promptHistory[promptHistory.length - 1 - nextIndex];
      return { nextValue, nextIndex, nextDraft: currentValue };
    } else if (historyIndex < promptHistory.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextValue = promptHistory[promptHistory.length - 1 - nextIndex];
      return { nextValue, nextIndex, nextDraft: draftInput };
    }
  }

  if (key === "ArrowDown") {
    if (historyIndex === -1) {
      return { nextValue: currentValue, nextIndex: historyIndex, nextDraft: draftInput };
    }

    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      const nextValue = promptHistory[promptHistory.length - 1 - nextIndex];
      return { nextValue, nextIndex, nextDraft: draftInput };
    } else if (historyIndex === 0) {
      return { nextValue: draftInput, nextIndex: -1, nextDraft: draftInput };
    }
  }

  return { nextValue: currentValue, nextIndex: historyIndex, nextDraft: draftInput };
}

describe("navigateHistory", () => {
  const history = ["Prompt 1 (oldest)", "Prompt 2", "Prompt 3 (newest)"];

  it("navigates backwards on ArrowUp starting from unsubmitted draft", () => {
    const res1 = navigateHistory({
      key: "ArrowUp",
      currentValue: "My unsubmitted draft",
      promptHistory: history,
      historyIndex: -1,
      draftInput: "",
    });
    expect(res1.nextValue).toBe("Prompt 3 (newest)");
    expect(res1.nextIndex).toBe(0);
    expect(res1.nextDraft).toBe("My unsubmitted draft");

    const res2 = navigateHistory({
      key: "ArrowUp",
      currentValue: res1.nextValue,
      promptHistory: history,
      historyIndex: res1.nextIndex,
      draftInput: res1.nextDraft,
    });
    expect(res2.nextValue).toBe("Prompt 2");
    expect(res2.nextIndex).toBe(1);

    const res3 = navigateHistory({
      key: "ArrowUp",
      currentValue: res2.nextValue,
      promptHistory: history,
      historyIndex: res2.nextIndex,
      draftInput: res2.nextDraft,
    });
    expect(res3.nextValue).toBe("Prompt 1 (oldest)");
    expect(res3.nextIndex).toBe(2);
  });

  it("navigates forwards on ArrowDown and restores the unsubmitted draft", () => {
    // Start at historyIndex 2 ("Prompt 1 (oldest)")
    const res1 = navigateHistory({
      key: "ArrowDown",
      currentValue: "Prompt 1 (oldest)",
      promptHistory: history,
      historyIndex: 2,
      draftInput: "My unsubmitted draft",
    });
    expect(res1.nextValue).toBe("Prompt 2");
    expect(res1.nextIndex).toBe(1);

    const res2 = navigateHistory({
      key: "ArrowDown",
      currentValue: res1.nextValue,
      promptHistory: history,
      historyIndex: res1.nextIndex,
      draftInput: res1.nextDraft,
    });
    expect(res2.nextValue).toBe("Prompt 3 (newest)");
    expect(res2.nextIndex).toBe(0);

    const res3 = navigateHistory({
      key: "ArrowDown",
      currentValue: res2.nextValue,
      promptHistory: history,
      historyIndex: res2.nextIndex,
      draftInput: res2.nextDraft,
    });
    expect(res3.nextValue).toBe("My unsubmitted draft");
    expect(res3.nextIndex).toBe(-1);
  });
});
