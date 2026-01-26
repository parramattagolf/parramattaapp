import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import webPush from 'web-push';


export async function POST(request: Request) {
  const supabase = await createClient();
  
  // Check if admin (optional: implement your admin check logic here)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Example: Check if user email is admin (replace with your logic)
  // if (user.email !== 'admin@parramattagolf.com') { ... }

  try {
    webPush.setVapidDetails(
      process.env.NEXT_PUBLIC_VAPID_SUBJECT || 'mailto:admin@example.com',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );
  } catch (error) {
    console.error('VAPID keys not configured', error);
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const { title, body, url, userId } = await request.json();

  let query = supabase.from('push_subscriptions').select('*');
  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data: subscriptions, error } = await query;

  if (error || !subscriptions) {
    return NextResponse.json({ error: 'Error fetching subscriptions' }, { status: 500 });
  }

  const notifications = subscriptions.map((sub) => {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    };

    const payload = JSON.stringify({
      title,
      body,
      url,
    });

    return webPush.sendNotification(pushSubscription, payload).catch((err) => {
      if (err.statusCode === 404 || err.statusCode === 410) {
        console.log('Subscription expired or no longer valid: ', sub.endpoint);
        // Optional: Delete expired subscription from DB
        // await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      } else {
        console.error('Error sending notification', err);
      }
    });
  });

  await Promise.all(notifications);

  return NextResponse.json({ success: true, count: notifications.length });
}
