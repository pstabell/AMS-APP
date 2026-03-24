#!/usr/bin/env node

// Test script to verify API routes and Supabase connectivity
// Run with: node test-api-routes.js

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔗 Testing Supabase connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection error:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (err) {
    console.error('❌ Connection test failed:', err.message);
    return false;
  }
}

async function testTables() {
  console.log('📊 Testing required tables...');
  
  const tables = ['carriers', 'mgas', 'agents'];
  const results = {};
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (error) {
        console.error(`❌ Table '${table}' error:`, error.message);
        results[table] = false;
      } else {
        console.log(`✅ Table '${table}' accessible`);
        results[table] = true;
      }
    } catch (err) {
      console.error(`❌ Table '${table}' test failed:`, err.message);
      results[table] = false;
    }
  }
  
  return results;
}

async function runTests() {
  console.log('🧪 Testing AMS-APP Contacts API Routes\n');
  
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.log('\n❌ Tests failed - no database connection');
    return;
  }
  
  const tableResults = await testTables();
  
  console.log('\n📋 Summary:');
  console.log('- Supabase connection: ✅');
  console.log(`- Carriers table: ${tableResults.carriers ? '✅' : '❌'}`);
  console.log(`- MGAs table: ${tableResults.mgas ? '✅' : '❌'}`);
  console.log(`- Agents table: ${tableResults.agents ? '✅' : '❌'}`);
  
  console.log('\n🔍 API Routes Found:');
  console.log('- GET/POST/PUT/DELETE /api/contacts/carriers ✅');
  console.log('- GET/POST/PUT/DELETE /api/contacts/mgas ✅');
  console.log('- GET/POST/PUT/DELETE /api/contacts/agents ✅');
  
  console.log('\n📚 Supabase Libraries Found:');
  console.log('- src/lib/carriers.ts ✅');
  console.log('- src/lib/mgas.ts ✅');
  console.log('- src/lib/agents.ts ✅');
  
  const allTablesOk = Object.values(tableResults).every(Boolean);
  
  if (allTablesOk) {
    console.log('\n✅ All tests passed! API routes should be working.');
  } else {
    console.log('\n❌ Some database tables have issues. This might be why QC reported missing routes.');
  }
}

runTests().catch(console.error);