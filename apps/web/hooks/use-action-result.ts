"use client";

import { useEffect, useRef } from "react";

interface ActionResultLike<TData> {
  data?: TData;
  error?: string;
  success: boolean;
}

interface FormStateLike<TData> {
  data?: TData;
  error?: string;
  fieldErrors?: Record<string, string | undefined>;
  status: string;
}

export type ActionResultState<TData> =
  | ActionResultLike<TData>
  | FormStateLike<TData>
  | null;

interface ActionResultHandlers<TData> {
  onError?: (error: string | undefined) => void;
  onSuccess?: (data: TData | undefined) => void;
}

interface NormalizedResult<TData> {
  data: TData | undefined;
  error: string | undefined;
  ok: boolean;
  // A safeParse rejection carries fieldErrors and no root message; those render
  // inline via useActionFieldErrors, so reporting them again would stack a
  // vaguer toast on top of the precise field message.
  reportedByFields: boolean;
  settled: boolean;
}

function normalize<TData>(
  state: ActionResultState<TData>
): NormalizedResult<TData> {
  if (state === null) {
    return {
      data: undefined,
      error: undefined,
      ok: false,
      reportedByFields: false,
      settled: false,
    };
  }
  if ("status" in state) {
    return {
      data: state.data,
      error: state.error,
      ok: state.status === "success",
      reportedByFields:
        state.error === undefined &&
        Object.keys(state.fieldErrors ?? {}).length > 0,
      settled: state.status !== "idle",
    };
  }
  return {
    data: state.data,
    error: state.error,
    ok: state.success,
    reportedByFields: false,
    settled: true,
  };
}

export function useActionResult<TData = unknown>(
  state: ActionResultState<TData>,
  handlers: ActionResultHandlers<TData>
): void {
  const handled = useRef(state);
  const latest = useRef(handlers);
  latest.current = handlers;

  useEffect(() => {
    if (handled.current === state) {
      return;
    }
    handled.current = state;

    const result = normalize(state);
    if (!result.settled) {
      return;
    }
    if (result.ok) {
      latest.current.onSuccess?.(result.data);
    } else if (!result.reportedByFields) {
      latest.current.onError?.(result.error);
    }
  }, [state]);
}
