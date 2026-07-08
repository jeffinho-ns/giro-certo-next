'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  Copy,
  Check,
  QrCode,
  Package,
  ShoppingBag,
  DollarSign,
  Clock,
  LayoutTemplate,
  History,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import {
  Partner,
  StoreAdminStats,
  StoreAuditLogEntry,
  StoreReadiness,
  StoreTemplate,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStoreManage } from '@/lib/store-manage-context';

const money = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0);

export default function AdminStoreOverviewPage({
  params,
}: {
  params: Promise<{ partnerId: string }>;
}) {
  const { partnerId } = use(params);
  const { partnerName } = useStoreManage();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: partnerData } = useQuery<{ partner: Partner }>({
    queryKey: ['partner', partnerId],
    queryFn: () => apiClient.get(`/api/partners/${partnerId}`),
  });
  const partner = partnerData?.partner;
  const slug = partner?.slug;
  const storefrontPath = slug ? `/loja/${slug}` : null;
  const storefrontUrl =
    storefrontPath && typeof window !== 'undefined'
      ? `${window.location.origin}${storefrontPath}`
      : storefrontPath;

  const { data: readiness, isLoading: loadingReadiness } = useQuery<StoreReadiness>({
    queryKey: ['store-admin', partnerId, 'readiness'],
    queryFn: () => apiClient.get(`/api/store/admin/${partnerId}/readiness`),
  });

  const { data: stats, isLoading: loadingStats } = useQuery<StoreAdminStats>({
    queryKey: ['store-admin', partnerId, 'stats'],
    queryFn: () => apiClient.get(`/api/store/admin/${partnerId}/stats`),
  });

  const { data: auditData, isLoading: loadingAudit } = useQuery<{ entries: StoreAuditLogEntry[] }>({
    queryKey: ['store-admin', partnerId, 'audit'],
    queryFn: () => apiClient.get(`/api/store/admin/${partnerId}/audit-log?limit=10`),
  });

  const { data: templatesData } = useQuery<{ templates: StoreTemplate[] }>({
    queryKey: ['store-admin', 'templates'],
    queryFn: () => apiClient.get('/api/store/admin/templates'),
  });
  const templates = templatesData?.templates ?? [];

  const applyTemplate = useMutation({
    mutationFn: (templateId: string) =>
      apiClient.post(`/api/store/admin/${partnerId}/apply-template`, { templateId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-admin', partnerId] });
      setSelectedTemplate('');
    },
  });

  const copyUrl = async () => {
    if (!storefrontUrl || typeof window === 'undefined') return;
    const full = storefrontUrl.startsWith('http')
      ? storefrontUrl
      : `${window.location.origin}${storefrontPath}`;
    await navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Visão geral — {partnerName || partner?.name}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Checklist de prontidão, estatísticas e ações rápidas da vitrine.
          </p>
        </div>
        {partner?.storeManagementMode && (
          <Badge variant={partner.storeManagementMode === 'giro_managed' ? 'default' : 'secondary'}>
            {partner.storeManagementMode === 'giro_managed' ? 'Giro gerencia' : 'Lojista gerencia'}
          </Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Pedidos hoje"
          value={loadingStats ? '…' : String(stats?.ordersToday ?? 0)}
          icon={ShoppingBag}
        />
        <StatCard
          title="Pendentes"
          value={loadingStats ? '…' : String(stats?.ordersPending ?? 0)}
          icon={Clock}
        />
        <StatCard
          title="Produtos ativos"
          value={loadingStats ? '…' : String(stats?.productsActive ?? 0)}
          icon={Package}
        />
        <StatCard
          title="Receita hoje"
          value={loadingStats ? '…' : money(stats?.revenueToday ?? 0)}
          icon={DollarSign}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Prontidão da vitrine
            </CardTitle>
            <CardDescription>
              {loadingReadiness
                ? 'Carregando checklist...'
                : readiness?.ready
                  ? 'Loja pronta para receber pedidos'
                  : `Score: ${readiness?.score ?? 0}%`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingReadiness && (
              <p className="text-sm text-muted-foreground">Verificando requisitos...</p>
            )}
            {!loadingReadiness &&
              (readiness?.checks ?? []).map((check) => (
                <div
                  key={check.key}
                  className="flex items-start gap-3 rounded-lg border border-border p-3"
                >
                  {check.passed ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{check.label}</p>
                    {check.hint && (
                      <p className="text-xs text-muted-foreground">{check.hint}</p>
                    )}
                  </div>
                </div>
              ))}
            {!loadingReadiness && !readiness?.checks?.length && (
              <p className="text-sm text-muted-foreground">Nenhum item no checklist.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Vitrine pública
            </CardTitle>
            <CardDescription>Link compartilhável e QR code para divulgação.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {storefrontPath ? (
              <>
                <div className="rounded-lg bg-muted p-3 font-mono text-sm break-all">
                  {storefrontPath}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={copyUrl}>
                    {copied ? (
                      <Check className="mr-2 h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    {copied ? 'Copiado!' : 'Copiar URL'}
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={storefrontPath} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Abrir vitrine
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`${storefrontPath}?qr=1`} target="_blank">
                      <QrCode className="mr-2 h-4 w-4" />
                      Dica QR
                    </Link>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Imprima o QR code apontando para esta URL em materiais físicos da loja.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Esta loja ainda não possui slug configurado. Defina em Personalizar.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutTemplate className="h-5 w-5" />
              Aplicar template
            </CardTitle>
            <CardDescription>
              Preenche catálogo e aparência com um modelo pré-definido.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplate && (
              <p className="text-xs text-muted-foreground">
                {templates.find((t) => t.id === selectedTemplate)?.description}
              </p>
            )}
            <Button
              disabled={!selectedTemplate || applyTemplate.isPending}
              onClick={() => applyTemplate.mutate(selectedTemplate)}
            >
              {applyTemplate.isPending ? 'Aplicando...' : 'Aplicar template'}
            </Button>
            {applyTemplate.isError && (
              <p className="text-sm text-destructive">
                {(applyTemplate.error as Error)?.message || 'Falha ao aplicar template'}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Auditoria recente
            </CardTitle>
            <CardDescription>Últimas ações na vitrine desta loja.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingAudit && (
              <p className="text-sm text-muted-foreground">Carregando histórico...</p>
            )}
            {!loadingAudit && !auditData?.entries?.length && (
              <p className="text-sm text-muted-foreground">Nenhum registro recente.</p>
            )}
            <ul className="space-y-3">
              {(auditData?.entries ?? []).map((entry) => (
                <li key={entry.id} className="rounded-lg border border-border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{entry.action}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  {entry.actorName && (
                    <p className="mt-1 text-xs text-muted-foreground">por {entry.actorName}</p>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href={`/dashboard/lojas/${partnerId}/produtos`}>Gerenciar produtos</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/lojas/${partnerId}/personalizar`}>Personalizar vitrine</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/lojas/${partnerId}/pedidos`}>Ver pedidos</Link>
        </Button>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
