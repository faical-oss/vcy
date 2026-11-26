// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { JsonLd } from "./json-ld";

describe("JsonLd", () => {
  it("renders the data as a JSON-LD script and escapes < so it cannot close the tag", () => {
    const { container } = render(<JsonLd data={{ "@type": "Hotel", name: "A</script><b>" }} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script?.innerHTML).not.toContain("</script>");
    expect(JSON.parse(script?.innerHTML ?? "{}").name).toBe("A</script><b>");
  });
});
