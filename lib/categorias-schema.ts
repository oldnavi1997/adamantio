import { z } from "zod";

/**
 * Entrada de las rutas de categorías. Vive aparte del servicio para que el
 * formulario del admin pueda importar los mismos límites sin arrastrar Prisma.
 */

/** Ids de `categories` y de "Product": UUIDs y cuids, sin nada más raro. */
export const idSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/, "Id inválido");

/**
 * Texto opcional que se puede vaciar. `undefined` = no tocar (PATCH),
 * cadena vacía o `null` = borrar.
 */
const textoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v === undefined ? undefined : v || null));

const urlOpcional = z
  .string()
  .trim()
  .max(1000)
  .refine((v) => v === "" || /^https:\/\/\S+$/.test(v), "Debe ser una URL https")
  .nullish()
  .transform((v) => (v === undefined ? undefined : v || null));

const campos = {
  name: z.string().trim().min(2, "El nombre necesita al menos 2 caracteres").max(80),
  slug: textoOpcional(80),
  description: textoOpcional(2000),
  image: urlOpcional,
  banner: urlOpcional,
  parentId: idSchema.nullish(),
  isActive: z.boolean().optional(),
  metaTitle: textoOpcional(70),
  metaDescription: textoOpcional(170),
};

export const crearCategoriaSchema = z.object(campos).strict();
export const editarCategoriaSchema = z
  .object({ ...campos, name: campos.name.optional() })
  .strict()
  .refine((d) => Object.keys(d).length > 0, "No hay cambios que guardar");

export const reordenarSchema = z
  .array(z.object({ id: idSchema, sortOrder: z.number().int().min(0).max(100_000) }))
  .min(1)
  .max(500);

export const asignarSchema = z.object({
  productIds: z.array(idSchema).min(1).max(500),
  categoryIds: z.array(idSchema).min(1).max(50),
  mode: z.enum(["add", "set", "remove"]),
  primaryCategoryId: idSchema.optional(),
});

/** Categorías de un producto en el alta y la edición. La primera es la principal. */
export const categoryIdsSchema = z.array(idSchema).max(20);

export const ORDENES_CATALOGO = ["newest", "oldest", "name_asc", "name_desc", "price_asc", "price_desc"] as const;

export const productosDeCategoriaSchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(24),
  sort: z.enum(ORDENES_CATALOGO).catch("newest"),
});

export type CrearCategoria = z.infer<typeof crearCategoriaSchema>;
export type EditarCategoria = z.infer<typeof editarCategoriaSchema>;
