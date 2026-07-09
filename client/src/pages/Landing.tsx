import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="mx-auto h-20 w-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-6">
            <span className="text-4xl">🏥</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Aayuniq Health Portal
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your comprehensive healthcare management platform. Access your medical records, 
            connect with healthcare providers, and manage your health journey.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Patient Login Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-gray-200 hover:bg-white/90 transition-all duration-300"
          >
            <div className="text-center">
              <div className="h-16 w-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">👤</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Patient Portal</h2>
              <p className="text-gray-600 mb-6">
                Access your medical records, view health reports, and manage your healthcare information.
              </p>
              <Link
                to="/login"
                className="inline-block bg-white text-primary-600 hover:bg-gray-100 font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg"
              >
                Patient Login
              </Link>
            </div>
          </motion.div>

          {/* Doctor Login Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-gray-200 hover:bg-white/90 transition-all duration-300"
          >
            <div className="text-center">
              <div className="h-16 w-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">👨‍⚕️</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Doctor Portal</h2>
              <p className="text-gray-600 mb-6">
                Manage patient records, view medical history, and provide comprehensive healthcare services.
              </p>
              <Link
                to="/doctor/login"
                className="inline-block bg-white text-secondary-600 hover:bg-gray-100 font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg"
              >
                Doctor Login
              </Link>
            </div>
          </motion.div>

          {/* Government Login Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-gray-200 hover:bg-white/90 transition-all duration-300"
          >
            <div className="text-center">
              <div className="h-16 w-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🏛️</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Government Portal</h2>
              <p className="text-gray-600 mb-6">
                Access public health analytics, disease surveillance, and health statistics for policy making.
              </p>
              <Link
                to="/government/login"
                className="inline-block bg-white text-purple-600 hover:bg-gray-100 font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg"
              >
                Government Login
              </Link>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-12"
        >
          <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center">
              <span className="mr-2">🔒</span>
              <span>Secure & Encrypted</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">📱</span>
              <span>OTP Verification</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">🏥</span>
              <span>HIPAA Compliant</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Landing;
