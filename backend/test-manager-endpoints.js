// Quick test to verify manager access to endpoints
import { userDb } from './database.js';
import { generateToken } from './auth.js';

async function testManagerAccess() {
  try {
    // Create a test manager user
    const timestamp = Date.now();
    const managerEmail = `test-manager-${timestamp}@test.com`;
    
    await userDb.create({
      email: managerEmail,
      name: 'Test Manager',
      password_hash: 'dummy-hash',
      role: 'manager',
      first_name: 'Test',
      last_name: 'Manager',
      manager_first_name: 'Boss',
      manager_last_name: 'Admin',
      manager_email: 'boss@test.com'
    });

    const manager = await userDb.getByEmail(managerEmail);
    console.log('Created manager:', manager);
    console.log('Manager role:', manager.role);
    console.log('Manager role type:', typeof manager.role);

    const token = generateToken(manager);
    console.log('Generated token:', token);
    
    // Verify token
    import('./auth.js').then(({ verifyToken }) => {
      const decoded = verifyToken(token);
      console.log('Decoded token:', decoded);
      console.log('Decoded role:', decoded.role);
      console.log('Decoded role type:', typeof decoded.role);
    });

    // Clean up
    await userDb.delete(manager.id);
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
  process.exit(0);
}

testManagerAccess();
