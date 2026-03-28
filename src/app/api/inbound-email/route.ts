import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

/**
 * Inbound Email Handler
 *
 * Called by Relay (or another agent) when a commission statement
 * arrives in the shared Microsoft mailbox. Relay downloads the
 * PDF attachment and POSTs it here with the client's account info.
 *
 * Flow:
 * 1. Relay monitors statements@metropointtech.com via Graph API
 * 2. New email arrives with PDF attachment
 * 3. Relay identifies the client from the subject line or account tag
 * 4. Relay downloads the PDF and sends it here
 * 5. This endpoint logs the email, stores the file, and queues processing
 */
export async function POST(request: NextRequest) {
  try {
    // Auth: require a service key header (Relay uses this)
    const serviceKey = request.headers.get('x-service-key');
    if (serviceKey !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const userId = formData.get('user_id') as string;
    const fromAddress = formData.get('from_address') as string;
    const subject = formData.get('subject') as string;
    const file = formData.get('file') as File | null;

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Verify user exists and has autopilot or agency_ai plan
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, subscription_plan, subscription_status, email_forwarding_enabled')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!['active', 'trialing'].includes(user.subscription_status || '')) {
      return NextResponse.json({ error: 'Subscription not active' }, { status: 403 });
    }

    if (!user.email_forwarding_enabled) {
      return NextResponse.json({ error: 'Email forwarding not enabled for this account' }, { status: 403 });
    }

    // Log the inbound email
    const { data: emailRecord, error: insertError } = await supabase
      .from('inbound_emails')
      .insert({
        user_id: userId,
        from_address: fromAddress || 'unknown',
        subject: subject || 'No subject',
        status: file ? 'pending' : 'no_attachment',
        attachment_count: file ? 1 : 0,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[Inbound Email] Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to log email' }, { status: 500 });
    }

    // If there's a file, upload to Supabase Storage
    if (file) {
      const fileBuffer = await file.arrayBuffer();
      const fileName = `${userId}/${emailRecord.id}/${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('statements')
        .upload(fileName, Buffer.from(fileBuffer), {
          contentType: file.type || 'application/pdf',
        });

      if (uploadError) {
        console.error('[Inbound Email] Upload error:', uploadError);
        await supabase
          .from('inbound_emails')
          .update({ status: 'failed', error_message: `Upload failed: ${uploadError.message}` })
          .eq('id', emailRecord.id);

        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
      }

      // Update email record with processing status
      await supabase
        .from('inbound_emails')
        .update({ status: 'processing' })
        .eq('id', emailRecord.id);

      // TODO: Queue for parsing and auto-reconciliation
      // This is where we call the existing /api/import/parse-pdf
      // or trigger Catalyst to process the statement
    }

    return NextResponse.json({
      success: true,
      emailId: emailRecord.id,
      status: file ? 'processing' : 'no_attachment',
      message: file ? 'Statement received and queued for processing' : 'Email received but no attachment found',
    });
  } catch (error) {
    console.error('[Inbound Email] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
