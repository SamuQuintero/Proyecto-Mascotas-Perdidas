import {
  ETIQUETA_REPORTES,
  ETIQUETA_RESGUARDO,
  invalidar,
} from "@/lib/cache";
import type { NotificadorCambios } from "@/lib/puertos";

// Adaptador del puerto NotificadorCambios: invalida las etiquetas del caché
// de Next.js (ver src/lib/cache.ts).
export class NotificadorCacheNext implements NotificadorCambios {
  reportesCambiaron(): void {
    invalidar(ETIQUETA_REPORTES);
  }

  resguardoCambio(): void {
    invalidar(ETIQUETA_RESGUARDO);
  }
}
