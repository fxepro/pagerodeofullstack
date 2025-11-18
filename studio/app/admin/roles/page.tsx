"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Plus, Edit, Trash2, Users, Settings, BarChart3, Loader2 } from "lucide-react";
import { applyTheme, LAYOUT } from "@/lib/theme";
import { RolesListPanel } from "@/components/roles-list-panel";
import { PermissionsPanel } from "@/components/permissions-panel";
import { Role, Permission } from "@/lib/types/role";
import axios from "axios";

// Use relative URL in production (browser), localhost in dev (SSR)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? '' : 'http://localhost:8000');

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total_roles: 0,
    system_roles: 0,
    custom_roles: 0,
    total_permissions: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setError("Authentication token not found. Please log in.");
        setLoading(false);
        return;
      }

      const [rolesResponse, permissionsResponse] = await Promise.all([
        axios.get(`${API_BASE}/api/roles/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE}/api/permissions/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setRoles(rolesResponse.data);
      setPermissions(permissionsResponse.data);
      
      // Calculate stats
      const totalRoles = rolesResponse.data.length;
      const systemRoles = rolesResponse.data.filter((role: Role) => role.is_system_role).length;
      const customRoles = totalRoles - systemRoles;
      
      setStats({
        total_roles: totalRoles,
        system_roles: systemRoles,
        custom_roles: customRoles,
        total_permissions: permissionsResponse.data.length,
      });
    } catch (error: any) {
      console.error("Error fetching data:", error);
      if (error.response?.status === 401) {
        // Token is invalid or expired
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setError("Session expired. Please log in again.");
        // Redirect to login
        window.location.href = "/login";
      } else {
        setError("Failed to fetch roles or permissions. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
  };

  const handlePermissionsUpdate = (updatedRole: Role) => {
    setRoles(prevRoles => 
      prevRoles.map(role => 
        role.id === updatedRole.id ? updatedRole : role
      )
    );
    setSelectedRole(updatedRole);
  };

  const handleRoleAdd = (newRole: Role) => {
    setRoles(prevRoles => [...prevRoles, newRole]);
    setSelectedRole(newRole);
  };

  const handleRoleUpdate = (updatedRole: Role) => {
    setRoles(prevRoles =>
      prevRoles.map(role => (role.id === updatedRole.id ? updatedRole : role))
    );
    if (selectedRole?.id === updatedRole.id) {
      setSelectedRole(updatedRole);
    }
  };

  if (loading) {
    return (
      <div className={applyTheme.page()}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-palette-primary" />
          <span className="ml-2 text-slate-600">Loading role data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={applyTheme.page()}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => {
                setError(null);
                fetchData();
              }}
              className="px-4 py-2 bg-palette-primary text-white rounded-lg hover:bg-palette-primary-hover"
            >
              Retry
            </button>
          </div>
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
                <p className={`text-sm font-medium ${applyTheme.text('secondary')}`}>Total Roles</p>
                <p className={`text-2xl font-bold ${applyTheme.text('primary')}`}>
                  {stats.total_roles}
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
                <p className={`text-sm font-medium ${applyTheme.text('secondary')}`}>System Roles</p>
                <p className="text-2xl font-bold text-palette-accent-2">
                  {stats.system_roles}
                </p>
              </div>
              <Settings className={`h-8 w-8 ${applyTheme.status('info')}`} />
            </div>
          </CardContent>
        </Card>

        <Card className={applyTheme.card()}>
          <CardContent className={applyTheme.cardContent()}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${applyTheme.text('secondary')}`}>Custom Roles</p>
                <p className="text-2xl font-bold text-green-400">
                  {stats.custom_roles}
                </p>
              </div>
              <Plus className={`h-8 w-8 ${applyTheme.status('success')}`} />
            </div>
          </CardContent>
        </Card>

        <Card className={applyTheme.card()}>
          <CardContent className={applyTheme.cardContent()}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${applyTheme.text('secondary')}`}>Total Permissions</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {stats.total_permissions}
                </p>
              </div>
              <BarChart3 className={`h-8 w-8 ${applyTheme.status('warning')}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roles Management - 40/60 Split */}
      <div className="grid grid-cols-5 gap-6">
        {/* Roles List - 40% */}
        <div className="col-span-2">
          <RolesListPanel
            roles={roles}
            selectedRole={selectedRole}
            onRoleSelect={handleRoleSelect}
            onRefresh={fetchData}
            onRoleAdd={handleRoleAdd}
            onRoleUpdate={handleRoleUpdate}
          />
        </div>

        {/* Permissions Panel - 60% */}
        <div className="col-span-3">
          <PermissionsPanel
            selectedRole={selectedRole}
            allPermissions={permissions}
            onRoleUpdate={handlePermissionsUpdate}
          />
        </div>
      </div>
    </div>
  );
}