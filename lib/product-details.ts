/**
 * Detalles de producto: formato, orden y la copia que es común a todos.
 *
 * `Product.productDetails` guarda texto plano, una línea por atributo, en la
 * forma `Clave: valor`. Antes era HTML pegado desde un editor, con decenas de
 * variables `--tw-*` en línea por etiqueta —1,4 MB en total para mostrar unos
 * cientos de caracteres— y sin ninguna estructura que la ficha pudiera pintar.
 *
 * Módulo puro y cliente-safe: lo usan la ficha de producto y el script de
 * normalización, así que no puede importar nada de servidor.
 */

/** Las cinco filas de la ficha, en este orden. El resto va detrás, tal cual. */
export const ORDEN_CLAVES = ["Tipo", "Material", "Estilo", "Tamaño", "Uso"] as const;

/**
 * Etiquetas que significan lo mismo y se unifican al normalizar. Sin esto unas
 * fichas dicen «Aplicación» y otras «Uso», unas «Pureza» y otras «Material».
 */
export const ALIAS_CLAVES: Record<string, string> = {
  aplicacion: "Uso",
  uso: "Uso",
  pureza: "Material",
  "pureza del material": "Material",
  material: "Material",
  tipo: "Tipo",
  estilo: "Estilo",
  tamano: "Tamaño",
};

/**
 * Claves que NO deben vivir en el producto: son las de `BENEFICIOS_PLATA`, que
 * es texto idéntico para toda la joyería de plata. Estaban copiadas en más de
 * medio catálogo.
 */
export const CLAVES_REDUNDANTES = [
  "caracteristicas y beneficios",
  "caracteristicas",
  "resistente al agua",
  "resistente al deslustre",
  "antideslustre",
  "sin niquel e hipoalergenico",
  "hipoalergenico",
  "durable",
];

/**
 * Beneficios comunes de la plata. Se escriben aquí una sola vez y la ficha los
 * pinta para todo lo que no sea acero.
 */
export const BENEFICIOS_PLATA: { clave: string; valor: string }[] = [
  {
    clave: "Resistente al agua",
    valor: "Adecuado para el uso diario y diferentes condiciones climáticas.",
  },
  {
    clave: "Antideslustre",
    valor: "Ayuda a conservar su brillo y apariencia con el paso del tiempo.",
  },
  {
    clave: "Hipoalergénico",
    valor: "Libre de níquel, ideal para pieles sensibles.",
  },
  {
    clave: "Durable",
    valor: "Diseñado para un uso prolongado sin dejar manchas verdes en la piel.",
  },
];

/**
 * Beneficios de los anillos de acero. Van aparte de los de plata porque el acero
 * no admite las mismas promesas: nada de «libre de níquel» ni de «sin manchas
 * verdes», que son afirmaciones de la plata.
 */
export const BENEFICIOS_ACERO: { clave: string; valor: string }[] = [
  {
    clave: "Material resistente",
    valor: "El acero ofrece buena resistencia para el uso cotidiano.",
  },
  {
    clave: "Durable",
    valor: "Diseñado para acompañarte durante mucho tiempo con el cuidado adecuado.",
  },
  {
    clave: "Apertura ajustable",
    valor: "Se adapta fácilmente a diferentes tamaños de dedo.",
  },
  {
    clave: "Fácil de mantener",
    valor: "Su superficie permite una limpieza sencilla para conservar su apariencia.",
  },
  {
    clave: "Diseño versátil",
    valor: "Ideal para combinar con diferentes estilos y ocasiones.",
  },
  {
    clave: "Uso diario",
    valor: "Una opción práctica para llevar como anillo de pareja o accesorio personal.",
  },
];

/**
 * Cuidado del acero. Es una advertencia útil, no un argumento de venta, así que
 * la ficha la pinta como nota al pie del bloque y no como una viñeta más.
 */
export const CUIDADO_ACERO =
  "Para conservar su apariencia original, evita el contacto prolongado con perfumes, " +
  "productos químicos, cloro, detergentes y otros líquidos que puedan alterar el acabado del acero.";

/**
 * Guía de tallas de los anillos ajustables. Otro texto idéntico en ~70 fichas
 * que ahora se escribe una sola vez.
 */
export const GUIA_AJUSTABLE: string[] = [
  "Fácilmente personalizable para máxima comodidad y estilo.",
  "Ideal para usar en diferentes dedos.",
  "Perfecto para aquellos que cambian el tamaño de sus dedos debido a la temperatura u otros factores.",
  "No hay necesidad de preocuparse por elegir el tamaño correcto.",
  "Mantiene su forma elegante después del ajuste.",
];

/** Categorías que son anillos aunque el nombre no lo diga ("Naturaleza Eterna"). */
const CATEGORIAS_ANILLO = [
  "Anillos de Plata",
  "Anillos de Acero",
  "Anillos para Damas",
  "Regulables",
  "De talla",
];

/**
 * Anillo de apertura ajustable, y por tanto con guía de talla compartida.
 *
 * `sizes` es el discriminador: los anillos que se venden por talla la declaran
 * (categorías "De talla" y "Anillos para Damas") y necesitan su propia tabla, no
 * este texto. Los ajustables no tienen ninguna.
 */
export function esAnilloAjustable(product: {
  name: string;
  category?: string | null;
  sizes?: string[] | null;
}): boolean {
  if ((product.sizes ?? []).length > 0) return false;
  const cat = product.category ?? "";
  return CATEGORIAS_ANILLO.includes(cat) || /anillo/i.test(`${cat} ${product.name}`);
}

export type Detalle = { clave: string; valor: string };

/** Sin tildes y en minúsculas, para comparar claves escritas de cualquier forma. */
export function normalizaClave(clave: string): string {
  return clave
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Convierte el texto guardado en filas ordenadas.
 *
 * Tolera el HTML antiguo por si queda algún producto sin migrar: si detecta
 * etiquetas, las quita antes de partir por líneas.
 */
export function parseDetalles(texto: string | null | undefined): Detalle[] {
  if (!texto) return [];

  const plano = texto.includes("<") ? aTextoPlano(texto) : texto;

  // El `•` es **separador**, no solo marca inicial: parte del HTML pegado no
  // traía ningún salto y encadenaba todos los atributos en una misma línea
  // ("Tipo: … • Material: … • Estilo: …"). Cortando solo por saltos, esos
  // productos salían con todo apelmazado en la primera fila.
  const lineas = plano
    .split(/[\n•]/)
    .map((l) => l.replace(/^[\s\-–·*]+/, "").trim())
    .filter(Boolean);

  // Parte del HTML antiguo parte la clave y el valor en elementos distintos, y
  // lo hace de dos maneras según el producto:
  //
  //   <span>Tipo:</span><span>Anillos regulable.</span>   → "Tipo:" / "Anillos…"
  //   <span>Tipo</span><span>: Collar de plata.</span>    → "Tipo"  / ": Collar…"
  //
  // Sin recomponer las dos, esos productos se quedan sin ningún detalle.
  const unidas: string[] = [];
  for (const linea of lineas) {
    const previa = unidas[unidas.length - 1];
    if (previa !== undefined && previa.endsWith(":")) {
      unidas[unidas.length - 1] = `${previa} ${linea}`;
    } else if (previa !== undefined && linea.startsWith(":")) {
      unidas[unidas.length - 1] = `${previa}${linea}`;
    } else {
      unidas.push(linea);
    }
  }

  const filas: Detalle[] = [];
  for (const limpia of unidas) {
    const corte = limpia.indexOf(":");
    if (corte < 1) continue;

    const clave = limpia.slice(0, corte).trim();

    // En algunos productos la sección de beneficios venía pegada al último
    // valor, sin separador ninguno ("Plata de ley 925. Características y
    // beneficios: Resistente al agua: …"), y se lo tragaba entero. Todo lo que
    // va de ese rótulo en adelante lo pinta la ficha desde `BENEFICIOS_PLATA`.
    const bruto = limpia.slice(corte + 1);
    const seccion = bruto.search(/caracter[ií]sticas y beneficios/i);
    const valor = (seccion >= 0 ? bruto.slice(0, seccion) : bruto)
      .trim()
      .replace(/[.,;·]+\s*$/, "");
    if (!clave || !valor) continue;

    filas.push({ clave, valor });
  }

  return ordena(filas);
}

/**
 * Líneas sueltas (sin `clave: valor`), como la guía de tallas. Mismo troceado
 * que `parseDetalles`: tolera el HTML antiguo y trata el `•` como separador.
 */
export function parseLineas(texto: string | null | undefined): string[] {
  if (!texto) return [];
  const plano = texto.includes("<") ? aTextoPlano(texto) : texto;
  return plano
    .split(/[\n•]/)
    .map((l) => l.replace(/^[\s\-–·*]+/, "").trim())
    .filter(Boolean);
}

/**
 * Las filas tal como deben verse: sin las claves que ahora pinta la ficha, con
 * las etiquetas unificadas y sin repetidas.
 *
 * Vive aquí y no solo en el script de normalización porque **el render tiene que
 * ser correcto con los datos sin migrar**. Sin esto, una ficha cuyo
 * `productDetails` siga en HTML antiguo mostraría los beneficios dos veces —una
 * del dato y otra del bloque compartido— y mezclaría "Pureza" con "Material".
 * Así el script de datos pasa a ser una limpieza de peso, no un requisito.
 */
export function detallesVisibles(texto: string | null | undefined): Detalle[] {
  const filas = parseDetalles(texto)
    .filter((d) => !CLAVES_REDUNDANTES.includes(normalizaClave(d.clave)))
    .map((d) => ({ clave: ALIAS_CLAVES[normalizaClave(d.clave)] ?? d.clave, valor: d.valor }));
  return ordena(deduplica(filas));
}

/**
 * Colapsa las claves repetidas quedándose con el valor más específico.
 *
 * Hace falta porque `Pureza` y `Material` se unifican: el SKU 091, por ejemplo,
 * trae "Material: Plata 925" y "Pureza: Plata de ley 925". Gana el más largo, que
 * es el que dice más.
 */
export function deduplica(filas: Detalle[]): Detalle[] {
  const porClave = new Map<string, Detalle>();
  for (const fila of filas) {
    const k = normalizaClave(fila.clave);
    const previa = porClave.get(k);
    if (!previa || fila.valor.length > previa.valor.length) porClave.set(k, fila);
  }
  return [...porClave.values()];
}

/** `ORDEN_CLAVES` primero y en su orden; lo específico de cada producto detrás. */
export function ordena(filas: Detalle[]): Detalle[] {
  const posicion = (clave: string) => {
    const i = ORDEN_CLAVES.findIndex((c) => normalizaClave(c) === normalizaClave(clave));
    return i === -1 ? ORDEN_CLAVES.length : i;
  };
  return [...filas].sort((a, b) => posicion(a.clave) - posicion(b.clave));
}

/** Quita etiquetas y entidades del HTML antiguo, dejando un salto por bloque. */
export function aTextoPlano(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(div|p|li|h[1-6]|tr|span)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * Si el producto es de plata, y por tanto le corresponden los beneficios.
 *
 * **La categoría manda.** Es lo único completo: 71 de los 120 productos no
 * declaran material, así que preguntarle al material dejaría fuera a la mayoría.
 * El material y el nombre solo sirven para cazar las piezas de acero que están
 * catalogadas en otra parte.
 */
export function esPlata(product: {
  name: string;
  category?: string | null;
  productDetails?: string | null;
}): boolean {
  if (product.category === "Anillos de Acero") return false;

  const material = parseDetalles(product.productDetails).find(
    (d) => normalizaClave(d.clave) === "material"
  )?.valor;

  return !/acero|\b316\b|steel/i.test(`${material ?? ""} ${product.name}`);
}
