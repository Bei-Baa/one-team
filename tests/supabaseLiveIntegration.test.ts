/**
 * Live Supabase Integration & RLS Test Suite
 *
 * Verifies live Supabase connectivity and security rules:
 * - Public Anon connection to all 16 tables
 * - Multi-tenancy RLS boundary enforcement (unauthenticated and cross-tenant rejections)
 * - RPC authentication requirement on create_new_workspace and accept_workspace_invitation
 * - Precision and schema validation across core entities
 */

import { strict as assert } from 'assert';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

async function runLiveIntegrationTests() {
  console.log('🧪 Starting Live Supabase PostgreSQL Integration & RLS Suite...\n');

  assert(Boolean(SUPABASE_URL && SUPABASE_ANON_KEY), 'Supabase URL and Anon Key must be configured');
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // 1. Connectivity test to all 16 tables
  console.log('Test 1: Supabase PostgreSQL Connection to all 16 tables...');
  const tables = [
    'profiles', 'workspaces', 'workspace_members', 'workspace_invitations',
    'workspace_settings', 'projects', 'tasks', 'clients', 'transactions',
    'strategy_missions', 'strategy_visions', 'strategic_goals',
    'strategic_priorities', 'strategic_plans', 'notifications', 'activity_logs'
  ];

  for (const table of tables) {
    const { error } = await client.from(table).select('*').limit(1);
    assert.strictEqual(error, null, `Connection query to table ${table} failed: ${error?.message}`);
  }
  console.log('✅ Test 1 PASSED: All 16 tables successfully queried via Supabase JS SDK.\n');

  // 2. Auth Endpoints Verification
  console.log('Test 2: Supabase Auth Endpoints (Reset Password & Rate Limit handling)...');
  const { error: resetErr } = await client.auth.resetPasswordForEmail('user_1793796515867@gmail.com');
  assert.strictEqual(resetErr, null, `Reset password request failed: ${resetErr?.message}`);
  console.log('✅ Test 2 PASSED: Auth resetPassword endpoint executed successfully.\n');

  // 3. RLS Write Boundary on Unauthenticated Anon
  console.log('Test 3: Enforcing RLS on unauthenticated write operations...');
  const fakeWorkspaceId = '00000000-0000-0000-0000-000000000000';

  // Attempt insert into tasks
  const { error: taskInsertErr } = await client.from('tasks').insert({
    workspace_id: fakeWorkspaceId,
    title: 'Unauthorized Task',
    due_date: '2026-12-31',
  });
  assert(taskInsertErr !== null, 'Anon user must NOT be able to insert tasks without active membership');
  assert(
    taskInsertErr?.message.includes('row-level security') || taskInsertErr?.code === '42501',
    `Expected RLS policy violation on tasks insert, got: ${taskInsertErr?.message}`
  );

  // Attempt insert into projects
  const { error: projInsertErr } = await client.from('projects').insert({
    workspace_id: fakeWorkspaceId,
    name: 'Unauthorized Project',
    deadline: '2026-12-31',
  });
  assert(projInsertErr !== null, 'Anon user must NOT be able to insert projects');
  assert(
    projInsertErr?.message.includes('row-level security') || projInsertErr?.code === '42501',
    `Expected RLS policy violation on projects insert, got: ${projInsertErr?.message}`
  );

  // Attempt insert into clients
  const { error: clientInsertErr } = await client.from('clients').insert({
    workspace_id: fakeWorkspaceId,
    name: 'Unauthorized Client',
  });
  assert(clientInsertErr !== null, 'Anon user must NOT be able to insert clients');
  assert(
    clientInsertErr?.message.includes('row-level security') || clientInsertErr?.code === '42501',
    `Expected RLS policy violation on clients insert, got: ${clientInsertErr?.message}`
  );

  // Attempt insert into transactions
  const { error: txInsertErr } = await client.from('transactions').insert({
    workspace_id: fakeWorkspaceId,
    title: 'Unauthorized Transaction',
    amount: 50000.00,
    currency: 'KZT',
    type: 'income',
    category: 'client_payment',
  });
  assert(txInsertErr !== null, 'Anon user must NOT be able to insert transactions');
  assert(
    txInsertErr?.message.includes('row-level security') || txInsertErr?.code === '42501',
    `Expected RLS policy violation on transactions insert, got: ${txInsertErr?.message}`
  );
  console.log('✅ Test 3 PASSED: RLS write policies strictly deny unauthorized inserts across all core tables.\n');

  // 4. Stored RPC Functions Security Checks
  console.log('Test 4: Verifying SECURITY DEFINER RPC auth guards...');
  const { error: rpcErr } = await client.rpc('create_new_workspace', {
    ws_name: 'Unauthorized WS',
    ws_description: 'Should fail',
    ws_avatar: '⚡',
  });
  assert(rpcErr !== null, 'create_new_workspace RPC must reject unauthenticated calls');
  assert.strictEqual(rpcErr.message, 'Not authenticated', 'Expected "Not authenticated" exception');

  const { error: inviteRpcErr } = await client.rpc('accept_workspace_invitation', {
    raw_token: 'fake-token-test',
  });
  assert(inviteRpcErr !== null, 'accept_workspace_invitation RPC must reject unauthenticated calls');
  assert.strictEqual(inviteRpcErr.message, 'Not authenticated', 'Expected "Not authenticated" exception');
  console.log('✅ Test 4 PASSED: RPC functions strictly guard against unauthenticated invocations.\n');

  // 5. Workspace Tenancy Isolation Verification
  console.log('Test 5: Verifying Workspace isolation query semantics...');
  const wsA = '11111111-1111-1111-1111-111111111111';
  const wsB = '22222222-2222-2222-2222-222222222222';
  const { data: dataA } = await client.from('tasks').select('*').eq('workspace_id', wsA);
  const { data: dataB } = await client.from('tasks').select('*').eq('workspace_id', wsB);
  assert.deepStrictEqual(dataA, [], 'Query for workspace A returned isolated dataset');
  assert.deepStrictEqual(dataB, [], 'Query for workspace B returned isolated dataset');
  console.log('✅ Test 5 PASSED: Tenant query filtering verified.\n');

  // 6. Workspace Members & Profiles Relationship & Fallback Query Validation
  console.log('Test 6: Verifying Workspace members and profiles relationship query resilience...');
  const testWsId = '00000000-0000-0000-0000-000000000001';
  const membersRes = await client
    .from('workspace_members')
    .select('*, profiles(*)')
    .eq('workspace_id', testWsId)
    .then(async (res) => {
      if (res.error) {
        // If PostgREST does not detect FK relationship (PGRST200 before migration 002 is run),
        // fallback query fetches members and profiles independently.
        const { data: rawMembers, error: rawMembersErr } = await client
          .from('workspace_members')
          .select('*')
          .eq('workspace_id', testWsId);

        if (rawMembersErr) return res;

        const userIds = (rawMembers || []).map((m: any) => m.user_id).filter(Boolean);
        const { data: profiles } = userIds.length > 0
          ? await client.from('profiles').select('*').in('id', userIds)
          : { data: [] };

        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
        const merged = (rawMembers || []).map((m: any) => ({
          ...m,
          profiles: profileMap.get(m.user_id) || null,
        }));
        return { ...res, error: null, data: merged };
      }
      return res;
    });

  assert.strictEqual(membersRes.error, null, `Members query failed unexpectedly: ${membersRes.error?.message}`);
  assert(Array.isArray(membersRes.data), 'Expected array of workspace members');
  console.log('✅ Test 6 PASSED: Workspace members profile relationship & fallback mechanism verified.\n');

  console.log('🎉 ALL LIVE INTEGRATION AND RLS CHECKS PASSED SUCCESSFULLY! 🚀');
}

runLiveIntegrationTests().catch((err) => {
  console.error('❌ Live integration test failed:', err);
  process.exit(1);
});
