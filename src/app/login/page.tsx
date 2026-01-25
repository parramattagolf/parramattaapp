
import { redirect } from 'next/navigation'

export default function LoginPage() {
  // /login 접속 시 무조건 메인(/)으로 리다이렉트
  redirect('/')
}
