/**
 * Netlify Function to fetch attendance data by date range
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

    // Get date range from query parameters
    const fromDate = event.queryStringParameters?.fromDate;
    const toDate = event.queryStringParameters?.toDate;

    if (!fromDate || !toDate) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          error: 'fromDate and toDate parameters are required'
        })
      };
    }

    // Fetch attendance records for the date range with related persons
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        attendance_persons (
          person_id,
          persons (
            id,
            first_name,
            last_name,
            pass_number
          )
        )
      `)
      .gte('date', fromDate)
      .lte('date', toDate)
      .order('date', { ascending: true });

    if (error) {
      throw new Error('Database error: ' + error.message);
    }

    // Process data: extract person names and IDs
    const processedData = (data || []).map(record => {
      // Get present person names from attendance_persons links
      let presentKids = [];
      let presentPersonIds = [];
      
      if (record.attendance_persons && Array.isArray(record.attendance_persons)) {
        presentKids = record.attendance_persons
          .map(ap => {
            if (ap.persons) {
              const person = ap.persons;
              presentPersonIds.push(person.id);
              return `${person.first_name} ${person.last_name}`.trim();
            }
            return null;
          })
          .filter(name => name !== null);
      }
      
      // Fallback: parse old format (present_kids string) for backward compatibility
      if (presentKids.length === 0 && record.present_kids) {
        presentKids = record.present_kids
          .split(',')
          .map(name => name.trim())
          .filter(name => name);
      }
      
      return {
        id: record.id,
        date: record.date,
        activity_type: record.activity_type,
        present_kids: presentKids,
        present_person_ids: presentPersonIds,
        total_kids: record.total_persons || record.total_kids || 0,
        absent_kids: record.absent || record.absent_kids || 0
      };
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        data: processedData
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

