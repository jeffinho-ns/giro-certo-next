'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Search, Eye, Trash2, Shield, AlertTriangle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';
import apiClient from '@/lib/api';

interface PostFromApi {
  id: string;
  userId: string;
  content: string;
  images: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  user?: { id: string; name: string; photoUrl?: string };
  reportInfo?: Array<{ reason: string; createdAt: string }>;
}

export default function ModerationPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showReportedOnly, setShowReportedOnly] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: apiData, isLoading } = useQuery({
    queryKey: ['community-posts', showReportedOnly],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '100' });
      if (showReportedOnly) params.set('reported', 'true');
      const res = await apiClient.get<{ posts: PostFromApi[] }>(`/api/posts?${params}`);
      return res;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (postId: string) => apiClient.delete(`/api/posts/${postId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    },
  });

  const posts = apiData?.posts?.map((p) => {
    const reports = (p.reportInfo as Array<{ reason: string; createdAt: string }>) ?? [];
    const reported = reports.length > 0;
    const reportReason = reports.map((r) => r.reason).join('; ') || undefined;
    return {
      id: p.id,
      userId: p.userId,
      userName: p.user?.name ?? 'Utilizador',
      userPhotoUrl: p.user?.photoUrl,
      userBike: '-',
      content: p.content,
      images: p.images ?? [],
      likesCount: p.likesCount ?? 0,
      commentsCount: p.commentsCount ?? 0,
      createdAt: p.createdAt,
      reported,
      reportReason,
    };
  }) ?? [];

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

      {/* Search & Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar e Filtrar Posts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por autor ou conteúdo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={showReportedOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowReportedOnly(!showReportedOnly)}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Apenas reportados
            </Button>
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
                          <AvatarImage src={post.userPhotoUrl} alt={post.userName} />
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
                                    <AvatarImage src={selectedPost.userPhotoUrl} alt={selectedPost.userName} />
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
                                      <div key={idx} className="relative h-32 w-full rounded-lg border bg-muted overflow-hidden">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                          src={img.startsWith('http') ? img : '/placeholder-image.jpg'}
                                          alt={`Imagem ${idx + 1}`}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
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
                                  <Button variant="outline" className="flex-1" disabled>Aprovar</Button>
                                  <Button
                                    variant="destructive"
                                    className="flex-1"
                                    disabled={deleteMutation.isPending}
                                    onClick={() => {
                                      if (selectedPost?.id) {
                                        deleteMutation.mutate(selectedPost.id);
                                        setSelectedPost(null);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remover
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (confirm('Remover este post?')) {
                              deleteMutation.mutate(post.id);
                            }
                          }}
                        >
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
