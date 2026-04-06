/**
 * Calcula el costo de fabricación de una luna según rango de esfera y cilindro.
 * Recibe valores absolutos (ej: esfera -2.50 → pasar 2.50).
 * @param esOI true cuando es el ojo izquierdo (afecta precio en caso valD===5)
 */
export function calcularPrecio(esfera: number, cilindro: number, esOI = false): number {
  const valC = Math.floor(esfera);
  const valD = Math.floor(cilindro);
  let costo = 0;

  if (valC <= 2) {
    if (cilindro <= 2) costo = 47.5;
    else if (cilindro < 4) costo = 57.5;
    else if (cilindro < 5) costo = 62.5;
    else if (valD === 5) costo = esOI ? 65.0 : 67.5;
    else if (valD === 6) costo = 67.5;
  } else if (valC === 3) {
    if (cilindro <= 3) costo = 57.5;
    else if (cilindro < 5) costo = 62.5;
    else costo = 67.5;
  } else if (valC >= 4) {
    if (valC === 4 && valD === 4) costo = 62.5;
    else costo = 67.5;
  }

  return costo;
}

/** Parsea un string de dioptrías del selector (ej: "-2.50", "+1.25") a valor absoluto. */
function absVal(s: string): number {
  const n = parseFloat(s);
  return isNaN(n) ? 0 : Math.abs(n);
}

export interface DesgloseLunas {
  pOdEsf: number;
  pOdCil: number;
  pOiEsf: number;
  pOiCil: number;
  subtotalOD: number;
  subtotalOI: number;
  total: number;
  hasValues: boolean;
}

/**
 * Calcula el desglose completo de los 4 precios (esfera y cilindro por cada ojo).
 * Devuelve hasValues=false cuando ningún ojo tiene esfera seleccionada.
 */
export function calcularDesglose(
  odSphere: string, odCylinder: string,
  oiSphere: string, oiCylinder: string
): DesgloseLunas {
  const hasOD = odSphere !== "";
  const hasOI = oiSphere !== "";

  const pOdEsf = hasOD ? calcularPrecio(absVal(odSphere), absVal(odCylinder), false) : 0;
  const pOdCil = hasOD ? calcularPrecio(absVal(odSphere), absVal(odCylinder), false) : 0;
  const pOiEsf = hasOI ? calcularPrecio(absVal(oiSphere), absVal(oiCylinder), true) : 0;
  const pOiCil = hasOI ? calcularPrecio(absVal(oiSphere), absVal(oiCylinder), true) : 0;

  const subtotalOD = pOdEsf + pOdCil;
  const subtotalOI = pOiEsf + pOiCil;
  const total = subtotalOD + subtotalOI;

  return {
    pOdEsf, pOdCil, pOiEsf, pOiCil,
    subtotalOD, subtotalOI, total,
    hasValues: hasOD || hasOI,
  };
}
