"use client";

import { useCartStore } from "@/stores/cart";

export function useCart() {
  const store = useCartStore();
  return store;
}
