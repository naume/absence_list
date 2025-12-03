/**
 * Netlify Function to create or update a person
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
        'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST' && event.httpMethod !== 'PUT') {
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

    // Parse request body
    const data = JSON.parse(event.body);

    // Generate pass_number if missing
    let passNumber = data.passNumber?.trim() || '';
    if (!passNumber) {
      const hashString = `${data.firstName || ''}${data.lastName || ''}${data.team || ''}`;
      passNumber = Buffer.from(hashString).toString('base64');
    }

    // Prepare person record
    const personRecord = {
      pass_number: passNumber,
      first_name: data.firstName || '',
      last_name: data.lastName || '',
      team: data.team || null,
      birth_date: data.birthDate || null
    };

    let result;
    let error;

    if (data.id) {
      // Update existing person
      const { data: updatedData, error: updateError } = await supabase
        .from('persons')
        .update(personRecord)
        .eq('id', data.id)
        .select()
        .single();
      
      result = updatedData;
      error = updateError;
    } else {
      // Insert new person
      const { data: insertedData, error: insertError } = await supabase
        .from('persons')
        .insert([personRecord])
        .select()
        .single();
      
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
        person: result
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

