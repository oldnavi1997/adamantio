"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const registerSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegisterData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterData>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, email: data.email, password: data.password }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Error al registrarse");
        return;
      }

      await signIn("credentials", { email: data.email, password: data.password, redirect: false });
      toast.success("¡Cuenta creada exitosamente!");
      router.push("/");
    } catch {
      toast.error("Error inesperado");
    } finally {
      setLoading(false);
    }
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
              Crear cuenta
            </p>
            <div className="h-px flex-1 bg-[#111111]/10 max-w-[60px]" />
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white border border-[#111111]/8 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Nombre completo"
              placeholder="Juan Pérez"
              error={errors.name?.message}
              {...register("name")}
            />
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
              placeholder="Mínimo 8 caracteres"
              error={errors.password?.message}
              {...register("password")}
            />
            <Input
              label="Confirmar contraseña"
              type="password"
              placeholder="Repetí tu contraseña"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
            <div className="pt-1">
              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Crear cuenta
              </Button>
            </div>
          </form>

          <p className="text-center text-[11px] text-[#111111]/40 mt-6 uppercase tracking-[0.1em]">
            ¿Ya tienes cuenta?{" "}
            <Link href="/auth/login" className="text-[#d4af37] hover:text-[#b4952f] transition-colors font-medium">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
