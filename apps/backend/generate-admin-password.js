const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * Script to generate a 128-character admin password and its bcrypt hash
 * 
 * Usage: node generate-admin-password.js
 */

async function generateAdminPassword() {
  try {
    // Generate a 128-character random password
    // Using 64 random bytes = 128 hex characters
    const password = crypto.randomBytes(64).toString('hex');

    console.log('='.repeat(60));
    console.log('Admin Password Generator');
    console.log('='.repeat(60));
    console.log('\n✅ Generated 128-character password:');
    console.log(password);
    console.log('\n⏳ Hashing password with bcrypt (10 rounds)...\n');

    // Hash the password with bcrypt (using 10 rounds)
    const hash = await bcrypt.hash(password, 10);

    console.log('='.repeat(60));
    console.log('Configuration');
    console.log('='.repeat(60));
    console.log('\nAdd this to your .env file:');
    console.log(`ADMIN_PASSWORD_HASH=${hash}`);
    console.log('\n' + '='.repeat(60));
    console.log('⚠️  IMPORTANT');
    console.log('='.repeat(60));
    console.log('\nSave the password above securely!');
    console.log('You will need it to access the admin dashboard at /admin');
    console.log('\nPassword:', password);
    console.log('\n' + '='.repeat(60));
  } catch (error) {
    console.error('❌ Error generating admin password:', error);
    process.exit(1);
  }
}

// Run the generator
generateAdminPassword();

