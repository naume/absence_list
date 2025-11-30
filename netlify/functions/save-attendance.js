/**
 * Netlify Function with Supabase integration
 * 
 * SETUP:
 * 1. Install: npm install @supabase/supabase-js
 * 2. Set environment variables in Netlify:
 *    - SUPABASE_URL
 *    - SUPABASE_KEY (anon/public key)
 * 3. For local testing, create a .env file with these variables
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
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Initialize Supabase client
    // Use service_role key if available (bypasses RLS), otherwise use anon key
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured. Set SUPABASE_URL and SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY) environment variables in your .env file or Netlify dashboard.');
    }

    // Validate key format (Supabase keys are JWT tokens starting with 'eyJ')
    if (!supabaseKey.startsWith('eyJ')) {
      throw new Error('Invalid Supabase key format. Supabase keys are JWT tokens starting with "eyJ...". Please check your SUPABASE_KEY or SUPABASE_SERVICE_ROLE_KEY in Settings → API in Supabase dashboard.');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse the request body
    const data = JSON.parse(event.body);

    // Validate required fields
    if (!data.date || !data.activityType) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          error: 'Missing required fields: date and activityType'
        })
      };
    }

    // Prepare data for database
    const attendanceRecord = {
      date: data.date,
      activity_type: data.activityType,
      present_kids: Array.isArray(data.presentKids) 
        ? data.presentKids.join(', ') 
        : String(data.presentKids || ''),
      total_kids: data.totalKids || 0,
      absent_kids: data.absentKids || 0
    };

    let result;
    let error;

    // If record ID is provided, update existing record; otherwise insert new one
    if (data.recordId) {
      // Update existing record
      const { data: updatedData, error: updateError } = await supabase
        .from('attendance')
        .update(attendanceRecord)
        .eq('id', data.recordId)
        .select();
      
      result = updatedData;
      error = updateError;
    } else {
      // Insert new record
      const { data: insertedData, error: insertError } = await supabase
        .from('attendance')
        .insert([attendanceRecord])
        .select();
      
      result = insertedData;
      error = insertError;
    }

    if (error) {
      throw new Error('Database error: ' + error.message);
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: data.recordId ? 'Attendance updated successfully' : 'Attendance saved successfully',
        id: result[0]?.id
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
