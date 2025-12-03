/**
 * Netlify Function to get/ensure person IDs exist
 * Takes person data, upserts them, and returns their IDs
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

    if (!data.persons || !Array.isArray(data.persons)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          error: 'Missing or invalid persons array'
        })
      };
    }

    // Upsert persons and get their IDs
    const personIds = [];
    const errors = [];

    for (const personData of data.persons) {
      // Generate pass_number from firstName + lastName + team if missing
      let passNumber = personData.passNumber?.trim() || '';
      
      if (!passNumber) {
        const hashString = `${personData.firstName || ''}${personData.lastName || ''}${personData.team || ''}`;
        passNumber = Buffer.from(hashString).toString('base64');
      }

      // Prepare person record
      const personRecord = {
        pass_number: passNumber,
        first_name: personData.firstName || '',
        last_name: personData.lastName || '',
        team: personData.team || null,
        birth_date: personData.birthDate || null
      };

      // Upsert person
      const { data: personResult, error: personError } = await supabase
        .from('persons')
        .upsert(personRecord, {
          onConflict: 'pass_number',
          ignoreDuplicates: false
        })
        .select('id')
        .single();

      if (personError) {
        // Try to get existing person
        const { data: existingPerson } = await supabase
          .from('persons')
          .select('id')
          .eq('pass_number', personRecord.pass_number)
          .single();

        if (existingPerson) {
          personIds.push(existingPerson.id);
        } else {
          errors.push({
            person: `${personData.firstName} ${personData.lastName}`,
            error: personError.message
          });
        }
      } else {
        personIds.push(personResult.id);
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        personIds: personIds,
        errors: errors,
        total: data.persons.length,
        successCount: personIds.length
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

