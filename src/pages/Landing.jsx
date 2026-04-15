import React from 'react';
import { Link } from 'react-router-dom';
import { FaMosque, FaPray, FaChartLine, FaUsers } from 'react-icons/fa';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-islamic-cream to-white">
      {/* Header */}
      <header className="bg-islamic-green text-white py-4 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaMosque className="text-3xl text-islamic-gold" />
            <h1 className="text-2xl font-bold">Solah Tracker</h1>
          </div>
          <div className="flex gap-4">
            <Link 
              to="/login" 
              className="px-6 py-2 border-2 border-islamic-gold text-islamic-gold rounded-lg font-medium hover:bg-islamic-gold hover:text-islamic-green transition-all duration-300"
            >
              Login
            </Link>
            <Link 
              to="/register" 
              className="px-6 py-2 bg-islamic-gold text-islamic-green rounded-lg font-medium hover:bg-islamic-gold-light transition-all duration-300"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <FaMosque className="text-8xl text-islamic-green mx-auto mb-6" />
          </div>
          <h2 className="text-5xl font-bold text-islamic-green-dark mb-6">
            Track Your Daily Prayers
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            A simple and elegant way to monitor your Salah (prayer) progress. 
            Stay consistent, build streaks, and strengthen your connection with Allah.
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
              to="/register" 
              className="px-8 py-4 bg-islamic-green text-white rounded-lg font-semibold text-lg hover:bg-islamic-green-dark transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Get Started
            </Link>
            <Link 
              to="/login" 
              className="px-8 py-4 border-2 border-islamic-green text-islamic-green rounded-lg font-semibold text-lg hover:bg-islamic-green hover:text-white transition-all duration-300"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-islamic-green-dark mb-16">
            Why Use Solah Tracker?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<FaPray className="text-4xl" />}
              title="Daily Prayer Tracking"
              description="Monitor all five daily prayers (Fajr, Dhuhr, Asr, Maghrib, Isha) with accurate prayer times for Osogbo, Nigeria."
            />
            <FeatureCard 
              icon={<FaChartLine className="text-4xl" />}
              title="Progress Statistics"
              description="View your prayer streaks, monthly completion rates, and historical data to stay motivated."
            />
            <FeatureCard 
              icon={<FaUsers className="text-4xl" />}
              title="Community Support"
              description="Admin-monitored attendance system ensures accurate tracking and accountability."
            />
          </div>
        </div>
      </section>

      {/* Prayer Times Preview */}
      <section className="py-20 px-6 bg-islamic-green text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-4">Daily Prayer Times</h3>
          <p className="text-islamic-gold mb-10">Osogbo, Nigeria</p>
          <div className="grid grid-cols-5 gap-4">
            {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer) => (
              <div 
                key={prayer}
                className="bg-white/10 backdrop-blur rounded-lg p-4 border border-islamic-gold/30"
              >
                <p className="font-semibold text-islamic-gold">{prayer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-islamic-green-dark text-white py-8 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FaMosque className="text-2xl text-islamic-gold" />
            <span className="text-xl font-bold">Solah Tracker</span>
          </div>
          <p className="text-gray-400">
            &copy; {new Date().getFullYear()} Solah Tracker. May Allah accept our prayers.
          </p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-islamic-cream rounded-xl p-8 text-center hover:shadow-xl transition-all duration-300">
    <div className="text-islamic-green mb-4 flex justify-center">{icon}</div>
    <h4 className="text-xl font-bold text-islamic-green-dark mb-3">{title}</h4>
    <p className="text-gray-600">{description}</p>
  </div>
);

export default Landing;
