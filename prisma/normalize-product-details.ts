/**
 * Normaliza `Product.productDetails`: de HTML pegado a texto plano `Clave: valor`.
 *
 * Uso de un solo tiro. Va en seco salvo que se le pase `--apply`:
 *
 *   npx tsx prisma/normalize-product-details.ts            # solo informa
 *   npx tsx prisma/normalize-product-details.ts --apply    # escribe
 *
 * El contenido de partida es texto enriquecido pegado en el textarea del admin,
 * con decenas de variables `--tw-*` en línea por etiqueta: 1,4 MB en total para
 * mostrar unos cientos de caracteres. Además más de medio catálogo repetía en su
 * propio HTML los cuatro beneficios de la plata, que ahora los pinta la ficha
 * desde `BENEFICIOS_PLATA` y por tanto se descartan aquí.
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";
import {
  detallesVisibles,
  parseLineas,
  esAnilloAjustable,
  GUIA_AJUSTABLE,
  ordena,
  normalizaClave,
  type Detalle,
} from "../lib/product-details";

const APLICAR = process.argv.includes("--apply");

/** Material deducible del propio nombre. Solo eso: no se inventa nada. */
function materialDelNombre(nombre: string): string | null {
  if (/\bacero\b|\b316l?\b/i.test(nombre)) return "Acero inoxidable";
  if (/plata|\b925\b/i.test(nombre)) return "Plata de ley 925";
  return null;
}

function normaliza(producto: { name: string; productDetails: string }): Detalle[] {
  // Mismo filtrado y mismas etiquetas que usa la ficha: el script solo escribe
  // en la base lo que el render ya calcula, más el material del nombre.
  const finales = [...detallesVisibles(producto.productDetails)];

  if (!finales.some((d) => normalizaClave(d.clave) === "material")) {
    const material = materialDelNombre(producto.name);
    if (material) finales.push({ clave: "Material", valor: material });
  }

  return ordena(finales);
}

const aTexto = (filas: Detalle[]) => filas.map((d) => `${d.clave}: ${d.valor}`).join("\n");

/** Para comparar frases ignorando puntuación y espacios de más. */
const compara = (t: string) =>
  t.toLowerCase().replace(/[^a-z0-9áéíóúñ ]/gi, "").replace(/\s+/g, " ").trim();

const GUIA_COMPARABLE = new Set(GUIA_AJUSTABLE.map(compara));

/**
 * Guía de tallas. Casi siempre devuelve vacío, y a propósito:
 *
 * - Si sus líneas son las de `GUIA_AJUSTABLE`, sobran: la pinta la ficha. Estaba
 *   copiada tal cual en unas setenta fichas.
 * - Si el producto no es un anillo es un error de captura —hay tres pulseras con
 *   los detalles del producto pegados en este campo— y se limpia.
 * - Cualquier otra cosa se conserva, ya normalizada a texto plano.
 */
function normalizaGuia(producto: {
  name: string;
  category: string | null;
  sizes: string[];
  sizeInfo: string;
}): string {
  const lineas = parseLineas(producto.sizeInfo);
  if (lineas.length === 0) return "";

  const esAnillo = esAnilloAjustable(producto) || producto.sizes.length > 0;
  if (!esAnillo) return "";

  if (lineas.every((l) => GUIA_COMPARABLE.has(compara(l)))) return "";

  return lineas.join("\n");
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const productos = await prisma.product.findMany({
    select: {
      id: true,
      sku: true,
      name: true,
      category: true,
      sizes: true,
      productDetails: true,
      sizeInfo: true,
    },
    orderBy: { sku: "asc" },
  });

  let antes = 0;
  let despues = 0;
  let cambiados = 0;
  let guiasLimpiadas = 0;
  let guiasConservadas = 0;
  const sinMaterial: string[] = [];
  const sinNada: string[] = [];

  for (const p of productos) {
    antes += p.productDetails.length + p.sizeInfo.length;
    const filas = normaliza(p);
    const texto = aTexto(filas);
    const guia = normalizaGuia(p);
    despues += texto.length + guia.length;

    if (p.sizeInfo && !guia) guiasLimpiadas++;
    if (guia) guiasConservadas++;

    if (!filas.some((d) => normalizaClave(d.clave) === "material")) {
      sinMaterial.push(`${p.sku ?? p.id.slice(0, 8)}  ${p.name.slice(0, 44)}`);
    }
    if (p.productDetails && !texto) {
      sinNada.push(`${p.sku ?? p.id.slice(0, 8)}  ${p.name.slice(0, 44)}`);
    }

    if (texto !== p.productDetails || guia !== p.sizeInfo) {
      cambiados++;
      if (APLICAR) {
        await prisma.product.update({
          where: { id: p.id },
          data: { productDetails: texto, sizeInfo: guia },
        });
      }
    }
  }

  const kb = (n: number) => `${(n / 1024).toFixed(0)} KB`;
  console.log(APLICAR ? "=== APLICADO ===" : "=== EN SECO (usa --apply para escribir) ===");
  console.log(`productos: ${productos.length} · a cambiar: ${cambiados}`);
  console.log(`peso de detalles + guía: ${kb(antes)} → ${kb(despues)}`);
  console.log(
    `guías de talla: ${guiasLimpiadas} vaciadas (las pinta la ficha) · ${guiasConservadas} propias conservadas`
  );
  const conGuia = productos.filter((p) => esAnilloAjustable(p)).length;
  console.log(`anillos ajustables que mostrarán la guía compartida: ${conGuia}`);

  if (sinNada.length) {
    console.log(`\n⚠ QUEDAN SIN NINGÚN DETALLE (tenían contenido y no se pudo extraer): ${sinNada.length}`);
    sinNada.forEach((s) => console.log("   " + s));
  }

  console.log(`\nSIN MATERIAL — hay que completarlos desde el admin: ${sinMaterial.length}`);
  sinMaterial.forEach((s) => console.log("   " + s));

  console.log("\n=== MUESTRA ===");
  for (const sku of ["091", "073", "025"]) {
    const p = productos.find((x) => x.sku === sku);
    if (!p) continue;
    console.log(`\n--- SKU ${sku} · ${p.category ?? "sin categoría"} · ${p.name.slice(0, 40)}`);
    console.log(`    antes: ${p.productDetails.length} caracteres de HTML`);
    normaliza(p).forEach((d) => console.log(`      ${d.clave}: ${d.valor}`));
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
