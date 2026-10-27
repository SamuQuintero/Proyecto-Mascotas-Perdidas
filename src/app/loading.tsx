// Se muestra al instante mientras la página siguiente consulta la base de
// datos (~0,5 s por consulta desde Colombia). El navbar no cambia: solo este
// bloque, así la aplicación responde al clic sin esperar.
export default function Cargando() {
  return (
    <div className="space-y-8" role="status" aria-label="Cargando">
      <div className="space-y-3">
        <div className="esqueleto h-5 w-40 !rounded-full" />
        <div className="esqueleto h-10 w-2/3 max-w-md" />
        <div className="esqueleto h-4 w-1/2 max-w-sm" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="tarjeta overflow-hidden">
            <div className="esqueleto aspect-[4/3] !rounded-none" />
            <div className="space-y-2 p-4">
              <div className="esqueleto h-5 w-3/4" />
              <div className="esqueleto h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
