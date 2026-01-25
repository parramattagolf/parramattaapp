-- Create or replace the function to get network members with distance
CREATE OR REPLACE FUNCTION get_member_list_with_distance(query_user_id UUID, max_depth INT)
RETURNS TABLE (
    id UUID,
    nickname TEXT,
    real_name TEXT,
    profile_img TEXT,
    job TEXT,
    manner_score FLOAT,
    golf_experience TEXT,
    distance INT,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    -- Variable to hold the recursion depth
    depth INT := 1;
BEGIN
    -- We will use a temporary table to store the results of BFS
    CREATE TEMP TABLE IF NOT EXISTS temp_network (
        member_id UUID,
        dist INT
    ) ON COMMIT DROP;

    -- Initialize with 1st degree connections (direct friends)
    INSERT INTO temp_network (member_id, dist)
    SELECT contact_id, 1
    FROM contacts
    WHERE user_id = query_user_id
    UNION
    SELECT user_id, 1
    FROM contacts
    WHERE contact_id = query_user_id;

    -- Loop to find further connections up to max_depth
    -- (Simplified for this specific custom function, assuming we just need direct 1-chon for now or basic recursive logic is sufficient. 
    --  For a full graph traversal, a recursive CTE is better, but here we can stick to a simple recursive CTE implementation for correctness)
    
    RETURN QUERY
    WITH RECURSIVE network_graph AS (
        -- Base case: 1st degree connections
        SELECT
            c.contact_id AS connected_to,
            1 AS dist
        FROM contacts c
        WHERE c.user_id = query_user_id
        UNION
        SELECT
            c.user_id AS connected_to,
            1 AS dist
        FROM contacts c
        WHERE c.contact_id = query_user_id
        
        UNION
        
        -- Recursive step
        SELECT
            CASE 
                WHEN c.user_id = ng.connected_to THEN c.contact_id 
                ELSE c.user_id 
            END AS connected_to,
            ng.dist + 1
        FROM contacts c
        JOIN network_graph ng ON (c.user_id = ng.connected_to OR c.contact_id = ng.connected_to)
        WHERE ng.dist < max_depth
          AND (CASE WHEN c.user_id = ng.connected_to THEN c.contact_id ELSE c.user_id END) <> query_user_id -- Don't circle back to self
    )
    SELECT DISTINCT ON (m.id)
        m.id,
        m.nickname,
        m.real_name,
        COALESCE(m.profile_img, m.avatar_url) as profile_img, -- Fallback to avatar_url if profile_img is null
        m.job,
        m.manner_score,
        m.golf_experience,
        ng.dist AS distance,
        m.created_at
    FROM network_graph ng
    JOIN members m ON ng.connected_to = m.id
    ORDER BY m.id, ng.dist ASC; -- Get the shortest distance for each member

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
