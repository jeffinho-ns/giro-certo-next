'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Prediction = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
};

export function AddressAutocompleteField({
  value,
  onChange,
  onCoords,
  label = 'Endereço de entrega',
  placeholder = 'Rua, número, bairro, cidade',
}: {
  value: string;
  onChange: (address: string) => void;
  onCoords: (coords: { lat: number; lng: number } | null) => void;
  label?: string;
  placeholder?: string;
}) {
  const listId = useId();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const sessionRef = useRef(
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `sess-${Date.now()}`
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPredictions = useCallback(async (input: string) => {
    if (input.trim().length < 3) {
      setPredictions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.get<{ predictions: Prediction[] }>(
        `/api/store/public/places/autocomplete?input=${encodeURIComponent(input)}&sessionToken=${encodeURIComponent(sessionRef.current)}`
      );
      setPredictions(res.predictions ?? []);
      setOpen((res.predictions ?? []).length > 0);
    } catch {
      setPredictions([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleInput = (text: string) => {
    onChange(text);
    onCoords(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(text), 350);
  };

  const selectPrediction = async (p: Prediction) => {
    onChange(p.description);
    setOpen(false);
    setPredictions([]);
    try {
      const res = await apiClient.get<{
        place: { formattedAddress: string; latitude: number; longitude: number };
      }>(
        `/api/store/public/places/details?placeId=${encodeURIComponent(p.placeId)}&sessionToken=${encodeURIComponent(sessionRef.current)}`
      );
      if (res.place?.formattedAddress) onChange(res.place.formattedAddress);
      if (Number.isFinite(res.place?.latitude) && Number.isFinite(res.place?.longitude)) {
        onCoords({ lat: res.place.latitude, lng: res.place.longitude });
      }
      sessionRef.current =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `sess-${Date.now()}`;
    } catch {
      /* servidor geocodifica no createOrder se necessário */
    }
  };

  return (
    <div className="relative space-y-1">
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => predictions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        autoComplete="street-address"
        aria-autocomplete="list"
        aria-controls={listId}
      />
      {loading && (
        <p className="text-xs text-muted-foreground">Buscando endereços...</p>
      )}
      {open && predictions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border border-border bg-popover shadow-md"
        >
          {predictions.map((p) => (
            <li key={p.placeId} role="option">
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectPrediction(p)}
              >
                <span className="font-medium">{p.mainText}</span>
                {p.secondaryText ? (
                  <span className="block text-xs text-muted-foreground">{p.secondaryText}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">
        Selecione um endereço da lista ou use &quot;minha localização&quot; para melhor precisão.
      </p>
    </div>
  );
}
