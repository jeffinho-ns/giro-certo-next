'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { apiClient } from '@/lib/api';
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
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Clock, User, Bike, FileText, Eye } from 'lucide-react';
import Image from 'next/image';

interface DeliveryRegistration {
  id: string;
  userId: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  cpfCnh: string;
  selfieWithDocData?: string; // base64
  motoWithPlateData?: string; // base64
  platePlateCloseupData?: string; // base64
  cnhPhotoData?: string; // base64
  crlvPhotoData?: string; // base64
  plateLicense: string;
  currentKilometers: number;
  lastOilChangeDate?: string;
  lastOilChangeKm?: number;
  emergencyPhone?: string;
  consentImages: boolean;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  adminNotes?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

function ImagePreview({ data, label }: { data?: string; label: string }) {
  if (!data) return <div className="text-xs text-muted-foreground">{label}: Não enviada</div>;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium">{label}</p>
      <img
        src={`data:image/jpeg;base64,${data}`}
        alt={label}
        className="w-full h-40 object-cover rounded border"
      />
    </div>
  );
}

function RegistrationDetail({ registration }: { registration: DeliveryRegistration }) {
  return (
    <div className="space-y-6">
      {/* Dados do usuário */}
      <div>
        <h3 className="font-semibold mb-2">Dados do Motociclista</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Nome</p>
            <p className="font-medium">{registration.user?.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Email</p>
            <p className="font-medium text-xs">{registration.user?.email || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Documentos */}
      <div>
        <h3 className="font-semibold mb-2">Documentação</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">CPF/CNH</p>
            <p className="font-medium">{registration.cpfCnh}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Consentimento de Imagens</p>
            <Badge variant={registration.consentImages ? 'default' : 'destructive'}>
              {registration.consentImages ? 'Consentiu' : 'Negou'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Moto */}
      <div>
        <h3 className="font-semibold mb-2">Dados da Motocicleta</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Placa</p>
            <p className="font-mono font-bold text-lg">{registration.plateLicense}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Km Atual</p>
            <p className="font-medium">{registration.currentKilometers.toLocaleString('pt-BR')} km</p>
          </div>
          <div>
            <p className="text-muted-foreground">Data Última Troca de Óleo</p>
            <p className="font-medium">
              {registration.lastOilChangeDate 
                ? new Date(registration.lastOilChangeDate).toLocaleDateString('pt-BR')
                : 'Não informado'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Km na Última Troca</p>
            <p className="font-medium">
              {registration.lastOilChangeKm?.toLocaleString('pt-BR') || 'Não informado'} km
            </p>
          </div>
        </div>
      </div>

      {/* Contato */}
      {registration.emergencyPhone && (
        <div>
          <h3 className="font-semibold mb-2">Contato de Emergência</h3>
          <p className="font-medium">{registration.emergencyPhone}</p>
        </div>
      )}

      {/* Fotos */}
      <div>
        <h3 className="font-semibold mb-4">Fotos Enviadas</h3>
        <div className="grid grid-cols-2 gap-4">
          <ImagePreview data={registration.selfieWithDocData} label="Selfie com Documento" />
          <ImagePreview data={registration.cnhPhotoData} label="Foto da CNH" />
          <ImagePreview data={registration.crlvPhotoData} label="Foto do CRLV" />
          <ImagePreview data={registration.motoWithPlateData} label="Moto com Placa" />
          <ImagePreview data={registration.platePlateCloseupData} label="Placa (Close-up)" />
        </div>
      </div>

      {/* Status */}
      {registration.status === 'APPROVED' && (
        <div className="bg-green-50 border border-green-200 rounded p-4">
          <p className="text-sm text-green-800">
            ✓ Aprovado em {new Date(registration.approvedAt!).toLocaleDateString('pt-BR')} por{' '}
            <strong>{registration.approvedBy}</strong>
          </p>
        </div>
      )}

      {registration.status === 'REJECTED' && (
        <div className="bg-red-50 border border-red-200 rounded p-4 space-y-2">
          <p className="text-sm font-medium text-red-800">Motivo da Rejeição:</p>
          <p className="text-sm text-red-700">{registration.rejectionReason}</p>
          {registration.adminNotes && (
            <>
              <p className="text-sm font-medium text-red-800 mt-2">Notas do Admin:</p>
              <p className="text-sm text-red-700">{registration.adminNotes}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function DeliveryRegistrationPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>('PENDING');
  const [selectedRegistration, setSelectedRegistration] = useState<DeliveryRegistration | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');

  // Listar registros
  const { data: registrationsData, isLoading } = useQuery<{
    registrations: DeliveryRegistration[];
    total: number;
  }>({
    queryKey: ['delivery-registrations', filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      params.append('limit', '50');

      const response = await apiClient.get<any>(
        `/api/delivery-registration/pending/review-list?${params.toString()}`
      );

      if (response && response.registrations) {
        return response;
      } else if (Array.isArray(response)) {
        return { registrations: response, total: response.length };
      }

      return { registrations: [], total: 0 };
    },
  });

  // Aprovar
  const approveMutation = useMutation({
    mutationFn: async ({
      registrationId,
      notes,
    }: {
      registrationId: string;
      notes?: string;
    }) => {
      return await apiClient.put(`/api/delivery-registration/${registrationId}/status`, {
        status: 'APPROVED',
        adminNotes: notes || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-registrations'] });
      setIsReviewModalOpen(false);
      setApprovalNotes('');
    },
  });

  // Rejeitar
  const rejectMutation = useMutation({
    mutationFn: async ({
      registrationId,
      reason,
      notes,
    }: {
      registrationId: string;
      reason: string;
      notes?: string;
    }) => {
      return await apiClient.put(`/api/delivery-registration/${registrationId}/status`, {
        status: 'REJECTED',
        rejectionReason: reason,
        adminNotes: notes || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-registrations'] });
      setIsReviewModalOpen(false);
      setRejectionReason('');
      setRejectionNotes('');
    },
  });

  const registrations = registrationsData?.registrations ?? [];

  function getStatusBadge(status: string) {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      PENDING: 'secondary',
      UNDER_REVIEW: 'default',
      APPROVED: 'outline',
      REJECTED: 'destructive',
    };

    const labels: Record<string, string> = {
      PENDING: 'Pendente',
      UNDER_REVIEW: 'Sob Revisão',
      APPROVED: 'Aprovado',
      REJECTED: 'Rejeitado',
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Aprovação de Registros</h1>
        <p className="text-muted-foreground">Gerencie pedidos de aprovação de entregadores</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="status-filter" className="mb-2 block">
                Status
              </Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Sob Revisão</SelectItem>
                  <SelectItem value="APPROVED">Aprovado</SelectItem>
                  <SelectItem value="REJECTED">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de registros */}
      <Card>
        <CardHeader>
          <CardTitle>
            Registros {filterStatus === 'all' ? '' : `(${filterStatus})`}
          </CardTitle>
          <CardDescription>
            Total: {registrations.length} registro{registrations.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum registro encontrado</div>
          ) : (
            <div className="space-y-4">
              {registrations.map((registration) => (
                <div
                  key={registration.id}
                  className="border rounded-lg p-4 flex items-start justify-between hover:bg-muted/50 transition"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-semibold">{registration.user?.name || 'Usuário'}</p>
                        <p className="text-sm text-muted-foreground">{registration.user?.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center text-sm">
                      <span className="font-mono">{registration.plateLicense}</span>
                      <span className="text-muted-foreground">•</span>
                      <span>{registration.currentKilometers.toLocaleString('pt-BR')} km</span>
                      <span className="text-muted-foreground">•</span>
                      {getStatusBadge(registration.status)}
                      <span className="text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(registration.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRegistration(registration);
                      setIsReviewModalOpen(true);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Revisar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes e Aprovação */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Revisar Registro de Delivery</DialogTitle>
            <DialogDescription>
              {selectedRegistration?.user?.name} • {selectedRegistration?.plateLicense}
            </DialogDescription>
          </DialogHeader>

          {selectedRegistration && (
            <>
              <RegistrationDetail registration={selectedRegistration} />

              {/* Ações */}
              {selectedRegistration.status === 'PENDING' && (
                <div className="space-y-4 border-t pt-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="approval-notes">Notas (Opcional)</Label>
                    <Textarea
                      id="approval-notes"
                      placeholder="Adicione comentários sobre a aprovação..."
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      className="resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (!rejectionReason.trim()) {
                          alert('Por favor, indique o motivo da rejeição');
                          return;
                        }
                        rejectMutation.mutate({
                          registrationId: selectedRegistration.id,
                          reason: rejectionReason,
                          notes: rejectionNotes,
                        });
                      }}
                      disabled={rejectMutation.isPending}
                      className="flex-1"
                    >
                      {rejectMutation.isPending ? 'Rejeitando...' : 'Rejeitar'}
                    </Button>
                    <Button
                      onClick={() => {
                        approveMutation.mutate({
                          registrationId: selectedRegistration.id,
                          notes: approvalNotes || undefined,
                        });
                      }}
                      disabled={approveMutation.isPending}
                      className="flex-1"
                    >
                      {approveMutation.isPending ? 'Aprovando...' : 'Aprovar'}
                    </Button>
                  </div>

                  {/* Área de Rejeição */}
                  <div className="space-y-2 border-t pt-4">
                    <Label htmlFor="rejection-reason">Motivo da Rejeição</Label>
                    <select
                      id="rejection-reason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                    >
                      <option value="">Selecione um motivo...</option>
                      <option value="DOCUMENTOS_ILEGÍVEIS">Documentos Ilegíveis</option>
                      <option value="FOTOS_INADEQUADAS">Fotos Inadequadas</option>
                      <option value="DOCUMENTOS_EXPIRADOS">Documentos Expirados</option>
                      <option value="DADOS_INCORRETOS">Dados Incorretos</option>
                      <option value="OUTRO">Outro</option>
                    </select>
                    <Textarea
                      placeholder="Detalhes adicionais sobre a rejeição..."
                      value={rejectionNotes}
                      onChange={(e) => setRejectionNotes(e.target.value)}
                      className="resize-none"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
