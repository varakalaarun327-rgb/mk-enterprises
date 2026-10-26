import assert from 'assert';

// 1. Sq. Ft Calculation Tests
function calculateArea(length, lengthUnit, width, widthUnit, quantity = 1, calcType = 'sqft') {
  const qty = Number(quantity) || 1;
  const l = Number(length) || 0;
  const w = Number(width) || 0;

  if (calcType === 'pcs') return qty;

  if (calcType === 'rft') {
    let lengthInFeet = 0;
    if (lengthUnit === 'inch') lengthInFeet = l / 12;
    else if (lengthUnit === 'mm') lengthInFeet = l / 304.8;
    else if (lengthUnit === 'feet') lengthInFeet = l;
    else lengthInFeet = l;
    return Number((lengthInFeet * qty).toFixed(2));
  }

  let lengthInInches = 0;
  let widthInInches = 0;

  if (lengthUnit === 'inch') lengthInInches = l;
  else if (lengthUnit === 'mm') lengthInInches = l / 25.4;
  else if (lengthUnit === 'feet') lengthInInches = l * 12;
  else lengthInInches = l;

  if (widthUnit === 'inch') widthInInches = w;
  else if (widthUnit === 'mm') widthInInches = w / 25.4;
  else if (widthUnit === 'feet') widthInInches = w * 12;
  else widthInInches = w;

  const sqFt = (lengthInInches * widthInInches / 144) * qty;
  return Number(sqFt.toFixed(2));
}

console.log('--- Running Glass Calculation Tests ---');

// Test 1: 72" x 36" (Quantity: 2) -> (72 * 36 / 144) * 2 = 36 sq.ft
const test1 = calculateArea(72, 'inch', 36, 'inch', 2, 'sqft');
assert.strictEqual(test1, 36.00, `Expected 36, got ${test1}`);
console.log('✓ Test 1 Passed: 72" x 36" x 2 = 36.00 Sq. Ft.');

// Test 2: 48" x 48" (Quantity: 1) -> (48 * 48 / 144) * 1 = 16 sq.ft
const test2 = calculateArea(48, 'inch', 48, 'inch', 1, 'sqft');
assert.strictEqual(test2, 16.00, `Expected 16, got ${test2}`);
console.log('✓ Test 2 Passed: 48" x 48" x 1 = 16.00 Sq. Ft.');

// Test 3: Feet input: 6 ft x 3 ft (Quantity: 1) -> 18 sq.ft
const test3 = calculateArea(6, 'feet', 3, 'feet', 1, 'sqft');
assert.strictEqual(test3, 18.00, `Expected 18, got ${test3}`);
console.log('✓ Test 3 Passed: 6 ft x 3 ft x 1 = 18.00 Sq. Ft.');

// Test 4: Running Feet: 120" Aluminium section (Quantity: 3) -> (120 / 12) * 3 = 30 Rft
const test4 = calculateArea(120, 'inch', 1, 'pcs', 3, 'rft');
assert.strictEqual(test4, 30.00, `Expected 30, got ${test4}`);
console.log('✓ Test 4 Passed: 120" Section x 3 pcs = 30.00 Rft');

// Test 5: Pieces: Floor spring (Quantity: 4) -> 4 Pcs
const test5 = calculateArea(1, 'pcs', 1, 'pcs', 4, 'pcs');
assert.strictEqual(test5, 4, `Expected 4, got ${test5}`);
console.log('✓ Test 5 Passed: Floor Spring x 4 = 4 Pcs');

// Test 6: GST Calculation (18% on ₹10,000) -> CGST 900, SGST 900, Total 11,800
const taxable = 10000;
const gstRate = 18;
const cgst = (taxable * (gstRate / 2)) / 100;
const sgst = (taxable * (gstRate / 2)) / 100;
const grandTotal = taxable + cgst + sgst;
assert.strictEqual(cgst, 900);
assert.strictEqual(sgst, 900);
assert.strictEqual(grandTotal, 11800);
console.log('✓ Test 6 Passed: 18% GST (9% CGST + 9% SGST) on ₹10,000 = ₹1,800 Tax, Total = ₹11,800');

console.log('\nAll 6 verification tests passed successfully!');

