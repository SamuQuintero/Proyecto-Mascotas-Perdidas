import { afterEach, describe, expect, it, vi } from "vitest";
import { AlmacenFotosSupabase } from "@/infraestructura/almacenFotosSupabase";

const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const almacen = () => new AlmacenFotosSupabase("https://abc.supabase.co/", "clave");

describe("AlmacenFotosSupabase", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sube la foto y devuelve su URL pública", async () => {
    const fetchFalso = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchFalso);
    const url = await almacen().guardar(new File([PNG], "a.png", { type: "image/png" }));
    expect(url).toMatch(/^https:\/\/abc\.supabase\.co\/storage\/v1\/object\/public\/fotos\/[\w-]+\.png$/);
    const [destino, opciones] = fetchFalso.mock.calls[0];
    expect(destino).toMatch(/\/storage\/v1\/object\/fotos\/[\w-]+\.png$/);
    expect(opciones.headers.Authorization).toBe("Bearer clave");
  });

  it("con una clave nueva (sb_secret_) no envía Authorization", async () => {
    const fetchFalso = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchFalso);
    await new AlmacenFotosSupabase("https://abc.supabase.co", "sb_secret_x").guardar(
      new File([PNG], "a.png", { type: "image/png" })
    );
    const { headers } = fetchFalso.mock.calls[0][1];
    expect(headers.apikey).toBe("sb_secret_x");
    expect(headers.Authorization).toBeUndefined();
  });

  it("rechaza archivos que no son imágenes sin llamar a la red", async () => {
    const fetchFalso = vi.fn();
    vi.stubGlobal("fetch", fetchFalso);
    const falso = new File([new TextEncoder().encode("<script>")], "a.png", { type: "image/png" });
    await expect(almacen().guardar(falso)).rejects.toThrow();
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  it("falla con claridad si Supabase responde con error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403, text: async () => "" }));
    await expect(almacen().guardar(new File([PNG], "a.png", { type: "image/png" }))).rejects.toThrow(/403/);
  });

  it("solo borra fotos de su propio bucket", async () => {
    const fetchFalso = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchFalso);
    await almacen().eliminar("/uploads/vieja.jpg");
    await almacen().eliminar("https://otro.com/storage/v1/object/public/fotos/x.jpg");
    expect(fetchFalso).not.toHaveBeenCalled();
    await almacen().eliminar("https://abc.supabase.co/storage/v1/object/public/fotos/uno.jpg");
    expect(fetchFalso).toHaveBeenCalledTimes(1);
    expect(fetchFalso.mock.calls[0][1].method).toBe("DELETE");
  });
});
