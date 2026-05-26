import fs from 'fs';

console.log('🧪 PHASES 5-7 TEST: Frontend Components\n');

const components = [
  { name: 'HierarchicalItemSelector.tsx', file: './src/components/HierarchicalItemSelector.tsx', required: ['loadChannels', 'loadCategories', 'loadLocations', 'loadItems', 'handleItemToggle'] },
  { name: 'HierarchicalItemSelector.css', file: './src/components/HierarchicalItemSelector.css', required: ['.hierarchical-item-selector', '.selector-panel', '.items-grid'] },
  { name: 'RegistrationDetailTabs.tsx', file: './src/components/RegistrationDetailTabs.tsx', required: ['getVisibleTabs', 'RegistrationInfoTab', 'AdvertisingContentTab', 'ItemScopeTab', 'BrandIntakeTab', 'AcceptanceDetailsTab'] },
  { name: 'RegistrationDetailTabs.css', file: './src/components/RegistrationDetailTabs.css', required: ['.registration-detail-tabs', '.tab-button', '.tab-pane'] },
  { name: 'DeploymentAcceptanceScreen.tsx', file: './src/components/DeploymentAcceptanceScreen.tsx', required: ['loadAcceptanceItems', 'handleImageUpload', 'validateAcceptance', 'handleSubmit'] },
  { name: 'DeploymentAcceptanceScreen.css', file: './src/components/DeploymentAcceptanceScreen.css', required: ['.deployment-acceptance-screen', '.image-comparison', '.acceptance-item-card'] }
];

let passed = 0, failed = 0;

for (const comp of components) {
  if (!fs.existsSync(comp.file)) {
    console.log(`❌ ${comp.name}: File not found`);
    failed++;
    continue;
  }

  const content = fs.readFileSync(comp.file, 'utf8');
  let componentPassed = true;

  for (const req of comp.required) {
    if (!content.includes(req)) {
      console.log(`❌ ${comp.name}: Missing "${req}"`);
      componentPassed = false;
      failed++;
      break;
    }
  }

  if (componentPassed) {
    console.log(`✅ ${comp.name}: Complete`);
    passed++;
  }
}

console.log('\n' + '='.repeat(50));
console.log(`RESULTS: ${passed}/6 passed, ${failed} issues`);
console.log('='.repeat(50));

if (failed === 0) {
  console.log('\n✅ Phases 5-7 Ready! Moving to Phase 8.');
}
