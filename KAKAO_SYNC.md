# Kakao Login Profile Sync - Implementation Summary

## 📌 변경 사항 요약

카카오 로그인 시 프로필 사진과 닉네임이 자동으로 동기화되도록 시스템을 개선했습니다. 카카오가 제공하는 데이터는 로그인을 할 때마다 최신 상태로 강제 업데이트(Strict Overwrite)됩니다.

### 🔄 동작 방식

#### 1. **최초 로그인 (First Login)**
```
User → Kakao OAuth → Callback Handler
                      ↓
         Check if user exists in DB
                      ↓ (Not Found)
         INSERT into users table:
         - id (from auth)
         - kakao_id
         - nickname (from Kakao)
         - profile_img (from Kakao)
         - email (from Kakao)
         - real_name = '' (empty)
```

#### 2. **재방문 로그인 (Subsequent Logins)**
```
User → Kakao OAuth → Callback Handler
                      ↓
         Check if user exists in DB
                      ↓ (Found)
         STRICT UPDATE (Overwrite):
         - email (synced from Kakao)
         - nickname (synced from Kakao)
         - profile_img (synced from Kakao)
         - kakao_id (refreshed)
         - updated_at (timestamp)
```

### 📝 수정된 파일

#### `src/app/auth/callback/route.ts` & `supabase/execute_me_final.sql` 트리거
**변경 내용:**
- Kakao 프로필 데이터 추출 로직 최적화
- 사용자 존재 여부 확인 후 **강제 덮어쓰기(Strict Overwrite)** 적용

### 🔒 데이터 정책

| 필드 | 최초 로그인 | 재로그인 | 사용자 수정 가능 | 비고 |
|------|------------|---------|----------------|------|
| `email` | Kakao → DB | Kakao → DB (덮어쓰기) | ❌ | 카카오 데이터 우선 |
| `profile_img` | Kakao → DB | Kakao → DB (덮어쓰기) | ❌ | 카카오 데이터 우선 |
| `nickname` | Kakao → DB | Kakao → DB (덮어쓰기) | ❌ | 카카오 값 고정 (수정 불가) |
| `kakao_id` | Kakao → DB | Kakao → DB (갱신) | ❌ | 고유 식별값 |

### ⚠️ 중요 참고사항

   - 사용자가 카카오톡에서 프로필 사진을 변경하면 다음 로그인 시 앱에 자동 반영됩니다.

2. **닉네임 중복 허용**
   - 시스템은 카카오 고유 ID(`kakao_id`)를 기준으로 사용자를 구분합니다. 따라서 닉네임이 다른 사용자와 중복되어도 가입 및 이용에 아무런 문제가 없습니다.

### 🧪 테스트 시나리오

#### 시나리오 1: 신규 사용자
1. Kakao 로그인
2. DB에 사용자 생성 (profile_img, nickname, email 저장)
3. 온보딩 페이지로 이동하여 추가 정보 입력

#### 시나리오 2: 카카오 프로필 변경 후 재로그인
1. 카카오톡에서 프로필 사진 변경
2. 앱에서 로그아웃 후 재로그인
3. DB의 `profile_img`가 새 이미지로 강제 업데이트됨

#### 시나리오 3: 닉네임 수동 변경 시도
1. 앱 내 설정 페이지에서 닉네임 수정을 시도함
2. 시스템 정책에 의해 수정이 차단됨 (카카오 프로필 연동)
3. 로그아웃 후 재로그인 시에도 카카오의 최신 닉네임이 유지됨
4. 결론: 카카오 닉네임이 유일한 기준 (Strict Source of Truth)

---
**상태**: ✅ 적용 완료 및 동기화 정책 수립
