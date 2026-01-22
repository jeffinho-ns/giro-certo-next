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
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, CheckCircle2, XCircle, Clock, User, ShieldCheck } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

enum DocumentType {
  RG = 'RG',
  CNH = 'CNH',
  PASSPORT = 'PASSPORT',
}

enum DocumentStatus {
  PENDING = 'PENDING',
  UPLOADED = 'UPLOADED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

interface CourierDocument {
  id: string;
  userId: string;
  documentType: DocumentType;
  status: DocumentStatus;
  fileUrl: string | null;
  expirationDate: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  rejectionReason: string | null;
  notes: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function DocumentsPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedDocument, setSelectedDocument] = useState<CourierDocument | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [notes, setNotes] = useState('');

  // Listar documentos pendentes
  const { data: documentsData, isLoading } = useQuery<{ documents: CourierDocument[]; total: number }>({
    queryKey: ['documents', filterStatus, filterType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterType !== 'all') params.append('documentType', filterType);
      params.append('limit', '100');
      
      const response = await apiClient.get<any>(
        `/api/courier-documents/pending/review?${params.toString()}`
      );
      
      // Ajustar estrutura da resposta
      if (response && response.documents) {
        return response;
      } else if (Array.isArray(response)) {
        return { documents: response, total: response.length };
      } else if (response && response.data) {
        return { documents: response.data, total: response.total || response.data.length };
      }
      
      return { documents: [], total: 0 };
    },
  });

  // Aprovar documento
  const approveMutation = useMutation({
    mutationFn: async ({ documentId, notes }: { documentId: string; notes?: string }) => {
      return apiClient.put(`/api/courier-documents/${documentId}/status`, {
        status: DocumentStatus.APPROVED,
        notes: notes || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setIsReviewModalOpen(false);
      setSelectedDocument(null);
      setRejectionReason('');
      setNotes('');
    },
  });

  // Rejeitar documento
  const rejectMutation = useMutation({
    mutationFn: async ({ documentId, rejectionReason, notes }: { documentId: string; rejectionReason: string; notes?: string }) => {
      return apiClient.put(`/api/courier-documents/${documentId}/status`, {
        status: DocumentStatus.REJECTED,
        rejectionReason,
        notes: notes || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setIsReviewModalOpen(false);
      setSelectedDocument(null);
      setRejectionReason('');
      setNotes('');
    },
  });

  const documents = documentsData?.documents || [];

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.APPROVED:
        return <Badge className="bg-green-500">Aprovado</Badge>;
      case DocumentStatus.REJECTED:
        return <Badge className="bg-red-500">Rejeitado</Badge>;
      case DocumentStatus.UPLOADED:
        return <Badge className="bg-yellow-500">Aguardando Revisão</Badge>;
      case DocumentStatus.PENDING:
        return <Badge className="bg-gray-500">Pendente</Badge>;
      case DocumentStatus.EXPIRED:
        return <Badge className="bg-orange-500">Expirado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeLabel = (type: DocumentType) => {
    switch (type) {
      case DocumentType.RG:
        return 'RG';
      case DocumentType.CNH:
        return 'CNH';
      case DocumentType.PASSPORT:
        return 'Passaporte';
      default:
        return type;
    }
  };

  const handleReview = (document: CourierDocument) => {
    setSelectedDocument(document);
    setIsReviewModalOpen(true);
  };

  const handleApprove = () => {
    if (!selectedDocument) return;
    approveMutation.mutate({
      documentId: selectedDocument.id,
      notes: notes || undefined,
    });
  };

  const handleReject = () => {
    if (!selectedDocument || !rejectionReason.trim()) {
      alert('Por favor, informe o motivo da rejeição');
      return;
    }
    rejectMutation.mutate({
      documentId: selectedDocument.id,
      rejectionReason: rejectionReason.trim(),
      notes: notes || undefined,
    });
  };

  return (
    <ProtectedRoute requireAdmin>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Documentos de Entregadores</h1>
            <p className="text-muted-foreground mt-2">
              FASE 1: Revisar e aprovar documentos dos motociclistas
            </p>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value={DocumentStatus.PENDING}>Pendente</SelectItem>
                    <SelectItem value={DocumentStatus.UPLOADED}>Aguardando Revisão</SelectItem>
                    <SelectItem value={DocumentStatus.APPROVED}>Aprovado</SelectItem>
                    <SelectItem value={DocumentStatus.REJECTED}>Rejeitado</SelectItem>
                    <SelectItem value={DocumentStatus.EXPIRED}>Expirado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Documento</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value={DocumentType.RG}>RG</SelectItem>
                    <SelectItem value={DocumentType.CNH}>CNH</SelectItem>
                    <SelectItem value={DocumentType.PASSPORT}>Passaporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Documentos */}
        {isLoading ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">Carregando documentos...</div>
            </CardContent>
          </Card>
        ) : documents.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum documento encontrado</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {documents.map((document) => (
              <Card key={document.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold">{getTypeLabel(document.documentType)}</h3>
                        {getStatusBadge(document.status)}
                      </div>
                      
                      {document.user && (
                        <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>{document.user.name}</span>
                          <span className="text-muted-foreground/70">({document.user.email})</span>
                        </div>
                      )}

                      {document.expirationDate && (
                        <div className="text-sm text-muted-foreground mb-2">
                          Vencimento: {new Date(document.expirationDate).toLocaleDateString('pt-BR')}
                        </div>
                      )}

                      {document.fileUrl && (
                        <div className="mt-2">
                          <a
                            href={document.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            Ver documento →
                          </a>
                        </div>
                      )}

                      {document.rejectionReason && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm">
                          <strong>Motivo da rejeição:</strong> {document.rejectionReason}
                        </div>
                      )}

                      {document.notes && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          <strong>Notas:</strong> {document.notes}
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground mt-2">
                        Enviado em: {new Date(document.createdAt).toLocaleString('pt-BR')}
                      </div>
                    </div>

                    {document.status === DocumentStatus.UPLOADED && (
                      <Button
                        variant="outline"
                        onClick={() => handleReview(document)}
                        className="ml-4"
                      >
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        Revisar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de Revisão */}
        <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Revisar Documento</DialogTitle>
              <DialogDescription>
                {selectedDocument && (
                  <>
                    Revisando {getTypeLabel(selectedDocument.documentType)} de{' '}
                    {selectedDocument.user?.name}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            {selectedDocument && (
              <div className="space-y-4">
                {selectedDocument.fileUrl && (
                  <div>
                    <Label>Documento</Label>
                    <div className="mt-2">
                      <a
                        href={selectedDocument.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Abrir documento em nova aba →
                      </a>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">Notas (opcional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Adicione notas sobre a revisão..."
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="rejectionReason">Motivo da Rejeição (se rejeitar)</Label>
                  <Textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Informe o motivo da rejeição..."
                    className="mt-2"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsReviewModalOpen(false);
                      setRejectionReason('');
                      setNotes('');
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={rejectMutation.isPending || !rejectionReason.trim()}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeitar
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={approveMutation.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Aprovar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
