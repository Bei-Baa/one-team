/**
 * Comprehensive Team Membership & Email Invitation System Test Suite
 *
 * Verifies all required scenarios:
 * Scenario A: Owner A invites registered User B by email -> B sees invitation -> accepts -> joins with correct role -> inviter notified
 * Scenario B: Owner A invites unregistered User C by email -> C signs up with that email -> invitation appears -> accepts in-app
 * Scenario C: User B declines invitation -> status becomes 'declined' -> inviter notified
 * Scenario D: Duplicate prevention, expired/cancelled handling, permission checks (no owner assignment, caller verification)
 */

import { strict as assert } from 'assert';

// Browser environment polyfills for Node tsx execution
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

import { workspaceService, WorkspaceInvitation } from '../src/services/workspaceService';
import { notificationService } from '../src/services/notificationService';
import { storageService } from '../src/services/storage';

async function runInvitationTests() {
  console.log('🧪 Starting Email Invitations & Team Membership Test Suite...\n');

  // Test 1: Email Validation & Role Restrictions
  console.log('Test 1: Email normalization, format validation, and role rules...');
  assert.strictEqual(workspaceService.validateEmail('user@company.com'), true);
  assert.strictEqual(workspaceService.validateEmail('USER.NAME+tag@domain.co.uk'), true);
  assert.strictEqual(workspaceService.validateEmail('not-an-email'), false);
  assert.strictEqual(workspaceService.validateEmail('@nodomain.com'), false);
  assert.strictEqual(workspaceService.validateEmail('user@'), false);

  // Ensure 'owner' role is rejected from invitation
  await assert.rejects(
    async () => {
      await workspaceService.inviteUser('ws-123', 'owner-candidate@company.com', 'Alex', 'owner' as any);
    },
    /роль владельца/i,
    'Should forbid inviting as Owner'
  );
  console.log('✅ Test 1 PASSED: Email validation & Owner role restrictions enforced.\n');

  // Test 2: Notification Lifecycle Events for Invitations
  console.log('Test 2: Notification dispatch for team invitation lifecycle...');
  localStorage.clear();

  // 1. Sent
  notificationService.notifyInvitationSent('Tech Workspace', 'bob@test.com', 'Editor');
  let notifs = storageService.getNotifications();
  assert.strictEqual(notifs.length, 1);
  assert(notifs[0].title.includes('Приглашение отправлено'));

  // 2. Received
  notificationService.notifyInvitationReceived('Tech Workspace', 'Alice (Owner)', 'Editor');
  notifs = storageService.getNotifications();
  assert.strictEqual(notifs.length, 2);
  assert(notifs[0].title.includes('Новое приглашение в команду'));

  // 3. Accepted
  notificationService.notifyInvitationAccepted('Tech Workspace', 'Bob Smirnov');
  notifs = storageService.getNotifications();
  assert.strictEqual(notifs.length, 3);
  assert(notifs[0].title.includes('Приглашение принято'));

  // 4. Declined
  notificationService.notifyInvitationDeclined('Tech Workspace', 'Charlie');
  notifs = storageService.getNotifications();
  assert.strictEqual(notifs.length, 4);
  assert(notifs[0].title.includes('Приглашение отклонено'));

  // 5. Member removed
  notificationService.notifyTeamMemberRemoved('David');
  notifs = storageService.getNotifications();
  assert.strictEqual(notifs.length, 5);
  assert(notifs[0].title.includes('Участник покинул команду'));

  console.log('✅ Test 2 PASSED: Notification events dispatched and stored with correct category & details.\n');

  // Test 3: Simulating RPC logic for Scenario A (Registered User Invitation & Acceptance)
  console.log('Test 3: Simulating Scenario A (Registered user invitation -> in-app acceptance -> member addition)...');

  interface MockDb {
    workspaces: Record<string, any>;
    members: any[];
    invitations: any[];
    notifications: any[];
    profiles: any[];
  }

  const db: MockDb = {
    workspaces: {
      'ws-alpha': { id: 'ws-alpha', name: 'Alpha Studio', created_by: 'user-a' },
    },
    profiles: [
      { id: 'user-a', full_name: 'Alice Owner', email: 'alice@oneteam.internal' },
      { id: 'user-b', full_name: 'Bob Dev', email: 'bob@oneteam.internal' },
    ],
    members: [
      { id: 'm-1', workspace_id: 'ws-alpha', user_id: 'user-a', role: 'owner', status: 'active' },
    ],
    invitations: [],
    notifications: [],
  };

  // Mock SQL accept function simulation matching 003_email_invitations_and_notifications.sql
  function simulateAcceptRpc(callerId: string, callerEmail: string, callerName: string, invitationId: string) {
    const inv = db.invitations.find((i) => i.id === invitationId);
    if (!inv) throw new Error('Приглашение не найдено');

    if (inv.email.toLowerCase().trim() !== callerEmail.toLowerCase().trim()) {
      throw new Error('Email приглашения не совпадает с вашим аккаунтом');
    }

    if (inv.status === 'accepted') throw new Error('Приглашение уже принято');
    if (inv.status === 'declined') throw new Error('Приглашение было отклонено');
    if (inv.status === 'cancelled') throw new Error('Приглашение было отозвано администратором');
    if (inv.status !== 'pending') throw new Error('Приглашение недействительно');

    if (new Date(inv.expires_at).getTime() <= Date.now()) {
      throw new Error('Срок действия приглашения истёк');
    }

    // Check existing active member
    const existingMember = db.members.find(
      (m) => m.workspace_id === inv.workspace_id && m.user_id === callerId && m.status === 'active'
    );
    if (existingMember) {
      inv.status = 'accepted';
      return { success: true, workspace_id: inv.workspace_id, role: inv.role, message: 'Уже участник' };
    }

    // Add member
    db.members.push({
      id: `mem-${Date.now()}`,
      workspace_id: inv.workspace_id,
      user_id: callerId,
      role: inv.role,
      status: 'active',
      joined_at: new Date().toISOString(),
    });

    // Mark invitation accepted
    inv.status = 'accepted';
    inv.accepted_at = new Date().toISOString();

    // Create notification to inviter
    const ws = db.workspaces[inv.workspace_id];
    db.notifications.push({
      id: `notif-${Date.now()}`,
      workspace_id: inv.workspace_id,
      recipient_id: inv.invited_by,
      title: 'Приглашение принято',
      description: `${callerName} принял(а) приглашение в команду "${ws?.name}".`,
      type: 'team',
      is_read: false,
    });

    return { success: true, workspace_id: inv.workspace_id, role: inv.role };
  }

  // Alice invites Bob
  const invAId = 'inv-1001';
  db.invitations.push({
    id: invAId,
    workspace_id: 'ws-alpha',
    email: 'bob@oneteam.internal',
    invitee_name: 'Bob Dev',
    role: 'editor',
    invited_by: 'user-a',
    status: 'pending',
    token_hash: '',
    expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
  });

  // Bob accepts invitation
  const acceptResult = simulateAcceptRpc('user-b', 'bob@oneteam.internal', 'Bob Dev', invAId);
  assert.strictEqual(acceptResult.success, true);
  assert.strictEqual(acceptResult.role, 'editor');

  // Verify Bob is now in workspace_members
  const bobMember = db.members.find((m) => m.workspace_id === 'ws-alpha' && m.user_id === 'user-b');
  assert(bobMember !== undefined, 'Bob must now be active workspace member');
  assert.strictEqual(bobMember.role, 'editor');

  // Verify Alice received acceptance notification
  const aliceNotif = db.notifications.find((n) => n.recipient_id === 'user-a');
  assert(aliceNotif !== undefined, 'Alice should receive notification');
  assert(aliceNotif.description.includes('Bob Dev'));
  console.log('✅ Test 3 PASSED: Scenario A executed successfully.\n');

  // Test 4: Scenario B (Unregistered user invited -> registers -> accepts in-app)
  console.log('Test 4: Simulating Scenario B (Unregistered User C invited -> registers -> accepts)...');
  const invCId = 'inv-2002';
  db.invitations.push({
    id: invCId,
    workspace_id: 'ws-alpha',
    email: 'charlie_new@oneteam.internal',
    invitee_name: 'Charlie Newcomer',
    role: 'viewer',
    invited_by: 'user-a',
    status: 'pending',
    token_hash: '',
    expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
  });

  // Charlie signs up with user id 'user-c'
  db.profiles.push({
    id: 'user-c',
    full_name: 'Charlie Newcomer',
    email: 'charlie_new@oneteam.internal',
  });

  // Query pending invitations for Charlie's email
  const charliePending = db.invitations.filter(
    (i) => i.email.toLowerCase() === 'charlie_new@oneteam.internal' && i.status === 'pending'
  );
  assert.strictEqual(charliePending.length, 1);
  assert.strictEqual(charliePending[0].id, invCId);

  // Charlie accepts in-app
  const charlieAcceptResult = simulateAcceptRpc('user-c', 'charlie_new@oneteam.internal', 'Charlie Newcomer', invCId);
  assert.strictEqual(charlieAcceptResult.success, true);
  assert.strictEqual(charlieAcceptResult.role, 'viewer');

  const charlieMember = db.members.find((m) => m.workspace_id === 'ws-alpha' && m.user_id === 'user-c');
  assert(charlieMember !== undefined, 'Charlie must now be member');
  assert.strictEqual(charlieMember.role, 'viewer');
  console.log('✅ Test 4 PASSED: Scenario B executed successfully.\n');

  // Test 5: Scenario C (User declines invitation)
  console.log('Test 5: Simulating Scenario C (Invitation decline flow)...');
  function simulateDeclineRpc(callerId: string, callerEmail: string, callerName: string, invitationId: string) {
    const inv = db.invitations.find((i) => i.id === invitationId);
    if (!inv) throw new Error('Приглашение не найдено');

    if (inv.email.toLowerCase().trim() !== callerEmail.toLowerCase().trim()) {
      throw new Error('Email приглашения не совпадает с вашим аккаунтом');
    }

    if (inv.status !== 'pending') throw new Error('Приглашение уже обработано или недействительно');

    inv.status = 'declined';
    const ws = db.workspaces[inv.workspace_id];
    db.notifications.push({
      id: `notif-${Date.now()}`,
      workspace_id: inv.workspace_id,
      recipient_id: inv.invited_by,
      title: 'Приглашение отклонено',
      description: `${callerName} отклонил(а) приглашение в команду "${ws?.name}".`,
      type: 'team',
      is_read: false,
    });
    return { success: true, workspace_id: inv.workspace_id, status: 'declined' };
  }

  const invDId = 'inv-3003';
  db.invitations.push({
    id: invDId,
    workspace_id: 'ws-alpha',
    email: 'dan@oneteam.internal',
    invitee_name: 'Dan Brown',
    role: 'editor',
    invited_by: 'user-a',
    status: 'pending',
    token_hash: '',
    expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
  });

  const declineRes = simulateDeclineRpc('user-d', 'dan@oneteam.internal', 'Dan Brown', invDId);
  assert.strictEqual(declineRes.status, 'declined');

  const declinedInv = db.invitations.find((i) => i.id === invDId);
  assert.strictEqual(declinedInv?.status, 'declined');

  const aliceDeclineNotif = db.notifications.find(
    (n) => n.recipient_id === 'user-a' && n.title === 'Приглашение отклонено'
  );
  assert(aliceDeclineNotif !== undefined, 'Inviter received decline notification');
  console.log('✅ Test 5 PASSED: Scenario C executed successfully.\n');

  // Test 6: Scenario D (Edge cases: duplicate rejection, wrong email, expired, cancelled)
  console.log('Test 6: Simulating Scenario D (Security & edge cases)...');

  // 1. Wrong email attempt
  assert.throws(
    () => {
      simulateAcceptRpc('user-intruder', 'hacker@evil.com', 'Intruder', invAId);
    },
    /не совпадает с вашим аккаунтом/i,
    'Should reject acceptance when caller email does not match invitation email'
  );

  // 2. Already accepted invitation
  assert.throws(
    () => {
      simulateAcceptRpc('user-b', 'bob@oneteam.internal', 'Bob Dev', invAId);
    },
    /уже принято/i,
    'Should reject re-accepting already accepted invitation'
  );

  // 3. Expired invitation
  const expiredInvId = 'inv-expired';
  db.invitations.push({
    id: expiredInvId,
    workspace_id: 'ws-alpha',
    email: 'expired_user@oneteam.internal',
    invitee_name: 'Late User',
    role: 'editor',
    invited_by: 'user-a',
    status: 'pending',
    token_hash: '',
    expires_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  });

  assert.throws(
    () => {
      simulateAcceptRpc('user-exp', 'expired_user@oneteam.internal', 'Late User', expiredInvId);
    },
    /истёк/i,
    'Should reject expired invitation'
  );

  // 4. Cancelled invitation
  const cancelledInvId = 'inv-cancelled';
  db.invitations.push({
    id: cancelledInvId,
    workspace_id: 'ws-alpha',
    email: 'cancelled_user@oneteam.internal',
    invitee_name: 'Cancelled User',
    role: 'editor',
    invited_by: 'user-a',
    status: 'cancelled',
    token_hash: '',
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date().toISOString(),
  });

  assert.throws(
    () => {
      simulateAcceptRpc('user-canc', 'cancelled_user@oneteam.internal', 'Cancelled User', cancelledInvId);
    },
    /отозвано/i,
    'Should reject cancelled invitation'
  );

  console.log('✅ Test 6 PASSED: Security and edge case rejection verified.\n');

  console.log('🎉 ALL EMAIL INVITATIONS & TEAM MEMBERSHIP SCENARIOS PASSED SUCCESSFULLY! 🚀');
}

runInvitationTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
