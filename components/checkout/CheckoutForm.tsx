"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ShippingFormData } from "@/types";
import ubigeoData from "@/lib/peru-ubigeo.json";
import {
  SHALOM_PRICE,
  OLVA_PRICE_BY_DEPARTMENT,
  getShippingCost,
  getPaymentFee,
  COURIER_LABELS,
  DESTINO_COPY,
  TIENDA,
  esRecojo,
  type PaymentProvider,
} from "@/lib/shipping";

type UbigeoJson = {
  departments: string[];
  provincesByDepartment: Record<string, string[]>;
  districtsByDepartmentProvince: Record<string, Record<string, { name: string; postalCode: string }[]>>;
};

const UBIGEO = ubigeoData as UbigeoJson;


const shippingSchema = z.object({
  email: z.string().email("Email inválido"),
  firstName: z.string().min(3, "Mínimo 3 caracteres").max(20, "Máximo 20 caracteres"),
  lastName: z.string().min(3, "Mínimo 3 caracteres").max(20, "Máximo 20 caracteres"),
  documentType: z.enum(["DNI", "CE"]),
  documentNumber: z.string(),
  phone: z.string().min(5, "Teléfono requerido"),
  street: z.string(),
  department: z.string(),
  province: z.string(),
  district: z.string(),
  postalCode: z.string(),
  courier: z.enum(["shalom", "olva", "tienda"]),
}).superRefine((data, ctx) => {
  if (data.documentType === "DNI" && !/^\d{8}$/.test(data.documentNumber)) {
    ctx.addIssue({ code: "custom", path: ["documentNumber"], message: "DNI debe tener 8 dígitos" });
  }
  if (data.documentType === "CE" && (data.documentNumber.length < 5 || data.documentNumber.length > 12)) {
    ctx.addIssue({ code: "custom", path: ["documentNumber"], message: "Carnet debe tener entre 5 y 12 caracteres" });
  }
  // Recojo en tienda: no hay nada más que pedir. La dirección del local la
  // escribe el servidor al crear la orden, no el comprador.
  if (esRecojo(data.courier)) return;

  const ubicacion = [
    ["department", "Selecciona un departamento"],
    ["province", "Selecciona una provincia"],
    ["district", "Selecciona un distrito"],
    ["postalCode", "Código postal requerido"],
  ] as const;
  for (const [path, message] of ubicacion) {
    if (!data[path]) ctx.addIssue({ code: "custom", path: [path], message });
  }

  // Qué falta depende del courier: Shalom solo entrega en agencia.
  if (data.street.trim().length < 3) {
    ctx.addIssue({ code: "custom", path: ["street"], message: DESTINO_COPY[data.courier].error });
  }
});

interface CheckoutFormProps {
  onSubmit: (data: ShippingFormData) => void;
  loading?: boolean;
  subtotal: number;
  isTestMode?: boolean;
  freeShipping?: boolean;
  /** Pasarela con la que se va a cobrar; decide la comisión que se previsualiza. */
  paymentProvider?: PaymentProvider;
  defaultValues?: Partial<ShippingFormData>;
}

export function CheckoutForm({ onSubmit, loading, subtotal, isTestMode, freeShipping, paymentProvider = "mercadopago", defaultValues }: CheckoutFormProps) {
  const [districtSelectValue, setDistrictSelectValue] = useState(defaultValues?.district ?? "");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: { documentType: "DNI", courier: "shalom", ...defaultValues },
  });

  const department = watch("department");
  const province = watch("province");
  const courier = watch("courier");
  const documentType = watch("documentType");

  const provinceOptions = department ? (UBIGEO.provincesByDepartment[department] ?? []) : [];
  const districtOptions = department && province
    ? (UBIGEO.districtsByDepartmentProvince[department]?.[province] ?? [])
    : [];

  // Mismo cálculo que `create-order`, desde el mismo módulo: el importe que se
  // previsualiza aquí es el que se va a cobrar.
  const recojo = esRecojo(courier);
  const shippingCost = isTestMode || freeShipping ? 0 : getShippingCost(courier, department);
  const beforeCommission = subtotal + shippingCost;
  const mpCommission = isTestMode ? 0 : getPaymentFee(paymentProvider, beforeCommission);
  const total = beforeCommission + mpCommission;

  function handleDepartmentChange(value: string) {
    setValue("department", value);
    setValue("province", "");
    setValue("district", "");
    setValue("postalCode", "");
    setDistrictSelectValue("");
  }

  function handleProvinceChange(value: string) {
    setValue("province", value);
    setValue("district", "");
    setValue("postalCode", "");
    setDistrictSelectValue("");
  }

  function handleDistrictChange(value: string) {
    const [districtName, postalCode] = value.split("___");
    setDistrictSelectValue(value);
    setValue("district", districtName ?? "");
    setValue("postalCode", postalCode ?? "");
  }

  const selectClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]";
  const errorClass = "text-xs text-red-500 mt-1";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Identificación */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="font-semibold text-[#111111]">Datos de contacto</h3>
        <Input label="Email *" type="email" error={errors.email?.message} {...register("email")} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nombres *" error={errors.firstName?.message} {...register("firstName")} />
          <Input label="Apellidos *" error={errors.lastName?.message} {...register("lastName")} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de documento *</label>
            <select className={selectClass} {...register("documentType")}>
              <option value="DNI">DNI</option>
              <option value="CE">Carnet de extranjería</option>
            </select>
          </div>
          <Input
            label={`Número de ${documentType === "DNI" ? "DNI (8 dígitos)" : "carnet"} *`}
            error={errors.documentNumber?.message}
            {...register("documentNumber")}
          />
        </div>
        <Input label="Teléfono *" type="tel" error={errors.phone?.message} {...register("phone")} />
      </div>

      {/* Ubicación — en recojo no hay nada que ubicar */}
      <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4 ${recojo ? "hidden" : ""}`}>
        <h3 className="font-semibold text-[#111111]">Ubicación de entrega</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Departamento *</label>
            <select className={selectClass} value={department ?? ""} onChange={(e) => handleDepartmentChange(e.target.value)}>
              <option value="">Selecciona...</option>
              {UBIGEO.departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            {errors.department && <p className={errorClass}>{errors.department.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Provincia *</label>
            <select className={selectClass} value={province ?? ""} onChange={(e) => handleProvinceChange(e.target.value)} disabled={!department}>
              <option value="">Selecciona...</option>
              {provinceOptions.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            {errors.province && <p className={errorClass}>{errors.province.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Distrito *</label>
            <select className={selectClass} value={districtSelectValue} onChange={(e) => handleDistrictChange(e.target.value)} disabled={!province}>
              <option value="">Selecciona...</option>
              {districtOptions.map((d) => (
                <option key={`${d.name}___${d.postalCode}`} value={`${d.name}___${d.postalCode}`}>{d.name}</option>
              ))}
            </select>
            {errors.district && <p className={errorClass}>{errors.district.message}</p>}
          </div>
        </div>
      </div>

      {/* Courier */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="font-semibold text-[#111111]">Método de envío</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(["shalom", "olva", "tienda"] as const).map((c) => {
            const price =
              c === "tienda" ? 0 : c === "shalom" ? SHALOM_PRICE : (OLVA_PRICE_BY_DEPARTMENT[department] ?? 15);
            const label = COURIER_LABELS[c];
            return (
              <label key={c} className={`flex items-center gap-3 border rounded-lg p-4 cursor-pointer transition-colors ${courier === c ? "border-[#111111] bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}>
                <input type="radio" value={c} {...register("courier")} className="accent-[#111111]" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#111111]">{label}</p>
                  <p className="text-xs text-gray-500">{price === 0 ? "Gratis" : `S/ ${price.toFixed(2)}`}</p>
                </div>
              </label>
            );
          })}
        </div>
        <div className="pt-4 border-t border-gray-100">
          {recojo ? (
            <div className="text-sm">
              <p className="text-[10px] font-medium text-[#111111]/60 uppercase tracking-[0.15em] mb-1.5">
                Recoges en
              </p>
              <p className="text-[#111111]">{TIENDA.street}</p>
              <p className="text-gray-500 text-xs mt-0.5">
                {TIENDA.district}, {TIENDA.department}
              </p>
              <p className="text-gray-500 text-xs mt-2">
                Te avisamos por correo cuando tu pedido esté listo para recoger.
              </p>
            </div>
          ) : (
            <Input
              label={`${DESTINO_COPY[courier].label} *`}
              placeholder={DESTINO_COPY[courier].placeholder}
              error={errors.street?.message}
              {...register("street")}
            />
          )}
        </div>
      </div>

      {/* Resumen de costos */}
      <div className="bg-[#f8f7f4] rounded-xl p-4 text-sm space-y-2">
        <div className="flex justify-between text-[#111111]/60">
          <span>Subtotal</span><span>S/ {subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[#111111]/60">
          <span>Envío ({COURIER_LABELS[courier]})</span>
          <span>{shippingCost === 0 ? "Gratis" : `S/ ${shippingCost.toFixed(2)}`}</span>
        </div>
        <div className="flex justify-between text-[#111111]/60">
          <span>Comisión de pago</span>
          <span>S/ {mpCommission.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-semibold text-[#111111] pt-2 border-t border-gray-200">
          <span>Total a pagar</span><span>S/ {total.toFixed(2)}</span>
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full" loading={loading}>
        Continuar al pago
      </Button>
    </form>
  );
}
