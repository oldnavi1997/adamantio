import { describe, expect, it } from "vitest";
import {
  CategoryRuleError,
  MAX_NIVEL,
  aplicarAsignacion,
  alturaSubarbol,
  construirArbol,
  idsDescendientes,
  motivoParaNoBorrar,
  nivelDe,
  nivelParaCrear,
  padresPosibles,
  planMover,
  resolverRuta,
  rutaCategoria,
  soloActivas,
  type NodoCategoria,
} from "@/lib/category-tree";

/**
 * joyas
 * ├── anillos
 * │   ├── promesa
 * │   └── pareja
 * └── collares
 * pulseras (raíz, sin hijas)
 */
const arbol: NodoCategoria[] = [
  { id: "joyas", parentId: null, slug: "joyas", name: "Joyas", sortOrder: 0 },
  { id: "anillos", parentId: "joyas", slug: "anillos", name: "Anillos", sortOrder: 0 },
  { id: "promesa", parentId: "anillos", slug: "anillos-de-promesa", name: "Anillos de promesa", sortOrder: 1 },
  { id: "pareja", parentId: "anillos", slug: "anillos-de-pareja", name: "Anillos de pareja", sortOrder: 0 },
  { id: "collares", parentId: "joyas", slug: "collares", name: "Collares", sortOrder: 1 },
  { id: "pulseras", parentId: null, slug: "pulseras", name: "Pulseras", sortOrder: 1 },
];

const error = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return e as CategoryRuleError;
  }
  throw new Error("se esperaba un error");
};

describe("niveles al crear", () => {
  it("crea los tres niveles", () => {
    expect(nivelParaCrear(arbol, null)).toBe(1);
    expect(nivelParaCrear(arbol, "joyas")).toBe(2);
    expect(nivelParaCrear(arbol, "anillos")).toBe(3);
  });

  it("impide un cuarto nivel", () => {
    const e = error(() => nivelParaCrear(arbol, "promesa"));
    expect(e).toBeInstanceOf(CategoryRuleError);
    expect(e.status).toBe(400);
    expect(e.message).toMatch(/Máximo 3 niveles/);
  });

  it("rechaza un padre que no existe", () => {
    expect(error(() => nivelParaCrear(arbol, "fantasma")).status).toBe(404);
  });

  it("calcula el nivel y la altura del subárbol", () => {
    expect(nivelDe(arbol, "promesa")).toBe(3);
    expect(alturaSubarbol(arbol, "joyas")).toBe(2);
    expect(alturaSubarbol(arbol, "anillos")).toBe(1);
    expect(alturaSubarbol(arbol, "promesa")).toBe(0);
  });
});

describe("mover categorías", () => {
  it("mueve una hoja y recalcula su nivel", () => {
    expect(planMover(arbol, "collares", null)).toEqual([{ id: "collares", level: 1 }]);
  });

  it("actualiza el nivel de toda la descendencia", () => {
    // anillos (2) con hijas (3) sube a raíz: anillos 1, hijas 2.
    const plan = planMover(arbol, "anillos", null);
    expect(Object.fromEntries(plan.map((p) => [p.id, p.level]))).toEqual({
      anillos: 1,
      promesa: 2,
      pareja: 2,
    });
  });

  it("mueve un subárbol de dos niveles bajo otra raíz", () => {
    const plan = planMover(arbol, "anillos", "pulseras");
    expect(Object.fromEntries(plan.map((p) => [p.id, p.level]))).toEqual({
      anillos: 2,
      promesa: 3,
      pareja: 3,
    });
  });

  it("impide que el subárbol movido pase del nivel 3", () => {
    // anillos tiene hijas: bajo collares (2) quedarían en el nivel 4.
    expect(error(() => planMover(arbol, "anillos", "collares")).message).toMatch(/nivel 4/);
    // joyas tiene dos niveles debajo: no puede colgar de nada.
    expect(() => planMover(arbol, "joyas", "pulseras")).toThrow(CategoryRuleError);
  });

  it("impide ciclos: ni dentro de sí misma ni de su descendencia", () => {
    expect(error(() => planMover(arbol, "anillos", "anillos")).message).toMatch(/propio padre/);
    expect(error(() => planMover(arbol, "joyas", "anillos")).message).toMatch(/descendencia/);
    expect(error(() => planMover(arbol, "joyas", "promesa")).message).toMatch(/descendencia/);
  });

  it("detecta un ciclo que ya estuviera en los datos", () => {
    const roto: NodoCategoria[] = [
      { id: "a", parentId: "b" },
      { id: "b", parentId: "a" },
    ];
    expect(error(() => nivelDe(roto, "a")).status).toBe(409);
    expect(idsDescendientes(roto, "a")).toEqual(["b"]);
  });

  it("solo ofrece padres válidos: nunca el nivel 3, la propia ni su descendencia", () => {
    const paraNueva = padresPosibles(arbol, null).map((c) => c.id);
    expect(paraNueva).not.toContain("promesa");
    expect(paraNueva).not.toContain("pareja");
    expect(paraNueva).toContain("anillos");

    // anillos tiene hijas: solo puede colgar de una raíz que no sea la suya propia.
    expect(padresPosibles(arbol, "anillos").map((c) => c.id).sort()).toEqual(["joyas", "pulseras"]);
    // joyas tiene dos niveles debajo: solo puede ser raíz.
    expect(padresPosibles(arbol, "joyas")).toEqual([]);
  });

  it(`el tope es ${MAX_NIVEL}`, () => {
    expect(MAX_NIVEL).toBe(3);
  });
});

describe("borrado", () => {
  it("solo se borran categorías vacías", () => {
    expect(motivoParaNoBorrar(0, 0)).toBeNull();
    expect(motivoParaNoBorrar(0, 3)).toMatch(/3 productos/);
    expect(motivoParaNoBorrar(2, 0)).toMatch(/2 subcategorías/);
  });
});

describe("rutas jerárquicas", () => {
  it("arma la ruta completa", () => {
    expect(rutaCategoria(arbol, "promesa")).toBe("/categorias/joyas/anillos/anillos-de-promesa");
    expect(rutaCategoria(arbol, "pulseras")).toBe("/categorias/pulseras");
  });

  it("valida la cadena completa", () => {
    const r = resolverRuta(arbol, ["joyas", "anillos", "anillos-de-promesa"]);
    expect(r?.cadena.map((c) => c.id)).toEqual(["joyas", "anillos", "promesa"]);
    expect(r?.canonica).toBe(true);
  });

  it("rechaza una cadena rota aunque cada tramo exista", () => {
    expect(resolverRuta(arbol, ["anillos"])).toBeNull(); // no es raíz
    expect(resolverRuta(arbol, ["pulseras", "anillos"])).toBeNull(); // no es su hija
    expect(resolverRuta(arbol, ["joyas", "anillos-de-promesa"])).toBeNull(); // salta un nivel
    expect(resolverRuta(arbol, ["joyas", "anillos", "anillos-de-promesa", "x"])).toBeNull();
    expect(resolverRuta(arbol, [])).toBeNull();
  });

  it("acepta el id o mayúsculas pero marca la URL como no canónica", () => {
    expect(resolverRuta(arbol, ["joyas", "anillos", "promesa"])?.canonica).toBe(false);
    expect(resolverRuta(arbol, ["Joyas"])?.canonica).toBe(false);
  });

  it("una categoría sin slug usa su id", () => {
    const sinSlug = [...arbol, { id: "x1", parentId: "pulseras", slug: null }];
    expect(rutaCategoria(sinSlug, "x1")).toBe("/categorias/pulseras/x1");
    expect(resolverRuta(sinSlug, ["pulseras", "x1"])?.canonica).toBe(true);
  });
});

describe("árbol público", () => {
  it("ordena por sortOrder", () => {
    const t = construirArbol(arbol);
    expect(t.map((c) => c.id)).toEqual(["joyas", "pulseras"]);
    expect(t[0].children[0].children.map((c) => c.id)).toEqual(["pareja", "promesa"]);
  });

  it("una inactiva oculta toda su descendencia", () => {
    const conInactiva = arbol.map((c) => (c.id === "anillos" ? { ...c, isActive: false } : c));
    expect(soloActivas(conInactiva).map((c) => c.id).sort()).toEqual(["collares", "joyas", "pulseras"]);
  });
});

describe("asignación de productos", () => {
  it("añade sin duplicar y conserva la principal", () => {
    expect(aplicarAsignacion(["a", "b"], ["b", "c", "c"], "add")).toEqual(["a", "b", "c"]);
  });

  it("reemplaza el conjunto", () => {
    expect(aplicarAsignacion(["a", "b"], ["c", "c", "d"], "set")).toEqual(["c", "d"]);
  });

  it("quita", () => {
    expect(aplicarAsignacion(["a", "b", "c"], ["a"], "remove")).toEqual(["b", "c"]);
  });

  it("cambia la principal si se pide y está en el resultado", () => {
    expect(aplicarAsignacion(["a", "b"], ["c"], "add", "c")).toEqual(["c", "a", "b"]);
    expect(aplicarAsignacion(["a", "b"], ["b"], "remove", "b")).toEqual(["a"]);
  });
});
