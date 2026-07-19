"use client";

import { useRef, useState } from "react";
import { Loader2, Upload, X, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface FileUploadProps {
  /** input accept attribute, e.g. "application/pdf" or "image/*" */
  accept: string;
  /** blob folder prefix, e.g. "assessments" */
  folder: string;
  /** called with the public blob URL after a successful upload */
  onUploaded: (url: string, filename: string) => void;
  /** currently-stored URL (to show it's set / allow clearing) */
  currentUrl?: string | null;
  onClear?: () => void;
  label?: string;
  /** show a preview image thumbnail for image uploads */
  preview?: boolean;
  maxSizeMB?: number;
}

export function FileUpload({
  accept,
  folder,
  onUploaded,
  currentUrl,
  onClear,
  label = "Unggah file",
  preview = false,
  maxSizeMB = 100,
}: FileUploadProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast({ title: `Ukuran file maksimal ${maxSizeMB} MB`, variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);
      const res = await fetch("/api/blob/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload gagal");
      onUploaded(data.url, file.name);
      toast({ title: "File terunggah" });
    } catch (err) {
      toast({
        title: "Gagal mengunggah",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {preview && currentUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentUrl} alt="preview" className="w-14 h-14 rounded-lg object-cover border border-sand-200" />
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFile}
          className="hidden"
          id={`fu-${folder}`}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 text-sm rounded-lg border border-sand-300 px-3 py-2 text-forest-600 hover:bg-sand-50 disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {label}
        </button>
        {currentUrl && !preview && (
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-teal-dark hover:underline"
          >
            <FileText className="w-3.5 h-3.5" /> Lihat file
          </a>
        )}
        {currentUrl && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-sand-400 hover:text-red-500"
            aria-label="Hapus file"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
