import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, household_id, token } = await req.json()

    // Validate input
    if (!email || !household_id || !token) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client with service role key (NEVER expose this key to the frontend)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verify the invite token exists and is valid before sending email
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('household_invites')
      .select('*')
      .eq('token', token)
      .eq('household_id', household_id)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (inviteError || !invite) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired invite' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build redirect URL so user lands on /einladen?token=XYZ after clicking email link
    const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:4200'
    const redirectUrl = `${siteUrl}/einladen?token=${token}`

    // Send invite email via Supabase Auth Admin API
    const { error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectUrl,
    })

    if (authError) {
      // If user is already registered, inviteUserByEmail still sends a magic link.
      // Only surface genuine errors (not "already registered").
      if (!authError.message.includes('already registered')) {
        return new Response(
          JSON.stringify({ error: authError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Record the invited email on the invite row for tracking
    await supabaseAdmin
      .from('household_invites')
      .update({ invited_email: email })
      .eq('id', invite.id)

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
