import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TransferRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify the user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const body = await req.json() as TransferRequest
    const { fromAccountId, toAccountId, amount, description } = body

    console.log('Transfer request:', { fromAccountId, toAccountId, amount, userId: user.id })

    // Validate input
    if (!fromAccountId || !toAccountId || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid transfer parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (fromAccountId === toAccountId) {
      return new Response(
        JSON.stringify({ error: 'Cannot transfer to the same account' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Begin transaction by fetching both accounts
    const { data: fromAccount, error: fromError } = await supabaseClient
      .from('accounts')
      .select('*')
      .eq('id', fromAccountId)
      .eq('user_id', user.id)
      .single()

    if (fromError || !fromAccount) {
      console.error('From account error:', fromError)
      return new Response(
        JSON.stringify({ error: 'From account not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { data: toAccount, error: toError } = await supabaseClient
      .from('accounts')
      .select('*')
      .eq('id', toAccountId)
      .eq('user_id', user.id)
      .single()

    if (toError || !toAccount) {
      console.error('To account error:', toError)
      return new Response(
        JSON.stringify({ error: 'To account not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if from account has sufficient balance
    const currentBalance = parseFloat(fromAccount.balance.toString())
    if (currentBalance < amount) {
      return new Response(
        JSON.stringify({ 
          error: `Insufficient funds in ${fromAccount.bank_name}. Available: ${currentBalance} JOD` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update from account balance
    const newFromBalance = currentBalance - amount
    const { error: updateFromError } = await supabaseClient
      .from('accounts')
      .update({ balance: newFromBalance })
      .eq('id', fromAccountId)
      .eq('user_id', user.id)

    if (updateFromError) {
      console.error('Update from account error:', updateFromError)
      return new Response(
        JSON.stringify({ error: 'Failed to update from account' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update to account balance
    const currentToBalance = parseFloat(toAccount.balance.toString())
    const newToBalance = currentToBalance + amount
    const { error: updateToError } = await supabaseClient
      .from('accounts')
      .update({ balance: newToBalance })
      .eq('id', toAccountId)
      .eq('user_id', user.id)

    if (updateToError) {
      console.error('Update to account error:', updateToError)
      // Rollback from account balance
      await supabaseClient
        .from('accounts')
        .update({ balance: currentBalance })
        .eq('id', fromAccountId)
        .eq('user_id', user.id)
      
      return new Response(
        JSON.stringify({ error: 'Failed to update to account' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create transaction record
    const { error: transactionError } = await supabaseClient
      .from('transactions')
      .insert({
        user_id: user.id,
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        amount: amount,
        transaction_type: 'transfer',
        status: 'completed',
        description: description || `Transfer from ${fromAccount.bank_name} to ${toAccount.bank_name}`
      })

    if (transactionError) {
      console.error('Transaction record error:', transactionError)
    }

    console.log('Transfer completed successfully')

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Transferred ${amount} JOD from ${fromAccount.bank_name} to ${toAccount.bank_name}`,
        fromAccount: { ...fromAccount, balance: newFromBalance },
        toAccount: { ...toAccount, balance: newToBalance }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Transfer function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})