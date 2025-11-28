/**
 * Netlify Function with Supabase integration
 * 
 * SETUP:
 * 1. Install: npm install @supabase/supabase-js
 * 2. Set environment variables in Netlify:
 *    - SUPABASE_URL
 *    - SUPABASE_KEY (anon/public key)
 * 3. Rename this file to save-attendance.js
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
    const supabaseUrl = process.env.SUPABASE_URL || 'https://bfhkzqbztkyojvbhkxzg.supabase.co';
    const supabaseKey = process.env.SUPABASE_KEY || 'sb_publishable_5yd9iRP6pVcXpHuxPpLBVA_Sq-ulQWc';

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured. Set SUPABASE_URL and SUPABASE_KEY environment variables.');
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

    // Insert into Supabase
    const { data: insertedData, error } = await supabase
      .from('attendance')
      .insert([attendanceRecord])
      .select();

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
        message: 'Attendance saved successfully',
        id: insertedData[0]?.id
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

