/**
 * Netlify Function to migrate persons from Google Sheets to Supabase
 * 
 * This function reads all persons from the Google Sheet and imports them into the database.
 * 
 * Usage:
 * POST /.netlify/functions/migrate-persons
 * 
 * Optional body parameters:
 * - googleApiKey: Google Sheets API key (or use GOOGLE_API_KEY env var)
 * - sheetId: Google Sheet ID (or use GOOGLE_SHEET_ID env var)
 * - sheetName: Sheet name (default: 'Spieler Liste')
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
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
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
      throw new Error('Supabase credentials not configured. Set SUPABASE_URL and SUPABASE_KEY environment variables.');
    }

    if (!supabaseKey.startsWith('eyJ')) {
      throw new Error('Invalid Supabase key format.');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get configuration from request body or environment variables
    // Use the same configuration as index.html
    let requestData = {};
    if (event.body) {
      try {
        requestData = JSON.parse(event.body);
      } catch (e) {
        // Ignore parse errors for GET requests
      }
    }

    // Use environment variables (same as index.html setup)
    const googleApiKey = requestData.googleApiKey || process.env.GOOGLE_API_KEY;
    const sheetId = requestData.sheetId || process.env.GOOGLE_SHEET_ID || '1edGoIYzKpmNFU0Iyr-PmOTI6NHPwFgE0p3eHlKlbLhM';
    const sheetName = requestData.sheetName || process.env.GOOGLE_SHEET_NAME || 'Spieler Liste';

    if (!googleApiKey) {
      throw new Error('Google API key not configured. Please set GOOGLE_API_KEY environment variable in Netlify dashboard.');
    }

    // Step 1: Fetch data from Google Sheets
    const range = `${sheetName}!A:E`; // Columns: A=Gruppe, B=Nachname, C=Vorname, D=Geburtsdatum, E=Passnummer
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${googleApiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      throw new Error(`Google Sheets API error: ${data.error.message}`);
    }

    if (!data.values || data.values.length === 0) {
      throw new Error('No data returned from spreadsheet');
    }

    // Step 2: Process rows from Google Sheets
    const personsData = data.values
      .map((row, index) => {
        const team = row[0] ? row[0].trim() : ''; // A: Gruppe
        const lastName = row[1] ? row[1].trim() : ''; // B: Nachname
        const firstName = row[2] ? row[2].trim() : ''; // C: Vorname
        const birthDate = row[3] ? row[3].trim() : ''; // D: Geburtsdatum
        const passNumber = row[4] ? row[4].trim() : ''; // E: Passnummer

        // Skip empty rows
        if (!firstName && !lastName) {
          return null;
        }

        // Skip header row
        if (index === 0) {
          const firstItem = (team || '').toLowerCase();
          if (firstItem.includes('gruppe') || firstItem.includes('nachname') || firstItem.includes('vorname') ||
              firstItem.includes('geburtsdatum') || firstItem.includes('passnummer') ||
              firstItem.includes('name') || firstItem.includes('first') || firstItem.includes('last') ||
              firstItem.includes('team') || firstItem.includes('role') || firstItem.includes('coach') || firstItem.includes('player')) {
            return null;
          }
        }

        // Generate pass_number from firstName + lastName + team if missing
        let finalPassNumber = passNumber;
        if (!finalPassNumber || finalPassNumber.trim() === '') {
          const hashString = `${firstName || ''}${lastName || ''}${team || ''}`;
          finalPassNumber = Buffer.from(hashString).toString('base64');
        }

        return {
          pass_number: finalPassNumber,
          first_name: firstName || '',
          last_name: lastName || '',
          team: team || null,
          birth_date: birthDate || null
        };
      })
      .filter(item => item !== null && (item.first_name || item.last_name)); // Remove null/empty entries

    if (personsData.length === 0) {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          message: 'No persons found to import',
          imported: 0,
          updated: 0,
          errors: []
        })
      };
    }

    // Step 3: Upsert all persons into database
    const results = {
      imported: 0,
      updated: 0,
      errors: []
    };

    // Process in batches to avoid overwhelming the database
    const batchSize = 50;
    for (let i = 0; i < personsData.length; i += batchSize) {
      const batch = personsData.slice(i, i + batchSize);
      
      const { data: upsertedData, error: upsertError } = await supabase
        .from('persons')
        .upsert(batch, {
          onConflict: 'pass_number',
          ignoreDuplicates: false
        })
        .select('id, pass_number, first_name, last_name');

      if (upsertError) {
        // Try to insert one by one to identify problematic records
        for (const person of batch) {
          try {
            const { data: existingPerson } = await supabase
              .from('persons')
              .select('id')
              .eq('pass_number', person.pass_number)
              .single();

            if (existingPerson) {
              // Update existing
              const { error: updateError } = await supabase
                .from('persons')
                .update({
                  first_name: person.first_name,
                  last_name: person.last_name,
                  team: person.team,
                  birth_date: person.birth_date
                })
                .eq('id', existingPerson.id);

              if (updateError) {
                results.errors.push({
                  person: `${person.first_name} ${person.last_name}`,
                  error: updateError.message
                });
              } else {
                results.updated++;
              }
            } else {
              // Insert new
              const { error: insertError } = await supabase
                .from('persons')
                .insert([person]);

              if (insertError) {
                results.errors.push({
                  person: `${person.first_name} ${person.last_name}`,
                  error: insertError.message
                });
              } else {
                results.imported++;
              }
            }
          } catch (err) {
            results.errors.push({
              person: `${person.first_name} ${person.last_name}`,
              error: err.message
            });
          }
        }
      } else {
        // Batch upsert succeeded - count new vs updated
        // We can't easily distinguish, so we'll check if they existed before
        const passNumbers = batch.map(p => p.pass_number);
        const { data: existingPersons } = await supabase
          .from('persons')
          .select('id, pass_number')
          .in('pass_number', passNumbers);

        const existingPassNumbers = new Set(existingPersons?.map(p => p.pass_number) || []);
        
        batch.forEach(person => {
          if (existingPassNumbers.has(person.pass_number)) {
            results.updated++;
          } else {
            results.imported++;
          }
        });
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
        message: `Migration completed: ${results.imported} imported, ${results.updated} updated`,
        imported: results.imported,
        updated: results.updated,
        total: personsData.length,
        errors: results.errors,
        errorCount: results.errors.length
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
        error: error.message || 'Internal server error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};

