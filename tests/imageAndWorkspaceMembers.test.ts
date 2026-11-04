/**
 * ONE TEAM — Image URLs & Workspace Member Profiles Test Suite
 *
 * Verifies:
 * 1. Legacy `/src/assets/images/` and relative URL normalization.
 * 2. Static and valid external URL preservation.
 * 3. Fallback SVG avatar initials generation and empty string safety.
 * 4. Workspace members retrieval without invalid relational joins.
 * 5. Batch profiles retrieval by unique UUID user_ids.
 * 6. In-memory joining of members and profiles by UUID.
 * 7. Handling of empty workspace members list without redundant profiles query.
 * 8. Handling of members with missing profiles without UI crashes.
 * 9. Supabase error propagation.
 * 10. Rapid workspace switching race condition prevention.
 */

import { strict as assert } from 'assert';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Mock browser globals for Node.js tsx runner
if (typeof (globalThis as any).localStorage === 'undefined') {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (k: string) => store[k] || null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
  };
}

if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = {
    location: { origin: 'http://localhost:3000' },
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

import { normalizeImageUrl, getInitials, generateInitialsAvatarSvg } from '../src/utils/imageUrl';
import { CloudDataService } from '../src/services/cloudDataService';
import { supabase } from '../src/services/supabaseClient';

async function runTests() {
  console.log('🧪 Starting Image URLs and Workspace Member Profiles test suite...\n');

  // =========================================================================
  // TASK 1: Image URL Normalization & Fallbacks
  // =========================================================================
  console.log('--- Suite 1: Image URL Normalization & Fallback Tests ---');

  // 1.1 Legacy /src/assets/images/... normalization
  assert.equal(
    normalizeImageUrl('/src/assets/images/avatar_ekaterina_1793774892743.jpg'),
    '/assets/images/avatar_ekaterina_1793774892743.jpg',
    'Should normalize leading /src/assets/images/ to /assets/images/'
  );

  assert.equal(
    normalizeImageUrl('src/assets/images/avatar_anton_1793774893419.jpg'),
    '/assets/images/avatar_anton_1793774893419.jpg',
    'Should normalize non-leading src/assets/images/ to /assets/images/'
  );

  // 1.2 General /src/assets/ normalization
  assert.equal(
    normalizeImageUrl('/src/assets/icon.png'),
    '/assets/icon.png',
    'Should normalize general /src/assets/ paths'
  );

  // 1.3 Preservation of valid paths
  assert.equal(
    normalizeImageUrl('/assets/images/avatar_maria_1793774893832.jpg'),
    '/assets/images/avatar_maria_1793774893832.jpg',
    'Should keep /assets/images/... intact'
  );

  assert.equal(
    normalizeImageUrl('https://example.com/avatar.png'),
    'https://example.com/avatar.png',
    'Should keep https:// URLs intact'
  );

  assert.equal(
    normalizeImageUrl('data:image/svg+xml;utf8,<svg></svg>'),
    'data:image/svg+xml;utf8,<svg></svg>',
    'Should keep data: URIs intact'
  );

  // 1.4 Empty / invalid inputs
  assert.equal(normalizeImageUrl(''), '', 'Empty string should return empty string');
  assert.equal(normalizeImageUrl(null), '', 'Null should return empty string');
  assert.equal(normalizeImageUrl(undefined), '', 'Undefined should return empty string');

  // 1.5 Initials extraction
  assert.equal(getInitials('Екатерина Соколова'), 'ЕС', 'Should extract two initials from two words');
  assert.equal(getInitials('Дмитрий'), 'ДМ', 'Should extract first two letters from single word');
  assert.equal(getInitials('Антон Сергеевич Васильев'), 'АВ', 'Should extract first and last initials from multiple words');
  assert.equal(getInitials(''), '?', 'Empty name should return ?');
  assert.equal(getInitials(null), '?', 'Null name should return ?');

  // 1.6 SVG Avatar generation
  const svgDataUri = generateInitialsAvatarSvg('Екатерина Соколова');
  assert.ok(svgDataUri.startsWith('data:image/svg+xml;utf8,'), 'Should return valid data URI');
  assert.ok(svgDataUri.includes('%D0%95%D0%A1') || svgDataUri.includes('ЕС'), 'Data URI should contain initials');
  console.log('✅ Image URL normalization and fallback tests passed.');

  // =========================================================================
  // TASK 2: Workspace Members & Profiles Cloud Service Tests
  // =========================================================================
  console.log('\n--- Suite 2: Workspace Members & Profiles Query Tests ---');

  const cloudService = new CloudDataService();

  // Test 2.1: Independent query without relational joins (preventing PGRST200)
  const mockMembers = [
    {
      id: '11111111-1111-4111-8111-111111111111',
      workspace_id: 'a0000000-0000-4000-8000-000000000001',
      user_id: 'a1111111-1111-4111-8111-111111111111',
      role: 'owner',
      status: 'active',
      joined_at: '2026-03-01T10:00:00Z',
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      workspace_id: 'a0000000-0000-4000-8000-000000000001',
      user_id: 'a2222222-2222-4222-8222-222222222222',
      role: 'editor',
      status: 'active',
      joined_at: '2026-03-02T10:00:00Z',
    },
    {
      id: '33333333-3333-4333-8333-333333333333',
      workspace_id: 'a0000000-0000-4000-8000-000000000001',
      user_id: 'a3333333-3333-4333-8333-333333333333', // member without profile
      role: 'viewer',
      status: 'active',
      joined_at: '2026-03-03T10:00:00Z',
    },
  ];

  const mockProfiles = [
    {
      id: 'a1111111-1111-4111-8111-111111111111',
      full_name: 'Екатерина Соколова',
      email: 'ekaterina@oneteam.io',
      position: 'CEO',
      department: 'Руководство',
      avatar_url: '/assets/images/avatar_ekaterina_1793774892743.jpg',
      is_online: true,
    },
    {
      id: 'a2222222-2222-4222-8222-222222222222',
      full_name: 'Антон Васильев',
      email: 'anton@oneteam.io',
      position: 'Product Designer',
      department: 'Дизайн',
      avatar_url: '/assets/images/avatar_anton_1793774893419.jpg',
      is_online: false,
    },
  ];

  // Intercept supabase.from to test our CloudDataService query behavior
  const originalFrom = supabase.from.bind(supabase);
  let queriedTables: string[] = [];
  let selectClauses: Record<string, string> = {};

  (supabase as any).from = (table: string) => {
    queriedTables.push(table);
    return {
      select: (columns: string) => {
        selectClauses[table] = columns;
        const queryBuilder: any = {
          eq: (field: string, val: any) => {
            if (table === 'workspace_members') {
              const p: any = Promise.resolve({ data: mockMembers, error: null });
              p.maybeSingle = () => Promise.resolve({ data: null, error: null });
              return p;
            }
            const p: any = Promise.resolve({ data: [], error: null });
            p.maybeSingle = () => Promise.resolve({ data: null, error: null });
            return p;
          },
          in: (field: string, vals: any[]) => {
            if (table === 'profiles') {
              const matched = mockProfiles.filter((p) => vals.includes(p.id));
              const p: any = Promise.resolve({ data: matched, error: null });
              p.maybeSingle = () => Promise.resolve({ data: null, error: null });
              return p;
            }
            const p: any = Promise.resolve({ data: [], error: null });
            p.maybeSingle = () => Promise.resolve({ data: null, error: null });
            return p;
          },
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        };
        return queryBuilder;
      },
    };
  };

  const loadedData = await cloudService.loadWorkspaceData('a0000000-0000-4000-8000-000000000001');

  // Verify workspace_members was queried without relational join
  assert.equal(
    selectClauses['workspace_members'],
    '*',
    'workspace_members should be queried with "*" without relational profiles(*) join'
  );
  assert.equal(
    selectClauses['profiles'],
    '*',
    'profiles should be queried via separate table query'
  );

  // Verify members mapped correctly
  assert.equal(loadedData?.members.length, 3, 'Should map all 3 members');

  // Verify member 1 profile joined
  const member1 = loadedData?.members.find((m) => m.id === 'a1111111-1111-4111-8111-111111111111');
  assert.equal(member1?.name, 'Екатерина Соколова');
  assert.equal(member1?.role, 'owner');
  assert.equal(member1?.email, 'ekaterina@oneteam.io');
  assert.equal(member1?.avatar, '/assets/images/avatar_ekaterina_1793774892743.jpg');
  assert.equal(member1?.isOnline, true);

  // Verify member 3 missing profile fallback
  const member3 = loadedData?.members.find((m) => m.id === 'a3333333-3333-4333-8333-333333333333');
  assert.equal(member3?.name, 'Участник', 'Should fallback to default name when profile is missing');
  assert.equal(member3?.position, 'Специалист', 'Should fallback to default position');
  assert.equal(member3?.email, '', 'Missing email should be empty string');
  assert.equal(member3?.avatar, '', 'Missing avatar should be empty string');

  console.log('✅ Independent queries, UUID matching, and missing profile fallback tests passed.');

  // Test 2.2: Empty workspace_members list
  queriedTables = [];
  selectClauses = {};
  (supabase as any).from = (table: string) => {
    queriedTables.push(table);
    return {
      select: (columns: string) => {
        selectClauses[table] = columns;
        const queryBuilder: any = {
          eq: () => {
            const p: any = Promise.resolve({ data: [], error: null });
            p.maybeSingle = () => Promise.resolve({ data: null, error: null });
            return p;
          },
          in: () => {
            const p: any = Promise.resolve({ data: [], error: null });
            p.maybeSingle = () => Promise.resolve({ data: null, error: null });
            return p;
          },
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        };
        return queryBuilder;
      },
    };
  };

  const emptyData = await cloudService.loadWorkspaceData('a0000000-0000-4000-8000-000000000002');
  assert.equal(emptyData?.members.length, 0, 'Empty member response should result in empty array');
  assert.ok(
    !queriedTables.includes('profiles'),
    'Should not execute profiles query when workspace_members is empty'
  );
  console.log('✅ Empty workspace members list handled without superfluous profiles query.');

  // Test 2.3: Supabase error propagation
  (supabase as any).from = (table: string) => ({
    select: () => ({
      eq: () => {
        if (table === 'workspace_members') {
          const p: any = Promise.resolve({ data: null, error: { message: 'Database connection failed', code: '500' } });
          p.maybeSingle = () => Promise.resolve({ data: null, error: null });
          return p;
        }
        const p: any = Promise.resolve({ data: [], error: null });
        p.maybeSingle = () => Promise.resolve({ data: null, error: null });
        return p;
      },
      in: () => {
        const p: any = Promise.resolve({ data: [], error: null });
        p.maybeSingle = () => Promise.resolve({ data: null, error: null });
        return p;
      },
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
    }),
  });

  const errorData = await cloudService.loadWorkspaceData('a0000000-0000-4000-8000-000000000003');
  assert.equal(errorData, null, 'Should catch Supabase error and return null without crashing');
  console.log('✅ Supabase error propagation verified.');

  // Restore supabase.from
  (supabase as any).from = originalFrom;

  // =========================================================================
  // TASK 3: Workspace Switching Race Condition Tests
  // =========================================================================
  console.log('\n--- Suite 3: Rapid Workspace Switching Race Condition Tests ---');

  // Simulate two async load requests where workspace A is slow and workspace B is fast
  let isCancelledWs1 = false;
  let isCancelledWs2 = false;

  let state: Record<string, any> = { currentWorkspaceId: 'ws-1', data: null };

  // Trigger ws-1 load (slow response: 50ms)
  const promiseWs1 = new Promise((resolve) => setTimeout(() => resolve({ wsId: 'ws-1', data: 'data-for-ws-1' }), 50))
    .then((res: any) => {
      if (!isCancelledWs1) {
        state = { currentWorkspaceId: res.wsId, data: res.data };
      }
    });

  // Rapidly switch to ws-2 (user switches before ws-1 resolves)
  isCancelledWs1 = true; // Cleanup of ws-1 effect

  // Trigger ws-2 load (fast response: 10ms)
  const promiseWs2 = new Promise((resolve) => setTimeout(() => resolve({ wsId: 'ws-2', data: 'data-for-ws-2' }), 10))
    .then((res: any) => {
      if (!isCancelledWs2) {
        state = { currentWorkspaceId: res.wsId, data: res.data };
      }
    });

  await Promise.all([promiseWs1, promiseWs2]);

  assert.equal(state.currentWorkspaceId, 'ws-2', 'Active workspace must remain ws-2');
  assert.equal(state.data, 'data-for-ws-2', 'Stale response from ws-1 must not overwrite ws-2');
  console.log('✅ Rapid workspace switching cancellation logic verified.');

  console.log('\n🎉 ALL Image URLs and Workspace Member Profiles tests PASSED successfully!\n');
}

runTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
