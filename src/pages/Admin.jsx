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
  const { user, logout, isAdmin, isMarker, isViewer, canMark, canViewHistory, canManageUsers } = useAuth();
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
  const [allHistory, setAllHistory] = useState([]); // Store history for all users
  const [updatingRole, setUpdatingRole] = useState(null);
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

      // Auto-set tab based on privilege if current tab is restricted
      if (isViewer() && activeTab !== 'history') {
        setActiveTab('history');
      } else if (isMarker() && activeTab !== 'attendance') {
        setActiveTab('attendance');
      }
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
    // Check if this specific user already has a log for this prayer
    const hasExistingLog = todayLogs[prayer]?.some(log => log.userId._id === userId);
    if (hasExistingLog) return;

    setAttendance(prev => ({
      ...prev,
      [prayer]: {
        ...prev[prayer],
        [userId]: prayed
      }
    }));
  };

  const savePrayerAttendance = async (prayer) => {
    // Prevent future dates
    const today = new Date().toISOString().split('T')[0];
    if (selectedDate > today) {
      showMessage('error', 'Cannot mark attendance for future dates.');
      return;
    }

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

      showMessage('success', `Attendance updated for ${prayer}!`);
      fetchAdminData(); // Refresh data
    } catch (error) {
      console.error('Error saving attendance:', error);
      const errorMessage = error.response?.data?.message || `Failed to save ${prayer} attendance.`;
      showMessage('error', errorMessage);
    } finally {
      setSaving(prev => ({ ...prev, [prayer]: false }));
    }
  };

  const fetchAllHistory = async () => {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const response = await prayerLogAPI.getAllLogs({ startDate, endDate });
      setAllHistory(response.data);
    } catch (error) {
      console.error('Error fetching all history:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'history' && !selectedUser) {
      fetchAllHistory();
    }
  }, [activeTab, selectedUser]);

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
  const handleRoleUpdate = async (userId, newRole) => {
    try {
      setUpdatingRole(userId);
      await userAPI.updateUserRole(userId, newRole);
      showMessage('success', 'User role updated successfully');
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error('Error updating role:', error);
      showMessage('error', error.response?.data?.message || 'Failed to update role');
    } finally {
      setUpdatingRole(null);
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
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-gray-800 font-bold focus:ring-2 focus:ring-islamic-gold"
            />
          </div>
        </section>

        {/* Desktop Tabs */}
        <div className="hidden sm:flex gap-4 mb-6 border-b border-gray-200">
          {canMark() && (
            <button
              onClick={() => setActiveTab('attendance')}
              className={`pb-3 px-4 font-bold capitalize ${activeTab === 'attendance' ? 'text-islamic-green border-b-2 border-islamic-green' : 'text-gray-500'}`}
            >
              Mark Attendance
            </button>
          )}
          {isAdmin() && (
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-3 px-4 font-bold capitalize ${activeTab === 'users' ? 'text-islamic-green border-b-2 border-islamic-green' : 'text-gray-500'}`}
            >
              Manage Users
            </button>
          )}
          {canViewHistory() && (
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 px-4 font-bold capitalize ${activeTab === 'history' ? 'text-islamic-green border-b-2 border-islamic-green' : 'text-gray-500'}`}
            >
              History
            </button>
          )}
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
                        {prayerTimes?.[prayer]}
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
                        {canMark() && (
                          <button
                            onClick={() => savePrayerAttendance(prayer)}
                            disabled={saving[prayer]}
                            className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {saving[prayer] ? <div className="spinner w-4 h-4 border-2" /> : <FaSave />}
                            {`Save ${prayer}`}
                          </button>
                        )}
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
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-sm truncate">{user.name}</span>
                                {todayLogs[prayer]?.some(log => log.userId._id === user._id) && (
                                  <span className="text-[9px] text-islamic-green font-black uppercase tracking-tighter">Saved</span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAttendanceChange(prayer, user._id, true)}
                                disabled={todayLogs[prayer]?.some(log => log.userId._id === user._id)}
                                className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                                  attendance[prayer]?.[user._id] === true ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
                                } ${todayLogs[prayer]?.some(log => log.userId._id === user._id) ? 'opacity-60 cursor-not-allowed' : ''}`}
                              >
                                {attendance[prayer]?.[user._id] === true && todayLogs[prayer]?.some(log => log.userId._id === user._id) ? <FaCheck className="inline mr-1" /> : ''}
                                Prayed
                              </button>
                              <button
                                onClick={() => handleAttendanceChange(prayer, user._id, false)}
                                disabled={todayLogs[prayer]?.some(log => log.userId._id === user._id)}
                                className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                                  attendance[prayer]?.[user._id] === false ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'
                                } ${todayLogs[prayer]?.some(log => log.userId._id === user._id) ? 'opacity-60 cursor-not-allowed' : ''}`}
                              >
                                {attendance[prayer]?.[user._id] === false && todayLogs[prayer]?.some(log => log.userId._id === user._id) ? <FaTimes className="inline mr-1" /> : ''}
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
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            user.role === 'admin' ? 'bg-red-100 text-red-600' :
                            user.role === 'marker' ? 'bg-blue-100 text-blue-600' :
                            user.role === 'viewer' ? 'bg-purple-100 text-purple-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {user.role}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {isAdmin() && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Change Privilege</p>
                        <select 
                          value={user.role} 
                          onChange={(e) => handleRoleUpdate(user._id, e.target.value)}
                          disabled={updatingRole === user._id}
                          className="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold focus:ring-2 focus:ring-islamic-green appearance-none"
                        >
                          <option value="user">User (Standard)</option>
                          <option value="marker">Marker (Attendance Only)</option>
                          <option value="viewer">Viewer (History Only)</option>
                        </select>
                      </div>
                    )}

                    <div className="flex gap-2 border-t pt-4">
                      <button onClick={() => viewUserHistory(user)} className="flex-1 py-2 bg-islamic-cream text-islamic-green rounded-lg font-bold text-xs uppercase">History</button>
                      {isAdmin() && (
                        <button onClick={() => handleDeleteUser(user._id, user.name)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><FaTrash /></button>
                      )}
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
                    <button onClick={() => setSelectedUser(null)} className="text-xs font-bold text-red-400 uppercase">Back to List</button>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(groupedHistory).sort((a, b) => new Date(b[0]) - new Date(a[0])).map(([date, prayers]) => (
                      <div key={date} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-xs font-black">{date}</span>
                        <div className="flex gap-1.5">
                          {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map(p => (
                            <div key={p} className="flex flex-col items-center gap-1">
                              <div className={`w-3.5 h-3.5 rounded-full border ${prayers[p] === true ? 'bg-green-500 border-green-600' : prayers[p] === false ? 'bg-red-500 border-red-600' : 'bg-gray-200 border-gray-300'}`} />
                              <span className="text-[6px] font-bold text-gray-400 uppercase">{p[0]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                      <FaHistory className="text-islamic-gold" />
                      Attendance History
                    </h3>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Last 7 Days</div>
                  </div>

                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users to view history..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {filteredUsers.map((user) => {
                      // Filter logs for this user from allHistory
                      const userLogs = allHistory.filter(log => log.userId && log.userId._id === user._id);
                      const dailySummary = userLogs.reduce((acc, log) => {
                        if (!acc[log.date]) acc[log.date] = { count: 0, total: 5 };
                        if (log.prayed) acc[log.date].count += 1;
                        return acc;
                      }, {});

                      // Get last 7 days including today
                      const last7Days = [];
                      for (let i = 0; i < 7; i++) {
                        const d = new Date();
                        d.setDate(d.getDate() - i);
                        last7Days.push(d.toISOString().split('T')[0]);
                      }

                      return (
                        <div 
                          key={user._id} 
                          onClick={() => viewUserHistory(user)}
                          className="p-4 bg-white border border-gray-100 rounded-2xl hover:border-islamic-green hover:shadow-md transition-all cursor-pointer group"
                        >
                          <div className="flex items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-3">
                              {user.profileImage ? (
                                <img src={user.profileImage?.startsWith('data:') ? user.profileImage : `${BACKEND_URL}${user.profileImage}`} className="w-10 h-10 rounded-full object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-islamic-cream flex items-center justify-center text-islamic-green font-bold text-sm">
                                  {user.name.charAt(0)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-bold text-gray-800 group-hover:text-islamic-green transition-colors">{user.name}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Tap to see full history</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {last7Days.reverse().map(date => (
                                <div 
                                  key={date} 
                                  className={`w-4 h-4 rounded-sm flex items-center justify-center text-[7px] font-black text-white ${
                                    dailySummary[date]?.count >= 4 ? 'bg-green-500' : 
                                    dailySummary[date]?.count >= 1 ? 'bg-yellow-500' :
                                    dailySummary[date] ? 'bg-red-500' : 'bg-gray-100'
                                  }`}
                                  title={`${date}: ${dailySummary[date]?.count || 0}/5 prayers`}
                                >
                                  {dailySummary[date]?.count || ''}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[9px] font-bold text-gray-400 border-t pt-2">
                            <span>TOTAL MARKED: {userLogs.length}</span>
                            <span>PRAYED: {userLogs.filter(l => l.prayed).length}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Mobile Tab Bar */}
      <nav className="mobile-nav">
        {canMark() && (
          <button onClick={() => setActiveTab('attendance')} className={`mobile-nav-item ${activeTab === 'attendance' ? 'active' : ''}`}>
            <FaCheck size={20} />
            <span className="text-[10px] mt-1 font-bold uppercase">Mark</span>
          </button>
        )}
        {isAdmin() && (
          <button onClick={() => setActiveTab('users')} className={`mobile-nav-item ${activeTab === 'users' ? 'active' : ''}`}>
            <FaUsers size={20} />
            <span className="text-[10px] mt-1 font-bold uppercase">Users</span>
          </button>
        )}
        {canViewHistory() && (
          <button onClick={() => setActiveTab('history')} className={`mobile-nav-item ${activeTab === 'history' ? 'active' : ''}`}>
            <FaHistory size={20} />
            <span className="text-[10px] mt-1 font-bold uppercase">History</span>
          </button>
        )}
      </nav>
    </div>
  );
};

export default Admin;
