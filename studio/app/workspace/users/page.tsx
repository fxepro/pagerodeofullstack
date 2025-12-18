"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Plus, Edit, Trash2, Search, Filter, Mail, Shield, Clock, Loader2, AlertCircle } from "lucide-react";
import { applyTheme, LAYOUT } from "@/lib/theme";
import { EditUserModal } from "@/components/edit-user-modal";
import { usePermissions } from "@/hooks/use-permissions";
import axios from "axios";

// Use relative URL in production (browser), localhost in dev (SSR)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? '' : 'http://localhost:8000');

// Helper function to refresh token
const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) {
    return null;
  }
  
  try {
    const res = await axios.post(`${API_BASE}/api/token/refresh/`, {
      refresh: refreshToken,
    });
    const newAccessToken = res.data.access;
    localStorage.setItem("access_token", newAccessToken);
    // Update refresh token if a new one is provided (token rotation)
    if (res.data.refresh) {
      localStorage.setItem("refresh_token", res.data.refresh);
    }
    return newAccessToken;
  } catch (err) {
    console.error("Token refresh failed:", err);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    return null;
  }
};

// Helper function to make authenticated request with retry
const makeAuthenticatedRequest = async (url: string, config: any = {}) => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("No access token available");
  }

  try {
    return await axios.get(url, {
      ...config,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err: any) {
    // If 401, try to refresh token and retry
    if (err.response?.status === 401) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return await axios.get(url, {
          ...config,
          headers: {
            ...config.headers,
            Authorization: `Bearer ${newToken}`,
          },
        });
      }
      throw err; // Re-throw if refresh failed
    }
    throw err;
  }
};

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  date_joined: string;
  last_login: string;
}

interface UserStats {
  total_users: number;
  active_users: number;
  admin_users: number;
  role_distribution: {
    admin: number;
    viewer: number;
    analyst: number;
    manager: number;
    director: number;
  };
}

export default function AdminUsersPage() {
  const { hasPermission } = usePermissions();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Check permission before loading
  useEffect(() => {
    if (!hasPermission('users.view')) {
      setError("You don't have permission to access this page. Admin access required.");
      setLoading(false);
      return;
    }
    fetchData();
  }, [hasPermission]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/workspace/login");
        return;
      }

      const [usersResponse, statsResponse] = await Promise.all([
        makeAuthenticatedRequest(`${API_BASE}/api/users/`),
        makeAuthenticatedRequest(`${API_BASE}/api/users/stats/`),
      ]);

      setUsers(usersResponse.data);
      setStats(statsResponse.data);
      setError(null);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      
      // Handle 403 Forbidden - user doesn't have permission
      if (error.response?.status === 403) {
        setError("You don't have permission to access this page. Admin access required.");
      } else if (error.response?.status === 401) {
        // Token expired and refresh failed
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        router.push("/workspace/login");
      } else {
        setError("Failed to load user data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || (user.role || 'viewer') === roleFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && user.is_active) ||
      (statusFilter === "inactive" && !user.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-palette-accent-3 text-palette-primary border-palette-accent-2";
      case "director": return "bg-blue-100 text-blue-800 border-blue-200";
      case "manager": return "bg-orange-100 text-orange-800 border-orange-200";
      case "analyst": return "bg-green-100 text-green-800 border-green-200";
      case "viewer": return "bg-slate-100 text-slate-800 border-slate-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getInitials = (firstName: string, lastName: string, username: string) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    return username.charAt(0).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString();
  };

  const getTimeAgo = (dateString: string) => {
    if (!dateString) return "Never";
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditingUser(null);
    setIsEditModalOpen(false);
  };

  const handleSaveUser = (updatedUser: User) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      )
    );
    // Refresh stats after user update
    fetchData();
  };

  if (loading) {
    return (
      <div className={applyTheme.page()}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-palette-primary" />
          <span className="ml-2 text-slate-600">Loading user data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={applyTheme.page()}>

      {/* Stats Cards */}
      <div className={LAYOUT.statsGrid}>
        <Card className={applyTheme.card()}>
          <CardContent className={applyTheme.cardContent()}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${applyTheme.text('secondary')}`}>Total Users</p>
                <p className={`text-2xl font-bold ${applyTheme.text('primary')}`}>
                  {stats?.total_users || 0}
                </p>
              </div>
              <Users className={`h-8 w-8 ${applyTheme.status('info')}`} />
            </div>
          </CardContent>
        </Card>

        <Card className={applyTheme.card()}>
          <CardContent className={applyTheme.cardContent()}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${applyTheme.text('secondary')}`}>Active Users</p>
                <p className="text-2xl font-bold text-green-400">
                  {stats?.active_users || 0}
                </p>
              </div>
              <Shield className={`h-8 w-8 ${applyTheme.status('success')}`} />
            </div>
          </CardContent>
        </Card>

        <Card className={applyTheme.card()}>
          <CardContent className={applyTheme.cardContent()}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${applyTheme.text('secondary')}`}>Admin Users</p>
                <p className="text-2xl font-bold text-palette-accent-2">
                  {stats?.admin_users || 0}
                </p>
              </div>
              <Shield className={`h-8 w-8 ${applyTheme.status('info')}`} />
            </div>
          </CardContent>
        </Card>

        <Card className={applyTheme.card()}>
          <CardContent className={applyTheme.cardContent()}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${applyTheme.text('secondary')}`}>New This Month</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {users.filter(user => {
                    const userDate = new Date(user.date_joined);
                    const now = new Date();
                    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    return userDate >= thisMonth;
                  }).length}
                </p>
              </div>
              <Clock className={`h-8 w-8 ${applyTheme.status('warning')}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className={applyTheme.card()}>
        <CardContent className={applyTheme.cardContent()}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search users by name, email, or role..."
                  className="pl-10 bg-white border-slate-300 text-slate-800 placeholder-slate-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select 
                className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="director">Director</option>
                <option value="manager">Manager</option>
                <option value="analyst">Analyst</option>
                <option value="viewer">Viewer</option>
              </select>
              <select 
                className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <Button 
                variant="outline" 
                className="border-slate-300 text-slate-700 hover:bg-slate-100"
                onClick={fetchData}
              >
                <Filter className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className={applyTheme.card()}>
        <CardHeader className={applyTheme.cardHeader()}>
          <CardTitle className={applyTheme.text('primary')}>All Users ({filteredUsers.length})</CardTitle>
          <CardDescription className={applyTheme.text('secondary')}>
            A list of all users in the system with their roles and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={applyTheme.text('primary')}>User</TableHead>
                  <TableHead className={applyTheme.text('primary')}>Email</TableHead>
                  <TableHead className={applyTheme.text('primary')}>Role</TableHead>
                  <TableHead className={applyTheme.text('primary')}>Status</TableHead>
                  <TableHead className={applyTheme.text('primary')}>Joined</TableHead>
                  <TableHead className={applyTheme.text('primary')}>Last Active</TableHead>
                  <TableHead className={applyTheme.text('primary')}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <Users className="h-8 w-8 text-slate-400" />
                        <p className={applyTheme.text('secondary')}>No users found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-palette-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {getInitials(user.first_name, user.last_name, user.username)}
                          </div>
                          <div>
                            <p className={`font-medium ${applyTheme.text('primary')}`}>
                              {user.first_name && user.last_name 
                                ? `${user.first_name} ${user.last_name}` 
                                : user.username}
                            </p>
                            <p className={`text-xs ${applyTheme.text('muted')}`}>@{user.username}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className={applyTheme.text('secondary')}>{user.email}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(user.role || 'viewer')}>
                          {(user.role || 'viewer').charAt(0).toUpperCase() + (user.role || 'viewer').slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={user.is_active 
                          ? "bg-green-100 text-green-800 border-green-200" 
                          : "bg-red-100 text-red-800 border-red-200"
                        }>
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className={applyTheme.text('secondary')}>{formatDate(user.date_joined)}</p>
                      </TableCell>
                      <TableCell>
                        <p className={applyTheme.text('secondary')}>{getTimeAgo(user.last_login)}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-slate-600 hover:text-palette-primary hover:bg-palette-accent-3"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      <EditUserModal
        user={editingUser}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveUser}
      />
    </div>
  );
}
