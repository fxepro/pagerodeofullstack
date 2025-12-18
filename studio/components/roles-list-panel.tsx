"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Shield, Plus, Edit, Trash2, Search, RefreshCw, Users } from "lucide-react";
import { applyTheme } from "@/lib/theme";
import { Role, Permission } from "@/lib/types/role";
import axios from "axios";

// Use relative URL in production (browser), localhost in dev (SSR)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? 'http://localhost:8000' : 'http://localhost:8000');

interface RolesListPanelProps {
  roles: Role[];
  selectedRole: Role | null;
  onRoleSelect: (role: Role) => void;
  onRefresh: () => void;
  onRoleAdd?: (newRole: Role) => void;
  onRoleUpdate?: (updatedRole: Role) => void;
}

// Sort roles by seniority: Admin, Agency, Executive, Director, Manager, Analyst, Auditor, Viewer
const ROLE_ORDER = ['Admin', 'Agency', 'Executive', 'Director', 'Manager', 'Analyst', 'Auditor', 'Viewer'];
const sortRoles = (roles: Role[]): Role[] => {
  return [...roles].sort((a, b) => {
    const aIndex = ROLE_ORDER.indexOf(a.name);
    const bIndex = ROLE_ORDER.indexOf(b.name);
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.name.localeCompare(b.name);
  });
};

export function RolesListPanel({ roles, selectedRole, onRoleSelect, onRefresh, onRoleAdd, onRoleUpdate }: RolesListPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const filteredRoles = sortRoles(
    roles.filter(role =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getRoleBadgeColor = (role: Role) => {
    if (role.is_system_role) {
      return "bg-palette-accent-3 text-purple-800 border-palette-accent-2";
    }
    return "bg-green-100 text-green-800 border-green-200";
  };

  const getRoleIconColor = (role: Role) => {
    switch (role.name.toLowerCase()) {
      case "admin": return "bg-red-600";
      case "agency": return "bg-indigo-600";
      case "executive": return "bg-purple-600";
      case "director": return "bg-blue-600";
      case "manager": return "bg-orange-600";
      case "analyst": return "bg-green-600";
      case "auditor": return "bg-teal-600";
      case "viewer": return "bg-slate-600";
      default: return "bg-palette-primary";
    }
  };

  const handleAddRole = async () => {
    if (!newRoleName.trim()) {
      alert("Please enter a role name");
      return;
    }

    setAddLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      const response = await axios.post(
        `${API_BASE}/api/roles/create/`,
        { name: newRoleName.trim() },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const newRole = response.data;
      setNewRoleName("");
      setShowAddForm(false);
      onRefresh();
      if (onRoleAdd) {
        onRoleAdd(newRole);
      }
    } catch (error: any) {
      console.error("Error creating role:", error);
      alert(error.response?.data?.error || "Failed to create role");
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditRole = async (role: Role) => {
    if (role.is_system_role) {
      alert("System roles cannot be edited");
      return;
    }

    const newName = prompt(`Edit role name:`, role.name);
    if (!newName || newName.trim() === role.name || !newName.trim()) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      const response = await axios.put(
        `${API_BASE}/api/roles/${role.id}/update/`,
        { name: newName.trim() },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const updatedRole = response.data;
      if (onRoleUpdate) {
        onRoleUpdate(updatedRole);
      }
      onRefresh();
    } catch (error: any) {
      console.error("Error updating role:", error);
      alert(error.response?.data?.error || "Failed to update role");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (role.is_system_role) {
      alert("System roles cannot be deleted");
      return;
    }

    if (role.user_count > 0) {
      alert(`Cannot delete role. ${role.user_count} users are assigned to this role.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete the "${role.name}" role?`)) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      await axios.delete(`${API_BASE}/api/roles/${role.id}/delete/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      onRefresh();
    } catch (error: any) {
      console.error("Error deleting role:", error);
      alert(error.response?.data?.error || "Failed to delete role");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={applyTheme.card()}>
      <CardHeader className={applyTheme.cardHeader()}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className={applyTheme.text('primary')}>Roles</CardTitle>
            <CardDescription className={applyTheme.text('secondary')}>
              Manage user roles and permissions
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className={applyTheme.button('secondary')}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search roles..."
              className="pl-10 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Roles List */}
        <div className="space-y-3">
          {filteredRoles.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className={applyTheme.text('secondary')}>No roles found</p>
            </div>
          ) : (
            filteredRoles.map((role) => (
              <div
                key={role.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                  selectedRole?.id === role.id
                    ? 'bg-palette-accent-3 border-palette-accent-2 shadow-sm'
                    : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
                onClick={() => onRoleSelect(role)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${getRoleIconColor(role)} rounded-full flex items-center justify-center text-white font-medium`}>
                      {role.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className={`font-medium ${applyTheme.text('primary')}`}>{role.name}</p>
                      <p className={`text-sm ${applyTheme.text('secondary')}`}>{role.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3 text-slate-400" />
                          <span className={`text-xs ${applyTheme.text('muted')}`}>
                            {role.user_count} users
                          </span>
                        </div>
                        <Badge className={getRoleBadgeColor(role)}>
                          {role.is_system_role ? 'System' : 'Custom'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-600 hover:text-palette-primary hover:bg-palette-accent-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditRole(role);
                      }}
                      disabled={loading}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {!role.is_system_role && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRole(role);
                        }}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Role Section */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          {!showAddForm ? (
            <Button
              className={`w-full ${applyTheme.button('primary')}`}
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Role
            </Button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className={`block text-sm font-medium ${applyTheme.text('primary')} mb-2`}>
                  Role Name
                </label>
                <Input
                  placeholder="Enter role name..."
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddRole()}
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleAddRole}
                  disabled={addLoading}
                  className={applyTheme.button('primary')}
                >
                  {addLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Role
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewRoleName("");
                  }}
                  disabled={addLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
