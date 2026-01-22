'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, Users, CreditCard } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function FinancialPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['financial-stats'],
    queryFn: async () => {
      // Mock data
      return {
        totalRevenue: 45230.50,
        standardCommissions: 12000.00,
        premiumCommissions: 33230.50,
        totalWithdrawals: 25000.00,
        pendingWithdrawals: 5000.00,
        commissionData: [
          { month: 'Jan', standard: 2000, premium: 5000 },
          { month: 'Fev', standard: 2500, premium: 6000 },
          { month: 'Mar', standard: 3000, premium: 7500 },
          { month: 'Abr', standard: 2800, premium: 7000 },
          { month: 'Mai', standard: 3200, premium: 8000 },
          { month: 'Jun', standard: 3500, premium: 9000 },
        ],
        commissionBreakdown: [
          { name: 'Premium (R$ 3,00)', value: 33230.50 },
          { name: 'Standard (R$ 1,00)', value: 12000.00 },
        ],
      };
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
        <p className="text-muted-foreground mt-2">
          Relatórios de comissões e sistema de repasse
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats?.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '-'}</div>
            <p className="text-xs text-muted-foreground">Total acumulado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões Premium</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ {stats?.premiumCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '-'}</div>
            <p className="text-xs text-muted-foreground">R$ 3,00 por corrida</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões Standard</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats?.standardCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '-'}</div>
            <p className="text-xs text-muted-foreground">R$ 1,00 por corrida</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saques Pendentes</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats?.pendingWithdrawals.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '-'}</div>
            <p className="text-xs text-muted-foreground">Aguardando processamento</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Comissões por Mês</CardTitle>
            <CardDescription>Evolução mensal das comissões</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.commissionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="standard" fill="#8884d8" name="Standard (R$ 1,00)" />
                <Bar dataKey="premium" fill="#82ca9d" name="Premium (R$ 3,00)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Comissões</CardTitle>
            <CardDescription>Breakdown por tipo de comissão</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats?.commissionBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats?.commissionBreakdown.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
          <CardDescription>Últimas movimentações financeiras</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Motociclista</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-sm">#abc123</TableCell>
                <TableCell>João Silva</TableCell>
                <TableCell><Badge>Comissão Premium</Badge></TableCell>
                <TableCell className="text-green-600 font-semibold">R$ 3,00</TableCell>
                <TableCell><Badge variant="outline">Concluído</Badge></TableCell>
                <TableCell>21/01/2024 14:30</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">#def456</TableCell>
                <TableCell>Maria Santos</TableCell>
                <TableCell><Badge>Comissão Standard</Badge></TableCell>
                <TableCell className="text-green-600 font-semibold">R$ 1,00</TableCell>
                <TableCell><Badge variant="outline">Concluído</Badge></TableCell>
                <TableCell>21/01/2024 14:25</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">#ghi789</TableCell>
                <TableCell>Pedro Costa</TableCell>
                <TableCell><Badge variant="secondary">Saque</Badge></TableCell>
                <TableCell className="text-red-600 font-semibold">-R$ 500,00</TableCell>
                <TableCell><Badge>Pendente</Badge></TableCell>
                <TableCell>21/01/2024 13:00</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
