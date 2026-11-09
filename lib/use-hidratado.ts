import { useSyncExternalStore } from "react";

const sinSuscripcion = () => () => {};

/**
 * Falso en el servidor y en la hidratación, verdadero después. Para lo que
 * depende de un store persistido en localStorage, que el servidor no puede ver.
 */
export function useHidratado() {
  return useSyncExternalStore(sinSuscripcion, () => true, () => false);
}
