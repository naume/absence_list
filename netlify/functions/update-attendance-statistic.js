/**
 * Netlify Function to update a single statistic value by delta (upsert-style)
 *
 * Body:
 * - attendanceId (number, required)
 * - personId (number, required)
 * - statisticItemId (number, required)
 * - delta (number, required)  // e.g. +1 or -1
 */
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
    if (!supabaseUrl || !supabaseKey) throw new Error('Supabase credentials not configured.');
    if (!supabaseKey.startsWith('eyJ')) throw new Error('Invalid Supabase key format.');

    const body = JSON.parse(event.body || '{}');
    const attendanceId = Number(body.attendanceId);
    const personId = Number(body.personId);
    const statisticItemId = Number(body.statisticItemId);
    const delta = Number(body.delta);

    if (!attendanceId || !personId || !statisticItemId || !Number.isFinite(delta) || delta === 0) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ success: false, error: 'attendanceId, personId, statisticItemId, delta are required' })
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: existing, error: existingError } = await supabase
      .from('attendance_person_statistics')
      .select('id, value')
      .eq('attendance_id', attendanceId)
      .eq('person_id', personId)
      .eq('statistic_item_id', statisticItemId)
      .maybeSingle();

    if (existingError) throw new Error(existingError.message);

    const currentValue = existing?.value ?? 0;
    const nextValue = Math.max(0, currentValue + delta);

    let saved;
    if (existing?.id) {
      const { data: updated, error: updateError } = await supabase
        .from('attendance_person_statistics')
        .update({ value: nextValue })
        .eq('id', existing.id)
        .select('value')
        .single();
      if (updateError) throw new Error(updateError.message);
      saved = updated;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('attendance_person_statistics')
        .insert([
          {
            attendance_id: attendanceId,
            person_id: personId,
            statistic_item_id: statisticItemId,
            value: nextValue
          }
        ])
        .select('value')
        .single();
      if (insertError) throw new Error(insertError.message);
      saved = inserted;
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ success: true, value: saved.value })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ success: false, error: error.message || 'Internal server error' })
    };
  }
};

