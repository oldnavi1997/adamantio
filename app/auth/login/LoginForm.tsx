"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

type LoginData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginData) => {
    setLoading(true);
    const result = await signIn("credentials", { ...data, redirect: false });
    setLoading(false);

    if (result?.error) {
      toast.error("Email o contraseña incorrectos");
      return;
    }

    const callbackUrl = searchParams.get("callbackUrl") || "/";
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <span
            className="text-[15px] tracking-[0.3em] text-[#111111] uppercase font-light"
            style={{ fontFamily: "var(--font-sans, sans-serif)" }}
          >
            Adamantio
          </span>
          <div className="flex items-center gap-3 mt-6 justify-center">
            <div className="h-px flex-1 bg-[#111111]/10 max-w-[60px]" />
            <p className="text-[9px] font-medium text-[#111111]/40 uppercase tracking-[0.25em]">
              Iniciar sesión
            </p>
            <div className="h-px flex-1 bg-[#111111]/10 max-w-[60px]" />
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white border border-[#111111]/8 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="tu@email.com"
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password")}
            />
            <div className="pt-1">
              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Ingresar
              </Button>
            </div>
          </form>

          <p className="text-center text-[11px] text-[#111111]/40 mt-6 uppercase tracking-[0.1em]">
            ¿No tienes cuenta?{" "}
            <Link href="/auth/register" className="text-[#d4af37] hover:text-[#b4952f] transition-colors font-medium">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
