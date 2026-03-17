/**
 * Netlify Function to list attendance records (for populating tournament filters)
 *
 * Query params (all optional, but at least one filter is recommended):
 * - date
 * - activityType
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
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
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

    const supabase = createClient(supabaseUrl, supabaseKey);

    const date = event.queryStringParameters?.date || null;
    const activityType = event.queryStringParameters?.activityType || null;

    let query = supabase
      .from('attendance')
      .select('id, date, activity_type, tournament_info, created_at')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (date) {
      query = query.eq('date', date);
    }
    if (activityType) {
      query = query.eq('activity_type', activityType);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ success: true, data: data || [] })
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

