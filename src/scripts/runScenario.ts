/**
 * Script Runner
 * 
 * This script runs the emergency scenario to demonstrate the full cycle:
 * - Create emergency
 * - Assign to user
 * - Complete
 * - Approve
 * - Update achievements
 */

import { runEmergencyScenario } from './emergencyScenario';

// Run the emergency scenario
console.log('🚀 Starting the emergency task scenario runner...');

runEmergencyScenario()
  .then(result => {
    if (result.success) {
      console.log('✅ Script executed successfully!');
      console.log(`Task ID: ${result.taskId}`);
    } else {
      console.error('❌ Script failed:', result.error);
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  }); 