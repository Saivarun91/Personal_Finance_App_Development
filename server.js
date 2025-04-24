const express = require('express');
const cors = require('cors');
require('dotenv').config();
const sequelize = require('./config/database.js');
const userRoutes = require('./routes/userRoutes.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/api/users', userRoutes);

// Root route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Database sync and server start
sequelize.sync({ force: false })
    .then(() => {
        console.log('Database synced successfully');
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Open http://localhost:${PORT} in your browser to view the application`);
        });
    })
    .catch(err => {
        console.error('Error syncing database:', err);
    });