"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { LngLatBounds, Map as MapLibreMap, NavigationControl, setWorkerUrl } from "maplibre-gl";
import type { ExpressionSpecification, MapLayerMouseEvent } from "maplibre-gl";
import { EKey } from "@/lib/types";
import { MetricDef, ResumoApi } from "@/lib/client-data";
import { fInt } from "@/lib/format";

interface Props {
  resumo: ResumoApi | null;
  eleicao: EKey;
  metric: MetricDef;
  selecionado: string | null;
  /** muda a cada pedido de "ir até" (busca/ranking) para reposicionar o mapa */
  foco: { codigo: string; n: number } | null;
  onSelect: (codigo: string) => void;
}

type Geo = GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon, { c: string }>;

function bboxOf(g: GeoJSON.Polygon | GeoJSON.MultiPolygon): LngLatBounds {
  const b = new LngLatBounds();
  const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  for (const poly of polys) for (const ring of poly) for (const [x, y] of ring) b.extend([x, y]);
  return b;
}

function colorExpr(metric: MetricDef): ExpressionSpecification {
  const stops = metric.stops.flatMap(([v, c]) => [v, c]);
  return [
    "case",
    ["boolean", ["feature-state", "ok"], false],
    ["interpolate", ["linear"], ["feature-state", "v"], ...stops],
    "#d9d9d9",
  ] as unknown as ExpressionSpecification;
}

export default function MapView({ resumo, eleicao, metric, selecionado, foco, onSelect }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const geo = useRef<Geo | null>(null);
  const [pronto, setPronto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number; texto: string } | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const resumoRef = useRef(resumo);
  resumoRef.current = resumo;
  const metricRef = useRef({ metric, eleicao });
  metricRef.current = { metric, eleicao };

  // inicialização (uma vez)
  useEffect(() => {
    if (!el.current) return;
    setWorkerUrl("/maplibre-gl-worker.mjs");
    const m = new MapLibreMap({
      container: el.current,
      style: { version: 8, sources: {}, layers: [{ id: "fundo", type: "background", paint: { "background-color": "#eef2f5" } }] },
      bounds: [
        [-74, -34],
        [-34, 5.5],
      ],
      fitBoundsOptions: { padding: 10 },
      attributionControl: { compact: true, customAttribution: "Malha: IBGE · Votos: TSE" },
      maxZoom: 11,
      minZoom: 2,
      canvasContextAttributes: { preserveDrawingBuffer: true },
    });
    map.current = m;
    (window as unknown as { __map: unknown }).__map = m;
    m.addControl(new NavigationControl({ showCompass: false }), "top-left");

    m.on("load", async () => {
      try {
        const r = await fetch("/data/malha.geojson");
        if (!r.ok) throw new Error(`malha: HTTP ${r.status}`);
        const g = (await r.json()) as Geo;
        geo.current = g;
        m.addSource("mun", { type: "geojson", data: g, promoteId: "c" });
        m.addLayer({ id: "mun-fill", type: "fill", source: "mun", paint: { "fill-color": colorExpr(metricRef.current.metric), "fill-opacity": 0.95 } });
        m.addLayer({ id: "mun-line", type: "line", source: "mun", paint: { "line-color": "#ffffff", "line-width": ["interpolate", ["linear"], ["zoom"], 3, 0, 6, 0.2, 9, 0.6] } });
        m.addLayer({ id: "mun-sel", type: "line", source: "mun", filter: ["==", ["get", "c"], ""], paint: { "line-color": "#111", "line-width": 2.5 } });

        m.on("mousemove", "mun-fill", (e: MapLayerMouseEvent) => {
          const f = e.features?.[0];
          if (!f) return;
          m.getCanvas().style.cursor = "pointer";
          const code = String(f.properties?.c ?? f.id);
          const mun = resumoRef.current?.municipios[code];
          const { metric: mt, eleicao: el2 } = metricRef.current;
          const v = mun ? mt.value(mun, el2) : null;
          setTip({
            x: e.point.x,
            y: e.point.y,
            texto: `${mun?.n ?? code} (${mun?.uf ?? ""}) — ${v == null ? "sem dado" : `${v.toFixed(1).replace(".", ",")} ${mt.unit}`}`,
          });
        });
        m.on("mouseleave", "mun-fill", () => {
          m.getCanvas().style.cursor = "";
          setTip(null);
        });
        m.on("click", "mun-fill", (e: MapLayerMouseEvent) => {
          const f = e.features?.[0];
          if (f) onSelectRef.current(String(f.properties?.c ?? f.id));
        });
        setPronto(true);
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Falha ao carregar o mapa");
      }
    });
    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  // cores conforme métrica/eleição
  useEffect(() => {
    const m = map.current;
    if (!m || !pronto || !resumo) return;
    m.setPaintProperty("mun-fill", "fill-color", colorExpr(metric));
    for (const [codigo, mun] of Object.entries(resumo.municipios)) {
      const v = metric.value(mun, eleicao);
      m.setFeatureState({ source: "mun", id: codigo }, v == null ? { ok: false } : { ok: true, v });
    }
  }, [resumo, metric, eleicao, pronto]);

  // seleção
  useEffect(() => {
    const m = map.current;
    if (!m || !pronto) return;
    m.setFilter("mun-sel", ["==", ["get", "c"], selecionado ?? ""]);
  }, [selecionado, pronto]);

  // foco (zoom no município)
  useEffect(() => {
    const m = map.current;
    if (!m || !pronto || !foco || !geo.current) return;
    const f = geo.current.features.find((x) => x.properties.c === foco.codigo);
    if (f) m.fitBounds(bboxOf(f.geometry), { padding: 80, maxZoom: 9, duration: 700 });
  }, [foco, pronto]);

  return (
    <div className="mapa-wrap">
      <div ref={el} className="mapa" role="img" aria-label="Mapa coroplético dos municípios do Brasil. Use a busca ou a aba Onde atuar para navegar por teclado." />
      {!pronto && !erro && <div className="mapa-msg">Carregando mapa…</div>}
      {erro && <div className="mapa-msg erro">Não foi possível carregar o mapa: {erro}</div>}
      {tip && (
        <div className="tip" style={{ left: tip.x + 12, top: tip.y + 12 }}>
          {tip.texto}
        </div>
      )}
      <Legenda metric={metric} />
      {resumo && <span className="sr-only">{fInt(Object.keys(resumo.municipios).length)} municípios carregados</span>}
    </div>
  );
}

function Legenda({ metric }: { metric: MetricDef }) {
  const g = `linear-gradient(to right, ${metric.stops.map(([, c]) => c).join(",")})`;
  const first = metric.stops[0][0];
  const last = metric.stops[metric.stops.length - 1][0];
  return (
    <div className="legenda" aria-hidden="true">
      <div className="legenda-barra" style={{ background: g }} />
      <div className="legenda-rotulos">
        <span>{first <= 0 && last > 0 && first < 0 ? `≤ ${first}` : first}</span>
        <span>
          {metric.unit} · cinza = sem dado
        </span>
        <span>≥ {last}</span>
      </div>
    </div>
  );
}
