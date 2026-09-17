import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/admin-auth';

// Verwijdert een gebruiker en al diens data. Onomkeerbaar — bewust geen "soft delete", dit is
// een admin-only opruimactie (bv. testaccounts, spam-registraties, AVG-verzoeken).
//
// `users` is multi-tenant: elke rij hoort bij een organizations-rij en bijna alle producttabellen
// zijn organization_id-scoped, niet user_id-scoped (zie src/lib/db/schema.ts). Cursusvoortgang
// (course_enrollments e.a.) hangt weer aan auth_users.id (tekst-UUID), niet aan users.id. Daarom
// hier expliciet child-tabellen eerst opruimen i.p.v. op FK ON DELETE CASCADE te vertrouwen — niet
// elke FK in dit schema heeft die cascade, en de live DB is via handmatige migraties opgebouwd dus
// niet gegarandeerd 1-op-1 met schema.ts.
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const userId = Number(id);
  if (!Number.isInteger(userId)) {
    return NextResponse.json({ error: 'Ongeldig gebruikers-ID' }, { status: 400 });
  }

  const [user] = await sql`SELECT id, email, organization_id FROM users WHERE id = ${userId}`;
  if (!user) {
    return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
  }
  const orgId = user.organization_id as number;

  const [authUser] = await sql`SELECT id FROM auth_users WHERE email = ${user.email}`;
  const authUserId = authUser?.id as string | undefined;

  const [{ count: otherUsersInOrg }] = await sql`
    SELECT COUNT(*)::int AS count FROM users WHERE organization_id = ${orgId} AND id != ${userId}
  `;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- neon's transaction() overloads
  // don't infer cleanly for a dynamically-built array of mixed-shape queries.
  const queries: any[] = [];

  if (authUserId) {
    queries.push(
      sql`DELETE FROM course_enrollments WHERE user_id = ${authUserId}`,
      sql`DELETE FROM lesson_completions WHERE user_id = ${authUserId}`,
      sql`DELETE FROM course_answers WHERE user_id = ${authUserId}`,
      sql`DELETE FROM exercise_completions WHERE user_id = ${authUserId}`,
      sql`DELETE FROM daily_practice_log WHERE user_id = ${authUserId}`,
      sql`DELETE FROM user_assessments WHERE user_id = ${authUserId}`,
      sql`DELETE FROM course_achievements WHERE user_id = ${authUserId}`,
    );
  }

  queries.push(
    sql`DELETE FROM habits WHERE organization_id = ${orgId}`,
    sql`DELETE FROM daily_logs WHERE organization_id = ${orgId}`,
    sql`DELETE FROM goals WHERE organization_id = ${orgId}`,
    sql`DELETE FROM identity_profiles WHERE organization_id = ${orgId}`,
    sql`DELETE FROM ritual_settings WHERE organization_id = ${orgId}`,
    sql`DELETE FROM weekly_goals WHERE organization_id = ${orgId}`,
    sql`DELETE FROM weekly_reviews WHERE organization_id = ${orgId}`,
    sql`DELETE FROM focus_sessions WHERE organization_id = ${orgId}`,
    sql`DELETE FROM meditation_sessions WHERE organization_id = ${orgId}`,
    sql`DELETE FROM wins WHERE organization_id = ${orgId}`,
    sql`DELETE FROM user_context WHERE organization_id = ${orgId}`,
    sql`DELETE FROM coach_lessons WHERE organization_id = ${orgId}`,
    sql`DELETE FROM energy_log WHERE organization_id = ${orgId}`,
    sql`DELETE FROM coach_predictions WHERE organization_id = ${orgId}`,
    sql`DELETE FROM calendar_proposals WHERE organization_id = ${orgId}`,
    sql`DELETE FROM approval_queue WHERE organization_id = ${orgId}`,
    sql`DELETE FROM onboarding_profiles WHERE organization_id = ${orgId}`,
    sql`DELETE FROM client_bridge_tokens WHERE organization_id = ${orgId}`,

    sql`DELETE FROM email_sends WHERE user_id = ${userId}`,
    sql`DELETE FROM email_preferences WHERE user_id = ${userId}`,
    sql`DELETE FROM push_subscriptions WHERE user_id = ${userId}`,
    sql`DELETE FROM notification_preferences WHERE user_id = ${userId}`,
    sql`DELETE FROM scheduled_notifications WHERE user_id = ${userId}`,
  );

  if (authUserId) {
    queries.push(
      sql`DELETE FROM auth_accounts WHERE user_id = ${authUserId}`,
      sql`DELETE FROM auth_sessions WHERE user_id = ${authUserId}`,
      sql`DELETE FROM auth_users WHERE id = ${authUserId}`,
    );
  }

  queries.push(sql`DELETE FROM users WHERE id = ${userId}`);

  if (otherUsersInOrg === 0) {
    queries.push(sql`DELETE FROM organizations WHERE id = ${orgId}`);
  }

  try {
    await sql.transaction(queries);
  } catch (error) {
    console.error('Delete user transaction failed:', error);
    return NextResponse.json({ error: 'Verwijderen mislukt' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
