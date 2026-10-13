"use client";

import { useEffect, useRef, useState, type ReactNode, type MouseEvent } from "react";
import { ImagePlus, X } from "lucide-react";

/* ---------- Reveal 3D al hacer scroll ---------- */
export function Reveal({
  children,
  delay = 0,
  variant = "up",
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  variant?: "up" | "left" | "right" | "zoom" | "flip";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal-3d reveal-${variant} ${visible ? "revealed" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ---------- Tarjeta con inclinación 3D siguiendo el mouse ---------- */
export function Tilt({
  children,
  className = "",
  max = 10,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${x * max * 2}deg) rotateX(${-y * max * 2}deg) translateZ(0)`;
  }
  function onLeave() {
    const el = ref.current;
    if (el) el.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg)";
  }
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={`tilt-3d ${className}`}>
      {children}
    </div>
  );
}

/* ---------- Comprimir imagen elegida del dispositivo ---------- */
export function fileToDataUrl(file: File, maxSize = 1100): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(reader.result as string);
        ctx.drawImage(img, 0, 0, w, h);
        const isPng = file.type === "image/png";
        resolve(canvas.toDataURL(isPng ? "image/png" : "image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ---------- Selector de imagen desde el dispositivo (sin URLs) ---------- */
export function ImagePicker({
  value,
  onChange,
  label = "Imagen del producto",
  rounded = "rounded-2xl",
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  rounded?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setBusy(true);
    try {
      onChange(await fileToDataUrl(file));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold text-rose-950">{label}</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {value ? (
        <div className={`group relative overflow-hidden border-2 border-rose-200 bg-rose-50 ${rounded}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Vista previa" className="h-44 w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-rose-950/50 opacity-0 transition group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-full bg-white px-4 py-2 text-sm font-bold text-rose-600 shadow hover:bg-rose-50"
            >
              Cambiar imagen
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="rounded-full bg-rose-600 p-2 text-white shadow hover:bg-rose-700"
              aria-label="Quitar imagen"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={`flex w-full flex-col items-center justify-center gap-2 border-2 border-dashed px-4 py-8 text-center transition ${rounded} ${
            drag ? "border-pink-500 bg-pink-100" : "border-rose-300 bg-rose-50 hover:border-pink-400 hover:bg-pink-50"
          }`}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-500 text-white shadow-lg shadow-pink-300">
            <ImagePlus className="h-6 w-6" />
          </span>
          <span className="text-sm font-bold text-rose-900">{busy ? "Procesando imagen..." : "Elegir imagen de mi dispositivo"}</span>
          <span className="text-xs text-rose-400">Tocá para abrir tu galería o arrastrá el archivo acá · JPG, PNG o WebP</span>
        </button>
      )}
    </div>
  );
}

/* ---------- Logo de la tienda ---------- */
export function StoreLogo({ logo, name, size = 44 }: { logo: string; name: string; size?: number }) {
  if (logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logo} alt={name} style={{ width: size, height: size }} className="rounded-full object-cover ring-2 ring-pink-200" />;
  }
  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      className="flex items-center justify-center rounded-full bg-pink-500 font-black text-white shadow-lg shadow-pink-300"
    >
      {(name || "C").trim().charAt(0).toUpperCase()}
    </span>
  );
}
