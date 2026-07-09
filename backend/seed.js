const mongoose = require('mongoose');
require('dotenv').config();
const { seedData } = require('./utils/seedData');
const { seedGovernmentData } = require('./utils/governmentSeedData');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/xyz-health-portal', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
  return seedData();
})
.then(() => {
  return seedGovernmentData();
})
.then(() => {
  console.log('Seeding completed');
  process.exit(0);
})
.catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
