import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Loader2, Package, Users, Building2, TrendingUp, ArrowUpRight } from 'lucide-react';

// Animation variants for staggered fade-in
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
};

// Stat Card Component with Soft Brutalism + Liquid Glass
const StatCard = ({ icon: Icon, value, label, trend, trendValue, colorClass = 'primary' }) => {
  const iconContainerClass = {
    primary: 'icon-container-primary',
    success: 'icon-container-success',
    warning: 'icon-container-warning',
  }[colorClass] || 'icon-container-primary';

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4, transition: { duration: 0.2, ease: 'easeOut' } }}
      className="stat-card-premium group"
    >
      {/* Icon */}
      <div className={`icon-container ${iconContainerClass} mb-6 group-hover:scale-105 transition-transform duration-300`}>
        <Icon className="w-6 h-6" strokeWidth={1.5} />
      </div>
      
      {/* Value */}
      <div className="mb-2">
        <span className="text-4xl md:text-5xl font-semibold tracking-tighter text-foreground">
          {value}
        </span>
      </div>
      
      {/* Label */}
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3">
        {label}
      </p>
      
      {/* Trend indicator */}
      {trend && (
        <div className="flex items-center gap-1.5">
          <div className={`flex items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-full ${
            trend === 'up' 
              ? 'bg-success/10 text-success' 
              : 'bg-destructive/10 text-destructive'
          }`}>
            <TrendingUp className={`w-3 h-3 ${trend === 'down' ? 'rotate-180' : ''}`} />
            <span>{trendValue}</span>
          </div>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">vs last month</span>
        </div>
      )}
    </motion.div>
  );
};

const Dashboard = () => {
  const { getAuthHeaders } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    assetsCount: 0,
    employeesCount: 0,
    companiesCount: 0
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stats', {
        headers: { ...getAuthHeaders() }
      });
      if (response.ok) {
        const data = await response.json();
        setDashboardStats(data);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </motion.div>
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm font-medium text-zinc-500 dark:text-zinc-400"
        >
          Loading dashboard...
        </motion.span>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6 md:space-y-8"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Overview of your asset compliance system
        </p>
      </motion.div>

      {/* Stats Bento Grid */}
      <motion.div 
        variants={containerVariants}
        className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      >
        <StatCard
          icon={Package}
          value={dashboardStats.assetsCount.toLocaleString()}
          label="Total Assets"
          trend="up"
          trendValue="+12%"
          colorClass="primary"
        />
        
        <StatCard
          icon={Users}
          value={dashboardStats.employeesCount.toLocaleString()}
          label="Team Members"
          trend="up"
          trendValue="+5%"
          colorClass="success"
        />
        
        <StatCard
          icon={Building2}
          value={dashboardStats.companiesCount.toLocaleString()}
          label="Partners"
          trend="up"
          trendValue="+3%"
          colorClass="warning"
        />
      </motion.div>

      {/* Quick Actions - Glass Panel Style */}
      <motion.div variants={itemVariants}>
        <div className="glass-card p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Quick Actions
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                Frequently used operations
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Add Asset', icon: Package },
              { label: 'Add User', icon: Users },
              { label: 'View Reports', icon: TrendingUp },
              { label: 'Settings', icon: ArrowUpRight },
            ].map((action, index) => (
              <motion.button
                key={action.label}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/40 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all duration-200"
              >
                <action.icon className="w-5 h-5 text-zinc-600 dark:text-zinc-300" strokeWidth={1.5} />
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  {action.label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
