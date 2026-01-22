"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Database,
  Plus,
  TestTube,
  Trash2,
  Edit,
  Eye,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity,
  Table as TableIcon,
  Columns,
  FileText,
  Play,
  Loader2,
  Shield,
  Settings,
} from "lucide-react";
import { applyTheme } from "@/lib/theme";
import axios from "axios";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? '' : 'http://localhost:8000');

interface DatabaseConnection {
  id: number;
  name: string;
  engine: string;
  connection_type: string;
  host: string;
  port: number;
  database: string;
  username: string;
  is_active: boolean;
  // TLS/SSL
  use_ssl: boolean;
  ssl_mode: string;
  ssl_ca_cert?: string;
  ssl_client_cert?: string;
  // Advanced
  connection_timeout: number;
  query_timeout: number;
  max_connections: number;
  is_read_only: boolean;
  allowed_schemas: string[];
  query_allowlist: string[];
  // Status
  connection_status: string;
  last_connected_at?: string;
  last_error?: string;
  created_at: string;
}

interface TableInfo {
  name: string;
  type: string;
}

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  default: string | null;
}

export default function DatabaseMonitoringPage() {
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<number | null>(null);
  const [schemas, setSchemas] = useState<string[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableColumns, setTableColumns] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [queryColumns, setQueryColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<DatabaseConnection | null>(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState({
    name: "",
    engine: "postgresql",
    connection_type: "direct",
    host: "",
    port: 5432,
    database: "",
    username: "",
    password: "",
    // TLS/SSL
    use_ssl: false,
    ssl_mode: "prefer",
    ssl_ca_cert: "",
    ssl_client_cert: "",
    ssl_client_key: "",
    // Advanced
    connection_timeout: 10,
    query_timeout: 30,
    max_connections: 10,
    is_read_only: false,
    allowed_schemas: [] as string[],
    query_allowlist: [] as string[],
  });

  useEffect(() => {
    fetchConnections();
  }, []);

  useEffect(() => {
    if (selectedConnection) {
      fetchSchemas();
    }
  }, [selectedConnection]);

  useEffect(() => {
    if (selectedConnection) {
      fetchTables();
    }
  }, [selectedConnection, selectedSchema]);

  useEffect(() => {
    if (selectedConnection && selectedTable) {
      fetchColumns();
      fetchTablePreview();
    }
  }, [selectedConnection, selectedTable, selectedSchema]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/admin/databases/`, {
        headers: getAuthHeaders(),
      });
      setConnections(response.data);
    } catch (error: any) {
      toast.error("Failed to fetch connections: " + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchSchemas = async () => {
    if (!selectedConnection) return;
    try {
      const response = await axios.get(
        `${API_BASE}/api/admin/databases/${selectedConnection}/schemas/`,
        { headers: getAuthHeaders() }
      );
      setSchemas(response.data.schemas || []);
    } catch (error: any) {
      console.error("Failed to fetch schemas:", error);
    }
  };

  const fetchTables = async () => {
    if (!selectedConnection) return;
    try {
      const url = selectedSchema
        ? `${API_BASE}/api/admin/databases/${selectedConnection}/tables/?schema=${selectedSchema}`
        : `${API_BASE}/api/admin/databases/${selectedConnection}/tables/`;
      const response = await axios.get(url, { headers: getAuthHeaders() });
      setTables(response.data.tables || []);
    } catch (error: any) {
      console.error("Failed to fetch tables:", error);
    }
  };

  const fetchColumns = async () => {
    if (!selectedConnection || !selectedTable) return;
    try {
      const url = selectedSchema
        ? `${API_BASE}/api/admin/databases/${selectedConnection}/tables/${selectedTable}/columns/?schema=${selectedSchema}`
        : `${API_BASE}/api/admin/databases/${selectedConnection}/tables/${selectedTable}/columns/`;
      const response = await axios.get(url, { headers: getAuthHeaders() });
      setColumns(response.data.columns || []);
    } catch (error: any) {
      console.error("Failed to fetch columns:", error);
    }
  };

  const fetchTablePreview = async () => {
    if (!selectedConnection || !selectedTable) return;
    try {
      const url = selectedSchema
        ? `${API_BASE}/api/admin/databases/${selectedConnection}/tables/${selectedTable}/preview/?schema=${selectedSchema}&limit=100`
        : `${API_BASE}/api/admin/databases/${selectedConnection}/tables/${selectedTable}/preview/?limit=100`;
      const response = await axios.get(url, { headers: getAuthHeaders() });
      setTableData(response.data.rows || []);
      setTableColumns(response.data.columns || []);
    } catch (error: any) {
      console.error("Failed to fetch table preview:", error);
    }
  };

  const testConnection = async (id: number) => {
    try {
      const response = await axios.post(
        `${API_BASE}/api/admin/databases/${id}/test/`,
        {},
        { headers: getAuthHeaders() }
      );
      if (response.data.success) {
        toast.success("Connection test successful!");
        fetchConnections(); // Refresh to update status
      } else {
        toast.error("Connection test failed: " + response.data.message);
        fetchConnections(); // Refresh to update status
      }
    } catch (error: any) {
      toast.error("Connection test failed: " + (error.response?.data?.message || error.message));
      fetchConnections(); // Refresh to update status
    }
  };

  const handleSaveConnection = async () => {
    try {
      setLoading(true);
      
      // Prepare data - convert arrays to proper format and handle empty strings
      const submitData = {
        ...formData,
        // Convert empty strings to null for optional fields
        ssl_ca_cert: formData.ssl_ca_cert || null,
        ssl_client_cert: formData.ssl_client_cert || null,
        ssl_client_key: formData.ssl_client_key || null,
        // Ensure arrays are properly formatted
        allowed_schemas: Array.isArray(formData.allowed_schemas) 
          ? formData.allowed_schemas 
          : (formData.allowed_schemas ? [formData.allowed_schemas] : []),
        query_allowlist: Array.isArray(formData.query_allowlist) 
          ? formData.query_allowlist 
          : (formData.query_allowlist ? [formData.query_allowlist] : []),
      };
      
      if (editingConnection) {
        await axios.put(
          `${API_BASE}/api/admin/databases/${editingConnection.id}/`,
          submitData,
          { headers: getAuthHeaders() }
        );
        toast.success("Connection updated successfully!");
      } else {
        await axios.post(
          `${API_BASE}/api/admin/databases/`,
          submitData,
          { headers: getAuthHeaders() }
        );
        toast.success("Connection created successfully!");
      }
      setIsDialogOpen(false);
      resetForm();
      fetchConnections();
    } catch (error: any) {
      console.error("Error saving connection:", error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          error.response?.data?.message ||
                          error.message ||
                          "Unknown error occurred";
      toast.error(`Failed to save connection: ${errorMessage}`);
      if (error.response?.data) {
        console.error("Server error details:", error.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConnection = async (id: number) => {
    if (!confirm("Are you sure you want to delete this connection?")) return;
    try {
      await axios.delete(`${API_BASE}/api/admin/databases/${id}/`, {
        headers: getAuthHeaders(),
      });
      toast.success("Connection deleted successfully!");
      fetchConnections();
      if (selectedConnection === id) {
        setSelectedConnection(null);
      }
    } catch (error: any) {
      toast.error("Failed to delete connection: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleExecuteQuery = async () => {
    if (!selectedConnection || !query.trim()) {
      toast.error("Please select a connection and enter a query");
      return;
    }
    try {
      setLoading(true);
      const response = await axios.post(
        `${API_BASE}/api/admin/databases/${selectedConnection}/query/`,
        { query: query.trim() },
        { headers: getAuthHeaders() }
      );
      setQueryResults(response.data.rows || []);
      setQueryColumns(response.data.columns || []);
      toast.success(`Query executed successfully. ${response.data.count} rows returned.`);
    } catch (error: any) {
      toast.error("Query execution failed: " + (error.response?.data?.error || error.message));
      setQueryResults([]);
      setQueryColumns([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      engine: "postgresql",
      connection_type: "direct",
      host: "",
      port: 5432,
      database: "",
      username: "",
      password: "",
      use_ssl: false,
      ssl_mode: "prefer",
      ssl_ca_cert: "",
      ssl_client_cert: "",
      ssl_client_key: "",
      connection_timeout: 10,
      query_timeout: 30,
      max_connections: 10,
      is_read_only: false,
      allowed_schemas: [],
      query_allowlist: [],
    });
    setEditingConnection(null);
    setActiveTab("basic");
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (connection: DatabaseConnection) => {
    setEditingConnection(connection);
    setFormData({
      name: connection.name,
      engine: connection.engine,
      connection_type: connection.connection_type || "direct",
      host: connection.host,
      port: connection.port,
      database: connection.database,
      username: connection.username,
      password: "", // Don't populate password
      use_ssl: connection.use_ssl || false,
      ssl_mode: connection.ssl_mode || "prefer",
      ssl_ca_cert: connection.ssl_ca_cert || "",
      ssl_client_cert: connection.ssl_client_cert || "",
      ssl_client_key: "", // Never populate key
      connection_timeout: connection.connection_timeout || 10,
      query_timeout: connection.query_timeout || 30,
      max_connections: connection.max_connections || 10,
      is_read_only: connection.is_read_only || false,
      allowed_schemas: connection.allowed_schemas || [],
      query_allowlist: connection.query_allowlist || [],
    });
    // Auto-select appropriate tab based on connection settings
    if (connection.use_ssl) {
      setActiveTab("security");
    } else if (connection.is_read_only || (connection.allowed_schemas && connection.allowed_schemas.length > 0) || (connection.query_allowlist && connection.query_allowlist.length > 0)) {
      setActiveTab("advanced");
    } else {
      setActiveTab("basic");
    }
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-h4-dynamic font-bold">Database Monitoring</h1>
        <p className="text-muted-foreground mt-1">Manage database connections, browse schemas, and execute queries</p>
      </div>

      <div className="flex items-center justify-end">
        <Button onClick={openCreateDialog} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Connection
        </Button>
      </div>

      <Tabs defaultValue="connections" className="space-y-6">
        <TabsList>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="browser">Database Browser</TabsTrigger>
          <TabsTrigger value="query">Query Editor</TabsTrigger>
        </TabsList>

        <TabsContent value="connections">
          <Card className={applyTheme.card()}>
            <CardHeader>
              <CardTitle>Database Connections</CardTitle>
              <CardDescription>Manage your database connections</CardDescription>
            </CardHeader>
            <CardContent>
              {loading && connections.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-palette-primary" />
                </div>
              ) : connections.length === 0 ? (
                <div className="text-center py-12">
                  <Database className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <p className={applyTheme.text('secondary')}>No database connections found</p>
                  <Button onClick={openCreateDialog} className="mt-4">
                    Create First Connection
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Engine</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Host</TableHead>
                      <TableHead>Database</TableHead>
                      <TableHead>Connection Status</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {connections.map((conn) => {
                      const getStatusBadge = (status: string) => {
                        switch (status) {
                          case 'connected':
                            return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
                          case 'error':
                            return <Badge className="bg-red-100 text-red-800">Error</Badge>;
                          case 'disconnected':
                            return <Badge className="bg-gray-100 text-gray-800">Disconnected</Badge>;
                          default:
                            return <Badge variant="outline">Unknown</Badge>;
                        }
                      };
                      
                      return (
                        <TableRow key={conn.id}>
                          <TableCell className="font-medium">{conn.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{conn.engine}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {conn.connection_type || 'direct'}
                            </Badge>
                            {conn.use_ssl && (
                              <Shield className="h-3 w-3 ml-1 inline text-green-600" />
                            )}
                          </TableCell>
                          <TableCell>{conn.host}:{conn.port}</TableCell>
                          <TableCell>{conn.database}</TableCell>
                          <TableCell>
                            {getStatusBadge(conn.connection_status || 'unknown')}
                          </TableCell>
                          <TableCell>
                            {conn.is_active ? (
                              <Badge className="bg-green-100 text-green-800">Active</Badge>
                            ) : (
                              <Badge variant="outline">Inactive</Badge>
                            )}
                          </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedConnection(conn.id);
                                // Switch to browser tab
                                document.querySelector('[value="browser"]')?.click();
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => testConnection(conn.id)}
                            >
                              <TestTube className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(conn)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteConnection(conn.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="browser">
          <div className="space-y-6">
            <Card className={applyTheme.card()}>
              <CardHeader>
                <CardTitle>Select Connection</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedConnection?.toString() || ""}
                  onValueChange={(value) => setSelectedConnection(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a database connection" />
                  </SelectTrigger>
                  <SelectContent>
                    {connections.map((conn) => (
                      <SelectItem key={conn.id} value={conn.id.toString()}>
                        {conn.name} ({conn.engine})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {selectedConnection && (
              <>
                {schemas.length > 0 && (
                  <Card className={applyTheme.card()}>
                    <CardHeader>
                      <CardTitle>Schema</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select
                        value={selectedSchema || "__all__"}
                        onValueChange={(value) => setSelectedSchema(value === "__all__" ? null : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a schema" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">All Schemas</SelectItem>
                          {schemas.map((schema) => (
                            <SelectItem key={schema} value={schema}>
                              {schema}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                )}

                <Card className={applyTheme.card()}>
                  <CardHeader>
                    <CardTitle>Tables</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {tables.length === 0 ? (
                      <p className={applyTheme.text('secondary')}>No tables found</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tables.map((table) => (
                          <Button
                            key={table.name}
                            variant={selectedTable === table.name ? "default" : "outline"}
                            className="justify-start"
                            onClick={() => setSelectedTable(table.name)}
                          >
                            <TableIcon className="h-4 w-4 mr-2" />
                            {table.name}
                          </Button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {selectedTable && (
                  <>
                    <Card className={applyTheme.card()}>
                      <CardHeader>
                        <CardTitle>Columns</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Nullable</TableHead>
                              <TableHead>Default</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {columns.map((col) => (
                              <TableRow key={col.name}>
                                <TableCell className="font-medium">{col.name}</TableCell>
                                <TableCell>{col.type}</TableCell>
                                <TableCell>
                                  {col.nullable ? (
                                    <Badge variant="outline">Yes</Badge>
                                  ) : (
                                    <Badge className="bg-red-100 text-red-800">No</Badge>
                                  )}
                                </TableCell>
                                <TableCell>{col.default || "-"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    <Card className={applyTheme.card()}>
                      <CardHeader>
                        <CardTitle>Table Preview</CardTitle>
                        <CardDescription>First 100 rows</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {tableData.length === 0 ? (
                          <p className={applyTheme.text('secondary')}>No data available</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  {tableColumns.map((col) => (
                                    <TableHead key={col}>{col}</TableHead>
                                  ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {tableData.map((row, idx) => (
                                  <TableRow key={idx}>
                                    {tableColumns.map((col) => (
                                      <TableCell key={col}>
                                        {row[col] !== null && row[col] !== undefined
                                          ? String(row[col])
                                          : "NULL"}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="query">
          <div className="space-y-6">
            <Card className={applyTheme.card()}>
              <CardHeader>
                <CardTitle>Query Editor</CardTitle>
                <CardDescription>Execute read-only SQL queries</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Connection</Label>
                  <Select
                    value={selectedConnection?.toString() || ""}
                    onValueChange={(value) => setSelectedConnection(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a database connection" />
                    </SelectTrigger>
                    <SelectContent>
                      {connections.map((conn) => (
                        <SelectItem key={conn.id} value={conn.id.toString()}>
                          {conn.name} ({conn.engine})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>SQL Query</Label>
                  <Textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="SELECT * FROM table_name LIMIT 100;"
                    className="font-mono"
                    rows={10}
                  />
                </div>
                <Button
                  onClick={handleExecuteQuery}
                  disabled={!selectedConnection || !query.trim() || loading}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Execute Query
                </Button>
              </CardContent>
            </Card>

            {queryResults.length > 0 && (
              <Card className={applyTheme.card()}>
                <CardHeader>
                  <CardTitle>Query Results</CardTitle>
                  <CardDescription>{queryResults.length} rows returned</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {queryColumns.map((col) => (
                            <TableHead key={col}>{col}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {queryResults.map((row, idx) => (
                          <TableRow key={idx}>
                            {queryColumns.map((col) => (
                              <TableCell key={col}>
                                {row[col] !== null && row[col] !== undefined
                                  ? String(row[col])
                                  : "NULL"}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Connection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] w-full max-h-[95vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-xl">
              {editingConnection ? "Edit Connection" : "New Database Connection"}
            </DialogTitle>
            <DialogDescription>
              {editingConnection
                ? "Update database connection details and settings"
                : "Configure a new database connection with advanced options"}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full rounded-none border-b px-6 bg-transparent h-auto">
              <TabsTrigger value="basic" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                <Database className="h-4 w-4 mr-2" />
                Basic Settings
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                <Shield className="h-4 w-4 mr-2" />
                TLS/SSL
              </TabsTrigger>
              <TabsTrigger value="advanced" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                <Settings className="h-4 w-4 mr-2" />
                Advanced
              </TabsTrigger>
            </TabsList>
            
            <div className="px-6 py-6 max-h-[calc(95vh-180px)] overflow-y-auto">
              <TabsContent value="basic" className="mt-0 space-y-6">
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="name" className="text-sm font-semibold">Connection Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="My Production Database"
                      className="mt-1.5 w-full"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="connection_type" className="text-sm font-semibold">Connection Type</Label>
                      <Select
                        value={formData.connection_type}
                        onValueChange={(value) => setFormData({ ...formData, connection_type: value })}
                      >
                        <SelectTrigger className="mt-1.5 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="direct">Direct TCP/IP</SelectItem>
                          <SelectItem value="tls">TLS/SSL</SelectItem>
                          <SelectItem value="ssh_tunnel">SSH Tunnel</SelectItem>
                          <SelectItem value="ssh_jump">SSH Jump Host</SelectItem>
                          <SelectItem value="iam">Cloud IAM</SelectItem>
                          <SelectItem value="proxy">Database Proxy</SelectItem>
                          <SelectItem value="agent">Agent-Based</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="engine" className="text-sm font-semibold">Database Engine</Label>
                      <Select
                        value={formData.engine}
                        onValueChange={(value) => {
                          const defaultPorts: Record<string, number> = {
                            postgresql: 5432,
                            mysql: 3306,
                            sqlite: 0,
                            mssql: 1433,
                            oracle: 1521,
                            mongodb: 27017,
                            redis: 6379,
                          };
                          setFormData({ 
                            ...formData, 
                            engine: value,
                            port: defaultPorts[value] || formData.port
                          });
                        }}
                      >
                        <SelectTrigger className="mt-1.5 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="postgresql">PostgreSQL</SelectItem>
                          <SelectItem value="mysql">MySQL / MariaDB</SelectItem>
                          <SelectItem value="sqlite">SQLite</SelectItem>
                          <SelectItem value="mssql">SQL Server</SelectItem>
                          <SelectItem value="oracle">Oracle</SelectItem>
                          <SelectItem value="mongodb">MongoDB</SelectItem>
                          <SelectItem value="redis">Redis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="host" className="text-sm font-semibold">Host</Label>
                      <Input
                        id="host"
                        value={formData.host}
                        onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                        placeholder="localhost"
                        className="mt-1.5 w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="port" className="text-sm font-semibold">Port</Label>
                      <Input
                        id="port"
                        type="number"
                        value={formData.port}
                        onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 5432 })}
                        className="mt-1.5 w-full"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="database" className="text-sm font-semibold">Database Name</Label>
                    <Input
                      id="database"
                      value={formData.database}
                      onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                      placeholder="mydb"
                      className="mt-1.5 w-full"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="username" className="text-sm font-semibold">Username</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="dbuser"
                        className="mt-1.5 w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder={editingConnection ? "Leave blank to keep current" : "Enter password"}
                        className="mt-1.5 w-full"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="security" className="mt-0 space-y-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                    <div>
                      <Label htmlFor="use_ssl" className="text-sm font-semibold">Enable TLS/SSL</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Encrypt database connections with TLS/SSL
                      </p>
                    </div>
                    <Switch
                      id="use_ssl"
                      checked={formData.use_ssl}
                      onCheckedChange={(checked) => setFormData({ ...formData, use_ssl: checked })}
                    />
                  </div>

                  {formData.use_ssl && (
                    <div className="space-y-5 p-5 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                      <div>
                        <Label htmlFor="ssl_mode" className="text-sm font-semibold">SSL Mode</Label>
                        <Select
                          value={formData.ssl_mode}
                          onValueChange={(value) => setFormData({ ...formData, ssl_mode: value })}
                        >
                          <SelectTrigger className="mt-1.5 w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="disable">Disable</SelectItem>
                            <SelectItem value="allow">Allow</SelectItem>
                            <SelectItem value="prefer">Prefer (Recommended)</SelectItem>
                            <SelectItem value="require">Require</SelectItem>
                            <SelectItem value="verify-ca">Verify CA</SelectItem>
                            <SelectItem value="verify-full">Verify Full (Most Secure)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {formData.ssl_mode === 'verify-full' && 'Validates certificate and hostname'}
                          {formData.ssl_mode === 'verify-ca' && 'Validates certificate chain'}
                          {formData.ssl_mode === 'require' && 'Requires SSL but does not verify certificate'}
                          {formData.ssl_mode === 'prefer' && 'Uses SSL if available'}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="ssl_ca_cert" className="text-sm font-semibold">CA Certificate</Label>
                          <p className="text-xs text-muted-foreground mb-1.5">Root certificate authority (PEM format)</p>
                          <Textarea
                            id="ssl_ca_cert"
                            value={formData.ssl_ca_cert}
                            onChange={(e) => setFormData({ ...formData, ssl_ca_cert: e.target.value })}
                            placeholder="-----BEGIN CERTIFICATE-----&#10;..."
                            rows={5}
                            className="font-mono text-xs w-full"
                          />
                        </div>
                        <div>
                          <Label htmlFor="ssl_client_cert" className="text-sm font-semibold">Client Certificate</Label>
                          <p className="text-xs text-muted-foreground mb-1.5">Client certificate for mutual TLS (PEM format)</p>
                          <Textarea
                            id="ssl_client_cert"
                            value={formData.ssl_client_cert}
                            onChange={(e) => setFormData({ ...formData, ssl_client_cert: e.target.value })}
                            placeholder="-----BEGIN CERTIFICATE-----&#10;..."
                            rows={5}
                            className="font-mono text-xs w-full"
                          />
                        </div>
                        <div>
                          <Label htmlFor="ssl_client_key" className="text-sm font-semibold">Client Private Key</Label>
                          <p className="text-xs text-muted-foreground mb-1.5">Private key for client certificate (PEM format, encrypted on server)</p>
                          <Textarea
                            id="ssl_client_key"
                            value={formData.ssl_client_key}
                            onChange={(e) => setFormData({ ...formData, ssl_client_key: e.target.value })}
                            placeholder="-----BEGIN PRIVATE KEY-----&#10;..."
                            rows={5}
                            className="font-mono text-xs w-full"
                          />
                          {editingConnection && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
                              Leave blank to keep existing key
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="mt-0 space-y-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <Label htmlFor="connection_timeout" className="text-sm font-semibold">Connection Timeout</Label>
                      <p className="text-xs text-muted-foreground mb-1.5">Seconds</p>
                      <Input
                        id="connection_timeout"
                        type="number"
                        value={formData.connection_timeout}
                        onChange={(e) => setFormData({ ...formData, connection_timeout: parseInt(e.target.value) || 10 })}
                        min={1}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="query_timeout" className="text-sm font-semibold">Query Timeout</Label>
                      <p className="text-xs text-muted-foreground mb-1.5">Seconds</p>
                      <Input
                        id="query_timeout"
                        type="number"
                        value={formData.query_timeout}
                        onChange={(e) => setFormData({ ...formData, query_timeout: parseInt(e.target.value) || 30 })}
                        min={1}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="max_connections" className="text-sm font-semibold">Max Connections</Label>
                      <p className="text-xs text-muted-foreground mb-1.5">Pool size</p>
                      <Input
                        id="max_connections"
                        type="number"
                        value={formData.max_connections}
                        onChange={(e) => setFormData({ ...formData, max_connections: parseInt(e.target.value) || 10 })}
                        min={1}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                    <div>
                      <Label htmlFor="is_read_only" className="text-sm font-semibold">Read-Only Connection</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Prevents write operations (INSERT, UPDATE, DELETE, DDL)
                      </p>
                    </div>
                    <Switch
                      id="is_read_only"
                      checked={formData.is_read_only}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_read_only: checked })}
                    />
                  </div>

                  <div className="space-y-4 p-5 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                    <div>
                      <Label htmlFor="allowed_schemas" className="text-sm font-semibold">Allowed Schemas</Label>
                      <p className="text-xs text-muted-foreground mb-1.5">
                        Restrict access to specific schemas (comma-separated). Leave empty for all schemas.
                      </p>
                      <Input
                        id="allowed_schemas"
                        value={Array.isArray(formData.allowed_schemas) ? formData.allowed_schemas.join(', ') : (formData.allowed_schemas || '')}
                        onChange={(e) => {
                          const schemas = e.target.value ? e.target.value.split(',').map(s => s.trim()).filter(s => s) : [];
                          setFormData({ ...formData, allowed_schemas: schemas });
                        }}
                        placeholder="public, app_schema, analytics"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="query_allowlist" className="text-sm font-semibold">Query Allowlist</Label>
                      <p className="text-xs text-muted-foreground mb-1.5">
                        SQL patterns (one per line, use % as wildcard). Leave empty to allow all queries.
                      </p>
                      <Textarea
                        id="query_allowlist"
                        value={Array.isArray(formData.query_allowlist) ? formData.query_allowlist.join('\n') : (formData.query_allowlist || '')}
                        onChange={(e) => {
                          const patterns = e.target.value ? e.target.value.split('\n').map(p => p.trim()).filter(p => p) : [];
                          setFormData({ ...formData, query_allowlist: patterns });
                        }}
                        placeholder="SELECT * FROM users%&#10;SELECT * FROM orders WHERE status = 'active'"
                        rows={6}
                        className="font-mono text-xs w-full"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
          
          <DialogFooter className="px-6 py-4 border-t bg-slate-50 dark:bg-slate-900">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConnection} disabled={loading} className="min-w-[120px]">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {editingConnection ? "Update Connection" : "Create Connection"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

