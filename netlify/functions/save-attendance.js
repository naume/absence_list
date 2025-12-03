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

    // Step 1: Get person IDs (either from request or from presentKidsData for backward compatibility)
    let personIds = [];
    
    if (data.personIds && Array.isArray(data.personIds)) {
      // New format: person IDs are already provided
      personIds = data.personIds.filter(id => id != null);
    } else if (data.presentKidsData && Array.isArray(data.presentKidsData)) {
      // Backward compatibility: upsert persons and get IDs
      for (const personData of data.presentKidsData) {
        // Generate pass_number from firstName + lastName + team if missing
        let passNumber = personData.passNumber?.trim() || '';
        
        if (!passNumber) {
          const hashString = `${personData.firstName || ''}${personData.lastName || ''}${personData.team || ''}`;
          passNumber = Buffer.from(hashString).toString('base64');
        }

        const personRecord = {
          pass_number: passNumber,
          first_name: personData.firstName || '',
          last_name: personData.lastName || '',
          team: personData.team || null,
          birth_date: personData.birthDate || null
        };

        const { data: personResult, error: personError } = await supabase
          .from('persons')
          .upsert(personRecord, {
            onConflict: 'pass_number',
            ignoreDuplicates: false
          })
          .select('id')
          .single();

        if (personError) {
          const { data: existingPerson } = await supabase
            .from('persons')
            .select('id')
            .eq('pass_number', personRecord.pass_number)
            .single();

          if (existingPerson) {
            personIds.push(existingPerson.id);
          } else {
            console.error('Error upserting person:', personError);
            throw new Error(`Failed to save person ${personData.firstName} ${personData.lastName}: ${personError.message}`);
          }
        } else {
          personIds.push(personResult.id);
        }
      }
    }

    // Step 2: Create or update attendance record
    const attendanceRecord = {
      date: data.date,
      activity_type: data.activityType,
      total_persons: data.totalKids || 0,
      absent: data.absentKids || 0
    };

    let attendanceId;
    let result;
    let error;

    if (data.recordId) {
      // Update existing record
      const { data: updatedData, error: updateError } = await supabase
        .from('attendance')
        .update(attendanceRecord)
        .eq('id', data.recordId)
        .select();
      
      if (updateError) {
        throw new Error('Database error updating attendance: ' + updateError.message);
      }
      
      attendanceId = updatedData[0]?.id;
      result = updatedData;
    } else {
      // Insert new record (with conflict handling for unique constraint)
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('id')
        .eq('date', data.date)
        .eq('activity_type', data.activityType)
        .single();

      if (existingAttendance) {
        // Update existing record for this date/activity
        const { data: updatedData, error: updateError } = await supabase
          .from('attendance')
          .update(attendanceRecord)
          .eq('id', existingAttendance.id)
          .select();
        
        if (updateError) {
          throw new Error('Database error updating attendance: ' + updateError.message);
        }
        
        attendanceId = updatedData[0]?.id;
        result = updatedData;
      } else {
        // Insert new record
        const { data: insertedData, error: insertError } = await supabase
          .from('attendance')
          .insert([attendanceRecord])
          .select();
        
        if (insertError) {
          throw new Error('Database error inserting attendance: ' + insertError.message);
        }
        
        attendanceId = insertedData[0]?.id;
        result = insertedData;
      }
    }

    // Step 3: Update attendance_persons links
    if (attendanceId) {
      // Delete existing links for this attendance record
      const { error: deleteError } = await supabase
        .from('attendance_persons')
        .delete()
        .eq('attendance_id', attendanceId);

      if (deleteError) {
        console.warn('Error deleting old attendance_persons links:', deleteError);
        // Continue anyway - we'll try to insert new ones
      }

      // Insert new links for present persons
      if (personIds.length > 0) {
        const attendancePersonsLinks = personIds.map(personId => ({
          attendance_id: attendanceId,
          person_id: personId
        }));

        const { error: linkError } = await supabase
          .from('attendance_persons')
          .insert(attendancePersonsLinks);

        if (linkError) {
          console.error('Error inserting attendance_persons links:', linkError);
          throw new Error('Failed to link persons to attendance: ' + linkError.message);
        }
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
        message: data.recordId ? 'Attendance updated successfully' : 'Attendance saved successfully',
        id: attendanceId || result[0]?.id
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
