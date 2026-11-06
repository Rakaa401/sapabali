"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import Button from "@/components/ui/button";

type Props = {
  slug: string;
  name: string;
  status: "draft" | "published" | "archived";
};

const QR_OPTIONS = { errorCorrectionLevel: "M", margin: 4, color: { dark: "#000000", light: "#ffffff" } } as const;

function download(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function DestinationQrCode({ slug, name, status }: Props) {
  const [origin] = useState<string>(process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ?? "");
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
const url = useMemo(() => (origin ? `${origin}/destinations/${encodeURIComponent(slug)}` : ""), [origin, slug]);
  const isLocal = /^https?:\/\/(localhost|127\.|0\.0\.0\.0|\[::1\])/i.test(url);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    QRCode.toDataURL(url, { ...QR_OPTIONS, width: 480 })
      .then((dataUrl) => {
        if (cancelled) return;
        setPreview(dataUrl);
        setError("");
      })
      .catch(() => {
        if (!cancelled) setError("Could not generate the QR code.");
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  async function downloadPng() {
    try {
      // Resolusi tinggi supaya tetap tajam saat dicetak
      const dataUrl = await QRCode.toDataURL(url, { ...QR_OPTIONS, width: 1200 });
      download(dataUrl, `qr-${slug}.png`);
    } catch {
      setError("Could not download the QR code.");
    }
  }

  async function downloadSvg() {
    try {
      const svg = await QRCode.toString(url, { ...QR_OPTIONS, type: "svg" });
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const objectUrl = URL.createObjectURL(blob);
      download(objectUrl, `qr-${slug}.svg`);
      URL.revokeObjectURL(objectUrl);
    } catch {
      setError("Could not download the QR code.");
    }
  }

  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-5 py-4">
        <h2 className="text-sm font-semibold text-zinc-900">Visitor QR code</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Print this code at the destination. Visitors scan it to open the public destination page.
        </p>
      </div>

      <div className="grid gap-6 p-5 sm:grid-cols-[auto_1fr]">
        <div className="flex h-48 w-48 items-center justify-center rounded-lg border border-zinc-200 bg-white">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt={`QR code for ${name}`} className="h-full w-full" />
          ) : (
            <span className="text-xs text-zinc-400">Generating...</span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-zinc-500">Destination URL</p>
            <p className="mt-1 break-all rounded-md bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-800">
              {url || "..."}
            </p>
          </div>

          {status !== "published" && (
            <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              This destination is {status}. Visitors who scan the code will see &ldquo;Destination not found&rdquo; until
              you publish it.
            </p>
          )}

          {isLocal && (
            <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              This URL points to your own computer, so phones cannot open it. Set NEXT_PUBLIC_SITE_URL to your deployed
              domain (or your LAN address for testing) before printing.
            </p>
          )}

          {error && (
            <p role="alert" className="text-xs text-red-700">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" onClick={downloadPng} disabled={!url} className="w-full sm:w-auto">
              Download PNG
            </Button>
            <Button type="button" variant="outline" onClick={downloadSvg} disabled={!url} className="w-full sm:w-auto">
              Download SVG
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
