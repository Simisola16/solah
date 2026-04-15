import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaMosque, FaSignOutAlt, FaCheck, FaTimes, FaUser, 
  FaClock, FaCalendarAlt, FaSave, FaUsers, FaHistory,
  FaChevronDown, FaChevronUp, FaSearch, FaTrash
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { prayerTimesAPI, userAPI, prayerLogAPI, BACKEND_URL } from '../utils/api';

const Admin = () => {
  const { user, logout } = useAuth();
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [users, setUsers] = useState([]);
  const [todayLogs, setTodayLogs] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [deleting, setDeleting] = useState(null); // Track which user is being deleted
  const [activeTab, setActiveTab] = useState('attendance');
  const [expandedPrayer, setExpandedPrayer] = useState('Fajr');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userHistory, setUserHistory] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });

  // ... (previous state management functions)

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This will also remove all their prayer history. This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(userId);
      await userAPI.deleteUser(userId);
      showMessage('success', `User ${userName} deleted successfully.`);
      
      // Update local state
      setUsers(users.filter(u => u._id !== userId));
      if (selectedUser?._id === userId) {
        setSelectedUser(null);
        setUserHistory([]);
        setActiveTab('users');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showMessage('error', error.response?.data?.message || 'Failed to delete user.');
    } finally {
      setDeleting(null);
    }
  };

  // Attendance state for each prayer
  const [attendance, setAttendance] = useState({
    Fajr: {},
    Dhuhr: {},
    Asr: {},
    Maghrib: {},
    Isha: {}
  });

  useEffect(() => {
    fetchAdminData();
  }, [selectedDate]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Fetch prayer times
      const prayerResponse = await prayerTimesAPI.getPrayerTimes();
      setPrayerTimes(prayerResponse.data);

      // Fetch all users
      const usersResponse = await userAPI.getAllUsers();
      setUsers(usersResponse.data);

      // Fetch prayer logs for selected date
      const logsResponse = await prayerLogAPI.getDateLogs(selectedDate);
      setTodayLogs(logsResponse.data.logs);

      // Initialize attendance state from existing logs
      const newAttendance = {
        Fajr: {},
        Dhuhr: {},
        Asr: {},
        Maghrib: {},
        Isha: {}
      };

      Object.entries(logsResponse.data.logs).forEach(([prayer, logs]) => {
        logs.forEach(log => {
          newAttendance[prayer][log.userId._id] = log.prayed;
        });
      });

      setAttendance(newAttendance);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      showMessage('error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleAttendanceChange = (prayer, userId, prayed) => {
    // Prevent changes if already saved
    if (todayLogs[prayer]?.length > 0) return;

    setAttendance(prev => ({
      ...prev,
      [prayer]: {
        ...prev[prayer],
        [userId]: prayed
      }
    }));
  };

  const savePrayerAttendance = async (prayer) => {
    try {
      setSaving(prev => ({ ...prev, [prayer]: true }));

      const attendances = users.map(user => ({
        userId: user._id,
        prayed: attendance[prayer]?.[user._id] || false
      }));

      await prayerLogAPI.markBulkPrayers({
        date: selectedDate,
        prayer,
        attendances
      });

      showMessage('success', `${prayer} attendance saved successfully!`);
      fetchAdminData(); // Refresh data
    } catch (error) {
      console.error('Error saving attendance:', error);
      showMessage('error', `Failed to save ${prayer} attendance.`);
    } finally {
      setSaving(prev => ({ ...prev, [prayer]: false }));
    }
  };

  const viewUserHistory = async (user) => {
    try {
      setSelectedUser(user);
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const response = await prayerLogAPI.getUserPrayerLogs(user._id, { startDate, endDate });
      setUserHistory(response.data);
      setActiveTab('history');
    } catch (error) {
      console.error('Error fetching user history:', error);
      showMessage('error', 'Failed to load user history.');
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group history by date
  const groupedHistory = userHistory.reduce((acc, log) => {
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
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-islamic-cream mobile-page-container">
      {/* Desktop Header */}
      <header className="bg-islamic-green text-white py-4 px-6 shadow-lg hidden sm:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaMosque className="text-3xl text-islamic-gold" />
            <div>
              <h1 className="text-2xl font-bold">Solah Tracker</h1>
              <p className="text-xs text-islamic-gold">Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="px-4 py-2 border border-white/30 rounded-lg hover:bg-white/10 transition-all">
              My Dashboard
            </Link>
            <button onClick={logout} className="flex items-center gap-2 px-4 py-2 border border-white/30 rounded-lg hover:bg-white/10 transition-all">
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
          <span className="font-bold">Admin Panel</span>
        </div>
        <button onClick={logout} className="text-white/80"><FaSignOutAlt size={20} /></button>
      </div>

      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Date Selection - More Compact on Mobile */}
        <section className="bg-islamic-green text-white rounded-2xl shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <h3 className="font-bold text-sm tracking-wider uppercase flex items-center gap-2">
              <FaCalendarAlt className="text-islamic-gold" />
              {new Date(selectedDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
            </h3>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-gray-800 font-bold focus:ring-2 focus:ring-islamic-gold"
            />
          </div>
        </section>

        {/* Desktop Tabs */}
        <div className="hidden sm:flex gap-4 mb-6 border-b border-gray-200">
          {['attendance', 'users', 'history'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-4 font-bold capitalize ${
                activeTab === tab ? 'text-islamic-green border-b-2 border-islamic-green' : 'text-gray-500'
              }`}
            >
              Mark {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div className="space-y-3">
              {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer) => (
                <div key={prayer} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                  <button
                    onClick={() => setExpandedPrayer(expandedPrayer === prayer ? null : prayer)}
                    className={`w-full px-5 py-4 flex items-center justify-between transition-all ${
                      expandedPrayer === prayer ? 'bg-islamic-green text-white' : 'bg-white text-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-black text-lg">{prayer}</span>
                      <span className={expandedPrayer === prayer ? 'text-islamic-gold' : 'text-gray-400'}>
                        {todayLogs[prayer]?.length > 0 ? (
                          <span className="text-[10px] bg-islamic-gold/10 px-2 py-0.5 rounded border border-islamic-gold/30 uppercase font-black">Locked</span>
                        ) : prayerTimes?.[prayer]}
                      </span>
                    </div>
                    {expandedPrayer === prayer ? <FaChevronUp /> : <FaChevronDown />}
                  </button>

                  {expandedPrayer === prayer && (
                    <div className="p-4 bg-gray-50/50">
                      <div className="mb-4 flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Find user..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-islamic-green"
                          />
                        </div>
                        <button
                          onClick={() => savePrayerAttendance(prayer)}
                          disabled={saving[prayer] || todayLogs[prayer]?.length > 0}
                          className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {saving[prayer] ? <div className="spinner w-4 h-4 border-2" /> : <FaSave />}
                          {todayLogs[prayer]?.length > 0 ? 'Saved & Locked' : `Save ${prayer}`}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredUsers.map((user) => (
                          <div key={user._id} className={`p-4 rounded-xl border-2 transition-all ${
                            attendance[prayer]?.[user._id] ? 'border-green-500 bg-white' : 'border-gray-100 bg-white'
                          }`}>
                            <div className="flex items-center gap-3 mb-3">
                              {user.profileImage ? (
                                <img src={user.profileImage?.startsWith('data:') ? user.profileImage : `${BACKEND_URL}${user.profileImage}`} className="w-10 h-10 rounded-full object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-islamic-green flex items-center justify-center text-white"><FaUser size={14} /></div>
                              )}
                              <span className="font-bold text-sm truncate">{user.name}</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAttendanceChange(prayer, user._id, true)}
                                disabled={todayLogs[prayer]?.length > 0}
                                className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest ${
                                  attendance[prayer]?.[user._id] === true ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
                                }`}
                              >
                                Prayed
                              </button>
                              <button
                                onClick={() => handleAttendanceChange(prayer, user._id, false)}
                                disabled={todayLogs[prayer]?.length > 0}
                                className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest ${
                                  attendance[prayer]?.[user._id] === false ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'
                                }`}
                              >
                                Missed
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Users Tab - Card layout on mobile */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="relative mb-4">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search all users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map((user) => (
                  <div key={user._id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      {user.profileImage ? (
                        <img src={user.profileImage?.startsWith('data:') ? user.profileImage : `${BACKEND_URL}${user.profileImage}`} className="w-14 h-14 rounded-full object-cover border-2 border-islamic-green/20" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-islamic-cream flex items-center justify-center text-islamic-green"><FaUser size={20} /></div>
                      )}
                      <div className="min-w-0">
                        <p className="font-black text-gray-800 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 border-t pt-4">
                      <button onClick={() => viewUserHistory(user)} className="flex-1 py-2 bg-islamic-cream text-islamic-green rounded-lg font-bold text-xs uppercase">History</button>
                      <button onClick={() => handleDeleteUser(user._id, user.name)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><FaTrash /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User History Tab */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-h-[400px]">
              {selectedUser ? (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <FaHistory size={20} className="text-islamic-gold" />
                      <span className="font-bold truncate">{selectedUser.name}</span>
                    </div>
                    <button onClick={() => setSelectedUser(null)} className="text-xs font-bold text-red-400 uppercase">Close</button>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(groupedHistory).sort((a, b) => new Date(b[0]) - new Date(a[0])).map(([date, prayers]) => (
                      <div key={date} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <span className="text-xs font-bold">{date}</span>
                        <div className="flex gap-2">
                          {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map(p => (
                            <div key={p} className={`w-3 h-3 rounded-full ${prayers[p] === true ? 'bg-green-500' : prayers[p] === false ? 'bg-red-500' : 'bg-gray-200'}`} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                  <FaUsers size={40} className="opacity-20" />
                  <p className="font-bold text-center">Select a user from the "Users" tab<br />to view their prayer history.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Mobile Tab Bar */}
      <nav className="mobile-nav">
        <button onClick={() => setActiveTab('attendance')} className={`mobile-nav-item ${activeTab === 'attendance' ? 'active' : ''}`}>
          <FaCheck size={20} />
          <span className="text-[10px] mt-1 font-bold uppercase">Mark</span>
        </button>
        <button onClick={() => setActiveTab('users')} className={`mobile-nav-item ${activeTab === 'users' ? 'active' : ''}`}>
          <FaUsers size={20} />
          <span className="text-[10px] mt-1 font-bold uppercase">Users</span>
        </button>
        <button onClick={() => setActiveTab('history')} className={`mobile-nav-item ${activeTab === 'history' ? 'active' : ''}`}>
          <FaHistory size={20} />
          <span className="text-[10px] mt-1 font-bold uppercase">History</span>
        </button>
        <Link to="/dashboard" className="mobile-nav-item">
          <FaMosque size={20} />
          <span className="text-[10px] mt-1 font-bold uppercase">Home</span>
        </Link>
      </nav>
    </div>
  );
};

export default Admin;
