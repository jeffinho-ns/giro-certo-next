'use client';

import { useRef, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';

interface ImageUploadFieldProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  /** Proporção do preview. */
  aspect?: 'square' | 'wide';
  /** entityId (pasta) para o upload; normalmente o id da loja. */
  entityId?: string;
}

export function ImageUploadField({
  label,
  value,
  onChange,
  aspect = 'wide',
  entityId,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showUrl, setShowUrl] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const url = await apiClient.uploadImage(file, entityId);
      onChange(url);
    } catch (e: any) {
      setError(e?.message || 'Falha no upload');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const previewClass =
    aspect === 'square' ? 'h-28 w-28 rounded-xl' : 'h-32 w-full rounded-lg';

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}

      <div
        className={`relative overflow-hidden border border-dashed border-border bg-muted ${previewClass}`}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
              aria-label="Remover imagem"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageIcon className="h-7 w-7" />
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="mr-2 h-3.5 w-3.5" />
          {value ? 'Trocar imagem' : 'Enviar imagem'}
        </Button>
        <button
          type="button"
          className="text-xs text-muted-foreground underline"
          onClick={() => setShowUrl((s) => !s)}
        >
          ou usar URL
        </button>
      </div>

      {showUrl && (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
        />
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
