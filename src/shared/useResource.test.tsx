import React, { act, useLayoutEffect } from "react";
import { createRoot } from "react-dom/client";
import { api } from "./api";
import { useResource } from "./useResource";

jest.mock("./api", () => ({ api: jest.fn() }));
const request = api as jest.Mock;

test("identity changes hide private data on the first render and cancel stale reads", async () => {
  let finishOld: (value: unknown) => void = () => {};
  let oldSignal: AbortSignal | undefined;
  const oldRead = new Promise((resolve) => {
    finishOld = resolve;
  });
  let requests = 0;
  request.mockImplementation(
    (_path: string, options: { signal: AbortSignal }) => {
      requests += 1;
      if (requests === 1) return Promise.resolve("account-one-data");
      if (requests === 2) {
        oldSignal = options.signal;
        return oldRead;
      }
      return Promise.resolve("account-three-data");
    },
  );
  const observed: Array<{ identity: string; value: string | null }> = [];
  function Probe({ identity }: { identity: string }) {
    const resource = useResource<string>("/private-resource", identity);
    useLayoutEffect(() => {
      observed.push({ identity, value: resource.data });
    });
    return <span>{resource.data}</span>;
  }
  const container = document.createElement("div");
  const root = createRoot(container);
  // Native React roots require act; no Testing Library render helper is involved.
  // eslint-disable-next-line testing-library/no-unnecessary-act
  await act(async () => root.render(<Probe identity="one" />));
  expect(container.textContent).toBe("account-one-data");
  // Native React root, not a Testing Library render helper.
  // eslint-disable-next-line testing-library/no-unnecessary-act
  await act(async () => root.render(<Probe identity="two" />));
  expect(observed.find((entry) => entry.identity === "two")?.value).toBeNull();
  // Native React root, not a Testing Library render helper.
  // eslint-disable-next-line testing-library/no-unnecessary-act
  await act(async () => root.render(<Probe identity="three" />));
  expect(oldSignal?.aborted).toBe(true);
  await act(async () => finishOld("late-account-two-data"));
  expect(container.textContent).toBe("account-three-data");
  act(() => root.unmount());
});
