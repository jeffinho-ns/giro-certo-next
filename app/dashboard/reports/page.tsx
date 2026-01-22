'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useQuery } from '@tanstack/react-query';
import { FileDown, TrendingUp, DollarSign, Users, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ReportsPage() {
  const { isAdmin } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Relatório de lojistas inadimplentes
  const { data: overduePartners, isLoading: loadingOverdue } = useQuery<{ partners: any[] }>({
    queryKey: ['report-overdue-partners'],
    queryFn: async () => {
      const response = await apiClient.get<{ partners: any[] }>('/api/reports/partners/overdue');
      return response;
    },
  });

  // Relatório de comissões pendentes
  const { data: pendingCommissions, isLoading: loadingCommissions } = useQuery<{ transactions: any[]; total: number; count: number }>({
    queryKey: ['report-pending-commissions', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await apiClient.get<{ transactions: any[]; total: number; count: number }>(`/api/reports/commissions/pending?${params.toString()}`);
      return response;
    },
  });

  // Ranking de confiabilidade
  const { data: reliabilityRanking, isLoading: loadingRanking } = useQuery<{ riders: any[]; rankings?: any[] }>({
    queryKey: ['report-reliability-ranking'],
    queryFn: async () => {
      const response = await apiClient.get<{ riders: any[]; rankings?: any[] }>('/api/reports/riders/reliability?limit=50');
      return response;
    },
  });

  const handleExport = async (reportType: string, format: 'csv' | 'json' = 'csv') => {
    try {
      let url = '';
      
      switch (reportType) {
        case 'overdue':
          url = `/api/reports/partners/overdue?format=${format}`;
          break;
        case 'commissions':
          url = `/api/reports/commissions/pending?format=${format}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`;
          break;
        case 'reliability':
          url = `/api/reports/riders/reliability?format=${format}`;
          break;
        default:
          return;
      }

      const token = apiClient.getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://giro-certo-api.onrender.com'}${url}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (format === 'csv') {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${reportType}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      }
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      alert('Erro ao exportar relatório');
    }
  };

  return (
    <ProtectedRoute requireModerator>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground mt-2">
            Relatórios exportáveis do sistema
          </p>
        </div>

        {/* Relatório 1: Lojistas Inadimplentes */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Lojistas Inadimplentes
                </CardTitle>
                <CardDescription>
                  Lista de parceiros com pagamentos atrasados
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('overdue', 'csv')}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('overdue', 'json')}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Exportar JSON
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingOverdue ? (
              <div className="text-center py-4">Carregando...</div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Total: {overduePartners?.partners?.length || 0} parceiros inadimplentes
                </p>
                {overduePartners?.partners && overduePartners.partners.length > 0 && (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {overduePartners.partners.slice(0, 10).map((partner: any) => (
                      <div
                        key={partner.id}
                        className="flex justify-between items-center p-2 border rounded"
                      >
                        <div>
                          <p className="font-medium">{partner.name}</p>
                          {partner.cnpj && (
                            <p className="text-xs text-muted-foreground">CNPJ: {partner.cnpj}</p>
                          )}
                        </div>
                        <Badge variant="destructive">Inadimplente</Badge>
                      </div>
                    ))}
                    {overduePartners.partners.length > 10 && (
                      <p className="text-xs text-muted-foreground text-center">
                        ... e mais {overduePartners.partners.length - 10} parceiros
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Relatório 2: Comissões Pendentes */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-yellow-500" />
                  Comissões Pendentes
                </CardTitle>
                <CardDescription>
                  Comissões aguardando processamento
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('commissions', 'csv')}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('commissions', 'json')}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Exportar JSON
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Filtros */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data Inicial</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Final</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {loadingCommissions ? (
                <div className="text-center py-4">Carregando...</div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Pendente</p>
                      <p className="text-2xl font-bold">
                        R$ {pendingCommissions?.total?.toFixed(2).replace('.', ',') || '0,00'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Quantidade</p>
                      <p className="text-2xl font-bold">{pendingCommissions?.count || 0}</p>
                    </div>
                  </div>
                  {pendingCommissions?.transactions && pendingCommissions.transactions.length > 0 && (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {pendingCommissions.transactions.slice(0, 10).map((transaction: any) => (
                        <div
                          key={transaction.id}
                          className="flex justify-between items-center p-2 border rounded"
                        >
                          <div>
                            <p className="font-medium">
                              {transaction.rider?.name || 'Entregador'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {transaction.description || 'Comissão'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              R$ {transaction.amount?.toFixed(2).replace('.', ',') || '0,00'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(transaction.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      ))}
                      {pendingCommissions.transactions.length > 10 && (
                        <p className="text-xs text-muted-foreground text-center">
                          ... e mais {pendingCommissions.transactions.length - 10} transações
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Relatório 3: Ranking de Confiabilidade */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Ranking de Confiabilidade
                </CardTitle>
                <CardDescription>
                  Top entregadores por confiabilidade e desempenho
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('reliability', 'csv')}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('reliability', 'json')}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Exportar JSON
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingRanking ? (
              <div className="text-center py-4">Carregando...</div>
            ) : (
              <div className="space-y-2">
                {reliabilityRanking?.rankings && reliabilityRanking.rankings.length > 0 ? (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {reliabilityRanking.rankings.map((ranking: any, index: number) => (
                      <div
                        key={ranking.rider.id}
                        className="flex justify-between items-center p-3 border rounded hover:bg-accent"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{ranking.rider.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {ranking.rider.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              Score: {ranking.reliabilityScore.toFixed(1)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {ranking.completedDeliveries}/{ranking.totalDeliveries} entregas
                            </p>
                          </div>
                          <Badge
                            className={
                              ranking.reliabilityScore >= 80
                                ? 'bg-green-500'
                                : ranking.reliabilityScore >= 60
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }
                          >
                            {ranking.reliabilityScore >= 80
                              ? 'Excelente'
                              : ranking.reliabilityScore >= 60
                              ? 'Bom'
                              : 'Regular'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhum dado disponível
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
