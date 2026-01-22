"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Edit, Trash2, Eye, FileText, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { fetchLearningMaterials, deleteLearningMaterial, fetchCollateralCategories, fetchCollateralTags, type LearningMaterial, type CollateralCategory, type CollateralTag } from '@/lib/api/collateral';
import { usePermissions } from '@/hooks/use-permissions';
import { format } from 'date-fns';
import Link from 'next/link';

type SortField = 'title' | 'created_at' | 'published_at' | 'views_count' | 'category' | 'status';
type SortDirection = 'asc' | 'desc';

export default function CollateralManagementPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [categories, setCategories] = useState<CollateralCategory[]>([]);
  const [tags, setTags] = useState<CollateralTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Check admin permission
  useEffect(() => {
    if (!hasPermission('users.view')) {
      router.push('/workspace');
    }
  }, [hasPermission, router]);

  useEffect(() => {
    loadCategories();
    loadTags();
  }, []);

  useEffect(() => {
    loadMaterials();
  }, [page, statusFilter, categoryFilter, tagFilter, searchTerm, sortField, sortDirection]);

  const loadCategories = async () => {
    try {
      const data = await fetchCollateralCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadTags = async () => {
    try {
      const data = await fetchCollateralTags();
      setTags(data);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const loadMaterials = async () => {
    setLoading(true);
    try {
      // Map frontend sort fields to backend ordering
      const getOrderingField = (field: SortField, direction: SortDirection) => {
        const prefix = direction === 'desc' ? '-' : '';
        switch (field) {
          case 'category':
            return `${prefix}category__name`;
          case 'status':
            return `${prefix}status`;
          case 'title':
            return `${prefix}title`;
          case 'created_at':
            return `${prefix}created_at`;
          case 'published_at':
            return `${prefix}published_at`;
          case 'views_count':
            return `${prefix}views_count`;
          default:
            return `${prefix}created_at`;
        }
      };

      const params: any = {
        page,
        page_size: 20,
        ordering: getOrderingField(sortField, sortDirection),
      };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      if (categoryFilter !== 'all') {
        params.category = categoryFilter;
      }
      
      if (tagFilter !== 'all') {
        params.tag = tagFilter;
      }
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      const response = await fetchLearningMaterials(params);
      setMaterials(response.results);
      setTotalPages(response.total_pages);
      setTotalCount(response.count);
    } catch (error) {
      console.error('Error loading materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this learning material? This action cannot be undone.')) {
      return;
    }
    
    setDeletingId(id);
    try {
      await deleteLearningMaterial(id);
      loadMaterials();
    } catch (error) {
      console.error('Error deleting material:', error);
      alert('Failed to delete learning material');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1" />;
    }
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'published':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'archived':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (!hasPermission('users.view')) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h4-dynamic font-bold">Collateral Management</h1>
          <p className="text-muted-foreground mt-1">Manage learning materials and documentation</p>
        </div>
        <Button onClick={() => router.push('/workspace/collateral/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add New
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search materials..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={(value) => {
              setCategoryFilter(value);
              setPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4">
            <Select value={tagFilter} onValueChange={(value) => {
              setTagFilter(value);
              setPage(1);
            }}>
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Filter by Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {tags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.slug}>{tag.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Materials Table */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading materials...</p>
          </CardContent>
        </Card>
      ) : materials.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-h4-dynamic font-semibold mb-2">No materials found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || tagFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by creating your first learning material'}
            </p>
            {!searchTerm && statusFilter === 'all' && categoryFilter === 'all' && tagFilter === 'all' && (
              <Button onClick={() => router.push('/workspace/collateral/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Material
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-0 px-4 md:px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">
                      <button
                        onClick={() => handleSort('title')}
                        className="flex items-center hover:text-foreground"
                      >
                        Title
                        {getSortIcon('title')}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('category')}
                        className="flex items-center hover:text-foreground"
                      >
                        Category
                        {getSortIcon('category')}
                      </button>
                    </TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center hover:text-foreground"
                      >
                        Status
                        {getSortIcon('status')}
                      </button>
                    </TableHead>
                    <TableHead>Content Type</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('published_at')}
                        className="flex items-center hover:text-foreground"
                      >
                        Published
                        {getSortIcon('published_at')}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('views_count')}
                        className="flex items-center hover:text-foreground"
                      >
                        Views
                        {getSortIcon('views_count')}
                      </button>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {material.featured && (
                            <Badge variant="default" className="text-xs">Featured</Badge>
                          )}
                          <Link
                            href={`/workspace/collateral/${material.slug}`}
                            className="hover:text-palette-primary hover:underline"
                          >
                            {material.title}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell>
                        {material.category ? (
                          <Badge variant="outline">{material.category.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {material.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag.id} variant="secondary" className="text-xs">
                              {tag.name}
                            </Badge>
                          ))}
                          {material.tags.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{material.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(material.status)}>
                          {material.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm capitalize">{material.content_type.replace('-', ' ')}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{material.author.full_name || material.author.username}</span>
                      </TableCell>
                      <TableCell>
                        {material.published_at ? (
                          <span className="text-sm">{format(new Date(material.published_at), 'MMM d, yyyy')}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{material.views_count}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/workspace/collateral/${material.slug}`)}
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/workspace/collateral/${material.slug}/edit`)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(material.id)}
                            disabled={deletingId === material.id}
                            title="Delete"
                          >
                            {deletingId === material.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, totalCount)} of {totalCount} materials
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

