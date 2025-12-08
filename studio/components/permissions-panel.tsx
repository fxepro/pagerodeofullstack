"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Save, RotateCcw, Plus, Edit, Trash2 } from "lucide-react";
import { applyTheme } from "@/lib/theme";
import { Role, Permission } from "@/lib/types/role";
import axios from "axios";

// Use relative URL in production (browser), localhost in dev (SSR)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? 'http://localhost:8000' : 'http://localhost:8000');

interface PermissionsPanelProps {
  selectedRole: Role | null;
  allPermissions: Permission[];
  onRoleUpdate: (updatedRole: Role) => void;
}

export function PermissionsPanel({ selectedRole, allPermissions, onRoleUpdate }: PermissionsPanelProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingRole, setEditingRole] = useState(false);

  useEffect(() => {
    if (selectedRole) {
      const rolePermissionIds = selectedRole.permissions.map(p => Number(p.id));
      setSelectedPermissions(rolePermissionIds);
      setHasChanges(false);
    } else {
      setSelectedPermissions([]);
      setHasChanges(false);
    }
  }, [selectedRole]);

  const handlePermissionToggle = (permissionId: number) => {
    setSelectedPermissions(prev => {
      const newPermissions = prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId];
      
      setHasChanges(JSON.stringify(newPermissions.sort()) !== JSON.stringify(selectedRole?.permissions.map(p => Number(p.id)).sort() || []));
      return newPermissions;
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      const response = await axios.put(
        `${API_BASE}/api/roles/${selectedRole.id}/permissions/update/`,
        { permission_ids: selectedPermissions },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      onRoleUpdate(response.data);
      setHasChanges(false);
      setEditingRole(false);
    } catch (error: any) {
      console.error("Error updating permissions:", error);
      alert(error.response?.data?.error || "Failed to update permissions");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPermissions = () => {
    if (selectedRole) {
      const rolePermissionIds = selectedRole.permissions.map(p => Number(p.id));
      setSelectedPermissions(rolePermissionIds);
      setHasChanges(false);
    }
  };

  const getAppColor = (appLabel: string) => {
    switch (appLabel) {
      case 'users': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'auth': return 'bg-palette-accent-3 text-purple-800 border-palette-accent-2';
      case 'admin': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'contenttypes': return 'bg-green-100 text-green-800 border-green-200';
      case 'sessions': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'actstream': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'auditlog': return 'bg-red-100 text-red-800 border-red-200';
      case 'emails': return 'bg-pink-100 text-pink-800 border-pink-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getPermissionType = (codename: string) => {
    if (codename.includes('add')) return 'Create';
    if (codename.includes('change')) return 'Update';
    if (codename.includes('delete')) return 'Delete';
    if (codename.includes('view')) return 'View';
    return 'Other';
  };

  const getPermissionTypeColor = (type: string) => {
    switch (type) {
      case 'Create': return 'bg-green-100 text-green-800 border-green-200';
      case 'Update': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Delete': return 'bg-red-100 text-red-800 border-red-200';
      case 'View': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!selectedRole) {
    return (
      <Card className={applyTheme.card()}>
        <CardHeader className={applyTheme.cardHeader()}>
          <CardTitle className={applyTheme.text('primary')}>Permissions</CardTitle>
          <CardDescription className={applyTheme.text('secondary')}>
            Select a role to view and edit its permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className={applyTheme.text('secondary')}>Select a role to manage permissions</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={applyTheme.card()}>
      <CardHeader className={applyTheme.cardHeader()}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className={applyTheme.text('primary')}>
              {selectedRole.name} Permissions
            </CardTitle>
            <CardDescription className={applyTheme.text('secondary')}>
              {selectedRole.description}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={selectedRole.is_system_role 
              ? "bg-palette-accent-3 text-purple-800 border-palette-accent-2" 
              : "bg-green-100 text-green-800 border-green-200"
            }>
              {selectedRole.is_system_role ? 'System Role' : 'Custom Role'}
            </Badge>
            <Badge className="bg-slate-100 text-slate-800 border-slate-200">
              {selectedRole.user_count} users
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Edit/View Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Button
              variant={editingRole ? "default" : "outline"}
              size="sm"
              onClick={() => setEditingRole(!editingRole)}
              disabled={selectedRole.is_system_role}
              className={selectedRole.is_system_role ? "opacity-50" : ""}
            >
              <Edit className="h-4 w-4 mr-2" />
              {editingRole ? "Editing" : "Edit Permissions"}
            </Button>
            {selectedRole.is_system_role && (
              <Badge className="bg-palette-accent-3 text-purple-800 border-palette-accent-2">
                System Role - Read Only
              </Badge>
            )}
          </div>
          <div className="text-sm text-slate-600">
            {selectedPermissions.length} of {allPermissions.length} permissions selected
          </div>
        </div>

        {/* Permissions Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 pl-4">
                  {editingRole && !selectedRole.is_system_role && (
                    <Checkbox
                      checked={selectedPermissions.length === allPermissions.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedPermissions(allPermissions.map(p => Number(p.id)));
                        } else {
                          setSelectedPermissions([]);
                        }
                        setHasChanges(true);
                      }}
                      className="border-2 border-slate-400 data-[state=checked]:bg-palette-primary data-[state=checked]:border-palette-primary h-5 w-5"
                    />
                  )}
                </TableHead>
                <TableHead className={applyTheme.text('primary')}>Permission</TableHead>
                <TableHead className={applyTheme.text('primary')}>Type</TableHead>
                <TableHead className={applyTheme.text('primary')}>Model</TableHead>
                <TableHead className={applyTheme.text('primary')}>App</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allPermissions.map((permission) => {
                const permissionType = getPermissionType(permission.codename || '');
                const isSelected = selectedPermissions.includes(Number(permission.id));
                
                return (
                  <TableRow key={permission.id} className={isSelected ? "bg-slate-50" : ""}>
                    <TableCell className="pl-4">
                      {editingRole && !selectedRole.is_system_role ? (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handlePermissionToggle(Number(permission.id))}
                          className="border-2 border-slate-400 data-[state=checked]:bg-palette-primary data-[state=checked]:border-palette-primary h-5 w-5"
                        />
                      ) : (
                        isSelected && <div className="w-5 h-5 bg-green-500 rounded-full border-2 border-green-600 ml-1" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{permission.name}</div>
                      <div className="text-xs text-slate-500">{permission.codename}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPermissionTypeColor(permissionType)}>
                        {permissionType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${applyTheme.text('secondary')}`}>
                        {permission.content_type?.model || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getAppColor(permission.content_type?.app_label || 'unknown')}>
                        {permission.content_type?.app_label || 'N/A'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Action Buttons */}
        {editingRole && !selectedRole.is_system_role && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <p className={`text-sm ${applyTheme.text('secondary')}`}>
                  {hasChanges ? "You have unsaved changes" : "No changes made"}
                </p>
                {hasChanges && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetPermissions}
                    className={applyTheme.button('secondary')}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingRole(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSavePermissions}
                  disabled={loading || !hasChanges}
                  className={applyTheme.button('primary')}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
