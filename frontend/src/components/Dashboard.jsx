import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { Loader2, Package, Users, Building2, TrendingUp, ArrowUpRight } from 'lucide-react';

// Animation variants for staggered fade-in with "unfold" effect
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,              // Increased from 0.1 for unfold effect
      delayChildren: 0.15,                // Increased from 0.1
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

// Magnetic Button Component with cursor following and hardware acceleration
const MagneticButton = ({ children, onClick, className = '' }) => {
  const buttonRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Smooth spring animation for magnetic effect
  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  const handleMouseMove = (e) => {
    if (!buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;
    const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);
    
    // Apply magnetic effect within 20px radius
    if (distance < 80) {
      const strength = (80 - distance) / 80;
      x.set(distanceX * strength * 0.3);
      y.set(distanceY * strength * 0.3);
    } else {
      x.set(0);
      y.set(0);
    }
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={buttonRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={className}
      // Hardware acceleration for 120fps performance
      layoutId="magnetic-button"
    >
      {children}
    </motion.button>
  );
};

// Stat Card Component with Soft Brutalism + Liquid Glass
const StatCard = ({ icon: Icon, value, label, trend, trendValue, colorClass = 'primary' }) => {
  const iconGradientClass = {
    primary: 'icon-gradient-primary',
    success: 'icon-gradient-success',
    warning: 'icon-gradient-warning',
    info: 'icon-gradient-info',
  }[colorClass] || 'icon-gradient-primary';

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4, transition: { duration: 0.2, ease: 'easeOut' } }}
      className="soft-stat-card group"
    >
      {/* Icon with gradient */}
      <div className={`${iconGradientClass} mb-6 group-hover:scale-105 transition-transform duration-300`}>
        <Icon className="w-6 h-6" strokeWidth={1.5} />
      </div>
      
      {/* Value - Fluid Typography */}
      <div className="mb-2">
        <span className="text-fluid-2xl font-semibold tracking-tighter text-foreground">
          {value}
        </span>
      </div>
      
      {/* Label with subtle text */}
      <p className="text-subtle mb-3 text-sm">
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
          <span className="text-xs text-subtle">vs last month</span>
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
      className="bento-container bg-gradient-mesh bg-noise space-y-6 @md:space-y-8 p-6 @md:p-8"
    >
      {/* Header Section with Fluid Typography */}
      <motion.div variants={itemVariants} className="space-y-1">
        <h1 className="text-fluid-display text-foreground">
          Dashboard
        </h1>
        <p className="text-fluid-body text-subtle">
          Overview of your asset compliance system
        </p>
      </motion.div>

      {/* Stats Bento Grid - Asymmetric Layout with Container Queries */}
      <AnimatePresence>
        <motion.div 
          variants={containerVariants}
          className="bento-grid grid-cols-1 @md:grid-cols-4 gap-4 @md:gap-6"
        >
          {/* First stat card spans 2 columns for emphasis */}
          <motion.div 
            variants={itemVariants}
            className="@md:bento-span-2"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', ...{ ease: 'var(--ease-spring)' } }}
          >
            <StatCard
              icon={Package}
              value={dashboardStats.assetsCount.toLocaleString()}
              label="Total Assets"
              trend="up"
              trendValue="+12%"
              colorClass="primary"
            />
          </motion.div>
          
          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', ...{ ease: 'var(--ease-spring)' } }}
          >
            <StatCard
              icon={Users}
              value={dashboardStats.employeesCount.toLocaleString()}
              label="Team Members"
              trend="up"
              trendValue="+5%"
              colorClass="success"
            />
          </motion.div>
          
          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', ...{ ease: 'var(--ease-spring)' } }}
          >
            <StatCard
              icon={Building2}
              value={dashboardStats.companiesCount.toLocaleString()}
              label="Partners"
              trend="up"
              trendValue="+3%"
              colorClass="warning"
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Quick Actions - Liquid Glass Panel spanning full width */}
      <AnimatePresence>
        <motion.div 
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
          transition={{ type: 'spring', ...{ ease: 'var(--ease-spring)' } }}
          className="bento-span-full"
        >
          <div className="liquid-glass-card glass-mask p-6 @md:p-8 @container">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-fluid-h3 text-foreground">
                  Quick Actions
                </h2>
                <p className="text-fluid-body text-subtle mt-0.5">
                  Frequently used operations
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 @md:grid-cols-4 gap-3">
              {[
                { label: 'Add Asset', icon: Package },
                { label: 'Add User', icon: Users },
                { label: 'View Reports', icon: TrendingUp },
                { label: 'Settings', icon: ArrowUpRight },
              ].map((action) => (
                <MagneticButton
                  key={action.label}
                  className="gpu-accelerate hover-lift flex flex-col items-center gap-3 p-4 rounded-2xl bg-surface-low border border-border/40 hover:border-border/60 transition-all duration-200"
                >
                  <action.icon className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                  <span className="text-xs font-medium text-muted-foreground">
                    {action.label}
                  </span>
                </MagneticButton>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default Dashboard;
