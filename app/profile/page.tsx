'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, LogOut, Save, Mail, User, Calendar, Lock } from 'lucide-react'
import Link from 'next/link'

interface UserProfile {
  email: string
  created_at: string
  last_updated?: string
}

interface FormData {
  email: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (!currentUser) {
        router.push('/auth/login')
        return
      }

      setUser(currentUser)
      setFormData(prev => ({ ...prev, email: currentUser.email || '' }))

      // Fetch user profile from database
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
      } else if (profileData) {
        setProfile(profileData)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!user) return

    try {
      setSaving(true)

      // Update email if changed
      if (formData.email !== user.email && formData.email) {
        const { error } = await supabase.auth.updateUser({
          email: formData.email,
        })
        if (error) throw error
      }

      // Update profile in database
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          email: formData.email,
          last_updated: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (profileError && profileError.code !== 'PGRST116') throw profileError

      alert('Profile updated successfully!')
      fetchUserProfile()
    } catch (error) {
      console.error('Error updating profile:', error)
      alert(`Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!formData.newPassword || !formData.confirmPassword) {
      alert('Please fill in both password fields')
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      alert('Passwords do not match')
      return
    }

    if (formData.newPassword.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }

    try {
      setSaving(true)
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword,
      })

      if (error) throw error

      alert('Password changed successfully!')
      setShowPasswordSection(false)
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }))
    } catch (error) {
      console.error('Error changing password:', error)
      alert(`Failed to change password: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-foreground">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-16 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
              <p className="text-sm text-muted-foreground">Manage your account settings</p>
            </div>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Account Information */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Account Information
            </h2>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                Email Address
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="max-w-md"
                placeholder="your@email.com"
              />
              <p className="text-xs text-muted-foreground">
                You may need to verify your new email address after changing it
              </p>
            </div>

            {/* Account Created */}
            {user?.created_at && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  Account Created
                </label>
                <p className="text-sm text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-border pt-4">
            <Button
              onClick={handleUpdateProfile}
              disabled={saving}
              className="bg-primary hover:bg-primary/90 gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Password Section */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Security
            </h2>
            <Button
              variant={showPasswordSection ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
            >
              {showPasswordSection ? 'Cancel' : 'Change Password'}
            </Button>
          </div>

          {showPasswordSection && (
            <div className="space-y-4 border-t border-border pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  New Password
                </label>
                <Input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, newPassword: e.target.value }))
                  }
                  placeholder="Enter new password"
                  className="max-w-md"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))
                  }
                  placeholder="Confirm new password"
                  className="max-w-md"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Password must be at least 6 characters long
              </p>

              <Button
                onClick={handleChangePassword}
                disabled={saving}
                className="bg-primary hover:bg-primary/90"
              >
                {saving ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          )}
        </div>

        {/* Account Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold text-foreground mb-2">Account Status</h3>
            <p className="text-sm text-muted-foreground">
              {user?.user_metadata?.verified ? '✓ Verified' : 'Pending verification'}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold text-foreground mb-2">Last Updated</h3>
            <p className="text-sm text-muted-foreground">
              {profile?.last_updated
                ? new Date(profile.last_updated).toLocaleDateString()
                : 'Not updated yet'}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
