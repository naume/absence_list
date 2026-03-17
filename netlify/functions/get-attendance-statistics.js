/**
 * Netlify Function to fetch statistics for a tournament attendance (present persons only)
 *
 * Query params:
 * - attendanceId (required)
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

    const attendanceId = Number(event.queryStringParameters?.attendanceId);
    if (!attendanceId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ success: false, error: 'attendanceId is required' })
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const [{ data: attendanceRows, error: attendanceError }, { data: items, error: itemsError }] = await Promise.all([
      supabase
        .from('attendance')
        .select(`
          id,
          date,
          activity_type,
          tournament_info,
          attendance_persons (
            person_id,
            persons (
              id,
              first_name,
              last_name,
              team
            )
          )
        `)
        .eq('id', attendanceId)
        .limit(1),
      supabase
        .from('statistic_items')
        .select('id, name, sort_order')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })
    ]);

    if (attendanceError) throw new Error(attendanceError.message);
    if (itemsError) throw new Error(itemsError.message);

    const attendance = (attendanceRows || [])[0];
    if (!attendance) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ success: false, error: 'Attendance not found' })
      };
    }

    const players = (attendance.attendance_persons || [])
      .map((ap) => ap.persons)
      .filter(Boolean)
      .map((p) => ({
        id: p.id,
        name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
        team: p.team || null
      }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    const { data: entries, error: entriesError } = await supabase
      .from('attendance_person_statistics')
      .select('person_id, statistic_item_id, value')
      .eq('attendance_id', attendanceId);

    if (entriesError) throw new Error(entriesError.message);

    // Build map: personId -> statItemId -> value
    const values = {};
    for (const e of entries || []) {
      if (!values[e.person_id]) values[e.person_id] = {};
      values[e.person_id][e.statistic_item_id] = e.value;
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        attendance: {
          id: attendance.id,
          date: attendance.date,
          activityType: attendance.activity_type,
          tournamentInfo: attendance.tournament_info || null
        },
        players,
        items: items || [],
        values
      })
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

