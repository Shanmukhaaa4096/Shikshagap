import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DICTS } from '../src/lib/i18n/dict.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '..', 'src');

test('Google Sign-In for Teachers via Supabase (@supabase/ssr)', async (t) => {
  const browserClientPath = path.join(srcDir, 'lib', 'supabase', 'client.ts');
  const serverClientPath = path.join(srcDir, 'lib', 'supabase', 'server.ts');
  const loginFormPath = path.join(srcDir, 'app', 'login', 'LoginForm.tsx');
  const callbackRoutePath = path.join(srcDir, 'app', 'auth', 'callback', 'route.ts');
  const teacherPagePath = path.join(srcDir, 'app', 'teacher', 'page.tsx');
  const teacherViewPath = path.join(srcDir, 'app', 'teacher', 'TeacherPortalView.tsx');
  const landingPagePath = path.join(srcDir, 'app', 'LandingPageClient.tsx');

  const browserClientCode = fs.readFileSync(browserClientPath, 'utf8');
  const serverClientCode = fs.readFileSync(serverClientPath, 'utf8');
  const loginFormCode = fs.readFileSync(loginFormPath, 'utf8');
  const callbackRouteCode = fs.readFileSync(callbackRoutePath, 'utf8');
  const teacherPageCode = fs.readFileSync(teacherPagePath, 'utf8');
  const teacherViewCode = fs.readFileSync(teacherViewPath, 'utf8');
  const landingPageCode = fs.readFileSync(landingPagePath, 'utf8');

  await t.test('1. Supabase Browser & Server Clients Helper Configuration', async () => {
    // Both helpers must read NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
    assert.ok(
      browserClientCode.includes('NEXT_PUBLIC_SUPABASE_URL') &&
      browserClientCode.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY') &&
      browserClientCode.includes('createBrowserClient'),
      'src/lib/supabase/client.ts must use createBrowserClient and read NEXT_PUBLIC_SUPABASE_URL & ANON_KEY'
    );

    assert.ok(
      serverClientCode.includes('NEXT_PUBLIC_SUPABASE_URL') &&
      serverClientCode.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY') &&
      serverClientCode.includes('createServerClient') &&
      serverClientCode.includes('cookies'),
      'src/lib/supabase/server.ts must use createServerClient and handle cookie headers'
    );

    // Verify dynamic import of browser client
    const { createClient } = await import('../src/lib/supabase/client.ts');
    const client = createClient();
    assert.ok(client && client.auth, 'Browser client should initialize with auth API');
  });

  await t.test('2. Teacher Login Page at /login with "Sign in with Google" button', () => {
    // Check for Teacher Login heading
    assert.ok(
      loginFormCode.includes('t.teacherLogin'),
      'LoginForm must render Teacher Login title from i18n dict'
    );

    // Check for Sign in with Google button
    assert.ok(
      loginFormCode.includes('t.signInWithGoogle'),
      'LoginForm must have Sign in with Google text'
    );

    // Check for exact signInWithOAuth call structure
    assert.ok(
      loginFormCode.includes("provider: 'google'") &&
      loginFormCode.includes("redirectTo:") &&
      loginFormCode.includes("/auth/callback"),
      'LoginForm must call supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: .../auth/callback } })'
    );

    // Existing demo credentials must be preserved
    assert.ok(
      loginFormCode.includes('fillDemoTeacher') && loginFormCode.includes('fillDemoAdmin'),
      'Existing 1-click evaluation demo credentials must remain available'
    );
  });

  await t.test('3. /auth/callback Route Handler Exchanges Code for Session and Redirects to /teacher', () => {
    assert.ok(
      callbackRouteCode.includes('exchangeCodeForSession'),
      'Callback route must call exchangeCodeForSession(code)'
    );

    assert.ok(
      callbackRouteCode.includes("next = searchParams.get('next') ?? '/teacher'") ||
      callbackRouteCode.includes('/teacher'),
      'Callback route must redirect to /teacher upon successful session exchange'
    );
  });

  await t.test('4. Protected /teacher Page Shows Teacher Name, Sign Out button, and Redirects Unauthenticated Users', () => {
    // Check protection & redirect in server component
    assert.ok(
      teacherPageCode.includes('getUser()') || teacherPageCode.includes('getSession()'),
      'Teacher page must verify authenticated user'
    );
    assert.ok(
      teacherPageCode.includes("redirect('/login')"),
      'Unauthenticated users must be redirected to /login'
    );

    // Check teacher name display & Sign Out button in client view
    assert.ok(
      teacherViewCode.includes('teacherName') &&
      teacherViewCode.includes('data-testid="teacher-name"'),
      'Teacher view must display the signed-in teacher name'
    );
    assert.ok(
      teacherViewCode.includes('t.signOut') &&
      teacherViewCode.includes('signOut()'),
      'Teacher view must provide a Sign Out button calling supabase.auth.signOut()'
    );
  });

  await t.test('5. Site Header & Landing Page: "Teacher login" link present; students & demo do not require login', () => {
    // Header must have Teacher login link
    assert.ok(
      landingPageCode.includes('dict.teacherLogin'),
      'Landing page navigation must feature Teacher login link'
    );

    // Students have direct access to assessment without login
    assert.ok(
      landingPageCode.includes('href="/assessment"'),
      'Students must be able to start assessment directly without login'
    );
  });

  await t.test('6. Trilingual Support: English, Hindi, and Telugu for all Teacher Auth Keys', () => {
    const requiredKeys = [
      'teacherLogin',
      'signInWithGoogle',
      'signOut',
      'teacherPortal',
      'welcomeTeacher',
      'verifiedTeacherBadge',
      'signedInAs',
      'teacherPortalDesc',
      'goToDashboard',
      'launchStudentCheck',
      'googleAuthFailed',
    ];

    for (const key of requiredKeys) {
      assert.ok(DICTS.en[key], `Missing English translation for ${key}`);
      assert.ok(DICTS.hi[key], `Missing Hindi translation for ${key}`);
      assert.ok(DICTS.te[key], `Missing Telugu translation for ${key}`);
    }

    assert.equal(DICTS.en.teacherLogin, 'Teacher Login');
    assert.equal(DICTS.hi.teacherLogin, 'शिक्षक लॉगिन');
    assert.equal(DICTS.te.teacherLogin, 'ఉపాధ్యాయుల లాగిన్');

    assert.equal(DICTS.en.signInWithGoogle, 'Sign in with Google');
    assert.equal(DICTS.hi.signInWithGoogle, 'Google से साइन इन करें');
    assert.equal(DICTS.te.signInWithGoogle, 'Googleతో సైన్ ఇన్ చేయండి');

    assert.equal(DICTS.en.signOut, 'Sign out');
    assert.equal(DICTS.hi.signOut, 'साइन आउट');
    assert.equal(DICTS.te.signOut, 'సైన్ అవుట్');
  });
});
