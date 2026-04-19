import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function supabaseConfig() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    '';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';
  return { url, anon, service };
}

export async function POST(request: NextRequest) {
  const { url: SUPABASE_URL, anon: SUPABASE_ANON_KEY, service: SUPABASE_SERVICE_ROLE_KEY } =
    supabaseConfig();
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      {
        error:
          'Server misconfigured: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY are required',
      },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: adminUser, error: profileErr } = await adminClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileErr) {
    return NextResponse.json({ error: 'Could not load user profile' }, { status: 500 });
  }
  if (!adminUser) {
    return NextResponse.json(
      {
        error:
          'No row in public.users for this login. Supabase Auth is not enough — insert your Auth user id into public.users with role admin (see SUPABASE_SETUP.md), then try again.',
      },
      { status: 403 },
    );
  }
  if (adminUser.role !== 'admin') {
    return NextResponse.json(
      {
        error: `Forbidden: admin role required (your profile role is "${adminUser.role}").`,
      },
      { status: 403 },
    );
  }

  const body = await request.json();
  const { email, password, name, phone, role } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 400 });
  }

  const { error: insertError } = await adminClient.from('users').insert({
    id: newUser.user.id,
    email,
    name: name || null,
    phone: phone || null,
    role: role === 'admin' ? 'admin' : 'technician',
  });

  if (insertError) {
    await adminClient.auth.admin.deleteUser(newUser.user.id);
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, id: newUser.user.id });
}
