/**
 * Netlify Function to fetch attendance data by date
 */

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
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
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured.');
    }

    if (!supabaseKey.startsWith('eyJ')) {
      throw new Error('Invalid Supabase key format.');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get date from query parameters
    const date = event.queryStringParameters?.date;

    if (!date) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          error: 'Date parameter is required'
        })
      };
    }

    // Fetch attendance record for the given date with related persons
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        attendance_persons (
          person_id,
          persons (
            id,
            pass_number,
            first_name,
            last_name,
            team,
            birth_date
          )
        )
      `)
      .eq('date', date)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      throw new Error('Database error: ' + error.message);
    }

    // If no record found, return empty
    if (!data || data.length === 0) {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          data: null
        })
      };
    }

    const record = data[0];
    
    // Extract present kids names from the joined persons data
    let presentKids = [];
    if (record.attendance_persons && Array.isArray(record.attendance_persons)) {
      presentKids = record.attendance_persons
        .map(ap => {
          if (ap.persons) {
            const person = ap.persons;
            return `${person.first_name} ${person.last_name}`.trim();
          }
          return null;
        })
        .filter(name => name !== null);
    }
    
    // Fallback: if no attendance_persons links found, try to parse old format (present_kids string)
    if (presentKids.length === 0 && record.present_kids) {
      presentKids = record.present_kids
        .split(',')
        .map(name => name.trim())
        .filter(name => name);
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        data: {
          id: record.id,
          date: record.date,
          activityType: record.activity_type,
          presentKids: presentKids,
          totalKids: record.total_persons || record.total_kids || 0,
          absentKids: record.absent || record.absent_kids || 0
        }
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      })
    };
  }
};

