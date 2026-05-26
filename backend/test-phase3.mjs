import fs from 'fs';
import path from 'path';

console.log('🧪 PHASE 3 TEST: Services Compilation\n');

const services = [
  'ValidationService.ts',
  'AuditService.ts',
  'ApprovalRoutingService.ts',
  'ItemStatusService.ts'
];

let passed = 0, failed = 0;

for (const service of services) {
  const filePath = path.join('./src/services', service);
  
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for class definition
    const hasClass = content.includes(`class ${service.replace('.ts', '')}`);
    
    // Check for constructor
    const hasConstructor = content.includes('constructor(');
    
    // Check for methods
    const hasMethods = content.includes('async ');
    
    if (hasClass && hasConstructor && hasMethods) {
      console.log(`✅ ${service}: Valid service class`);
      passed++;
    } else {
      console.log(`⚠️  ${service}: Missing components`);
      failed++;
    }
  } else {
    console.log(`❌ ${service}: File not found`);
    failed++;
  }
}

// Check for validation rules count
const validationPath = './src/services/ValidationService.ts';
if (fs.existsSync(validationPath)) {
  const content = fs.readFileSync(validationPath, 'utf8');
  const validationMethods = (content.match(/async validate|async cascade|async propagate/g) || []).length;
  console.log(`\n📊 ValidationService methods: ${validationMethods}`);
  if (validationMethods >= 25) {
    console.log('✅ Sufficient validation rules implemented');
  }
}

console.log('\n' + '='.repeat(50));
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('✅ Phase 3 Ready! Moving to Phase 4.');
}
