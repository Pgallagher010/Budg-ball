import { useEffect, useMemo, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { AuthScreen } from "./components/AuthScreen.jsx"
import { Dashboard } from "./components/Dashboard.jsx"
import { getFirebaseAuth, isFirebaseClientConfigured } from "./firebase.js"

export function App() {
  // dev session is only active after the user explicitly chooses "Continue without Firebase"
  const [devSession, setDevSession] = useState(() => {
    try {
      const raw = localStorage.getItem("budgball_dev_session")
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  const [authMode, setAuthMode] = useState("firebase") // "firebase" | "dev"
  const [displayName, setDisplayName] = useState("Demo User")
  const [idToken, setIdToken] = useState("")
  const [firebaseUid, setFirebaseUid] = useState("")

  const canUseFirebase = useMemo(
    () => isFirebaseClientConfigured() && Boolean(getFirebaseAuth()),
    []
  )

  useEffect(() => {
    if (!canUseFirebase) return undefined
    const auth = getFirebaseAuth()
    if (!auth) return undefined
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIdToken("")
        setFirebaseUid("")
        // If they have no dev session either, they'll land on the auth screen.
        return
      }
      setIdToken(await user.getIdToken())
      setFirebaseUid(user.uid)
      // Firebase persists sessions in the browser; when a user is already signed in,
      // ensure we actually run in firebase mode on page load.
      setAuthMode("firebase")
    })
  }, [canUseFirebase])

  const effectiveMode =
    authMode === "firebase" && idToken
      ? "firebase"
      : devSession?.devUserId
        ? "dev"
        : "none"

  if (effectiveMode === "none") {
    return (
      <AuthScreen
        onFirebaseUser={() => setAuthMode("firebase")}
        onDevContinue={(d) => {
          const next = { devUserId: d.devUserId, displayName: d.displayName }
          setDevSession(next)
          try {
            localStorage.setItem("budgball_dev_session", JSON.stringify(next))
          } catch {
            // ignore
          }
        }}
      />
    )
  }

  return (
    <Dashboard
      authMode={effectiveMode}
      idToken={effectiveMode === "firebase" ? idToken : ""}
      devUserId={effectiveMode === "dev" ? devSession?.devUserId || "" : ""}
      displayName={effectiveMode === "dev" ? devSession?.displayName || displayName : displayName}
      seedUsername={effectiveMode === "firebase" ? firebaseUid : devSession?.devUserId || ""}
      onSignedOut={() => {
        setIdToken("")
        setFirebaseUid("")
        setDevSession(null)
        try {
          localStorage.removeItem("budgball_dev_session")
        } catch {
          // ignore
        }
      }}
    />
  )
}
