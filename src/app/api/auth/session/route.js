import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const token = body?.token;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });

    // Securely set HttpOnly auth_token cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });

  // Clear auth_token cookie
  response.cookies.set({
    name: 'auth_token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}

export async function GET(request) {
  const token = request.cookies.get('auth_token')?.value || null;
  return NextResponse.json({
    isAuthenticated: !!token,
    hasToken: !!token,
  });
}
