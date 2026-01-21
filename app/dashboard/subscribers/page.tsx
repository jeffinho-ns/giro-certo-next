'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { Crown, Search, TrendingUp, Users, Star } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function SubscribersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  const { data: subscribers, isLoading } = useQuery({
    queryKey: ['subscribers', sortBy],
    queryFn: async () => {
      // Mock data
      return [
        {
          id: '1',
          name: 'João Silva',
          email: 'joao@example.com',
          subscriptionType: 'premium' as const,
          loyaltyPoints: 1250,
          totalDeliveries: 145,
          averageRating: 4.8,
          totalEarnings: 435.00,
          joinedAt: '2024-01-15',
          isOnline: true,
        },
        {
          id: '2',
          name: 'Maria Santos',
          email: 'maria@example.com',
          subscriptionType: 'premium' as const,
          loyaltyPoints: 980,
          totalDeliveries: 98,
          averageRating: 4.9,
          totalEarnings: 294.00,
          joinedAt: '2024-01-10',
          isOnline: true,
        },
        {
          id: '3',
          name: 'Pedro Costa',
          email: 'pedro@example.com',
          subscriptionType: 'premium' as const,
          loyaltyPoints: 750,
          totalDeliveries: 75,
          averageRating: 4.6,
          totalEarnings: 225.00,
          joinedAt: '2024-01-05',
          isOnline: false,
        },
        {
          id: '4',
          name: 'Ana Oliveira',
          email: 'ana@example.com',
          subscriptionType: 'premium' as const,
          loyaltyPoints: 2100,
          totalDeliveries: 210,
          averageRating: 5.0,
          totalEarnings: 630.00,
          joinedAt: '2023-12-20',
          isOnline: true,
        },
      ];
    },
  });

  const filteredSubscribers = subscribers?.filter((sub) =>
    sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Assinantes Premium</h1>
        <p className="text-muted-foreground mt-2">
          Gestão e estatísticas de membros Premium
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Assinantes</CardTitle>
            <Crown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscribers?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Membros Premium</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Agora</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subscribers?.filter((s) => s.isOnline).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Motociclistas ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de Avaliação</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subscribers && subscribers.length > 0
                ? (subscribers.reduce((acc, s) => acc + s.averageRating, 0) / subscribers.length).toFixed(1)
                : '-'}
            </div>
            <p className="text-xs text-muted-foreground">Avaliação média</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Corridas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subscribers?.reduce((acc, s) => acc + s.totalDeliveries, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Corridas completadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros e Busca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais Recentes</SelectItem>
                <SelectItem value="points">Mais Pontos</SelectItem>
                <SelectItem value="deliveries">Mais Corridas</SelectItem>
                <SelectItem value="rating">Melhor Avaliação</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subscribers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Assinantes</CardTitle>
          <CardDescription>
            {filteredSubscribers?.length || 0} assinante(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Motociclista</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Pontos</TableHead>
                <TableHead>Corridas</TableHead>
                <TableHead>Avaliação</TableHead>
                <TableHead>Ganhos</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">Carregando...</TableCell>
                </TableRow>
              ) : filteredSubscribers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">Nenhum assinante encontrado</TableCell>
                </TableRow>
              ) : (
                filteredSubscribers?.map((subscriber) => (
                  <TableRow key={subscriber.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{subscriber.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{subscriber.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Desde {new Date(subscriber.joinedAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{subscriber.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{subscriber.loyaltyPoints} pts</Badge>
                    </TableCell>
                    <TableCell>{subscriber.totalDeliveries}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{subscriber.averageRating.toFixed(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-green-600 font-semibold">
                      R$ {subscriber.totalEarnings.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={subscriber.isOnline ? 'default' : 'secondary'}>
                        {subscriber.isOnline ? 'Online' : 'Offline'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
