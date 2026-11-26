// @vitest-environment jsdom
import * as Dialog from "@radix-ui/react-dialog";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PhotoLightbox } from "./photo-lightbox";

afterEach(cleanup);

const photo = (src: string, alt: string) => ({ src, alt, width: 800, height: 600 });

describe("PhotoLightbox", () => {
  it("shows every photo as a thumbnail without a duplicate-key warning when the same photo appears in several groups", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    // The gallery passes the photos of every group, and the same file can sit in more than one (a room photo also in the overview).
    const images = [photo("/a.jpg", "A"), photo("/b.jpg", "B"), photo("/a.jpg", "A again")];
    render(
      <Dialog.Root open>
        <PhotoLightbox images={images} title="Azure" />
      </Dialog.Root>,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(error.mock.calls.filter(([message]) => String(message).includes("same key"))).toHaveLength(0);
    error.mockRestore();
  });
});
