import { renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { describe, expect, it, vi } from "vitest";
import { useActionResult } from "./use-action-result";

const idle = { status: "idle" } as const;

describe("useActionResult", () => {
  describe("idle states never fire", () => {
    it("skips an idle FormState on mount", () => {
      const onSuccess = vi.fn();
      const onError = vi.fn();

      renderHook(() => useActionResult(idle, { onError, onSuccess }));

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });

    it("skips a null ActionResult on mount", () => {
      const onSuccess = vi.fn();
      const onError = vi.fn();

      renderHook(() => useActionResult(null, { onError, onSuccess }));

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });

    // Recipe B's delete-account flow seeds a { success: false } sentinel rather
    // than null; seeding the guard with the mount state covers both without the
    // caller writing an identity check.
    it("skips a sentinel initial state on mount", () => {
      const onError = vi.fn();
      const sentinel = { success: false };

      renderHook(() => useActionResult(sentinel, { onError }));

      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe("dispatching results", () => {
    it("fires onSuccess with data when a success FormState arrives", () => {
      const onSuccess = vi.fn();
      const { rerender } = renderHook(
        ({ state }) => useActionResult(state, { onSuccess }),
        {
          initialProps: {
            state: idle as { data?: { slug: string }; status: string },
          },
        }
      );

      rerender({ state: { data: { slug: "acme" }, status: "success" } });

      expect(onSuccess).toHaveBeenCalledExactlyOnceWith({ slug: "acme" });
    });

    it("fires onError with the message when an error FormState arrives", () => {
      const onError = vi.fn();
      const { rerender } = renderHook(
        ({ state }) => useActionResult(state, { onError }),
        {
          initialProps: { state: idle as { error?: string; status: string } },
        }
      );

      rerender({ state: { error: "Boom", status: "error" } });

      expect(onError).toHaveBeenCalledExactlyOnceWith("Boom");
    });

    it("reads the success flag on an ActionResult", () => {
      const onSuccess = vi.fn();
      const onError = vi.fn();
      const { rerender } = renderHook(
        ({ state }) => useActionResult(state, { onError, onSuccess }),
        {
          initialProps: {
            state: null as { data?: { removedCount: number }; success: boolean } | null,
          },
        }
      );

      rerender({ state: { data: { removedCount: 3 }, success: true } });
      expect(onSuccess).toHaveBeenCalledExactlyOnceWith({ removedCount: 3 });

      rerender({ state: { success: false } });
      expect(onError).toHaveBeenCalledOnce();
    });
  });

  describe("failures the field layer already reports", () => {
    // A safeParse rejection returns fieldErrors and no root message.
    // useActionFieldErrors renders those inline, so a toast here would stack a
    // vaguer duplicate on top of the precise field message.
    it("stays silent for a fieldErrors-only failure", () => {
      const onError = vi.fn();
      const { rerender } = renderHook(
        ({ state }) => useActionResult(state, { onError }),
        {
          initialProps: {
            state: idle as {
              error?: string;
              fieldErrors?: Record<string, string>;
              status: string;
            },
          },
        }
      );

      rerender({
        state: { fieldErrors: { slug: "already taken" }, status: "error" },
      });

      expect(onError).not.toHaveBeenCalled();
    });

    it("still reports when a root message accompanies fieldErrors", () => {
      const onError = vi.fn();
      const { rerender } = renderHook(
        ({ state }) => useActionResult(state, { onError }),
        {
          initialProps: {
            state: idle as {
              error?: string;
              fieldErrors?: Record<string, string>;
              status: string;
            },
          },
        }
      );

      rerender({
        state: {
          error: "Boom",
          fieldErrors: { slug: "already taken" },
          status: "error",
        },
      });

      expect(onError).toHaveBeenCalledExactlyOnceWith("Boom");
    });

    // ActionResult failures have no field layer, so they always report.
    it("reports a message-less ActionResult failure", () => {
      const onError = vi.fn();
      const { rerender } = renderHook(
        ({ state }) => useActionResult(state, { onError }),
        { initialProps: { state: null as { success: boolean } | null } }
      );

      rerender({ state: { success: false } });

      expect(onError).toHaveBeenCalledExactlyOnceWith(undefined);
    });
  });

  describe("the replay guard", () => {
    // The regression this hook exists to prevent: an unrelated dependency
    // (a revalidated `errors` prop, a re-created onSuccess) changing identity
    // must not replay a side effect for a result already handled.
    it("does not re-fire when only the handler identity changes", () => {
      const onSuccess = vi.fn();
      const success = { status: "success" } as const;
      const { rerender } = renderHook(
        ({ state, tick }) =>
          useActionResult(state, { onSuccess: () => onSuccess(tick) }),
        { initialProps: { state: idle as { status: string }, tick: 0 } }
      );

      rerender({ state: success, tick: 0 });
      expect(onSuccess).toHaveBeenCalledExactlyOnceWith(0);

      rerender({ state: success, tick: 1 });
      rerender({ state: success, tick: 2 });

      expect(onSuccess).toHaveBeenCalledExactlyOnceWith(0);
    });

    it("fires again for a new state object carrying identical content", () => {
      const onError = vi.fn();
      const { rerender } = renderHook(
        ({ state }) => useActionResult(state, { onError }),
        {
          initialProps: { state: idle as { error?: string; status: string } },
        }
      );

      rerender({ state: { error: "Boom", status: "error" } });
      rerender({ state: { error: "Boom", status: "error" } });

      expect(onError).toHaveBeenCalledTimes(2);
    });

    // StrictMode re-runs effect setup on mount; the guard, not the dep array,
    // is what keeps a settled result from firing twice.
    it("fires once for a settled result under StrictMode", () => {
      const onSuccess = vi.fn();
      const { rerender } = renderHook(
        ({ state }) => useActionResult(state, { onSuccess }),
        { initialProps: { state: idle as { status: string } }, wrapper: StrictMode }
      );

      rerender({ state: { status: "success" } });

      expect(onSuccess).toHaveBeenCalledOnce();
    });

    it("invokes the handler from the most recent render", () => {
      const onSuccess = vi.fn();
      const { rerender } = renderHook(
        ({ state, tick }) =>
          useActionResult(state, { onSuccess: () => onSuccess(tick) }),
        { initialProps: { state: idle as { status: string }, tick: 0 } }
      );

      rerender({ state: idle, tick: 7 });
      rerender({ state: { status: "success" }, tick: 7 });

      expect(onSuccess).toHaveBeenCalledExactlyOnceWith(7);
    });
  });

  it("tolerates a missing handler for the branch that fires", () => {
    const onSuccess = vi.fn();
    const { rerender } = renderHook(
      ({ state }) => useActionResult(state, { onSuccess }),
      { initialProps: { state: idle as { error?: string; status: string } } }
    );

    expect(() =>
      rerender({ state: { error: "Boom", status: "error" } })
    ).not.toThrow();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
