export function formatFecha(fecha: string | null | undefined) {
  if (!fecha) return "—";

  const d = new Date(fecha);

  if (isNaN(d.getTime())) return fecha;

  const dia = String(d.getUTCDate()).padStart(2, "0");
  const mes = String(d.getUTCMonth() + 1).padStart(2, "0");
  const anio = d.getUTCFullYear();

  return `${dia}-${mes}-${anio}`;
}
