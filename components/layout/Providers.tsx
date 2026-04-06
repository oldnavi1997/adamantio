"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { CartDrawer } from "@/components/cart/CartDrawer";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <CartDrawer />
      <Toaster position="top-right" richColors />
    </SessionProvider>
  );
}
