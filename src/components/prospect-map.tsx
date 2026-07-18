"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export interface MapPin {
  id: string;
  name: string;
  tier: "platinum" | "gold" | "silver" | "black";
  score: number;
  lat: number;
  lng: number;
  city: string;
  window: string;
}

const TIER_COLOR: Record<MapPin["tier"], string> = {
  platinum: "#dcdfe6",
  gold: "#d4a843",
  silver: "#a49a8d",
  black: "#55493f",
};

export function ProspectMap({ pins }: { pins: MapPin[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-111.9, 33.45],
      zoom: 8,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    const bounds = new mapboxgl.LngLatBounds();
    for (const p of pins) {
      const el = document.createElement("div");
      el.style.cssText = `width:14px;height:14px;border-radius:50%;background:${TIER_COLOR[p.tier]};border:2px solid rgba(13,11,10,.9);box-shadow:0 0 0 1px ${TIER_COLOR[p.tier]}55, 0 2px 6px rgba(0,0,0,.5);cursor:pointer;`;
      const popup = new mapboxgl.Popup({ offset: 12, closeButton: false }).setHTML(
        `<div style="font-family:ui-sans-serif,system-ui;background:#1a1614;color:#ece7e1;margin:-10px;padding:10px 12px;border-radius:8px;border:1px solid #2b241e;min-width:180px">
           <div style="font-weight:600;font-size:13px">${p.name}</div>
           <div style="font-size:11px;color:#a89f94;margin-top:2px">${p.city} · ${p.tier.toUpperCase()}</div>
           <div style="font-size:11px;color:#e07b52;margin-top:4px">Est. window: ${p.window}</div>
         </div>`,
      );
      const marker = new mapboxgl.Marker({ element: el }).setLngLat([p.lng, p.lat]).setPopup(popup).addTo(map);
      el.addEventListener("mouseenter", () => marker.togglePopup());
      el.addEventListener("mouseleave", () => marker.togglePopup());
      bounds.extend([p.lng, p.lat]);
    }
    if (pins.length > 1) map.fitBounds(bounds, { padding: 60, maxZoom: 11, duration: 0 });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="h-80 w-full overflow-hidden rounded-xl border border-border" />;
}
