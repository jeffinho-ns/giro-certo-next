'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { Users, Search, Eye, Trash2, Shield, AlertTriangle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';
import Image from 'next/image';

export default function ModerationPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<any>(null);

  const { data: posts, isLoading } = useQuery({
    queryKey: ['community-posts'],
    queryFn: async () => {
      // Mock data
      return [
        {
          id: '1',
          userId: '1',
          userName: 'João Silva',
          userBike: 'Honda CB 600F',
          content: 'Ótima experiência hoje na estrada! Recomendo a rota pela serra.',
          images: [],
          likesCount: 23,
          commentsCount: 5,
          createdAt: '2024-01-21T10:30:00Z',
          reported: false,
        },
        {
          id: '2',
          userId: '2',
          userName: 'Maria Santos',
          userBike: 'Yamaha MT-07',
          content: 'Preciso de ajuda com manutenção do filtro de ar. Alguém tem dicas?',
          images: ['/placeholder-image.jpg'],
          likesCount: 15,
          commentsCount: 8,
          createdAt: '2024-01-21T09:15:00Z',
          reported: true,
          reportReason: 'Conteúdo inapropriado',
        },
        {
          id: '3',
          userId: '3',
          userName: 'Pedro Costa',
          userBike: 'Kawasaki Ninja 650',
          content: 'Fotos da minha customização nova! O que acharam?',
          images: ['/placeholder-image.jpg', '/placeholder-image2.jpg'],
          likesCount: 45,
          commentsCount: 12,
          createdAt: '2024-01-20T16:45:00Z',
          reported: false,
        },
        {
          id: '4',
          userId: '4',
          userName: 'Ana Oliveira',
          userBike: 'BMW G 310 R',
          content: 'Primeira viagem longa hoje! 500km completados com sucesso! 🏍️',
          images: [],
          likesCount: 67,
          commentsCount: 20,
          createdAt: '2024-01-20T14:20:00Z',
          reported: false,
        },
      ];
    },
  });

  const filteredPosts = posts?.filter(
    (post) =>
      post.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Moderação Social</h1>
        <p className="text-muted-foreground mt-2">
          Gestão dos posts da comunidade e fotos enviadas
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Posts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{posts?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Posts publicados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts Reportados</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {posts?.filter((p) => p.reported).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Aguardando revisão</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fotos Moderadas</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {posts?.reduce((acc, p) => acc + (p.images?.length || 0), 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Fotos publicadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Curtidas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {posts?.reduce((acc, p) => acc + p.likesCount, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Interações</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por autor ou conteúdo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Posts da Comunidade</CardTitle>
          <CardDescription>
            {filteredPosts?.length || 0} post(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Autor</TableHead>
                <TableHead>Conteúdo</TableHead>
                <TableHead>Moto</TableHead>
                <TableHead>Fotos</TableHead>
                <TableHead>Interações</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">Carregando...</TableCell>
                </TableRow>
              ) : filteredPosts?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">Nenhum post encontrado</TableCell>
                </TableRow>
              ) : (
                filteredPosts?.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar>
                          <AvatarFallback>{post.userName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{post.userName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">{post.content}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{post.userBike}</TableCell>
                    <TableCell>
                      <Badge variant={post.images?.length ? 'default' : 'secondary'}>
                        {post.images?.length || 0} foto(s)
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>❤️ {post.likesCount}</div>
                        <div>💬 {post.commentsCount}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {post.reported ? (
                        <Badge variant="destructive">Reportado</Badge>
                      ) : (
                        <Badge variant="outline">Aprovado</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedPost(post)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Detalhes do Post</DialogTitle>
                              <DialogDescription>Informações completas do post</DialogDescription>
                            </DialogHeader>
                            {selectedPost && (
                              <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarFallback>{selectedPost.userName.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{selectedPost.userName}</p>
                                    <p className="text-sm text-muted-foreground">{selectedPost.userBike}</p>
                                  </div>
                                </div>
                                <p className="text-sm">{selectedPost.content}</p>
                                {selectedPost.images?.length > 0 && (
                                  <div className="grid grid-cols-2 gap-2">
                                    {selectedPost.images.map((img: string, idx: number) => (
                                      <div key={idx} className="relative h-32 w-full rounded-lg border bg-muted" />
                                    ))}
                                  </div>
                                )}
                                {selectedPost.reported && (
                                  <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                                    <p className="text-sm font-medium text-red-800">Reportado</p>
                                    <p className="text-xs text-red-600">{selectedPost.reportReason}</p>
                                  </div>
                                )}
                                <div className="flex gap-2">
                                  <Button variant="outline" className="flex-1">Aprovar</Button>
                                  <Button variant="destructive" className="flex-1">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remover
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
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
