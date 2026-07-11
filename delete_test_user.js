const mongoose = require('mongoose');
const User = require('./models/user');
const db = require('./db'); // This connects to the DB

async function deleteTestUser() {
    try {
        const result = await User.deleteOne({ aadharCardNumber: 746430819302 });
        console.log("Deleted user:", result);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

// Wait for connection to open then delete
mongoose.connection.once('open', () => {
    deleteTestUser();
});
