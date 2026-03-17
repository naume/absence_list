/**
 * Netlify Function to create/update a statistic item (definition)
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

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = JSON.parse(event.body || '{}');

    const name = String(body.name || '').trim();
    const sortOrder = body.sortOrder == null ? null : Number(body.sortOrder);
    const id = body.id == null ? null : Number(body.id);

    if (!name) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ success: false, error: 'name is required' })
      };
    }

    const payload = {
      name,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : null
    };

    let query = supabase.from('statistic_items');
    if (id) {
      query = query.update(payload).eq('id', id).select('id, name, sort_order').single();
    } else {
      query = query.insert([payload]).select('id, name, sort_order').single();
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ success: true, item: data })
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

