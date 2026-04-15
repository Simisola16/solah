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
    <div className="min-h-screen bg-islamic-cream">
      {/* Header */}
      <header className="bg-islamic-green text-white py-4 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaMosque className="text-3xl text-islamic-gold" />
            <div>
              <h1 className="text-2xl font-bold">Solah Tracker</h1>
              <p className="text-xs text-islamic-gold">Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to="/dashboard" 
              className="px-4 py-2 border border-white/30 rounded-lg hover:bg-white/10 transition-all"
            >
              My Dashboard
            </Link>
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
        {/* Admin Info */}
        <section className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-islamic-green flex items-center justify-center">
              <FaUser className="text-2xl text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-islamic-green-dark">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
              <span className="inline-block mt-1 px-3 py-1 bg-islamic-gold text-islamic-green text-xs font-semibold rounded-full">
                Administrator
              </span>
            </div>
          </div>
        </section>

        {/* Prayer Times */}
        {prayerTimes && (
          <section className="bg-islamic-green text-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FaClock className="text-islamic-gold" />
                Prayer Times for {selectedDate}
              </h3>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 rounded-lg text-gray-800"
              />
            </div>
            <div className="grid grid-cols-5 gap-4">
              {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer) => (
                <div 
                  key={prayer}
                  className="bg-white/10 backdrop-blur rounded-lg p-4 text-center border border-islamic-gold/30"
                >
                  <p className="text-sm text-islamic-gold mb-1">{prayer}</p>
                  <p className="text-xl font-bold">{prayerTimes[prayer]}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Message */}
        {message.text && (
          <div className={`mb-6 px-4 py-3 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' :
            'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`pb-3 px-4 font-medium transition-all flex items-center gap-2 ${
              activeTab === 'attendance' 
                ? 'text-islamic-green border-b-2 border-islamic-green' 
                : 'text-gray-600 hover:text-islamic-green'
            }`}
          >
            <FaUsers />
            Mark Attendance
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-4 font-medium transition-all flex items-center gap-2 ${
              activeTab === 'users' 
                ? 'text-islamic-green border-b-2 border-islamic-green' 
                : 'text-gray-600 hover:text-islamic-green'
            }`}
          >
            <FaUser />
            All Users
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-4 font-medium transition-all flex items-center gap-2 ${
              activeTab === 'history' 
                ? 'text-islamic-green border-b-2 border-islamic-green' 
                : 'text-gray-600 hover:text-islamic-green'
            }`}
          >
            <FaHistory />
            User History
          </button>
        </div>

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <section className="animate-fade-in">
            <div className="space-y-4">
              {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer) => (
                <div key={prayer} className="bg-white rounded-xl shadow-md overflow-hidden">
                  <button
                    onClick={() => setExpandedPrayer(expandedPrayer === prayer ? null : prayer)}
                    className="w-full px-6 py-4 flex items-center justify-between bg-islamic-green text-white hover:bg-islamic-green-dark transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-semibold">{prayer}</span>
                      <span className="text-islamic-gold">({prayerTimes?.[prayer] || '--:--'})</span>
                      {todayLogs[prayer]?.length > 0 && (
                        <span className="px-2 py-0.5 bg-islamic-gold/20 border border-islamic-gold/50 text-islamic-gold text-[10px] uppercase font-bold rounded">
                          Locked
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm">
                        {Object.values(attendance[prayer] || {}).filter(v => v).length} / {users.length} prayed
                      </span>
                      {expandedPrayer === prayer ? <FaChevronUp /> : <FaChevronDown />}
                    </div>
                  </button>

                  {expandedPrayer === prayer && (
                    <div className="p-6 animate-fade-in">
                      <div className="mb-4 flex items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-islamic-green"
                          />
                        </div>
                        <button
                          onClick={() => savePrayerAttendance(prayer)}
                          disabled={saving[prayer] || todayLogs[prayer]?.length > 0}
                          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {saving[prayer] ? (
                            <>
                              <div className="spinner w-4 h-4 border-2"></div>
                              Saving...
                            </>
                          ) : todayLogs[prayer]?.length > 0 ? (
                            <>
                              <FaCheck />
                              Attendance Saved
                            </>
                          ) : (
                            <>
                              <FaSave />
                              Save {prayer} Attendance
                            </>
                          )}
                        </button>
                      </div>

                      {todayLogs[prayer]?.length > 0 && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg flex items-center gap-2">
                          <FaClock />
                          Attendance for {prayer} has been finalized and cannot be modified.
                        </div>
                      )}

                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                        {filteredUsers.map((user) => (
                          <div 
                            key={user._id}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              attendance[prayer]?.[user._id] 
                                ? 'border-green-400 bg-green-50' 
                                : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {user.profileImage ? (
                                <img 
                                  src={`${BACKEND_URL}${user.profileImage}`} 
                                  alt={user.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-islamic-green flex items-center justify-center">
                                  <FaUser className="text-white" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-800 truncate">{user.name}</p>
                                <p className="text-sm text-gray-500 truncate">{user.email}</p>
                              </div>
                            </div>
                            <div className="mt-3 flex gap-2">
                              <button
                                onClick={() => handleAttendanceChange(prayer, user._id, true)}
                                disabled={todayLogs[prayer]?.length > 0}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                                  attendance[prayer]?.[user._id] === true
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-600 hover:bg-green-100'
                                } ${todayLogs[prayer]?.length > 0 ? 'cursor-not-allowed opacity-80' : ''}`}
                              >
                                <FaCheck className="inline mr-1" /> Prayed
                              </button>
                              <button
                                onClick={() => handleAttendanceChange(prayer, user._id, false)}
                                disabled={todayLogs[prayer]?.length > 0}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                                  attendance[prayer]?.[user._id] === false
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-200 text-gray-600 hover:bg-red-100'
                                } ${todayLogs[prayer]?.length > 0 ? 'cursor-not-allowed opacity-80' : ''}`}
                              >
                                <FaTimes className="inline mr-1" /> Missed
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
          </section>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <section className="bg-white rounded-2xl shadow-lg p-6 animate-fade-in">
            <div className="mb-6">
              <div className="relative max-w-md">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-islamic-green"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Joined</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {user.profileImage ? (
                            <img 
                              src={`${BACKEND_URL}${user.profileImage}`} 
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-islamic-green flex items-center justify-center">
                              <FaUser className="text-white" />
                            </div>
                          )}
                          <span className="font-medium text-gray-800">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-600">{user.email}</td>
                      <td className="py-4 px-4 text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-4">
                          <button
                            onClick={() => viewUserHistory(user)}
                            className="text-islamic-green hover:underline font-medium"
                          >
                            View History
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id, user.name)}
                            disabled={deleting === user._id}
                            className={`p-2 rounded-lg transition-all ${
                              deleting === user._id 
                                ? 'bg-gray-100 text-gray-400' 
                                : 'text-red-500 hover:bg-red-50'
                            }`}
                            title="Delete User"
                          >
                            {deleting === user._id ? (
                              <div className="spinner w-4 h-4 border-2"></div>
                            ) : (
                              <FaTrash />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <p className="text-center text-gray-500 py-8">No users found.</p>
              )}
            </div>
          </section>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <section className="bg-white rounded-2xl shadow-lg p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-islamic-green-dark flex items-center gap-2">
                <FaHistory className="text-islamic-gold" />
                {selectedUser ? `Prayer History - ${selectedUser.name}` : 'Select a user to view history'}
              </h3>
              {selectedUser && (
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-600 hover:text-islamic-green"
                >
                  Clear Selection
                </button>
              )}
            </div>

            {selectedUser ? (
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
                                  <FaCheck className="text-green-500 mx-auto" />
                                ) : prayers[prayer] === false ? (
                                  <FaTimes className="text-red-500 mx-auto" />
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
                  <p className="text-center text-gray-500 py-8">No prayer history available for this user.</p>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FaUser className="text-4xl mx-auto mb-4 text-gray-300" />
                <p>Select a user from the "All Users" tab to view their prayer history.</p>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default Admin;
