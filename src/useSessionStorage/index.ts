import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useState } from "react";
import type { inferParser, Parser } from "../internals/parser";
import { getParseFn } from "../internals/parser";
import useEventCallback from "../internals/hooks/useEventCallback";
import useEventListener from "../internals/hooks/useEventListener";

declare global {
  interface WindowEventMap {
    "session-storage": CustomEvent;
  }
}

type SetValue<T> = Dispatch<SetStateAction<T>>;

type StorageConfig<T> = {
  key: string;
  initialValue: T;
  schema?: T extends inferParser<infer TParser>["out"] ? TParser : never;
  replace?: boolean;
};


function useSessionStorage<T>(
  config: StorageConfig<T>,
): [T, SetValue<T>] {
  const { schema, initialValue, replace, key } = config || {};
  // Get from session storage then
  // parse stored json or return initialValue
  const readValue = useCallback((): T => {
    // Prevent build error "window is undefined" but keep keep working
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.sessionStorage.getItem(key);
      return item ? (parse(item, schema) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading sessionStorage key “${key}”:`, error);

      if (replace) {
        window.sessionStorage.setItem(key, JSON.stringify(initialValue));

        // We dispatch a custom event so every useSessionStorage hook are notified
        window.dispatchEvent(new Event("session-storage"));
      }

      return initialValue;
    }
  }, [initialValue, key]);

  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to sessionStorage.
  const setValue: SetValue<T> = useEventCallback((value) => {
    // Prevent build error "window is undefined" but keeps working
    if (typeof window == "undefined") {
      console.warn(
        `Tried setting sessionStorage key “${key}” even though environment is not a client`,
      );
    }

    try {
      // Allow value to be a function so we have the same API as useState
      const newValue = value instanceof Function ? value(storedValue) : value;

      // Save to session storage
      window.sessionStorage.setItem(key, JSON.stringify(newValue));

      // Save state
      setStoredValue(newValue);

      // We dispatch a custom event so every useSessionStorage hook are notified
      window.dispatchEvent(new Event("session-storage"));
    } catch (error) {
      console.warn(`Error setting sessionStorage key “${key}”:`, error);
    }
  });

  useEffect(() => {
    setStoredValue(readValue());
  }, []);

  const handleStorageChange = useCallback(
    (event: StorageEvent | CustomEvent) => {
      if ((event as StorageEvent)?.key && (event as StorageEvent).key !== key) {
        return;
      }
      setStoredValue(readValue());
    },
    [key, readValue],
  );

  // this only works for other documents, not the current one
  useEventListener("storage", handleStorageChange);

  // this is a custom event, triggered in writeValueTosessionStorage
  // See: useSessionStorage()
  useEventListener("session-storage", handleStorageChange);

  return [storedValue, setValue];
}

export default useSessionStorage;

function parse<T>(value: string | null, schema?: Parser): T | undefined {
  try {
    if (value === "undefined") return undefined;
    let result = JSON.parse(value ?? "");
    if (schema) {
      const parser = getParseFn<T>(schema);
      return parser(result);
    }
    return result as T;
  } catch {
    console.log("parsing error on", { value });
    return undefined;
  }
}

