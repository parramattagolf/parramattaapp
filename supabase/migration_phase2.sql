-- Add Style Preferences to Users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS partner_style_preference TEXT[],
ADD COLUMN IF NOT EXISTS partner_style_avoid TEXT[];

-- Function to check onboarding status (simple check if essential fields exist)
-- We can also use a boolean flag if we want to be explicit, but ensuring data integrity is better.
-- Let's just rely on the 'real_name' or 'job' being present since they are part of onboarding.
-- Or better, let's create a View or helper.

-- 2. Advanced Kinship Function (BFS for N-Chon)
-- This function calculates the shortest path (chon) from current_user_id to all other users.
DROP FUNCTION IF EXISTS get_member_list_with_distance;

CREATE OR REPLACE FUNCTION get_member_list_with_distance(query_user_id UUID, max_depth INT DEFAULT 5)
RETURNS TABLE (
    id UUID,
    nickname TEXT,
    real_name TEXT,
    job TEXT,
    avatar_url TEXT,
    manner_score FLOAT,
    distance INT,
    is_blocked BOOLEAN
) AS $$
DECLARE
    -- We'll use a temp table or recursive CTE
BEGIN
    RETURN QUERY
    WITH RECURSIVE bfs_tree AS (
        -- Base Case: The user themselves (Distance 0)
        SELECT 
            u.id, 
            0 AS dist
        FROM public.users u
        WHERE u.id = query_user_id
        
        UNION ALL
        
        -- Recursive Step
        SELECT 
            CASE 
                WHEN r.user_id = b.id THEN r.friend_id 
                ELSE r.user_id 
            END AS id,
            b.dist + 1
        FROM public.relationships r
        JOIN bfs_tree b ON (r.user_id = b.id OR r.friend_id = b.id)
        WHERE 
            r.status = 'accepted' -- Only count accepted 1-chon friends
            AND b.dist < max_depth
    ),
    shortest_paths AS (
        SELECT 
            s.id, 
            MIN(s.dist) as dist
        FROM bfs_tree s
        GROUP BY s.id
    )
    SELECT 
        u.id,
        u.nickname,
        u.real_name,
        u.job,
        COALESCE(u.avatar_url, '') as avatar_url,
        u.manner_score,
        sp.dist as distance,
        EXISTS (
            SELECT 1 FROM public.blocks b 
            WHERE (b.blocker_id = query_user_id AND b.blocked_id = u.id)
               OR (b.blocker_id = u.id AND b.blocked_id = query_user_id)
        ) as is_blocked
    FROM public.users u
    LEFT JOIN shortest_paths sp ON u.id = sp.id
    WHERE 
        u.id <> query_user_id -- Exclude self from result list naturally? or keep? usually exclude.
        AND (sp.dist IS NOT NULL OR true) -- Show everyone? OR only connected? 
        -- Request implies "Member List" so likely everyone, but show distance if connected.
        -- If query wants ALL members with distance info:
        -- Join shortest_paths. If null, distance is NULL (Infinity/Unknown).
    ORDER BY 
        CASE WHEN sp.dist IS NULL THEN 999 ELSE sp.dist END ASC, 
        u.manner_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Grant execute to auth users
GRANT EXECUTE ON FUNCTION get_member_list_with_distance TO authenticated;
