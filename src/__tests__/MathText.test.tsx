import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MathText } from "@/components/MathText";

describe("MathText", () => {
  it("renders inline math", () => {
    render(<MathText>{`المعادلة $E=mc^2$`}</MathText>);
    expect(screen.getByText("المعادلة", { exact: false })).toBeInTheDocument();
    // KaTeX renders into <span class="katex">, assert it exists
    expect(document.querySelector(".katex")).toBeTruthy();
  });
});
