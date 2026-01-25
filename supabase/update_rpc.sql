-- Update RPC to include golf_experience
DROP FUNCTION IF EXISTS get_member_list_with_distance(UUID, INT);

CREATE OR REPLACE FUNCTION get_member_list_with_distance(query_user_id UUID, max_depth INT DEFAULT 5)
RETURNS TABLE (
    id UUID,
    nickname TEXT,
    real_name TEXT,
    job TEXT,
    profile_img TEXT,
    manner_score FLOAT,
    golf_experience TEXT,      -- Added this
    distance INT,
    is_blocked BOOLEAN
) AS $$
DECLARE
BEGIN
    RETURN QUERY
    WITH RECURSIVE bfs_tree AS (
        SELECT 
            u.id, 
            0 AS dist
        FROM public.users u
        WHERE u.id = query_user_id
        
        UNION ALL
        
        SELECT 
            CASE 
                WHEN r.user_id = b.id THEN r.friend_id 
                ELSE r.user_id 
            END AS id,
            b.dist + 1
        FROM public.relationships r
        JOIN bfs_tree b ON (r.user_id = b.id OR r.friend_id = b.id)
        WHERE 
            r.status = 'accepted'
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
        COALESCE(u.profile_img, '') as profile_img,
        u.manner_score,
        u.golf_experience,
        sp.dist as distance,
        EXISTS (
            SELECT 1 FROM public.blocks b 
            WHERE (b.blocker_id = query_user_id AND b.blocked_id = u.id)
               OR (b.blocker_id = u.id AND b.blocked_id = query_user_id)
        ) as is_blocked
    FROM public.users u
    LEFT JOIN shortest_paths sp ON u.id = sp.id
    WHERE 
        (sp.dist IS NOT NULL OR true)
    ORDER BY 
        CASE WHEN sp.dist IS NULL THEN 999 ELSE sp.dist END ASC, 
        u.manner_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Grant execute to auth users
GRANT EXECUTE ON FUNCTION get_member_list_with_distance TO authenticated;
