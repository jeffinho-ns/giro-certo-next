'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trophy, Plus, Edit, Trash2, Gift, Star } from 'lucide-react';
import { useState } from 'react';

interface BonusTier {
  id: string;
  name: string;
  pointsRequired: number;
  reward: string;
  description: string;
}

interface Campaign {
  id: string;
  name: string;
  description: string;
  pointsMultiplier: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export default function GamificationPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: bonusTiers } = useQuery({
    queryKey: ['bonus-tiers'],
    queryFn: async () => {
      // Mock data
      return [
        {
          id: '1',
          name: 'Bronze',
          pointsRequired: 100,
          reward: 'Desconto de 5% em peças',
          description: 'Acesso a descontos em parceiros',
        },
        {
          id: '2',
          name: 'Prata',
          pointsRequired: 500,
          reward: 'Desconto de 10% em peças',
          description: 'Descontos exclusivos e prioridade',
        },
        {
          id: '3',
          name: 'Ouro',
          pointsRequired: 1000,
          reward: 'Desconto de 15% + Frete grátis',
          description: 'Benefícios premium completos',
        },
        {
          id: '4',
          name: 'Platina',
          pointsRequired: 2500,
          reward: 'Desconto de 20% + Kit exclusivo',
          description: 'Status VIP com todos os benefícios',
        },
      ] as BonusTier[];
    },
  });

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      // Mock data
      return [
        {
          id: '1',
          name: 'Dia do Motociclista',
          description: 'Dobro de pontos em todas as corridas',
          pointsMultiplier: 2,
          startDate: '2024-01-20',
          endDate: '2024-01-25',
          isActive: true,
        },
        {
          id: '2',
          name: 'Fim de Semana Dourado',
          description: 'Triplo de pontos aos sábados e domingos',
          pointsMultiplier: 3,
          startDate: '2024-02-01',
          endDate: '2024-02-29',
          isActive: false,
        },
      ] as Campaign[];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gamificação</h1>
        <p className="text-muted-foreground mt-2">
          Configure faixas de bonificação e campanhas de fidelidade
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faixas Ativas</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bonusTiers?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Níveis configurados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campanhas Ativas</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns?.filter((c) => c.isActive).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Em andamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pontos</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.450</div>
            <p className="text-xs text-muted-foreground">Pontos distribuídos</p>
          </CardContent>
        </Card>
      </div>

      {/* Bonus Tiers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Faixas de Bonificação</CardTitle>
              <CardDescription>Configure os níveis de recompensa por pontos</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Faixa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Faixa de Bonificação</DialogTitle>
                  <DialogDescription>
                    Configure uma nova faixa de pontos e recompensas
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome da Faixa</Label>
                    <Input id="name" placeholder="Ex: Diamante" />
                  </div>
                  <div>
                    <Label htmlFor="points">Pontos Necessários</Label>
                    <Input id="points" type="number" placeholder="5000" />
                  </div>
                  <div>
                    <Label htmlFor="reward">Recompensa</Label>
                    <Input id="reward" placeholder="Ex: Desconto de 25%" />
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Input id="description" placeholder="Descrição da recompensa" />
                  </div>
                  <Button className="w-full">Criar Faixa</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Pontos Necessários</TableHead>
                <TableHead>Recompensa</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bonusTiers?.map((tier) => (
                <TableRow key={tier.id}>
                  <TableCell>
                    <Badge variant="secondary" className="text-lg">{tier.name}</Badge>
                  </TableCell>
                  <TableCell className="font-mono">{tier.pointsRequired.toLocaleString()} pts</TableCell>
                  <TableCell className="font-medium">{tier.reward}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{tier.description}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Campaigns */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Campanhas de Fidelidade</CardTitle>
              <CardDescription>Gerencie campanhas promocionais</CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Campanha
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Multiplicador</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns?.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{campaign.description}</TableCell>
                  <TableCell>
                    <Badge>{campaign.pointsMultiplier}x pontos</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(campaign.startDate).toLocaleDateString('pt-BR')} -{' '}
                    {new Date(campaign.endDate).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={campaign.isActive ? 'default' : 'secondary'}>
                      {campaign.isActive ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
