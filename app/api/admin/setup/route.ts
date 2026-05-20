import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { adminEmail, adminPassword } = await request.json()

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if this is the first admin setup (no other admins exist)
    const { data: existingAdmins } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_admin', true)
      .limit(1)

    if (existingAdmins && existingAdmins.length > 0) {
      return NextResponse.json(
        { error: 'Admin account already exists. Contact your admin for access.' },
        { status: 403 }
      )
    }

    // Try to sign up the admin user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
    })

    if (authError) {
      console.error('[v0] Error creating admin user:', authError)
      return NextResponse.json(
        { error: authError.message || 'Failed to create admin account' },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create admin user' },
        { status: 500 }
      )
    }

    // Set the user as admin in profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', authData.user.id)

    if (updateError) {
      console.error('[v0] Error setting admin status:', updateError)
      return NextResponse.json(
        { error: 'Failed to set admin status' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Admin account created successfully',
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[v0] Error in admin setup:', error)
    return NextResponse.json(
      { error: 'Failed to setup admin account' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if any admin exists
    const { data: admins, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_admin', true)
      .limit(1)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to check admin status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      adminExists: admins && admins.length > 0,
    })
  } catch (error) {
    console.error('[v0] Error checking admin setup:', error)
    return NextResponse.json(
      { error: 'Failed to check admin status' },
      { status: 500 }
    )
  }
}
