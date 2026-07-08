import { Store } from 'lucide-react';

export function ManagedStoreBanner() {
  return (
    <div
      role="status"
      className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <Store className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
      <p>
        Sua vitrine é gerenciada pela equipe Giro Certo. Foque nas suas vendas!
      </p>
    </div>
  );
}
