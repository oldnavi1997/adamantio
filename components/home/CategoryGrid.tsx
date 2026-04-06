export function TrustBar() {
  return (
    <section className="py-16 bg-[#f8f7f4] border-y border-[#111111]/6">
      <div className="max-w-4xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-6">

          {/* Envíos a nivel nacional */}
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 text-[#d4af37]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.25} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#111111] uppercase tracking-[0.15em]">Envíos a nivel nacional</p>
              <p className="text-xs text-[#111111]/50 mt-1 leading-relaxed">Despachamos a todo Argentina con seguimiento en tiempo real</p>
            </div>
          </div>

          {/* Pagos seguros */}
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 text-[#d4af37]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.25} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#111111] uppercase tracking-[0.15em]">Pagos seguros</p>
              <p className="text-xs text-[#111111]/50 mt-1 leading-relaxed">Transacciones protegidas con cifrado SSL y Mercado Pago</p>
            </div>
          </div>

          {/* Atención personalizada */}
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 text-[#d4af37]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.25} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#111111] uppercase tracking-[0.15em]">Atención personalizada</p>
              <p className="text-xs text-[#111111]/50 mt-1 leading-relaxed">Asesoramiento experto para encontrar tus lentes ideales</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
