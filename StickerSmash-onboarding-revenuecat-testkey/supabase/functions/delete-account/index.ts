import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req: Request) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({
          error: 'Method not allowed',
        }),
        {
          status: 405,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Get the user's access token
    const authorization =
      req.headers.get('Authorization');

    if (!authorization) {
      return new Response(
        JSON.stringify({
          error: 'Missing authorization header',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const token =
      authorization.replace(
        /^Bearer\s+/i,
        ''
      );

    // Supabase environment variables are automatically
    // available inside Edge Functions.
    const supabaseUrl =
      Deno.env.get('SUPABASE_URL');

    const serviceRoleKey =
      Deno.env.get(
        'SUPABASE_SERVICE_ROLE_KEY'
      );

    if (
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      throw new Error(
        'Supabase server environment variables are missing.'
      );
    }

    // Admin client
    const admin =
      createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      );

    /*
     * Verify the access token and get the authenticated user.
     * This prevents somebody from sending an arbitrary user ID
     * and deleting another user's account.
     */
    const {
      data: { user },
      error: userError,
    } =
      await admin.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error:
            'Invalid or expired session',
        }),
        {
          status: 401,
          headers: {
            'Content-Type':
              'application/json',
          },
        }
      );
    }

    const userId = user.id;

    /*
     * STEP 1:
     * Find all journey media owned by the user.
     */
    const {
      data: mediaRows,
      error: mediaError,
    } =
      await admin
        .from('skill_media')
        .select('storage_path')
        .eq('user_id', userId);

    if (mediaError) {
      throw mediaError;
    }

    const storagePaths =
      (mediaRows ?? [])
        .map((row) =>
          row.storage_path
        )
        .filter(
          (
            path
          ): path is string =>
            typeof path === 'string' &&
            path.length > 0
        );

    /*
     * STEP 2:
     * Delete the actual image/video files
     * from Supabase Storage.
     */
    if (storagePaths.length > 0) {
      const {
        error: storageError,
      } =
        await admin.storage
          .from('skill-media')
          .remove(storagePaths);

      if (storageError) {
        throw storageError;
      }
    }

    /*
     * STEP 3:
     * Delete media database rows.
     */
    const {
      error: mediaDeleteError,
    } =
      await admin
        .from('skill_media')
        .delete()
        .eq('user_id', userId);

    if (mediaDeleteError) {
      throw mediaDeleteError;
    }

    /*
     * STEP 4:
     * Delete the user's Supabase Auth account.
     *
     * Any tables configured with ON DELETE CASCADE
     * from auth.users/profile should be cleaned up too.
     */
    const {
      error: deleteUserError,
    } =
      await admin.auth.admin.deleteUser(
        userId
      );

    if (deleteUserError) {
      throw deleteUserError;
    }

    return new Response(
      JSON.stringify({
        success: true,
      }),
      {
        status: 200,
        headers: {
          'Content-Type':
            'application/json',
        },
      }
    );
  } catch (error) {
    console.error(
      'DELETE ACCOUNT ERROR:',
      error
    );

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Could not delete account',
      }),
      {
        status: 500,
        headers: {
          'Content-Type':
            'application/json',
        },
      }
    );
  }
});