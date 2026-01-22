'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { Partner, PartnerPayment, PartnerType, PaymentPlanType, PaymentStatus } from '@/lib/types';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Building2, MapPin, Phone, Mail, DollarSign, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function PartnersPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterBlocked, setFilterBlocked] = useState<string>('all');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Listar parceiros
  const { data: partnersData, isLoading } = useQuery<{ partners: Partner[]; total: number }>({
    queryKey: ['partners', filterType, filterBlocked],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('type', filterType);
      if (filterBlocked !== 'all') params.append('isBlocked', filterBlocked);
      params.append('limit', '50');
      
      const response = await apiClient.get<{ partners: Partner[]; total: number }>(
        `/api/partners?${params.toString()}`
      );
      return response;
    },
  });

  // Buscar parceiro com pagamento
  const { data: partnerDetail } = useQuery<{ partner: Partner } | null>({
    queryKey: ['partner', selectedPartner?.id],
    queryFn: async () => {
      if (!selectedPartner?.id) return null;
      const response = await apiClient.get<{ partner: Partner }>(
        `/api/partners/${selectedPartner.id}`
      );
      return response;
    },
    enabled: !!selectedPartner?.id,
  });

  // Criar/Atualizar parceiro
  const createPartnerMutation = useMutation({
    mutationFn: async (data: any) => {
      if (selectedPartner) {
        return apiClient.put(`/api/partners/${selectedPartner.id}`, data);
      }
      return apiClient.post('/api/partners', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      setIsEditModalOpen(false);
      setSelectedPartner(null);
    },
  });

  // Bloquear/Desbloquear
  const blockPartnerMutation = useMutation({
    mutationFn: async ({ partnerId, isBlocked }: { partnerId: string; isBlocked: boolean }) => {
      return apiClient.put(`/api/partners/${partnerId}/block`, { isBlocked });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      queryClient.invalidateQueries({ queryKey: ['partner'] });
    },
  });

  // Criar plano de pagamento
  const createPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiClient.post(`/api/partners/${selectedPartner?.id}/payment`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner'] });
      setIsPaymentModalOpen(false);
    },
  });

  // Registrar pagamento
  const recordPaymentMutation = useMutation({
    mutationFn: async ({ paymentId, data }: { paymentId: string; data: any }) => {
      return apiClient.post(`/api/partners/payment/${paymentId}/record`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner'] });
    },
  });

  const partners = partnersData?.partners || [];

  const filteredPartners = partners.filter((partner) => {
    const matchesSearch =
      partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.cnpj?.includes(searchTerm);
    return matchesSearch;
  });

  const getStatusBadge = (partner: Partner) => {
    if (partner.isBlocked) {
      return <Badge variant="destructive">Bloqueado</Badge>;
    }
    if (partner.payment?.status === PaymentStatus.OVERDUE) {
      return <Badge className="bg-orange-500">Inadimplente</Badge>;
    }
    if (partner.payment?.status === PaymentStatus.WARNING) {
      return <Badge className="bg-yellow-500">Aviso</Badge>;
    }
    if (partner.isTrusted) {
      return <Badge className="bg-green-500">Confiança</Badge>;
    }
    return <Badge variant="secondary">Ativo</Badge>;
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    const variants: Record<PaymentStatus, { className: string; label: string }> = {
      [PaymentStatus.ACTIVE]: { className: 'bg-green-500', label: 'Ativo' },
      [PaymentStatus.WARNING]: { className: 'bg-yellow-500', label: 'Aviso' },
      [PaymentStatus.OVERDUE]: { className: 'bg-orange-500', label: 'Inadimplente' },
      [PaymentStatus.SUSPENDED]: { className: 'bg-red-500', label: 'Suspenso' },
    };
    const variant = variants[status];
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const handleEdit = (partner: Partner) => {
    setSelectedPartner(partner);
    setIsEditModalOpen(true);
  };

  const handleBlock = async (partner: Partner) => {
    if (confirm(`Deseja ${partner.isBlocked ? 'desbloquear' : 'bloquear'} este parceiro?`)) {
      await blockPartnerMutation.mutateAsync({
        partnerId: partner.id,
        isBlocked: !partner.isBlocked,
      });
    }
  };

  return (
    <ProtectedRoute requireModerator>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestão de Lojistas</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie parceiros, dados empresariais e informações financeiras
            </p>
          </div>
          {isAdmin && (
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setSelectedPartner(null)}>
                  <Building2 className="h-4 w-4 mr-2" />
                  Novo Parceiro
                </Button>
              </DialogTrigger>
              <EditPartnerDialog
                partner={selectedPartner}
                onSave={(data) => createPartnerMutation.mutate(data)}
                isLoading={createPartnerMutation.isPending}
              />
            </Dialog>
          )}
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Buscar</Label>
                <Input
                  placeholder="Nome, email ou CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value={PartnerType.STORE}>Loja</SelectItem>
                    <SelectItem value={PartnerType.MECHANIC}>Mecânico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filterBlocked} onValueChange={setFilterBlocked}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="false">Ativos</SelectItem>
                    <SelectItem value="true">Bloqueados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('all');
                    setFilterBlocked('all');
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Parceiros */}
        {isLoading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPartners.map((partner) => (
              <Card key={partner.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{partner.name}</CardTitle>
                      <CardDescription>
                        {partner.type === PartnerType.STORE ? 'Loja' : 'Mecânico'}
                      </CardDescription>
                    </div>
                    {getStatusBadge(partner)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    {partner.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{partner.email}</span>
                      </div>
                    )}
                    {partner.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{partner.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{partner.address}</span>
                    </div>
                    {partner.cnpj && (
                      <div className="text-muted-foreground">
                        <strong>CNPJ:</strong> {partner.cnpj}
                      </div>
                    )}
                  </div>

                  {partner.payment && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Plano:</span>
                        {getPaymentStatusBadge(partner.payment.status)}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedPartner(partner);
                        setIsEditModalOpen(true);
                      }}
                    >
                      Ver Detalhes
                    </Button>
                    {isAdmin && (
                      <Button
                        variant={partner.isBlocked ? 'default' : 'destructive'}
                        size="sm"
                        onClick={() => handleBlock(partner)}
                      >
                        {partner.isBlocked ? 'Desbloquear' : 'Bloquear'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de Detalhes */}
        {selectedPartner && partnerDetail && (
          <Dialog open={!!selectedPartner} onOpenChange={(open) => !open && setSelectedPartner(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{partnerDetail.partner.name}</DialogTitle>
                <DialogDescription>Detalhes completos do parceiro</DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="financial">Financeiro</TabsTrigger>
                  <TabsTrigger value="operational">Operacional</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                  <PartnerInfoTab partner={partnerDetail.partner} />
                </TabsContent>

                <TabsContent value="financial" className="space-y-4">
                  <PartnerFinancialTab
                    partner={partnerDetail.partner}
                    onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
                    onRecordPayment={(paymentId, data) =>
                      recordPaymentMutation.mutate({ paymentId, data })
                    }
                    isAdmin={isAdmin || false}
                  />
                </TabsContent>

                <TabsContent value="operational" className="space-y-4">
                  <PartnerOperationalTab partner={partnerDetail.partner} />
                </TabsContent>
              </Tabs>

              <DialogFooter>
                {isAdmin && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedPartner(partnerDetail.partner);
                        setIsEditModalOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      variant={partnerDetail.partner.isBlocked ? 'default' : 'destructive'}
                      onClick={() => handleBlock(partnerDetail.partner)}
                    >
                      {partnerDetail.partner.isBlocked ? 'Desbloquear' : 'Bloquear'}
                    </Button>
                  </>
                )}
                <Button variant="outline" onClick={() => setSelectedPartner(null)}>
                  Fechar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Modal de Pagamento */}
        {selectedPartner && (
          <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Plano de Pagamento</DialogTitle>
                <DialogDescription>
                  Configure o plano de pagamento para {selectedPartner.name}
                </DialogDescription>
              </DialogHeader>
              <PaymentPlanForm
                partnerId={selectedPartner.id}
                onSave={(data) => createPaymentMutation.mutate(data)}
                isLoading={createPaymentMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </ProtectedRoute>
  );
}

// Componentes auxiliares
function EditPartnerDialog({
  partner,
  onSave,
  isLoading,
}: {
  partner: Partner | null;
  onSave: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: partner?.name || '',
    type: partner?.type || PartnerType.STORE,
    address: partner?.address || '',
    latitude: partner?.latitude?.toString() || '',
    longitude: partner?.longitude?.toString() || '',
    phone: partner?.phone || '',
    email: partner?.email || '',
    cnpj: partner?.cnpj || '',
    companyName: partner?.companyName || '',
    tradingName: partner?.tradingName || '',
    stateRegistration: partner?.stateRegistration || '',
    maxServiceRadius: partner?.maxServiceRadius?.toString() || '',
    avgPreparationTime: partner?.avgPreparationTime?.toString() || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      maxServiceRadius: formData.maxServiceRadius ? parseFloat(formData.maxServiceRadius) : null,
      avgPreparationTime: formData.avgPreparationTime
        ? parseInt(formData.avgPreparationTime)
        : null,
    });
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{partner ? 'Editar Parceiro' : 'Novo Parceiro'}</DialogTitle>
        <DialogDescription>
          {partner ? 'Atualize as informações do parceiro' : 'Preencha os dados do novo parceiro'}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as PartnerType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PartnerType.STORE}>Loja</SelectItem>
                <SelectItem value={PartnerType.MECHANIC}>Mecânico</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Endereço *</Label>
          <Input
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Latitude *</Label>
            <Input
              type="number"
              step="any"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Longitude *</Label>
            <Input
              type="number"
              step="any"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>CNPJ</Label>
          <Input
            value={formData.cnpj}
            onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Razão Social</Label>
            <Input
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Nome Fantasia</Label>
            <Input
              value={formData.tradingName}
              onChange={(e) => setFormData({ ...formData, tradingName: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Inscrição Estadual</Label>
          <Input
            value={formData.stateRegistration}
            onChange={(e) => setFormData({ ...formData, stateRegistration: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Raio Máximo (km)</Label>
            <Input
              type="number"
              step="0.1"
              value={formData.maxServiceRadius}
              onChange={(e) => setFormData({ ...formData, maxServiceRadius: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Tempo Médio Preparo (min)</Label>
            <Input
              type="number"
              value={formData.avgPreparationTime}
              onChange={(e) => setFormData({ ...formData, avgPreparationTime: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Salvando...' : partner ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function PartnerInfoTab({ partner }: { partner: Partner }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-muted-foreground">Nome</Label>
          <p className="font-medium">{partner.name}</p>
        </div>
        <div>
          <Label className="text-muted-foreground">Tipo</Label>
          <p className="font-medium">
            {partner.type === PartnerType.STORE ? 'Loja' : 'Mecânico'}
          </p>
        </div>
      </div>

      <div>
        <Label className="text-muted-foreground">Endereço</Label>
        <p className="font-medium">{partner.address}</p>
      </div>

      {partner.cnpj && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground">CNPJ</Label>
            <p className="font-medium">{partner.cnpj}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Razão Social</Label>
            <p className="font-medium">{partner.companyName || '-'}</p>
          </div>
        </div>
      )}

      {partner.tradingName && (
        <div>
          <Label className="text-muted-foreground">Nome Fantasia</Label>
          <p className="font-medium">{partner.tradingName}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {partner.email && (
          <div>
            <Label className="text-muted-foreground">Email</Label>
            <p className="font-medium">{partner.email}</p>
          </div>
        )}
        {partner.phone && (
          <div>
            <Label className="text-muted-foreground">Telefone</Label>
            <p className="font-medium">{partner.phone}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PartnerFinancialTab({
  partner,
  onOpenPaymentModal,
  onRecordPayment,
  isAdmin,
}: {
  partner: Partner;
  onOpenPaymentModal: () => void;
  onRecordPayment: (paymentId: string, data: any) => void;
  isAdmin: boolean;
}) {
  const payment = partner.payment;

  if (!payment) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">Nenhum plano de pagamento configurado</p>
        {isAdmin && (
          <Button onClick={onOpenPaymentModal}>
            <DollarSign className="h-4 w-4 mr-2" />
            Criar Plano de Pagamento
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-muted-foreground">Tipo de Plano</Label>
          <p className="font-medium">
            {payment.planType === PaymentPlanType.MONTHLY_SUBSCRIPTION
              ? 'Assinatura Mensal'
              : 'Percentual por Pedido'}
          </p>
        </div>
        <div>
          <Label className="text-muted-foreground">Status</Label>
          <div className="mt-1">
            {payment.status === PaymentStatus.ACTIVE && (
              <Badge className="bg-green-500">Ativo</Badge>
            )}
            {payment.status === PaymentStatus.WARNING && (
              <Badge className="bg-yellow-500">Aviso</Badge>
            )}
            {payment.status === PaymentStatus.OVERDUE && (
              <Badge className="bg-orange-500">Inadimplente</Badge>
            )}
            {payment.status === PaymentStatus.SUSPENDED && (
              <Badge className="bg-red-500">Suspenso</Badge>
            )}
          </div>
        </div>
      </div>

      {payment.planType === PaymentPlanType.MONTHLY_SUBSCRIPTION && (
        <div>
          <Label className="text-muted-foreground">Mensalidade</Label>
          <p className="font-medium">
            R$ {payment.monthlyFee?.toFixed(2).replace('.', ',') || '0,00'}
          </p>
        </div>
      )}

      {payment.planType === PaymentPlanType.PERCENTAGE_PER_ORDER && (
        <div>
          <Label className="text-muted-foreground">Percentual</Label>
          <p className="font-medium">{payment.percentageFee?.toFixed(2) || '0'}%</p>
        </div>
      )}

      {payment.dueDate && (
        <div>
          <Label className="text-muted-foreground">Data de Vencimento</Label>
          <p className="font-medium">
            {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
          </p>
        </div>
      )}

      {payment.lastPaymentDate && (
        <div>
          <Label className="text-muted-foreground">Último Pagamento</Label>
          <p className="font-medium">
            {new Date(payment.lastPaymentDate).toLocaleDateString('pt-BR')}
          </p>
        </div>
      )}

      {isAdmin && (
        <div className="pt-4 border-t">
          <Button onClick={onOpenPaymentModal} variant="outline" className="mr-2">
            Atualizar Plano
          </Button>
          <RecordPaymentButton
            paymentId={payment.id}
            onRecord={onRecordPayment}
          />
        </div>
      )}
    </div>
  );
}

function PartnerOperationalTab({ partner }: { partner: Partner }) {
  return (
    <div className="space-y-4">
      {partner.maxServiceRadius && (
        <div>
          <Label className="text-muted-foreground">Raio Máximo de Atendimento</Label>
          <p className="font-medium">{partner.maxServiceRadius} km</p>
        </div>
      )}

      {partner.avgPreparationTime && (
        <div>
          <Label className="text-muted-foreground">Tempo Médio de Preparo</Label>
          <p className="font-medium">{partner.avgPreparationTime} minutos</p>
        </div>
      )}

      {partner.operatingHours && (
        <div>
          <Label className="text-muted-foreground">Horários de Funcionamento</Label>
          <div className="mt-2 space-y-2">
            {Object.entries(partner.operatingHours).map(([day, hours]: [string, any]) => (
              <div key={day} className="flex justify-between">
                <span className="capitalize">{day}</span>
                <span>
                  {hours.closed
                    ? 'Fechado'
                    : `${hours.open || '-'} - ${hours.close || '-'}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentPlanForm({
  partnerId,
  onSave,
  isLoading,
}: {
  partnerId: string;
  onSave: (data: any) => void;
  isLoading: boolean;
}) {
  const [planType, setPlanType] = useState<PaymentPlanType>(
    PaymentPlanType.MONTHLY_SUBSCRIPTION
  );
  const [monthlyFee, setMonthlyFee] = useState('');
  const [percentageFee, setPercentageFee] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      planType,
      monthlyFee: planType === PaymentPlanType.MONTHLY_SUBSCRIPTION ? parseFloat(monthlyFee) : null,
      percentageFee:
        planType === PaymentPlanType.PERCENTAGE_PER_ORDER ? parseFloat(percentageFee) : null,
      dueDate: dueDate || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Tipo de Plano *</Label>
        <Select value={planType} onValueChange={(value) => setPlanType(value as PaymentPlanType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={PaymentPlanType.MONTHLY_SUBSCRIPTION}>
              Assinatura Mensal
            </SelectItem>
            <SelectItem value={PaymentPlanType.PERCENTAGE_PER_ORDER}>
              Percentual por Pedido
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {planType === PaymentPlanType.MONTHLY_SUBSCRIPTION && (
        <>
          <div className="space-y-2">
            <Label>Valor da Mensalidade (R$) *</Label>
            <Input
              type="number"
              step="0.01"
              value={monthlyFee}
              onChange={(e) => setMonthlyFee(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Data de Vencimento</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </>
      )}

      {planType === PaymentPlanType.PERCENTAGE_PER_ORDER && (
        <div className="space-y-2">
          <Label>Percentual por Pedido (%) *</Label>
          <Input
            type="number"
            step="0.01"
            value={percentageFee}
            onChange={(e) => setPercentageFee(e.target.value)}
            required
          />
        </div>
      )}

      <DialogFooter>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Criar Plano'}
        </Button>
      </DialogFooter>
    </form>
  );
}

function RecordPaymentButton({
  paymentId,
  onRecord,
}: {
  paymentId: string;
  onRecord: (paymentId: string, data: any) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRecord(paymentId, {
      amount: parseFloat(amount),
      paymentDate,
      description,
    });
    setIsOpen(false);
    setAmount('');
    setDescription('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Registrar Pagamento</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
          <DialogDescription>Registre um novo pagamento recebido</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Valor (R$) *</Label>
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Data do Pagamento *</Label>
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Pagamento mensalidade janeiro"
            />
          </div>
          <DialogFooter>
            <Button type="submit">Registrar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
