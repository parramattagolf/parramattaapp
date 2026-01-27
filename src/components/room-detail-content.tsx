"use client";

import { useState, useEffect, useCallback } from "react";
import {
  joinEvent,
  leaveEvent,
  inviteParticipant,
  holdSlot,
  releaseSlot,
  moveRoom,
} from "@/actions/event-actions";
import InviteModal from "@/components/invite-modal";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lock, Unlock, AlertCircle, HelpCircle } from "lucide-react";

interface Participant {
  id: string;
  user_id: string;
  event_id: string;
  joined_at: string;
  payment_status: string;
  group_no?: number;
  user: {
    id: string;
    nickname: string;
    profile_img: string;
    job?: string;
  };
}

interface UserData {
  id: string;
  is_admin?: boolean;
}

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface Event {
  id: string;
  title?: string;
  host_id: string;
  max_participants: number;
  start_date?: string;
  course_name?: string;
  location?: string;
}

interface HeldSlot {
  event_id: string;
  group_no: number;
  slot_index: number;
  held_by: string;
  invited_user_id?: string;
  created_at: string;
  holder?: { nickname: string };
}

export default function RoomDetailContent({
  event,
  participants,
  currentUser: authUser,
  roomHostId,
  // isRoomHost, // Unused
  // isJoined,   // Unused
  roomIndex,
}: {
  event: Event;
  participants: Participant[];
  currentUser: User | null;
  roomHostId: string | null;
  isRoomHost: boolean;
  isJoined: boolean;
  roomIndex: number;
}) {
  const [slots, setSlots] = useState<(Participant | null)[]>([]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [heldSlots, setHeldSlots] = useState<HeldSlot[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isJoinConfirmOpen, setIsJoinConfirmOpen] = useState(false);
  const [isMoveRoomOpen, setIsMoveRoomOpen] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [holdConfirmSlot, setHoldConfirmSlot] = useState<number | null>(null);
  const router = useRouter();
  const supabase = createClient();



  const [localUser, setLocalUser] = useState<User | null>(authUser);
  
  // Recalculate isJoined based on localUser
  const localIsJoined = participants.some(p => p.user_id === localUser?.id);
  const localIsRoomHost = localUser?.id === roomHostId;

  useEffect(() => {
    const syncUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            // Map Supabase user to our User interface if needed, or just cast/use
            setLocalUser(user as User);
        }
    };
    syncUser();
  }, [supabase]);

  useEffect(() => {
    if (localUser) {
      const fetchUser = async () => {
        const { data } = await supabase
          .from("users")
          .select("id, is_admin")
          .eq("id", localUser.id)
          .single();
        if (data) setUserData(data);
      };
      fetchUser();
    }
  }, [localUser, supabase]);

  // Define fetchHeldSlots as a useCallback to be reused
  const fetchHeldSlots = useCallback(async () => {
    const { getHeldSlots } = await import("@/actions/event-actions");
    const data = await getHeldSlots(event.id);
    setHeldSlots(data || []);
  }, [event.id]);

  useEffect(() => {
    fetchHeldSlots();
  }, [fetchHeldSlots, participants]);

  useEffect(() => {
    // Subscribe to held slots changes
    const channel = supabase
      .channel(`held_slots_room_${roomIndex}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "held_slots",
          filter: `event_id=eq.${event.id}`,
        },
        () => {
          fetchHeldSlots();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [event.id, supabase, roomIndex, fetchHeldSlots]);

  useEffect(() => {
    // Filter participants by group_no (roomIndex is 0-based, group_no is 1-based)
    const roomNumber = roomIndex + 1;
    const roomMembers = participants.filter(
      (p) => (p.group_no || 1) === roomNumber,
    );

    // Sort by join time to keep stable order
    roomMembers.sort(
      (a, b) =>
        new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime(),
    );

    // Calculate how many slots this room should show
    const max = event.max_participants || 4;
    const slotsUsedBefore = roomIndex * 4;
    const slotsForThisRoom = Math.min(4, max - slotsUsedBefore);

    // Create slots for this room
    const roomSlots: (Participant | null)[] = [];
    for (let i = 0; i < slotsForThisRoom; i++) {
      roomSlots.push(roomMembers[i] || null);
    }

    setSlots(roomSlots);
  }, [participants, roomIndex, event.max_participants]);

  useEffect(() => {
    const channel = supabase
      .channel(`room_participants_${roomIndex}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "participants",
          filter: `event_id=eq.${event.id}`,
        },
        () => {
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, event.id, router, roomIndex]);

  const handleJoinClick = () => {
    setIsJoinConfirmOpen(true);
  };

  const handleMoveRoom = async (targetRoom: number) => {
    if (isMoving) return;
    setIsMoving(true);
    try {
      const result = await moveRoom(event.id, targetRoom);
      if (result.success) {
        alert(result.message);
        setIsMoveRoomOpen(false);
        router.push(`/rounds/${event.id}/rooms/${targetRoom}`);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "이동 실패");
    } finally {
      setIsMoving(false);
    }
  };

  const confirmJoin = async () => {
    setIsJoinConfirmOpen(false);
    try {
      const roomNumber = roomIndex + 1;
      await joinEvent(event.id, roomNumber);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(
        "참가 실패: " +
          (error instanceof Error ? error.message : "알 수 없는 오류"),
      );
    }
  };

  const handleInvite = async (friendId: string) => {
    setIsInviteOpen(false);
    try {
      const roomNumber = roomIndex + 1;
      const result = await inviteParticipant(event.id, friendId, roomNumber);
      if (result.message) {
        alert(result.message);
      }
    } catch (e: unknown) {
      const error = e as Error;
      alert(error.message || "초대 실패");
    }
  };

  // Handle slot click - either hold, release, or join
  const handleSlotClick = (
    slotIndex: number,
    isHeld: boolean,
    canJoin: boolean,
  ) => {
    if (canJoin) {
      handleJoinClick();
      return;
    }

    // Check if user can hold/release (anyone joined can hold if it's empty, holder or admin can release)
    const canHoldSlot = localIsJoined || userData?.is_admin;
    const heldSlot = heldSlots.find(s => s.group_no === roomIndex + 1 && s.slot_index === slotIndex);
    const isHolder = heldSlot?.held_by === localUser?.id;
    const canReleaseSlot = isHolder || userData?.is_admin;

    if (isHeld) {
      if (canReleaseSlot) {
        setHoldConfirmSlot(slotIndex);
      }
    } else {
      if (canHoldSlot) {
        setHoldConfirmSlot(slotIndex);
      } else if (!localIsJoined) {
        handleJoinClick();
      }
    }
  };

  const confirmHoldAction = async (action: "hold" | "release") => {
    if (holdConfirmSlot === null) return;

    try {
      const roomNumber = roomIndex + 1;
      if (action === "hold") {
        const result = await holdSlot(event.id, roomNumber, holdConfirmSlot);
        if (result.success) {
          alert("슬롯이 홀드되었습니다.");
          await fetchHeldSlots();
        }
      } else {
        const result = await releaseSlot(event.id, roomNumber, holdConfirmSlot);
        if (result.success) {
          alert("홀드가 해제되었습니다.");
          await fetchHeldSlots();
        }
      }
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "작업 실패");
    } finally {
      setHoldConfirmSlot(null);
    }
  };

  const handleKick = async (userId: string) => {
    if (!confirm("정말 내보내시겠습니까?")) return;
    try {
      const { kickParticipant } = await import("@/actions/event-actions");
      const formData = new FormData();
      formData.append("eventId", event.id);
      formData.append("userId", userId);
      await kickParticipant(formData);
      router.refresh();
    } catch (error) {
      alert(
        "강퇴 실패: " +
          (error instanceof Error ? error.message : "알 수 없는 오류"),
      );
    }
  };



  const EventTimer = ({ targetDate, label, infoText, showSeconds = false }: { targetDate: Date; label: string; infoText?: string; showSeconds?: boolean }) => {
    const [timeLeft, setTimeLeft] = useState("");
    const [isExpired, setIsExpired] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    useEffect(() => {
      const calculateTimeLeft = () => {
        const now = new Date();
        const difference = targetDate.getTime() - now.getTime();

        if (difference <= 0) {
          setIsExpired(true);
          setTimeLeft(`${label} 마감`);
          return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        const d = String(days).padStart(2, '0');
        const h = String(hours).padStart(2, '0');
        const m = String(minutes).padStart(2, '0');
        const s = String(seconds).padStart(2, '0');

        if (showSeconds) {
          setTimeLeft(`${d}일 ${h}시간 ${m}분 ${s}초`);
        } else {
          setTimeLeft(`${d}일 ${h}시간 ${m}분`);
        }
      };

      calculateTimeLeft();
      const timer = setInterval(calculateTimeLeft, 1000); // Update every second

      return () => clearInterval(timer);
    }, [targetDate, label, showSeconds]);

    return (
      <div className="w-full">
        <div 
          className={`w-full py-2 flex items-center justify-between ${isExpired ? 'text-red-500' : 'text-blue-100'} cursor-pointer`}
          onClick={() => infoText && setShowInfo(!showInfo)}
        >
           <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${isExpired ? 'bg-red-500' : 'bg-blue-400 animate-pulse'}`} />
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-bold text-white/50">{label}</span>
                {infoText && <HelpCircle size={14} className="text-white/30" />}
              </div>
           </div>
           <span className={`text-[15px] font-black tracking-widest tabular-nums ${isExpired ? 'text-red-400' : 'text-blue-300'}`}>
              {timeLeft}
           </span>
        </div>
        {showInfo && infoText && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-2 text-center animate-in fade-in slide-in-from-top-1 duration-200">
            <p className="text-[13px] text-blue-300 font-bold tracking-tight">
              {infoText}
            </p>
          </div>
        )}
      </div>
    );
  };

  // Format date for display
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  // Determine if slot is held for current user (invited)
  const isInvitedToSlot = (heldSlot: HeldSlot | undefined) => {
    return heldSlot?.invited_user_id === userData?.id;
  };

  return (
    <div>



      {/* Action Buttons for all users (guarded) */}
      <div className="flex items-center mb-6 gap-2 w-full">
          <>
            <button
              onClick={() => {
                if (!localIsJoined) return alert("참가자만 이용할 수 있습니다.");
                setIsInviteOpen(true);
              }}
              className="flex-1 text-[15px] bg-blue-600 text-white py-4 rounded-2xl font-black border border-white/10 active:scale-95 transition-all shadow-[0_4px_12px_rgba(37,99,235,0.3)] tracking-tight hover:bg-blue-500"
            >
              초대하기
            </button>
            <button
              onClick={() => {
                if (!localIsJoined) return alert("참가자만 이용할 수 있습니다.");
                setIsMoveRoomOpen(true);
              }}
              className="flex-1 text-[15px] bg-yellow-500 text-black py-4 rounded-2xl font-black border border-yellow-500/20 active:scale-95 transition-all shadow-[0_4px_12px_rgba(234,179,8,0.3)] tracking-tight hover:bg-yellow-400"
            >
              방옮기기
            </button>
            <button
              onClick={async () => {
                if (!localIsJoined) return alert("참가자만 이용할 수 있습니다.");
                if (
                  confirm(
                    "정말 방을 나가시겠습니까?\n(다시 재신청은 가능합니다)",
                  )
                ) {
                  try {
                    const result = await leaveEvent(event.id);
                    if (result.message) {
                      alert(result.message);
                    }
                    if (result.redirectUrl) {
                      router.push(result.redirectUrl);
                    }
                  } catch {
                    alert("방 나가기 실패");
                  }
                }
              }}
              className="flex-1 text-[15px] bg-red-600 text-white py-4 rounded-2xl font-black border border-red-500/20 active:scale-95 transition-all shadow-[0_4px_12px_rgba(239,68,68,0.3)] tracking-tight hover:bg-red-500"
            >
              방나가기
            </button>
          </>
      </div>

      {/* Slots Grid */}
      <div className="grid grid-cols-2 gap-4">
        {slots.map((slot, i) => {
          const globalIndex = roomIndex * 4 + i;
          const isSlotValid = globalIndex < (event.max_participants || 4);
          if (!isSlotValid) return null;

          const heldSlot = heldSlots.find(
            (s) => s.group_no === roomIndex + 1 && s.slot_index === i,
          );
          const isHeld = !!heldSlot;
          const isInvitedHere = isInvitedToSlot(heldSlot);
          const canJoinThisSlot = !localIsJoined && (!isHeld || isInvitedHere);


          return (
            <div
              key={i}
              onClick={() => {
                if (!slot) {
                  handleSlotClick(i, isHeld, canJoinThisSlot);
                } else {
                  router.push(`/members/${slot.user_id}`);
                }
              }}
              className={`aspect-square rounded-[36px] border transition-all duration-500 flex flex-col items-center justify-center p-6 relative group overflow-hidden cursor-pointer ${
                slot
                  ? "border-white/10 bg-[#1c1c1e] shadow-2xl scale-100"
                  : isHeld
                    ? "border-yellow-500/50 bg-yellow-500/5 shadow-[0_0_20px_rgba(234,179,8,0.1)] hover:bg-yellow-500/10"
                  : "border-green-500/40 bg-green-500/[0.03] hover:bg-green-500/[0.08]"
              }`}
            >
              {slot ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  {slot.user_id === roomHostId && (
                    <div className="absolute top-4 left-4 bg-yellow-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded-[5px] z-20 shadow-lg tracking-tighter ring-1 ring-black/10">
                      방장
                    </div>
                  )}
                  <div className={`w-16 h-16 aspect-square rounded-[22px] mb-4 overflow-hidden border shadow-inner translate-y-0 group-hover:-translate-y-1 transition-transform active:scale-90 relative z-10 ${slot.payment_status === 'paid' ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.4)] ring-2 ring-emerald-500/20 bg-[#2c2c2e]' : 'border-white/10 bg-[#2c2c2e]'}`}>
                    {slot.user?.profile_img ? (
                      <Image
                        src={slot.user.profile_img}
                        className="w-full h-full object-cover"
                        alt=""
                        width={64}
                        height={64}
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl opacity-20 grayscale">
                        👤
                      </div>
                    )}

                  </div>
                  <div className="text-center w-full px-2 relative z-10 space-y-1.5">
                    <div className="font-black text-[15px] text-white truncate tracking-tighter leading-none">
                      {slot.user?.nickname}
                    </div>
                    
                    {slot.payment_status === 'paid' ? (
                       <div className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                          <span className="text-[10px] font-bold text-emerald-400 tracking-tight">결제완료</span>
                       </div>
                    ) : (
                       <div className="text-[11px] font-bold text-red-400/80 tracking-tight">
                          미결제
                       </div>
                    )}

                  </div>

                    {localIsRoomHost && slot.user_id !== localUser?.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleKick(slot.user_id);
                      }}
                      className="absolute top-4 right-4 text-white/10 hover:text-red-500 font-black p-2 text-2xl leading-none active:scale-75 transition-all z-20"
                    >
                      &times;
                    </button>
                  )}


                </>
              ) : isHeld ? (
                <div className="flex flex-col items-center justify-center text-yellow-500/50 gap-1 w-full relative h-full">
                  {/* Holder Nickname Badge */}
                  <div className="absolute top-4 left-4 bg-white text-black text-[10px] font-black px-2.5 py-1 rounded-[6px] z-20 shadow-xl tracking-tighter ring-1 ring-black/5 flex items-center gap-1.5">
                    <span className="opacity-30 text-[8px] font-black">BY</span>
                    <span>{heldSlot.holder?.nickname || 'Unknown'}</span>
                  </div>

                  <div className="bg-yellow-500/10 p-3 rounded-2xl border border-yellow-500/10 mb-1 group-hover:scale-110 transition-transform">
                    <Lock size={20} className="text-yellow-500/60" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500/80">
                    Reserved
                  </span>
                  

                  {isInvitedHere && (
                    <span className="text-[10px] text-blue-400 font-bold mt-2 bg-blue-500/10 px-2 py-0.5 rounded-full animate-pulse border border-blue-500/20">
                      초대됨 - 클릭하여 참가
                    </span>
                  )}
                  {(heldSlot?.held_by === localUser?.id || userData?.is_admin) && (
                    <span className="text-[9px] text-white/30 absolute bottom-3 uppercase font-black tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to release
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-full">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/5 shadow-inner group-hover:bg-white/10 transition-colors">
                    <span className="text-2xl font-extralight text-white/30">
                      +
                    </span>
                  </div>
                  <div className="flex flex-col items-center mt-3">
                    <span className="text-[13px] font-black text-white/30 tracking-tight">
                      조인하기
                    </span>
                    {(localIsJoined || userData?.is_admin) && !isHeld && (
                      <span className="text-[11px] text-yellow-500/50 mt-1 flex items-center gap-1 font-bold">
                        <Lock size={12} /> 홀드 가능
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Deadlines Timer */}
      {event.start_date && (
         <div className="mt-8 space-y-1">
            <EventTimer 
               label="매너예약" 
               targetDate={new Date(new Date(event.start_date).getTime() - 14 * 24 * 60 * 60 * 1000)} 
               infoText="마감 전 예약 시 매너점수 10점 적립!"
            />
            <EventTimer 
               label="임박예약" 
               targetDate={new Date(new Date(event.start_date).getTime() - 10 * 24 * 60 * 60 * 1000)} 
            />
            <EventTimer 
               label="결제 마감까지" 
               targetDate={new Date(new Date(event.start_date).getTime() - 7 * 24 * 60 * 60 * 1000)} 
               showSeconds={true}
            />
         </div>
      )}

      {/* Invite Modal */}
      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onInvite={handleInvite}
        eventId={event.id}
      />

      {/* Join Confirmation Modal */}
      {isJoinConfirmOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setIsJoinConfirmOpen(false)}
        >
          <div
            className="bg-[#1c1c1e] rounded-3xl p-6 max-w-sm w-full border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-black text-white mb-4 text-center">
              조인 신청
            </h3>

            {/* Event Info */}
            <div className="bg-white/5 rounded-2xl p-4 mb-4 space-y-2">
              <div className="text-sm text-white/60">
                <span className="font-bold">📌 주제:</span>{" "}
                <span className="text-white">{event.title}</span>
              </div>
              <div className="text-sm text-white/60">
                <span className="font-bold">📅 날짜:</span>{" "}
                <span className="text-white">
                  {formatDate(event.start_date)}
                </span>
              </div>
              <div className="text-sm text-white/60">
                <span className="font-bold">📍 장소:</span>{" "}
                <span className="text-white">{event.course_name || event.location || '미정'}</span>
              </div>
            </div>

            {/* Caution */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6">
              <p className="text-[13px] text-red-400 font-bold mb-2">
                ⚠️ 주의사항
              </p>
              <ul className="text-[12px] text-white/60 space-y-1">
                <li>• 신청 후 개인 사정으로 불참 시 꼭 알려주세요</li>
                <li>• 무단 불참(노쇼) 시 서비스 이용이 제한될 수 있습니다</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsJoinConfirmOpen(false)}
                className="flex-1 py-3 rounded-xl bg-white/10 text-white/60 font-bold active:scale-95 transition-all"
              >
                취소
              </button>
              <button
                onClick={confirmJoin}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-black active:scale-95 transition-all shadow-lg"
              >
                조인 신청
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hold Confirmation Modal */}
      {holdConfirmSlot !== null && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setHoldConfirmSlot(null)}
        >
          <div
            className="bg-[#1c1c1e] rounded-3xl p-6 max-w-sm w-full border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {heldSlots.find(
              (s) =>
                s.group_no === roomIndex + 1 &&
                s.slot_index === holdConfirmSlot,
            ) ? (
              <>
                <div className="text-center mb-6">
                  <Unlock size={40} className="text-yellow-500 mx-auto mb-3" />
                  <h3 className="text-xl font-black text-white">홀드 해제</h3>
                  <p className="text-white/60 text-sm mt-2">
                    이 슬롯의 홀드를 해제하시겠습니까?
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setHoldConfirmSlot(null)}
                    className="flex-1 py-3 rounded-xl bg-white/10 text-white/60 font-bold active:scale-95 transition-all"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => confirmHoldAction("release")}
                    className="flex-1 py-3 rounded-xl bg-yellow-500 text-black font-black active:scale-95 transition-all shadow-lg"
                  >
                    홀드 해제
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <Lock size={44} className="text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-xl font-black text-white tracking-tighter">슬롯 홀드</h3>
                  
                  <div className="mt-4 space-y-1">
                    <p className="text-white/80 text-[15px] font-bold">
                      초대할 분을 위해 슬롯을 선점하시겠습니까?
                    </p>
                    <p className="text-white/40 text-sm font-medium">
                      선점된 슬롯은 친구가 들어올 때까지 유지됩니다.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setHoldConfirmSlot(null)}
                    className="flex-1 py-3 rounded-xl bg-white/10 text-white/60 font-bold active:scale-95 transition-all"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => confirmHoldAction("hold")}
                    className="flex-1 py-3 rounded-xl bg-yellow-500 text-black font-black active:scale-95 transition-all shadow-lg"
                  >
                    홀드하기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* Move Room Modal */}
      {isMoveRoomOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-6"
          onClick={() => setIsMoveRoomOpen(false)}
        >
          <div 
            className="bg-[#1c1c1e] w-full max-w-sm rounded-[32px] overflow-hidden border border-white/10 shadow-2xl animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h3 className="text-lg font-black text-white">이동할 방 선택</h3>
              <button onClick={() => setIsMoveRoomOpen(false)} className="text-white/40 hover:text-white">&times;</button>
            </div>
            
            <div className="p-6 space-y-3">
              {(() => {
                const totalRooms = Math.ceil((event.max_participants || 4) / 4);
                const currentRoomNo = roomIndex + 1;
                const rooms = [];
                
                const currentRoomParticipants = participants.filter(p => (p.group_no || 1) === currentRoomNo);
                const isAlone = currentRoomParticipants.length === 1;

                let lowestEmptyRoom = -1;
                for (let i = 1; i <= totalRooms; i++) {
                  if (i === currentRoomNo) continue;
                  const roomParticipants = participants.filter(p => (p.group_no || 1) === i);
                  const isOccupied = roomParticipants.length > 0;
                  
                  if (isOccupied) {
                    // Always show occupied rooms (to join others)
                    if (roomParticipants.length < 4) {
                      rooms.push({ number: i, count: roomParticipants.length });
                    }
                  } else if (lowestEmptyRoom === -1) {
                    // Only allow moving to an empty room if it's a LOWER number than current (consolidation)
                    // or if not alone (to leave a crowd)
                    if (i < currentRoomNo || !isAlone) {
                      lowestEmptyRoom = i;
                    }
                  }
                }

                if (lowestEmptyRoom !== -1) {
                  rooms.push({ number: lowestEmptyRoom, count: 0 });
                }

                rooms.sort((a, b) => a.number - b.number);

                if (rooms.length === 0) {
                  return (
                    <div className="py-10 text-center">
                      <AlertCircle className="mx-auto text-white/20 mb-3" size={40} />
                      <p className="text-white/40 font-bold">옮길 수 있는 방이 없습니다.</p>
                    </div>
                  );
                }

                return rooms.map(room => (
                  <button
                    key={room.number}
                    onClick={() => handleMoveRoom(room.number)}
                    disabled={isMoving}
                    className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all active:scale-98 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400 font-black">
                        {room.number}
                      </div>
                      <span className="text-[15px] font-bold text-white/90">{room.number}번 조인방</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[...Array(4)].map((_, idx) => (
                          <div 
                            key={idx} 
                            className={`w-1.5 h-1.5 rounded-full ${idx < room.count ? 'bg-blue-500' : 'bg-white/10'}`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] font-black text-blue-400">{room.count}/4</span>
                    </div>
                  </button>
                ));
              })()}
            </div>
            
            <div className="p-6 pt-0">
               <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-2xl p-4">
                  <p className="text-[11px] text-yellow-500/70 leading-relaxed font-medium">
                    ⚠️ 방을 이동하면 현재 방에서 선점(홀드)한 슬롯은 자동으로 해제되며, 방장 권한은 다른 멤버에게 승계됩니다.
                  </p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
