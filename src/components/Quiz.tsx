"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  NOMBRE_RUTA,
  PREGUNTA_BIFURCACION,
  preguntasDeRuta,
} from "@/content/preguntas";
import { etapaDeFase, ROADMAPS } from "@/content/roadmaps";
import { COPY } from "@/content/copy";
import type { FaseId, Pregunta, PreguntaAbierta, Ruta } from "@/content/tipos";
import { leerUtm, leerCookiesMeta } from "@/lib/utm";
import { trackEvento } from "@/lib/analytics";
import { trackPixel } from "@/lib/meta-pixel";
import {
  idBaseDeSesion,
  progresoPendiente,
  registrarProgreso,
  sesionIdGuardado,
} from "@/lib/sesion-diagnostico";
import { BadgePlaceholder } from "@/components/BadgePlaceholder";
import { BrandBackdrop } from "@/components/brand/BrandBackdrop";

type Etapa = "bifurcacion" | "preguntas" | "calculando" | "gate";

interface ResultadoQuiz {
  id: string;
  fase: FaseId;
  score: number;
  demo: boolean;
}

// Duración de la pantalla de análisis: aunque el servidor responda al
// instante, se mantiene visible este mínimo para que se sienta como un
// análisis real del caso, no una respuesta fría e inmediata.
const INTERVALO_PASO_MS = 900;
const PASOS_ANALISIS = COPY.quiz.analisis.A.length;
const DURACION_MINIMA_MS = PASOS_ANALISIS * INTERVALO_PASO_MS + 500;

/** Marca de tiempo fuera del componente: el render debe ser puro. */
function ahoraMs(): number {
  return Date.now();
}

function esperarRestante(inicio: number, minimoMs: number): Promise<void> {
  const restante = minimoMs - (Date.now() - inicio);
  return new Promise((resolve) => setTimeout(resolve, Math.max(restante, 0)));
}

export function Quiz() {
  const router = useRouter();
  const [etapa, setEtapa] = useState<Etapa>("bifurcacion");
  const [ruta, setRuta] = useState<Ruta | null>(null);
  const [indice, setIndice] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  // Texto libre: pregunta abierta de investigación y detalle de "Otra cosa".
  const [textos, setTextos] = useState<Record<string, string>>({});
  const [resultado, setResultado] = useState<ResultadoQuiz | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pasoAnalisis, setPasoAnalisis] = useState(0);
  /**
   * Opción de etiqueta elegida que aún no avanza porque exige un detalle
   * escrito ("Otra cosa"). Mientras esté puesta, la pantalla no pasa.
   */
  const [seleccionPendiente, setSeleccionPendiente] = useState<string | null>(null);

  const preguntas = useMemo(
    () => (ruta ? preguntasDeRuta(ruta) : []),
    [ruta]
  );

  // En una variable propia para que TypeScript pueda estrechar el tipo de
  // pregunta (puntuada / etiqueta / abierta) al renderizar cada pantalla.
  const preguntaActual: Pregunta | undefined = preguntas[indice];

  // Avanza los pasos de la pantalla de análisis mientras está activa.
  useEffect(() => {
    if (etapa !== "calculando") return;
    const id = setInterval(() => {
      setPasoAnalisis((p) => Math.min(p + 1, PASOS_ANALISIS - 1));
    }, INTERVALO_PASO_MS);
    return () => clearInterval(id);
  }, [etapa]);

  function elegirRuta(rutaElegida: Ruta) {
    setRuta(rutaElegida);
    setEtapa("preguntas");
    trackEvento("quiz_iniciado", { ruta: rutaElegida });
  }

  /**
   * Avanza a la pantalla siguiente (o completa el quiz si era la última),
   * guardando el progreso por el camino.
   */
  async function avanzar(
    preguntaId: string,
    nuevasRespuestas: Record<string, string>,
    nuevosTextos: Record<string, string>
  ) {
    const esPrimera = Object.keys(respuestas).length === 0;
    setRespuestas(nuevasRespuestas);
    setTextos(nuevosTextos);
    setSeleccionPendiente(null);
    trackEvento("pregunta_respondida", {
      ruta,
      pregunta: preguntaId,
      opcion: nuevasRespuestas[preguntaId] ?? "texto_libre",
    });

    // Guardado progresivo: la fila nace aquí, en la primera respuesta.
    // Sin await — la persona nunca espera a la medición.
    if (ruta) {
      registrarProgreso({
        ruta,
        respuestas: nuevasRespuestas,
        textos: nuevosTextos,
        ultimaPregunta: preguntaId,
      });
      if (esPrimera) {
        trackPixel("DiagnosticoIniciado", idBaseDeSesion(), { ruta });
      }
    }

    if (indice < preguntas.length - 1) {
      setIndice(indice + 1);
      return;
    }
    await completarQuiz(nuevasRespuestas, nuevosTextos);
  }

  /** Clic en una opción de pregunta puntuada o de etiqueta. */
  function elegirOpcion(pregunta: Pregunta, opcionId: string) {
    if (pregunta.tipo === "abierta") return;

    const opcion = pregunta.opciones.find((o) => o.id === opcionId);
    // "Otra cosa": no avanza, despliega el campo obligatorio en la misma
    // pantalla y espera a que se escriba algo.
    if (pregunta.tipo === "tag" && opcion && "requiereDetalle" in opcion && opcion.requiereDetalle) {
      setSeleccionPendiente(opcionId);
      setRespuestas({ ...respuestas, [pregunta.id]: opcionId });
      return;
    }

    avanzar(pregunta.id, { ...respuestas, [pregunta.id]: opcionId }, textos);
  }

  async function completarQuiz(
    todas: Record<string, string>,
    todosLosTextos: Record<string, string>
  ) {
    setPasoAnalisis(0);
    setEtapa("calculando");
    setError(null);
    const inicio = ahoraMs();
    try {
      // La última respuesta se está guardando en paralelo; se espera a que
      // termine para que el id de sesión ya exista y esta fila se complete
      // en vez de duplicarse.
      await progresoPendiente();

      const utm = leerUtm();
      const idBase = idBaseDeSesion();
      const peticion = fetch("/api/diagnostico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ruta,
          respuestas: todas,
          textos: todosLosTextos,
          sesionId: sesionIdGuardado(),
          idBase,
          utm: utm
            ? {
                source: utm.source,
                medium: utm.medium,
                campaign: utm.campaign,
                content: utm.content,
                term: utm.term,
              }
            : null,
          referrer: utm?.referrer ?? null,
          meta: leerCookiesMeta(),
        }),
      }).then(async (res) => {
        if (!res.ok) throw new Error();
        return (await res.json()) as ResultadoQuiz;
      });

      const [data] = await Promise.all([
        peticion,
        esperarRestante(inicio, DURACION_MINIMA_MS),
      ]);

      setResultado(data);
      setEtapa("gate");
      trackEvento("quiz_completado", {
        ruta,
        fase: data.fase,
        score: data.score,
      });
      trackPixel("DiagnosticoCompletado", idBase, {
        ruta: ruta ?? "",
        fase: data.fase,
        score: data.score,
      });
    } catch {
      setError(COPY.errores.generico);
      setEtapa("preguntas");
    }
  }

  function retroceder() {
    setSeleccionPendiente(null);
    if (indice > 0) {
      setIndice(indice - 1);
    } else {
      setRuta(null);
      setEtapa("bifurcacion");
    }
  }

  return (
    <BrandBackdrop
      outerClassName="flex-1"
      innerClassName="flex-1 flex flex-col items-center px-5 py-10"
    >
      <div className="w-full max-w-xl">
        <p className="mb-8 text-center text-xs font-semibold tracking-[0.2em] text-white/60 uppercase">
          {COPY.marca.nombre}
        </p>

        {etapa === "bifurcacion" && (
          <Pantalla>
            <h1 className="font-display text-2xl sm:text-3xl font-medium leading-tight">
              {PREGUNTA_BIFURCACION.texto}
            </h1>
            <p className="mt-2 mb-6 text-sm text-[var(--brand-text-muted)]">
              {PREGUNTA_BIFURCACION.ayuda}
            </p>
            <div className="space-y-3">
              {PREGUNTA_BIFURCACION.opciones.map((opcion) => (
                <BotonOpcion
                  key={opcion.ruta}
                  onClick={() => elegirRuta(opcion.ruta)}
                >
                  {opcion.texto}
                </BotonOpcion>
              ))}
            </div>
          </Pantalla>
        )}

        {etapa === "preguntas" && ruta && preguntaActual && (
          <Pantalla>
            <div className="mb-6">
              <div className="flex justify-between text-xs text-[var(--brand-text-muted)] mb-2.5">
                <span className="font-medium tracking-wide">
                  {COPY.quiz.progresoDe(indice + 1, preguntas.length)}
                </span>
                <button
                  onClick={retroceder}
                  className="text-white/60 hover:text-white transition"
                >
                  {COPY.quiz.atras}
                </button>
              </div>
              <div className="brand-progress-track">
                <div
                  className="brand-progress-fill"
                  style={{ width: `${((indice + 1) / preguntas.length) * 100}%` }}
                />
              </div>
            </div>

            <h1 className="font-display text-xl sm:text-2xl font-medium leading-snug mb-6">
              {preguntaActual.texto}
            </h1>
            {preguntaActual.tipo === "puntuada" && preguntaActual.ayuda && (
              <p className="-mt-3 mb-5 text-sm text-[var(--brand-text-muted)]">
                {preguntaActual.ayuda}
              </p>
            )}

            {preguntaActual.tipo === "abierta" ? (
              <PantallaAbierta
                key={preguntaActual.id}
                pregunta={preguntaActual}
                valorInicial={textos[preguntaActual.id] ?? ""}
                onContinuar={(texto) =>
                  avanzar(preguntaActual.id, respuestas, {
                    ...textos,
                    [preguntaActual.id]: texto,
                  })
                }
              />
            ) : (
              <>
                <div className="space-y-3">
                  {preguntaActual.opciones.map((opcion) => (
                    <BotonOpcion
                      key={opcion.id}
                      seleccionada={respuestas[preguntaActual.id] === opcion.id}
                      onClick={() => elegirOpcion(preguntaActual, opcion.id)}
                    >
                      {opcion.texto}
                    </BotonOpcion>
                  ))}
                </div>

                {/* "Otra cosa": campo obligatorio en la misma pantalla */}
                {seleccionPendiente && (
                  <CampoDetalle
                    key={`${preguntaActual.id}-detalle`}
                    valorInicial={textos[preguntaActual.id] ?? ""}
                    onContinuar={(detalle) =>
                      avanzar(
                        preguntaActual.id,
                        { ...respuestas, [preguntaActual.id]: seleccionPendiente },
                        { ...textos, [preguntaActual.id]: detalle }
                      )
                    }
                  />
                )}
              </>
            )}

            {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
          </Pantalla>
        )}

        {etapa === "calculando" && ruta && (
          <PantallaAnalisis ruta={ruta} paso={pasoAnalisis} />
        )}

        {etapa === "gate" && resultado && (
          <GateResultado resultado={resultado} onExito={(token) => router.push(`/resultado/${token}`)} />
        )}
      </div>
    </BrandBackdrop>
  );
}

function GateResultado({
  resultado,
  onExito,
}: {
  resultado: ResultadoQuiz;
  onExito: (token: string) => void;
}) {
  const roadmap = ROADMAPS[resultado.fase];
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [consentimiento, setConsentimiento] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!consentimiento) {
      setError(COPY.errores.consentimientoRequerido);
      return;
    }
    setEnviando(true);
    try {
      const idBase = idBaseDeSesion();
      const res = await fetch("/api/diagnostico/capturar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: resultado.id,
          nombre,
          email,
          telefono: telefono || null,
          consentimiento,
          idBase,
          website: honeypot || undefined,
        }),
      });
      if (res.status === 400) {
        setError(COPY.errores.emailInvalido);
        setEnviando(false);
        return;
      }
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { token: string };
      trackEvento("email_capturado", { fase: resultado.fase });
      // Evento estándar de Meta: el que optimizan las campañas.
      trackPixel("Lead", idBase, { fase: resultado.fase, score: resultado.score });
      onExito(data.token);
    } catch {
      setError(COPY.errores.generico);
      setEnviando(false);
    }
  }

  return (
    <Pantalla>
      {resultado.demo && (
        <p className="mb-4 rounded-lg bg-amber-400/10 border border-amber-400/25 text-amber-300 text-xs px-3 py-2">
          {COPY.demo.aviso}
        </p>
      )}

      {/* Parte A: visible — valida el diagnóstico y genera curiosidad */}
      <div className="brand-glass relative overflow-hidden rounded-2xl p-5 mb-6 brand-pop-in">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full blur-2xl"
          style={{ background: "radial-gradient(circle, rgba(29, 168, 152,0.35), transparent 70%)" }}
        />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-accent)]/15 border border-[var(--brand-accent)]/40 px-3 py-1 text-[11px] font-bold tracking-wide text-[var(--brand-accent-light)] uppercase">
          {COPY.resultado.etiquetaFase(
            NOMBRE_RUTA[resultado.fase[0] as Ruta],
            etapaDeFase(resultado.fase)
          )}
        </span>
        <BadgePlaceholder visible={roadmap.status === "placeholder"} />
        <h1 className="font-display text-2xl sm:text-3xl font-medium mt-3">
          {roadmap.parteA.titulo}
        </h1>
        <p className="mt-3 text-white/75 leading-relaxed text-sm sm:text-base">
          {roadmap.parteA.diagnostico}
        </p>
      </div>

      {/* Gate: los 3 pasos se desbloquean con el email */}
      <h2 className="font-display text-lg font-bold">{COPY.gate.titulo}</h2>
      <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
        {COPY.gate.subtitulo}
      </p>

      <form onSubmit={enviar} className="mt-5 space-y-4">
        {/* Honeypot: invisible para humanos */}
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[9999px] h-0 w-0 opacity-0"
        />

        <Campo
          label={COPY.gate.labelNombre}
          type="text"
          value={nombre}
          onChange={setNombre}
          requerido
        />
        <Campo
          label={COPY.gate.labelEmail}
          type="email"
          value={email}
          onChange={setEmail}
          requerido
        />
        <Campo
          label={COPY.gate.labelTelefono}
          type="tel"
          value={telefono}
          onChange={setTelefono}
          placeholder={COPY.gate.placeholderTelefono}
        />

        <label className="flex items-start gap-2.5 text-xs text-white/60 cursor-pointer">
          <input
            type="checkbox"
            checked={consentimiento}
            onChange={(e) => setConsentimiento(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--brand-accent)]"
          />
          <span>{COPY.gate.consentimiento}</span>
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="brand-btn-cta font-display w-full rounded-2xl px-6 py-4 text-white font-bold"
        >
          {enviando ? COPY.gate.enviando : COPY.gate.boton}
        </button>

        <p className="text-center text-xs text-white/40">
          <Link href="/privacidad" className="underline hover:text-white/60">
            {COPY.gate.privacidad}
          </Link>
        </p>
        <p className="text-center text-[11px] leading-relaxed text-white/35">
          {COPY.avisoLegal}
        </p>
      </form>
    </Pantalla>
  );
}

/**
 * Campo obligatorio que se despliega al elegir "Otra cosa". Hasta que no
 * se escriba algo, el botón queda inhabilitado y la pantalla no avanza.
 */
function CampoDetalle({
  valorInicial,
  onContinuar,
}: {
  valorInicial: string;
  onContinuar: (detalle: string) => void;
}) {
  const MAX = 300;
  const [texto, setTexto] = useState(valorInicial);
  const listo = texto.trim().length > 0;

  return (
    <div className="brand-pop-in mt-4 rounded-2xl border border-[var(--brand-accent)]/30 bg-[var(--brand-accent)]/[0.06] p-4">
      <label htmlFor="detalle-otro" className="text-sm font-medium text-white/80">
        {COPY.quiz.ayudaOtro}
      </label>
      <textarea
        id="detalle-otro"
        autoFocus
        rows={3}
        value={texto}
        maxLength={MAX}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={COPY.quiz.placeholderOtro}
        className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-white/30 focus:border-[var(--brand-accent)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/25 transition"
      />
      <div className="mt-1 flex items-center justify-between">
        <span className="text-[11px] text-white/35">
          {texto.length}/{MAX}
        </span>
      </div>
      <button
        type="button"
        disabled={!listo}
        onClick={() => onContinuar(texto.trim())}
        className="brand-btn-cta font-display mt-3 w-full rounded-2xl px-6 py-3.5 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {COPY.quiz.botonContinuar}
      </button>
    </div>
  );
}

/**
 * Pregunta abierta de investigación. Opcional por diseño: el botón de
 * saltar es igual de visible que el de continuar, para no perder a nadie
 * en la última pantalla antes del resultado.
 */
function PantallaAbierta({
  pregunta,
  valorInicial,
  onContinuar,
}: {
  pregunta: PreguntaAbierta;
  valorInicial: string;
  onContinuar: (texto: string) => void;
}) {
  const [texto, setTexto] = useState(valorInicial);

  return (
    <div>
      <p className="-mt-3 mb-4 text-sm text-[var(--brand-text-muted)]">
        {pregunta.ayuda}
      </p>
      <textarea
        rows={5}
        value={texto}
        maxLength={pregunta.maxLargo}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={pregunta.placeholder}
        className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-base text-white placeholder:text-white/30 focus:border-[var(--brand-accent)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/25 transition"
      />
      <p className="mt-1 text-right text-[11px] text-white/35">
        {texto.length}/{pregunta.maxLargo}
      </p>

      <button
        type="button"
        onClick={() => onContinuar(texto.trim())}
        className="brand-btn-cta font-display mt-4 w-full rounded-2xl px-6 py-4 text-white font-bold"
      >
        {COPY.quiz.botonVerResultado}
      </button>
      <button
        type="button"
        onClick={() => onContinuar("")}
        className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-medium text-white/60 hover:border-white/25 hover:text-white/85 transition"
      >
        {COPY.quiz.botonSaltar}
      </button>
    </div>
  );
}

function PantallaAnalisis({ ruta, paso }: { ruta: Ruta; paso: number }) {
  const pasos = COPY.quiz.analisis[ruta];

  return (
    <Pantalla>
      <div className="py-4">
        <p className="text-center text-sm text-[var(--brand-text-muted)] mb-7">
          {COPY.quiz.introAnalisis}
        </p>

        <div className="space-y-4">
          {pasos.map((p, i) => {
            const completado = i < paso;
            const actual = i === paso;
            return (
              <div
                key={p}
                className={`flex items-center gap-3.5 transition-opacity duration-300 ${
                  i > paso ? "opacity-30" : "opacity-100"
                }`}
              >
                <span
                  className={`brand-step-icon ${actual ? "brand-step-icon--active" : ""} flex-none h-10 w-10 rounded-full flex items-center justify-center text-base border transition-colors duration-300 ${
                    completado
                      ? "bg-[var(--brand-accent)] border-[var(--brand-accent)]"
                      : actual
                        ? "bg-[var(--brand-accent)]/15 border-[var(--brand-accent)]/60"
                        : "bg-white/5 border-white/10"
                  }`}
                >
                  {completado ? (
                    <span className="text-white font-bold">✓</span>
                  ) : (
                    <span className="text-sm font-semibold">{i + 1}</span>
                  )}
                </span>
                <span
                  className={`text-sm sm:text-base ${
                    completado
                      ? "text-white/40"
                      : actual
                        ? "text-white font-medium"
                        : "text-white/40"
                  }`}
                >
                  {p}
                </span>
                {actual && (
                  <span className="ml-auto flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-accent)] animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-accent)] animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-accent)] animate-bounce" />
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="brand-progress-track mt-8">
          <div
            className="brand-progress-fill"
            style={{ width: `${((paso + 1) / pasos.length) * 100}%` }}
          />
        </div>
      </div>
    </Pantalla>
  );
}

function Pantalla({ children }: { children: React.ReactNode }) {
  return (
    <div className="brand-glass brand-pop-in relative rounded-3xl p-6 sm:p-8">
      {children}
    </div>
  );
}

interface Chispa {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
}

function BotonOpcion({
  children,
  onClick,
  seleccionada,
  icono,
}: {
  children: React.ReactNode;
  onClick: () => void;
  seleccionada?: boolean;
  icono?: string;
}) {
  const [chispas, setChispas] = useState<Chispa[]>([]);

  function manejarClick(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const nuevas: Chispa[] = Array.from({ length: 6 }, (_, i) => ({
      id: Date.now() + i,
      x,
      y,
      dx: (Math.random() - 0.5) * 70,
      dy: -(Math.random() * 50 + 20),
    }));
    setChispas((prev) => [...prev, ...nuevas]);
    setTimeout(() => {
      setChispas((prev) => prev.filter((c) => !nuevas.some((n) => n.id === c.id)));
    }, 700);
    onClick();
  }

  return (
    <button
      onClick={manejarClick}
      className={`brand-option ${seleccionada ? "brand-option--selected" : ""} w-full text-left rounded-2xl px-4 py-4 text-sm sm:text-base flex items-center gap-3 active:scale-[0.99]`}
    >
      {icono && <span className="text-xl flex-none">{icono}</span>}
      <span className={seleccionada ? "text-white font-medium" : "text-white/85"}>
        {children}
      </span>
      {chispas.map((c) => (
        <span
          key={c.id}
          className="brand-spark"
          style={
            {
              left: c.x,
              top: c.y,
              width: 5,
              height: 5,
              "--sx": `${c.dx}px`,
              "--sy": `${c.dy}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </button>
  );
}

function Campo({
  label,
  type,
  value,
  onChange,
  requerido,
  placeholder,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  requerido?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-white/80">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={requerido}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-[var(--brand-accent)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/25 transition"
      />
    </label>
  );
}
