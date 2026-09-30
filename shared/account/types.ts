/** What the session cookie carries; enough to render the header without a database read. */
export interface SessionUser {
  id: string
  username: string
}

export interface PublicUser extends SessionUser {
  createdAt: number
  /** When the username may change again; null means now. */
  renameAvailableAt: number | null
}
