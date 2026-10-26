import assert from 'assert';
import { authenticateUser, verifyToken, verifyAdminPinOverride, getAuthConfig } from '../server/authService.js';
import { createDailyBackup, listBackups, pruneOldBackups } from '../server/backupService.js';

console.log('==================================================');
console.log('M.K. ENTERPRISES - RBAC & Automated Backup Tests');
console.log('==================================================');

// 1. Admin Authentication Tests
console.log('\n--- 1. Testing Admin Authentication ---');
const config = getAuthConfig();
console.log(`Current Admin PIN configured: ${config.adminPin}`);

const adminSuccess = authenticateUser('ADMIN', config.adminPin);
assert.strictEqual(adminSuccess.success, true, 'Admin login with correct PIN should succeed');
assert.strictEqual(adminSuccess.user.role, 'ADMIN', 'User role must be ADMIN');
assert.ok(adminSuccess.token, 'Token must be returned');
console.log('✓ Admin login with correct PIN passed');

const adminFail = authenticateUser('ADMIN', 'wrongpin9999');
assert.strictEqual(adminFail.success, false, 'Admin login with incorrect PIN must fail');
console.log('✓ Admin login rejection with wrong PIN passed');

// 2. Staff Authentication Tests
console.log('\n--- 2. Testing Staff Authentication ---');
const staffSuccess = authenticateUser('STAFF', config.staffPin);
assert.strictEqual(staffSuccess.success, true, 'Staff login with correct PIN should succeed');
assert.strictEqual(staffSuccess.user.role, 'STAFF', 'User role must be STAFF');
console.log('✓ Staff login with correct PIN passed');

const staffFail = authenticateUser('STAFF', '9999');
assert.strictEqual(staffFail.success, false, 'Staff login with incorrect PIN must fail');
console.log('✓ Staff login rejection with wrong PIN passed');

// 3. Token Verification Tests
console.log('\n--- 3. Testing Signed Session Token Verification ---');
const verifiedAdmin = verifyToken(adminSuccess.token);
assert.ok(verifiedAdmin, 'Token verification must return payload');
assert.strictEqual(verifiedAdmin.role, 'ADMIN', 'Verified role must match ADMIN');
console.log('✓ Signed HMAC token successfully verified');

const tamperedToken = adminSuccess.token.slice(0, -5) + 'ABCDE';
const verifiedTampered = verifyToken(tamperedToken);
assert.strictEqual(verifiedTampered, null, 'Tampered token must be rejected');
console.log('✓ Tampered signature token rejected correctly');

// 4. Admin PIN Override Tests
console.log('\n--- 4. Testing Admin PIN Override ---');
const overrideValid = verifyAdminPinOverride(config.adminPin);
assert.strictEqual(overrideValid, true, 'Admin PIN override with valid PIN must return true');
const overrideInvalid = verifyAdminPinOverride('wrong0000');
assert.strictEqual(overrideInvalid, false, 'Admin PIN override with wrong PIN must return false');
console.log('✓ Admin PIN override verification passed');

// 5. Automated Backup Engine Tests
console.log('\n--- 5. Testing Automated Backup Engine ---');
const backupResult = await createDailyBackup(true);
assert.strictEqual(backupResult.success, true, 'Backup creation must succeed');
assert.ok(backupResult.fileName, 'Backup must return generated filename');
console.log(`✓ Backup creation passed: ${backupResult.fileName} (${backupResult.sizeFormatted})`);

const backups = listBackups();
assert.ok(Array.isArray(backups), 'listBackups must return an array');
assert.ok(backups.length >= 1, 'At least 1 backup must be listed');
console.log(`✓ Backups list retrieved: ${backups.length} total backup snapshots on disk`);

console.log('\n==================================================');
console.log('All 5 RBAC & Backup Integration Tests Passed 100%!');
console.log('==================================================');

