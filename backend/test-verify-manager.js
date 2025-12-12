import { assetDb, userDb, companyDb } from './database.js';

async function test() {
  try {
    await assetDb.init();
    
    const timestamp = Date.now();
    const companyResult = await companyDb.create({
      name: `Test Company ${timestamp}`,
      description: 'Test company'
    });
    
    const emp = await userDb.create({
      email: `emp-${timestamp}@test.com`,
      password_hash: 'hash',
      name: 'Employee One',
      role: 'employee',
      first_name: 'Employee',
      last_name: 'One'
    });
    
    const mgr = await userDb.create({
      email: `mgr-${timestamp}@test.com`,
      password_hash: 'hash',
      name: 'Manager Test',
      role: 'manager',
      first_name: 'Manager',
      last_name: 'Test'
    });
    
    const company = await companyDb.getById(companyResult.id);
    
    const asset = await assetDb.create({
      employee_first_name: 'Employee',
      employee_last_name: 'One',
      employee_email: `emp-${timestamp}@test.com`,
      company_name: company.name,
      asset_type: 'laptop',
      serial_number: `SN-${timestamp}`,
      asset_tag: `TAG-${timestamp}`,
      status: 'active'
    });
    
    const employee = await userDb.getByEmail(`emp-${timestamp}@test.com`);
    const manager = await userDb.getByEmail(`mgr-${timestamp}@test.com`);
    
    const managerAssets = await assetDb.getScopedForUser(manager);
    const hasAsset = managerAssets.find(a => a.id === asset.id);
    
    console.log(`Manager sees ${managerAssets.length} assets`);
    console.log(`Manager sees employee asset: ${!!hasAsset}`);
    
    await assetDb.delete(asset.id);
    await userDb.delete(employee.id);
    await userDb.delete(manager.id);
    await companyDb.delete(company.id);
    
    if (hasAsset) {
      console.log('✅ SUCCESS: Manager can see all employee assets');
    } else {
      console.log('❌ FAILURE: Manager cannot see employee assets');
      process.exit(1);
    }
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

test();
