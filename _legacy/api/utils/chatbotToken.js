const crypto = require('crypto');

// Function to generate a token with a specific format
const generateToken = function() {
    // Define the fixed part of the token
    const fixedPart = 'A1ED-';
    
    // Generate a random 8-character part
    const randomPart1 = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 8);
    const randomPart2 = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 8);
    
    // Construct the full token
    const token = `${fixedPart}${randomPart1}-${randomPart2}`;
    
    return token;
};


module.exports = { generateToken };
