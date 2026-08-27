/**
 * Carga de CSS y JS de terceros desde el navegador, compartida por los
 * formularios de pasarela.
 *
 * Ni Izipay ni Culqi se distribuyen como paquete npm: los dos exigen sus
 * propios scripts servidos desde su dominio, y hay que inyectarlos a mano. Las
 * dos funciones son idempotentes: si el recurso ya está en el documento no se
 * vuelve a pedir, cosa que importa porque el comprador puede cambiar de pestaña
 * de pago y volver.
 */

export function cargarCss(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

export function cargarScript(
  src: string,
  atributos: Record<string, string> = {},
  etiqueta = "el formulario de pago"
): Promise<void> {
  return new Promise((resolve, reject) => {
    const existente = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existente) {
      if (existente.dataset.cargado === "1") return resolve();
      existente.addEventListener("load", () => resolve());
      existente.addEventListener("error", () => reject(new Error(`No se pudo cargar ${etiqueta}`)));
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    // Los atributos van ANTES de insertar el script: los clientes de Krypton y
    // de Culqi leen su configuración de la propia etiqueta al inicializarse.
    for (const [k, v] of Object.entries(atributos)) script.setAttribute(k, v);
    script.onload = () => {
      script.dataset.cargado = "1";
      resolve();
    };
    script.onerror = () => reject(new Error(`No se pudo cargar ${etiqueta}`));
    document.head.appendChild(script);
  });
}
