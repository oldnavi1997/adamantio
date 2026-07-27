"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { WishlistDrawer } from "@/components/wishlist/WishlistDrawer";
import WhatsAppButton from "@/components/ui/WhatsAppButton";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <CartDrawer />
      <WishlistDrawer />
      <WhatsAppButton />
      <Toaster position="top-right" richColors />
    </SessionProvider>
  );
}
