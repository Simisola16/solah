import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaMosque, FaSignOutAlt, FaCheckCircle, FaTimesCircle, 
  FaClock, FaCalendarAlt, FaFire, FaChartPie, FaUser 
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { prayerTimesAPI, userAPI, prayerLogAPI, BACKEND_URL } from '../utils/api';

const Dashboard = () => {
  const { user, logout, isAdmin } = useAuth();
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [todayLogs, setTodayLogs] = useState({});
  const [stats, setStats] = useState(null);
  const [globalStats, setGlobalStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch prayer times
      const prayerResponse = await prayerTimesAPI.getPrayerTimes();
      setPrayerTimes(prayerResponse.data);

      // Fetch today's logs
      const today = new Date().toISOString().split('T')[0];
      const logsResponse = await prayerLogAPI.getUserPrayerLogs(user.id, {
        startDate: today,
        endDate: today
      });
      
      const logsMap = {};
      logsResponse.data.forEach(log => {
        logsMap[log.prayer] = log.prayed;
      });
      setTodayLogs(logsMap);

      // Fetch personal stats for streak/rate
      const statsResponse = await userAPI.getUserStats(user.id);
      setStats(statsResponse.data);

      // Fetch global community stats
      const globalResponse = await userAPI.getGlobalStats();
      setGlobalStats(globalResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPrayerStatus = (prayer) => {
    if (todayLogs[prayer] === true) return 'prayed';
    if (todayLogs[prayer] === false) return 'missed';
    return 'pending';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'prayed':
        return <FaCheckCircle className="text-green-500" />;
      case 'missed':
        return <FaTimesCircle className="text-red-500" />;
      default:
        return <FaClock className="text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'prayed':
        return <span className="badge-prayed"><FaCheckCircle /> Prayed</span>;
      case 'missed':
        return <span className="badge-missed"><FaTimesCircle /> Missed</span>;
      default:
        return null;
    }
  };

  // Group history by date
  const groupedHistory = history.reduce((acc, log) => {
    if (!acc[log.date]) {
      acc[log.date] = {};
    }
    acc[log.date][log.prayer] = log.prayed;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen bg-islamic-cream flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-islamic-cream mobile-page-container">
      {/* Header - Hidden on mobile, shown on desktop */}
      <header className="bg-islamic-green text-white py-4 px-6 shadow-lg hidden sm:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaMosque className="text-3xl text-islamic-gold" />
            <h1 className="text-2xl font-bold">Solah Tracker</h1>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin() && (
              <Link 
                to="/admin" 
                className="px-4 py-2 bg-islamic-gold text-islamic-green rounded-lg font-medium hover:bg-islamic-gold-light transition-all"
              >
                Admin Panel
              </Link>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 border border-white/30 rounded-lg hover:bg-white/10 transition-all"
            >
              <FaSignOutAlt />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <div className="sm:hidden bg-islamic-green p-4 sticky top-0 z-40 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2 text-white">
          <FaMosque className="text-xl text-islamic-gold" />
          <span className="font-bold">Solah Tracker</span>
        </div>
        <button onClick={logout} className="text-white/80"><FaSignOutAlt size={20} /></button>
      </div>

      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* User Profile Section */}
        <section className="bg-white rounded-2xl shadow-sm p-5 mb-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="relative">
              {user.profileImage ? (
                <img 
                  src={user.profileImage?.startsWith('data:') ? user.profileImage : `${BACKEND_URL}${user.profileImage}`} 
                  alt={user.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-islamic-green"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-islamic-green flex items-center justify-center border-4 border-islamic-gold">
                  <FaUser className="text-3xl sm:text-4xl text-white" />
                </div>
              )}
            </div>
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-islamic-green-dark">{user.name}</h2>
              <p className="text-gray-500 text-sm sm:text-base">{user.email}</p>
              <p className="text-[10px] uppercase font-bold tracking-widest text-islamic-gold mt-1">
                Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'New Member'}
              </p>
            </div>
            {stats && (
              <div className="flex gap-3 w-full sm:w-auto">
                <div className="flex-1 text-center bg-islamic-cream/50 rounded-xl p-3 border border-islamic-green/10">
                  <FaFire className="text-xl text-orange-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-islamic-green-dark">{stats.streak}</p>
                  <p className="text-[10px] uppercase font-bold text-gray-500">Streak</p>
                </div>
                <div className="flex-1 text-center bg-islamic-cream/50 rounded-xl p-3 border border-islamic-green/10">
                  <FaChartPie className="text-xl text-islamic-green mx-auto mb-1" />
                  <p className="text-xl font-bold text-islamic-green-dark">{stats.percentage}%</p>
                  <p className="text-[10px] uppercase font-bold text-gray-500">Rate</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Tab Selection (Desktop) */}
        <div className="hidden sm:flex gap-4 mb-6 border-b border-gray-200">
          {['today', 'stats'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-4 font-medium capitalize ${
                activeTab === tab ? 'text-islamic-green border-b-2 border-islamic-green' : 'text-gray-600'
              }`}
            >
              {tab === 'stats' ? 'Community Stats' : tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {activeTab === 'today' && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-islamic-green-dark">Today's Prayers</h3>
                <span className="text-xs text-gray-500">{prayerTimes?.date}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer) => (
                  <div key={prayer} className={`prayer-card ${getPrayerStatus(prayer)}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm text-islamic-green-dark">{prayer}</span>
                      {getStatusIcon(getPrayerStatus(prayer))}
                    </div>
                    <p className="text-xl font-black text-gray-800">{prayerTimes?.[prayer] || '--:--'}</p>
                    <div className="mt-2">{getStatusBadge(getPrayerStatus(prayer))}</div>
                  </div>
                ))}
              </div>
            </section>
          )}


          {activeTab === 'stats' && globalStats && (
            <section className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-islamic-green-dark mb-6 text-center">Community Performance</h3>
              <div className="grid grid-cols-2 gap-4">
                <StatCard title="Total Marked" value={globalStats.totalPrayers} icon={<FaClock />} color="blue" />
                <StatCard title="Total Prayed" value={globalStats.prayedCount} icon={<FaCheckCircle />} color="green" />
                <StatCard title="Avg. Rate" value={`${globalStats.percentage}%`} icon={<FaFire />} color="gold" />
                <StatCard title="Total Users" value={globalStats.totalUsers} icon={<FaUser />} color="red" />
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Mobile Tab Bar */}
      <nav className="mobile-nav">
        <button onClick={() => setActiveTab('today')} className={`mobile-nav-item ${activeTab === 'today' ? 'active' : ''}`}>
          <FaMosque size={20} />
          <span className="text-[10px] mt-1 font-bold uppercase">Prayers</span>
        </button>
        <button onClick={() => setActiveTab('stats')} className={`mobile-nav-item ${activeTab === 'stats' ? 'active' : ''}`}>
          <FaChartPie size={20} />
          <span className="text-[10px] mt-1 font-bold uppercase">Community</span>
        </button>
        {isAdmin() && (
          <Link to="/admin" className="mobile-nav-item">
            <FaUser size={20} />
            <span className="text-[10px] mt-1 font-bold uppercase">Admin</span>
          </Link>
        )}
      </nav>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    gold: 'bg-yellow-50 text-yellow-600'
  };

  return (
    <div className="bg-gray-50 rounded-xl p-6 text-center">
      <div className={`${colorClasses[color]} w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3`}>
        {icon}
      </div>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  );
};

export default Dashboard;
