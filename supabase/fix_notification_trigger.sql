CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'pending' THEN
        INSERT INTO public.notifications (receiver_id, type, sender_id, title, content)
        VALUES (NEW.friend_id, 'like_received', NEW.user_id, '새로운 1촌 신청', '회원님께 1촌 신청이 도착했습니다!');
    ELSIF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
         INSERT INTO public.notifications (receiver_id, type, sender_id, title, content)
         VALUES (NEW.user_id, 'like_accepted', NEW.friend_id, '1촌 신청 수락', '회원님의 1촌 신청이 수락되었습니다.');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
