import { useEffect, useMemo, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { FileText, BarChart3, Filter, Download, Loader2, X, TrendingUp, Shield, Activity, Laptop, Users, FileDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import TablePaginationControls from '@/components/TablePaginationControls';
import { AssetStatusPieChart, CompanyBarChart, ActivityAreaChart, TrendLineChart, ManagerBarChart } from '@/components/charts';
import { KPICard, RiskIndicatorList, ComplianceChecklist, MetricsComparison, ComplianceAlertBanner } from '@/components/widgets';

const AuditReportingNew = () => {
  const { getAuthHeaders, user } = useAuth();
  const [activeView, setActiveView] = useState('summary');
  const [logs, setLogs] = useState([]);
  const [summaryEnhanced, setSummaryEnhanced] = useState(null);
  const [statsEnhanced, setStatsEnhanced] = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [logsPage, setLogsPage] = useState(1);
  const [logsPageSize, setLogsPageSize] = useState(10);
  const [statsPeriod, setStatsPeriod] = useState(30);
  const [trendsPeriod, setTrendsPeriod] = useState(30);
  const [filters, setFilters] = useState({
    action: '', entityType: '', startDate: '', endDate: '', userEmail: '', limit: '100'
  });

  // Check if user can access advanced reports (admin, manager, and coordinator)
  const canAccessReports = user && (user.role === 'admin' || user.role === 'manager' || user.role === 'coordinator');

  // Track previous period values to avoid duplicate fetches
  const prevStatsPeriod = useRef(statsPeriod);
  const prevTrendsPeriod = useRef(trendsPeriod);

  // Fetch compliance data on mount for alert banner
  useEffect(() => {
    if (canAccessReports) {
      fetchCompliance();
    }
  }, []);

  // Fetch data when active view changes
  useEffect(() => {
    if (activeView === 'logs') fetchLogs();
    else if (activeView === 'summary') { fetchSummaryEnhanced(); }
    else if (activeView === 'stats') { fetchStatsEnhanced(); }
    else if (activeView === 'compliance') fetchCompliance();
    else if (activeView === 'trends') fetchTrends();
  }, [activeView]);

  // Auto-fetch stats when period changes (Issue 2 fix)
  useEffect(() => {
    // Only fetch if period actually changed (not on mount or tab switch)
    if (activeView === 'stats' && prevStatsPeriod.current !== statsPeriod) {
      fetchStatsEnhanced();
    }
    prevStatsPeriod.current = statsPeriod;
  }, [statsPeriod, activeView]);

  // Auto-fetch trends when period changes (Issue 3 fix)
  useEffect(() => {
    // Only fetch if period actually changed (not on mount or tab switch)
    if (activeView === 'trends' && prevTrendsPeriod.current !== trendsPeriod) {
      fetchTrends();
    }
    prevTrendsPeriod.current = trendsPeriod;
  }, [trendsPeriod, activeView]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v && v !== 'all') params.append(k, v);
      });
      const response = await fetch(`/api/audit/logs?${params}`, { headers: { ...getAuthHeaders() } });
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      setLogs(await response.json());
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  const fetchSummaryEnhanced = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/reports/summary-enhanced', { headers: { ...getAuthHeaders() } });
      if (!response.ok) throw new Error('Failed to fetch enhanced summary');
      setSummaryEnhanced(await response.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatsEnhanced = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ period: statsPeriod.toString() });
      const response = await fetch(`/api/reports/statistics-enhanced?${params}`, { headers: { ...getAuthHeaders() } });
      if (!response.ok) throw new Error('Failed to fetch enhanced statistics');
      setStatsEnhanced(await response.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompliance = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/reports/compliance', { headers: { ...getAuthHeaders() } });
      if (!response.ok) throw new Error('Failed to fetch compliance data');
      setCompliance(await response.json());
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  const fetchTrends = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ period: trendsPeriod.toString() });
      const response = await fetch(`/api/reports/trends?${params}`, { headers: { ...getAuthHeaders() } });
      if (!response.ok) throw new Error('Failed to fetch trends');
      setTrends(await response.json());
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && k !== 'limit' && params.append(k, v));
      const response = await fetch(`/api/audit/export?${params}`, { headers: { ...getAuthHeaders() } });
      if (!response.ok) throw new Error('Failed to export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message);
    }
  };

  const clearFilters = () => setFilters({ action: '', entityType: '', startDate: '', endDate: '', userEmail: '', limit: '100' });
  const formatDate = (d) => new Date(d).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  // Semantic badge classes for action types
  const getActionBadgeClass = (action) => ({
    CREATE: 'glow-success',
    STATUS_CHANGE: 'glow-warning',
    UPDATE: 'glow-info',
    DELETE: 'glow-destructive'
  }[action] || 'glow-muted');

  useEffect(() => {
    setLogsPage(1);
  }, [logsPageSize, logs.length]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(logs.length / logsPageSize) || 1);
    if (logsPage > totalPages) {
      setLogsPage(totalPages);
    }
  }, [logsPage, logsPageSize, logs.length]);

  const paginatedLogs = useMemo(() => {
    const start = (logsPage - 1) * logsPageSize;
    return logs.slice(start, start + logsPageSize);
  }, [logs, logsPage, logsPageSize]);

  return (
    <div className="space-y-6 p-1 md:p-2 animate-fade-in bg-surface/30 min-h-screen rounded-2xl">
      <Card className="glass-panel rounded-2xl">
        <CardHeader className="px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="icon-box icon-box-sm bg-primary/10 border-primary/20">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-gradient text-lg sm:text-xl">Audit & Reporting</CardTitle>
            </div>
            {canAccessReports && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="no-print gap-2"
                title="Export current view as PDF"
              >
                <FileDown className="h-4 w-4" />
                <span className="hidden sm:inline">Export PDF</span>
              </Button>
            )}
          </div>
          {/* Hidden print header - only shown when printing */}
          <div className="print-header hidden">
            <h1>Compliance Report</h1>
            <p className="date">Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <Tabs value={activeView} onValueChange={setActiveView}>
            <TabsList className="mb-6 w-full overflow-x-auto flex-nowrap justify-start">
              <TabsTrigger value="summary" className="gap-2"><BarChart3 className="h-4 w-4" />Summary</TabsTrigger>
              {canAccessReports && <TabsTrigger value="stats" className="gap-2"><Activity className="h-4 w-4" />Statistics</TabsTrigger>}
              {canAccessReports && <TabsTrigger value="compliance" className="gap-2"><Shield className="h-4 w-4" />Compliance</TabsTrigger>}
              {canAccessReports && <TabsTrigger value="trends" className="gap-2"><TrendingUp className="h-4 w-4" />Trends</TabsTrigger>}
              <TabsTrigger value="logs" className="gap-2"><FileText className="h-4 w-4" />Audit Logs</TabsTrigger>
            </TabsList>

            {/* Compliance Alert Banner - shown when there are critical issues */}
            {canAccessReports && compliance && (
              <ComplianceAlertBanner
                compliance={compliance}
                onNavigate={(tab) => setActiveView(tab)}
              />
            )}

            {error && <div className="mb-4 p-4 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>}

            <TabsContent value="logs" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-6">
                <Select value={filters.action} onValueChange={(v) => setFilters({ ...filters, action: v })}>
                  <SelectTrigger><SelectValue placeholder="Action" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="CREATE">Create</SelectItem>
                    <SelectItem value="STATUS_CHANGE">Status Change</SelectItem>
                    <SelectItem value="UPDATE">Update</SelectItem>
                    <SelectItem value="DELETE">Delete</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.entityType} onValueChange={(v) => setFilters({ ...filters, entityType: v })}>
                  <SelectTrigger><SelectValue placeholder="Entity Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="asset">Asset</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} placeholder="Start Date" />
                <Input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} placeholder="End Date" />
                <Input type="email" value={filters.userEmail} onChange={(e) => setFilters({ ...filters, userEmail: e.target.value })} placeholder="User Email" />
                <Select value={filters.limit} onValueChange={(v) => setFilters({ ...filters, limit: v })}>
                  <SelectTrigger><SelectValue placeholder="Limit" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50 records</SelectItem>
                    <SelectItem value="100">100 records</SelectItem>
                    <SelectItem value="250">250 records</SelectItem>
                    <SelectItem value="all">All records</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button onClick={fetchLogs}><Filter className="h-4 w-4 mr-2" />Apply Filters</Button>
                <Button variant="outline" onClick={clearFilters}><X className="h-4 w-4 mr-2" />Clear</Button>
                <Button variant="outline" onClick={handleExport} className="ml-auto"><Download className="h-4 w-4 mr-2" />Export CSV</Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-2 text-muted-foreground">Loading...</span></div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground"><FileText className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>No audit logs found.</p></div>
              ) : (
                <div className="space-y-4">
                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {paginatedLogs.map((log) => (
                      <div key={log.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', getActionBadgeClass(log.action))}>{log.action}</Badge>
                              <span className="text-xs text-muted-foreground capitalize">{log.entity_type}</span>
                            </div>
                            <h4 className="font-medium truncate">{log.entity_name || 'N/A'}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{formatDate(log.timestamp)}</p>
                          </div>
                        </div>

                        {log.details && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground mb-1">Details</p>
                            <p className="text-sm">{log.details}</p>
                          </div>
                        )}

                        {log.user_email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>{log.user_email}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead className="hidden lg:table-cell">Entity Type</TableHead>
                          <TableHead>Entity Name</TableHead>
                          <TableHead className="hidden xl:table-cell">Details</TableHead>
                          <TableHead className="hidden lg:table-cell">User</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-sm">{formatDate(log.timestamp)}</TableCell>
                            <TableCell><Badge className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', getActionBadgeClass(log.action))}>{log.action}</Badge></TableCell>
                            <TableCell className="hidden lg:table-cell capitalize">{log.entity_type}</TableCell>
                            <TableCell>{log.entity_name || '-'}</TableCell>
                            <TableCell className="hidden xl:table-cell max-w-xs truncate text-sm text-muted-foreground">{log.details}</TableCell>
                            <TableCell className="hidden lg:table-cell">{log.user_email || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <TablePaginationControls
                    className="mt-4"
                    page={logsPage}
                    pageSize={logsPageSize}
                    totalItems={logs.length}
                    onPageChange={setLogsPage}
                    onPageSizeChange={setLogsPageSize}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="summary" className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading...</span>
                </div>
              ) : summaryEnhanced ? (
                <>
                  {/* KPI Cards Row */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <KPICard
                      title="Total Assets"
                      value={summaryEnhanced.total}
                      icon={Laptop}
                      trend={summaryEnhanced.totalChange > 0 ? 'up' : summaryEnhanced.totalChange < 0 ? 'down' : null}
                      trendValue={summaryEnhanced.totalChange !== 0 ? `${Math.abs(summaryEnhanced.totalChange)} vs last month` : null}
                      variant="info"
                    />
                    <KPICard
                      title="Active Assets"
                      value={summaryEnhanced.byStatus?.active || 0}
                      icon={BarChart3}
                      variant="success"
                      description={`${summaryEnhanced.byStatus?.returned || 0} returned`}
                    />
                    <KPICard
                      title="At Risk"
                      value={(summaryEnhanced.byStatus?.lost || 0) + (summaryEnhanced.byStatus?.damaged || 0)}
                      icon={Shield}
                      variant={(summaryEnhanced.byStatus?.lost || 0) + (summaryEnhanced.byStatus?.damaged || 0) > 0 ? 'danger' : 'success'}
                      description={`${summaryEnhanced.byStatus?.lost || 0} lost, ${summaryEnhanced.byStatus?.damaged || 0} damaged`}
                    />
                    <KPICard
                      title="Active Rate"
                      value={`${summaryEnhanced.complianceScore}%`}
                      icon={Activity}
                      variant={summaryEnhanced.complianceScore >= 80 ? 'success' : summaryEnhanced.complianceScore >= 60 ? 'warning' : 'danger'}
                      description="Percentage of active assets"
                    />
                  </div>

                  {/* Charts Grid */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <AssetStatusPieChart data={summaryEnhanced.byStatus} />
                    <CompanyBarChart data={summaryEnhanced.byCompany} topN={10} />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <ManagerBarChart data={summaryEnhanced.byManager?.slice(0, 10) || []} />
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Asset Types</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {Object.entries(summaryEnhanced.byType || {})
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 8)
                            .map(([type, count]) => (
                              <div key={type} className="flex items-center justify-between">
                                <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-32 bg-muted rounded-full h-2">
                                    <div
                                      className="bg-primary h-2 rounded-full"
                                      style={{ width: `${(count / summaryEnhanced.total) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-semibold w-12 text-right">{count}</span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : null}
            </TabsContent>

            {canAccessReports && <TabsContent value="stats" className="space-y-4">
              <div className="flex gap-2 flex-wrap items-center">
                <span className="text-sm text-muted-foreground">Period:</span>
                <Button
                  variant={statsPeriod === 7 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setStatsPeriod(7); }}
                  aria-pressed={statsPeriod === 7}
                >
                  7 Days
                </Button>
                <Button
                  variant={statsPeriod === 30 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setStatsPeriod(30); }}
                  aria-pressed={statsPeriod === 30}
                >
                  30 Days
                </Button>
                <Button
                  variant={statsPeriod === 90 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setStatsPeriod(90); }}
                  aria-pressed={statsPeriod === 90}
                >
                  90 Days
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading...</span>
                </div>
              ) : statsEnhanced ? (
                <div className="space-y-6">
                  <ActivityAreaChart data={statsEnhanced.activityByDay} title="Activity Over Time" showPeriodSelector={false} />

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Action Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {statsEnhanced.actionBreakdown && statsEnhanced.actionBreakdown.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Action</TableHead>
                                <TableHead className="text-right">Count</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {statsEnhanced.actionBreakdown.map((item, i) => (
                                <TableRow key={i}>
                                  <TableCell>
                                    <Badge className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', getActionBadgeClass(item.action))}>{item.action}</Badge>
                                  </TableCell>
                                  <TableCell className="text-right font-semibold">{item.count}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">No data</div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Top Active Users</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {statsEnhanced.topUsers && statsEnhanced.topUsers.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {statsEnhanced.topUsers.map((user, i) => (
                                <TableRow key={i}>
                                  <TableCell className="font-medium">{user.email}</TableCell>
                                  <TableCell className="text-right">{user.count}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">No data</div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : null}
            </TabsContent>}

            {canAccessReports && <TabsContent value="compliance" className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading...</span>
                </div>
              ) : compliance ? (
                <>
                  {/* Compliance KPI Cards */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <KPICard
                      title="Compliance Score"
                      value={`${compliance.score}%`}
                      icon={Shield}
                      variant={compliance.score >= 80 ? 'success' : compliance.score >= 60 ? 'warning' : 'danger'}
                      description="Overall compliance rating"
                    />
                    <KPICard
                      title="Overdue Attestations"
                      value={compliance.overdueAttestations}
                      icon={FileText}
                      variant={compliance.overdueAttestations === 0 ? 'success' : 'warning'}
                      description="Past due date"
                    />
                    <KPICard
                      title="At Risk Assets"
                      value={compliance.atRiskAssets}
                      icon={Shield}
                      variant={compliance.atRiskAssets === 0 ? 'success' : compliance.atRiskAssets < 5 ? 'warning' : 'danger'}
                      description="Lost or damaged"
                    />
                    <KPICard
                      title="Attested This Quarter"
                      value={compliance.attestedThisQuarter}
                      icon={FileText}
                      variant="info"
                      description="Completed attestations"
                    />
                  </div>

                  {/* Campaign Progress */}
                  {compliance.campaigns && compliance.campaigns.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Active Campaign Progress</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {compliance.campaigns.map((campaign, index) => (
                          <div key={index}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">{campaign.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {campaign.completed}/{campaign.total} ({campaign.progress}%)
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-primary h-full transition-all duration-300 rounded-full"
                                style={{ width: `${campaign.progress}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <RiskIndicatorList risks={compliance.riskIndicators} />
                    <ComplianceChecklist items={compliance.checklist} />
                  </div>
                </>
              ) : null}
            </TabsContent>}

            {canAccessReports && <TabsContent value="trends" className="space-y-6">
              <div className="flex gap-2 flex-wrap items-center">
                <span className="text-sm text-muted-foreground">Period:</span>
                <Button
                  variant={trendsPeriod === 7 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setTrendsPeriod(7); }}
                  aria-pressed={trendsPeriod === 7}
                >
                  7 Days
                </Button>
                <Button
                  variant={trendsPeriod === 30 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setTrendsPeriod(30); }}
                  aria-pressed={trendsPeriod === 30}
                >
                  30 Days
                </Button>
                <Button
                  variant={trendsPeriod === 90 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setTrendsPeriod(90); }}
                  aria-pressed={trendsPeriod === 90}
                >
                  90 Days
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading...</span>
                </div>
              ) : trends ? (
                <div className="space-y-6">
                  <TrendLineChart data={trends.assetGrowth} title="Asset Growth Over Time" dataKey="count" />

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Status Changes Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ActivityAreaChart data={trends.statusChanges} title="" showPeriodSelector={false} />
                    </CardContent>
                  </Card>

                  {trends.metricsComparison && (
                    <MetricsComparison
                      current={trends.metricsComparison.current}
                      previous={trends.metricsComparison.previous}
                      title={`Metrics Comparison (Last ${trendsPeriod} Days vs Previous ${trendsPeriod} Days)`}
                    />
                  )}
                </div>
              ) : null}
            </TabsContent>}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditReportingNew;
