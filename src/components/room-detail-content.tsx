"use client";

import { useState, useEffect, useCallback } from "react";
import {
  joinEvent,
  leaveEvent,
  inviteParticipant,
  holdSlot,
  releaseSlot,
} from "@/actions/event-actions";
import InviteModal from "@/components/invite-modal";
import RoomInfoPopup from "@/components/room-info-popup";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import confetti from "canvas-confetti";
import { Lock, Unlock } from "lucide-react";

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
}

export default function RoomDetailContent({
  event,
  participants,
  currentUser: authUser,
  roomHostId,
  isRoomHost,
  isJoined,
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
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [isJoinConfirmOpen, setIsJoinConfirmOpen] = useState(false);
  const [holdConfirmSlot, setHoldConfirmSlot] = useState<number | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Show info popup on first visit to room detail
  useEffect(() => {
    const popupKey = `hasSeenRoomInfoPopup_${event.id}_${roomIndex}`;
    const hasSeenPopup = localStorage.getItem(popupKey);
    if (!hasSeenPopup) {
      setShowInfoPopup(true);
      localStorage.setItem(popupKey, "true");
    }
  }, [event.id, roomIndex]);

  useEffect(() => {
    if (authUser) {
      const fetchUser = async () => {
        const { data } = await supabase
          .from("users")
          .select("id, is_admin")
          .eq("id", authUser.id)
          .single();
        if (data) setUserData(data);
      };
      fetchUser();
    }
  }, [authUser, supabase]);

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

  const confirmJoin = async () => {
    setIsJoinConfirmOpen(false);
    try {
      const roomNumber = roomIndex + 1;
      const result = await joinEvent(event.id, roomNumber);
      if (result && result.pointsAwarded) {
        alert(`축하합니다. ${result.pointsAwarded}포인트가 시상되었습니다`);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#FFE400", "#FFBD00", "#E89400", "#FFCA6C", "#FDFFB8"],
        });
      }
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

    // Check if user can hold/release (either room host or admin)
    const canManageSlot = isRoomHost || userData?.is_admin;

    if (canManageSlot) {
      setHoldConfirmSlot(slotIndex);
    } else if (!isJoined) {
      // Regular user clicking empty slot - open join modal
      handleJoinClick();
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

  const TimeDisplay = ({
    joinedAt,
    onExpire,
  }: {
    joinedAt: string;
    onExpire: () => void;
  }) => {
    const [left, setLeft] = useState("");
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
      const checkExpiration = () => {
        const deadline = new Date(
          new Date(joinedAt).getTime() + 3 * 60 * 60 * 1000,
        );
        const now = new Date();
        const diff = deadline.getTime() - now.getTime();

        if (diff <= 0) {
          setLeft("만료됨");
          if (!isExpired) {
            setIsExpired(true);
            onExpire();
          }
          return true;
        } else {
          const h = Math.floor(diff / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((diff % (1000 * 60)) / 1000);
          setLeft(`${h}:${m < 10 ? "0" + m : m}:${s < 10 ? "0" + s : s}`);
          return false;
        }
      };

      if (checkExpiration()) return;

      const timer = setInterval(() => {
        if (checkExpiration()) {
          clearInterval(timer);
        }
      }, 1000);
      return () => clearInterval(timer);
    }, [joinedAt, isExpired, onExpire]);

    return (
      <span
        className={`font-mono font-bold text-xs ${isExpired ? "text-gray-500" : "text-red-500"}`}
      >
        {left}
      </span>
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
      {/* Event Title */}
      <div className="text-center mb-6 px-4">
        <h2 className="text-xl font-black text-white leading-relaxed tracking-tight break-keep border-b border-white/10 pb-4">
          {event.title}
        </h2>
      </div>

      {/* Action Buttons for joined users */}
      <div className="flex items-center mb-6 gap-2 w-full">
        {isJoined && (
          <>
            <button
              onClick={() => setIsInviteOpen(true)}
              className="flex-1 text-[15px] bg-blue-600 text-white py-4 rounded-2xl font-black border border-white/10 active:scale-95 transition-all shadow-[0_4px_12px_rgba(37,99,235,0.3)] tracking-tight hover:bg-blue-500"
            >
              초대하기
            </button>
            <button
              onClick={() => alert("준비중입니다.")}
              className="flex-1 text-[15px] bg-yellow-500 text-black py-4 rounded-2xl font-black border border-yellow-500/20 active:scale-95 transition-all shadow-[0_4px_12px_rgba(234,179,8,0.3)] tracking-tight hover:bg-yellow-400"
            >
              방옮기기
            </button>
            <button
              onClick={async () => {
                if (
                  confirm(
                    "정말 방을 나가시겠습니까?\n\n⚠️ 매너 -20, 포인트 -20이 차감됩니다.\n(다시 재신청은 가능합니다)",
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
        )}
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
          const canJoinThisSlot = !isJoined && (!isHeld || isInvitedHere);

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
                    : "border-dashed border-white/5 bg-white/[0.01] hover:bg-white/[0.03]"
              }`}
            >
              {slot ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="w-16 h-16 bg-[#2c2c2e] rounded-[22px] mb-4 overflow-hidden border border-white/10 shadow-inner translate-y-0 group-hover:-translate-y-1 transition-transform active:scale-90 relative z-10">
                    {slot.user?.profile_img ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={slot.user.profile_img}
                          className="object-cover"
                          alt=""
                          fill
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl opacity-20 grayscale">
                        👤
                      </div>
                    )}
                    {slot.user_id === roomHostId && (
                      <div className="absolute -top-1 -right-1 text-lg z-20 drop-shadow-md">
                        👑
                      </div>
                    )}
                  </div>
                  <div className="text-center w-full px-2 relative z-10">
                    <div className="font-black text-[15px] text-white truncate tracking-tighter leading-none">
                      {slot.user?.nickname}
                    </div>
                    {slot.user?.job && (
                      <div className="text-[10px] text-white/30 font-black truncate uppercase tracking-[0.2em] mt-2 mb-1">
                        {slot.user.job}
                      </div>
                    )}
                    {slot.payment_status !== "paid" && (
                      <div className="mt-2 bg-red-500/10 px-3 py-1 rounded-full inline-flex items-center gap-1.5 border border-red-500/10 shadow-lg">
                        <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></div>
                        <TimeDisplay
                          joinedAt={slot.joined_at}
                          onExpire={async () => {
                            try {
                              const { expireParticipant } =
                                await import("@/actions/event-actions");
                              await expireParticipant(event.id, slot.user_id);
                            } catch (e) {
                              console.error("Failed to expire participant:", e);
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {isRoomHost && slot.user_id !== authUser?.id && (
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

                  {slot.user_id === event.host_id && (
                    <span className="absolute top-5 left-5 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)] z-20"></span>
                  )}
                </>
              ) : isHeld ? (
                <div className="flex flex-col items-center justify-center text-yellow-500/50 gap-2">
                  <Lock size={28} className="text-yellow-500/60" />
                  <span className="text-[11px] font-black uppercase tracking-widest">
                    Reserved
                  </span>
                  {isInvitedHere && (
                    <span className="text-[10px] text-blue-400 font-bold mt-1 animate-pulse">
                      초대됨 - 클릭하여 참가
                    </span>
                  )}
                  {(isRoomHost || userData?.is_admin) && (
                    <span className="text-[9px] text-white/30 mt-1">
                      클릭하여 홀드 해제
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
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-30">
                      Available
                    </span>
                    {isJoined ? (
                      <span className="text-[9px] text-blue-500/40 font-black mt-2 tracking-widest uppercase">
                        (JOINED)
                      </span>
                    ) : (
                      <span className="text-[9px] text-green-400/60 font-bold mt-2">
                        클릭하여 조인
                      </span>
                    )}
                    {(isRoomHost || userData?.is_admin) && (
                      <span className="text-[9px] text-yellow-500/50 mt-1 flex items-center gap-1">
                        <Lock size={10} /> 홀드 가능
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Popup */}
      <RoomInfoPopup
        isOpen={showInfoPopup}
        onClose={() => setShowInfoPopup(false)}
      />

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
                <li>• 조인 신청 후 3시간 내 결제해 주세요</li>
                <li>• 3시간이내 방나가기 매너 -20, 포인트 -20</li>
                <li>• 3시간초과 방치할 경우 매너 -30, 포인트 -30</li>
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
                  <Lock size={40} className="text-yellow-500 mx-auto mb-3" />
                  <h3 className="text-xl font-black text-white">슬롯 홀드</h3>
                  <p className="text-white/60 text-sm mt-2">
                    이 슬롯을 초대할 분을 위해 홀드하시겠습니까?
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
    </div>
  );
}
