// Better Auth 类型扩展
import type { auth } from '@/lib/auth'
import type { authClient } from '@/lib/auth-client'

// 从服务端auth实例推断类型
export type Session = typeof auth.$Infer.Session

// 从客户端authClient推断类型
export type ClientSession = typeof authClient.$Infer.Session

// useSession hook 的返回类型
export type UseSessionReturn = {
  data: ClientSession | null
  isPending: boolean
  error: Error | null
  refetch: () => Promise<void>
}