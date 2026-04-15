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
  const [history, setHistory] = useState([]);
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

      // Fetch stats
      const statsResponse = await userAPI.getUserStats(user.id);
      setStats(statsResponse.data);

      // Fetch history (last 30 days)
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const historyResponse = await prayerLogAPI.getUserPrayerLogs(user.id, { startDate, endDate });
      setHistory(historyResponse.data);
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
        return <span className="badge-pending"><FaClock /> Pending</span>;
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
    <div className="min-h-screen bg-islamic-cream">
      {/* Header */}
      <header className="bg-islamic-green text-white py-4 px-6 shadow-lg">
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

      <main className="max-w-7xl mx-auto p-6">
        {/* User Profile Section */}
        <section className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              {user.profileImage ? (
                <img 
                  src={`${BACKEND_URL}${user.profileImage}`} 
                  alt={user.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-islamic-green"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-islamic-green flex items-center justify-center border-4 border-islamic-gold">
                  <FaUser className="text-4xl text-white" />
                </div>
              )}
            </div>
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-2xl font-bold text-islamic-green-dark">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
              <p className="text-sm text-islamic-gold mt-1">
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
            {stats && (
              <div className="flex gap-4">
                <div className="text-center bg-islamic-cream rounded-lg p-4">
                  <FaFire className="text-2xl text-orange-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-islamic-green-dark">{stats.streak}</p>
                  <p className="text-xs text-gray-600">Day Streak</p>
                </div>
                <div className="text-center bg-islamic-cream rounded-lg p-4">
                  <FaChartPie className="text-2xl text-islamic-green mx-auto mb-1" />
                  <p className="text-2xl font-bold text-islamic-green-dark">{stats.percentage}%</p>
                  <p className="text-xs text-gray-600">This Month</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Prayer Times Section */}
        {prayerTimes && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-islamic-green-dark flex items-center gap-2">
                <FaClock className="text-islamic-gold" />
                Today's Prayer Times
              </h3>
              <p className="text-gray-600 text-sm">
                {prayerTimes.date} | {prayerTimes.hijriDate} AH
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer) => (
                <div 
                  key={prayer}
                  className={`prayer-card ${getPrayerStatus(prayer)}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-islamic-green-dark">{prayer}</span>
                    {getStatusIcon(getPrayerStatus(prayer))}
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{prayerTimes[prayer]}</p>
                  <div className="mt-2">
                    {getStatusBadge(getPrayerStatus(prayer))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('today')}
            className={`pb-3 px-4 font-medium transition-all ${
              activeTab === 'today' 
                ? 'text-islamic-green border-b-2 border-islamic-green' 
                : 'text-gray-600 hover:text-islamic-green'
            }`}
          >
            Today's Status
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-4 font-medium transition-all ${
              activeTab === 'history' 
                ? 'text-islamic-green border-b-2 border-islamic-green' 
                : 'text-gray-600 hover:text-islamic-green'
            }`}
          >
            Prayer History
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`pb-3 px-4 font-medium transition-all ${
              activeTab === 'stats' 
                ? 'text-islamic-green border-b-2 border-islamic-green' 
                : 'text-gray-600 hover:text-islamic-green'
            }`}
          >
            Statistics
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'today' && (
          <section className="bg-white rounded-2xl shadow-lg p-6 animate-fade-in">
            <h3 className="text-lg font-bold text-islamic-green-dark mb-4">
              Today's Prayer Summary
            </h3>
            <div className="space-y-4">
              {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer) => {
                const status = getPrayerStatus(prayer);
                return (
                  <div 
                    key={prayer}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        status === 'prayed' ? 'bg-green-100' : 
                        status === 'missed' ? 'bg-red-100' : 'bg-gray-100'
                      }`}>
                        {getStatusIcon(status)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{prayer}</p>
                        <p className="text-sm text-gray-500">
                          {prayerTimes?.[prayer] || '--:--'}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(status)}
                  </div>
                );
              })}
            </div>
            <div className="mt-6 p-4 bg-islamic-cream rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Note:</strong> Your prayers are marked by the admin. 
                Contact your administrator if you have any questions about your prayer records.
              </p>
            </div>
          </section>
        )}

        {activeTab === 'history' && (
          <section className="bg-white rounded-2xl shadow-lg p-6 animate-fade-in">
            <h3 className="text-lg font-bold text-islamic-green-dark mb-4 flex items-center gap-2">
              <FaCalendarAlt className="text-islamic-gold" />
              Last 30 Days History
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Fajr</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Dhuhr</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Asr</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Maghrib</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Isha</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(groupedHistory)
                    .sort((a, b) => new Date(b[0]) - new Date(a[0]))
                    .map(([date, prayers]) => {
                      const prayedCount = Object.values(prayers).filter(v => v).length;
                      return (
                        <tr key={date} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm">{date}</td>
                          {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map(prayer => (
                            <td key={prayer} className="py-3 px-4 text-center">
                              {prayers[prayer] === true ? (
                                <FaCheckCircle className="text-green-500 mx-auto" />
                              ) : prayers[prayer] === false ? (
                                <FaTimesCircle className="text-red-500 mx-auto" />
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                          ))}
                          <td className="py-3 px-4 text-center">
                            <span className={`font-semibold ${
                              prayedCount === 5 ? 'text-green-600' : 
                              prayedCount >= 3 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {prayedCount}/5
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              {Object.keys(groupedHistory).length === 0 && (
                <p className="text-center text-gray-500 py-8">No prayer history available yet.</p>
              )}
            </div>
          </section>
        )}

        {activeTab === 'stats' && stats && (
          <section className="bg-white rounded-2xl shadow-lg p-6 animate-fade-in">
            <h3 className="text-lg font-bold text-islamic-green-dark mb-4 flex items-center gap-2">
              <FaChartPie className="text-islamic-gold" />
              Monthly Statistics ({stats.month})
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="Total Prayers"
                value={stats.totalPrayers}
                icon={<FaClock className="text-2xl" />}
                color="blue"
              />
              <StatCard 
                title="Prayed"
                value={stats.prayedCount}
                icon={<FaCheckCircle className="text-2xl" />}
                color="green"
              />
              <StatCard 
                title="Missed"
                value={stats.missedCount}
                icon={<FaTimesCircle className="text-2xl" />}
                color="red"
              />
              <StatCard 
                title="Completion Rate"
                value={`${stats.percentage}%`}
                icon={<FaFire className="text-2xl" />}
                color="gold"
              />
            </div>
            
            {/* Progress Bar */}
            <div className="mt-8">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Monthly Progress</span>
                <span className="text-sm font-medium text-islamic-green">{stats.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-islamic-green to-islamic-gold h-4 rounded-full transition-all duration-500"
                  style={{ width: `${stats.percentage}%` }}
                ></div>
              </div>
            </div>
          </section>
        )}
      </main>
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
