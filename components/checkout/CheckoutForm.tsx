"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ShippingFormData } from "@/types";
import ubigeoData from "@/lib/peru-ubigeo.json";

type UbigeoJson = {
  departments: string[];
  provincesByDepartment: Record<string, string[]>;
  districtsByDepartmentProvince: Record<string, Record<string, { name: string; postalCode: string }[]>>;
};

const UBIGEO = ubigeoData as UbigeoJson;

const SHALOM_PRICE = 8;
const OLVA_PRICE_BY_DEPARTMENT: Record<string, number> = {
  Amazonas: 18, Ancash: 18, Apurimac: 15, Ayacucho: 15, Cajamarca: 16,
  Cusco: 15, Huancavelica: 16, Huanuco: 18, Ica: 15, Junin: 16,
  "La Libertad": 16, Lambayeque: 18, Lima: 15, Loreto: 20,
  "Madre de Dios": 16, Moquegua: 12, Pasco: 16, Piura: 18, Puno: 12,
  "San Martin": 18, Tacna: 12, Tumbes: 20, Ucayali: 16, Arequipa: 15, Callao: 15,
};

const shippingSchema = z.object({
  email: z.string().email("Email inválido"),
  firstName: z.string().min(3, "Mínimo 3 caracteres").max(20, "Máximo 20 caracteres"),
  lastName: z.string().min(3, "Mínimo 3 caracteres").max(20, "Máximo 20 caracteres"),
  documentType: z.enum(["DNI", "CE"]),
  documentNumber: z.string(),
  phone: z.string().min(5, "Teléfono requerido"),
  street: z.string().min(3, "Ingresa tu dirección"),
  department: z.string().min(1, "Selecciona un departamento"),
  province: z.string().min(1, "Selecciona una provincia"),
  district: z.string().min(1, "Selecciona un distrito"),
  postalCode: z.string().min(1, "Código postal requerido"),
  courier: z.enum(["shalom", "olva"]),
}).superRefine((data, ctx) => {
  if (data.documentType === "DNI" && !/^\d{8}$/.test(data.documentNumber)) {
    ctx.addIssue({ code: "custom", path: ["documentNumber"], message: "DNI debe tener 8 dígitos" });
  }
  if (data.documentType === "CE" && (data.documentNumber.length < 5 || data.documentNumber.length > 12)) {
    ctx.addIssue({ code: "custom", path: ["documentNumber"], message: "Carnet debe tener entre 5 y 12 caracteres" });
  }
});

interface CheckoutFormProps {
  onSubmit: (data: ShippingFormData) => void;
  loading?: boolean;
  subtotal: number;
  isTestMode?: boolean;
  defaultValues?: Partial<ShippingFormData>;
}

export function CheckoutForm({ onSubmit, loading, subtotal, isTestMode, defaultValues }: CheckoutFormProps) {
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

  const shippingCost = isTestMode ? 0 : (courier === "shalom" ? SHALOM_PRICE : (OLVA_PRICE_BY_DEPARTMENT[department] ?? 15));
  const beforeCommission = subtotal + shippingCost;
  const mpCommission = isTestMode ? 0 : (beforeCommission * 0.0329 * 1.18 + 1.18);
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
        <h2 className="font-semibold text-[#111111]">Datos de contacto</h2>
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

      {/* Dirección */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-[#111111]">Dirección de envío</h2>
        <Input label="Dirección (calle y número) *" error={errors.street?.message} {...register("street")} />
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
        <h2 className="font-semibold text-[#111111]">Método de envío</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(["shalom", "olva"] as const).map((c) => {
            const price = c === "shalom" ? SHALOM_PRICE : (OLVA_PRICE_BY_DEPARTMENT[department] ?? 15);
            const label = c === "shalom" ? "Shalom" : "Olva Courier";
            return (
              <label key={c} className={`flex items-center gap-3 border rounded-lg p-4 cursor-pointer transition-colors ${courier === c ? "border-[#111111] bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}>
                <input type="radio" value={c} {...register("courier")} className="accent-[#111111]" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#111111]">{label}</p>
                  <p className="text-xs text-gray-500">S/ {price.toFixed(2)}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Resumen de costos */}
      <div className="bg-[#f8f7f4] rounded-xl p-4 text-sm space-y-2">
        <div className="flex justify-between text-[#111111]/60">
          <span>Subtotal</span><span>S/ {subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[#111111]/60">
          <span>Envío ({courier === "shalom" ? "Shalom" : "Olva"})</span>
          <span>S/ {shippingCost.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[#111111]/60">
          <span>Comisión Mercado Pago</span>
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
