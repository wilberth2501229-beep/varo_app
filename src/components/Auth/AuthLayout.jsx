import { useState } from 'react'
import LoginPage from './LoginPage'
import SignupPage from './SignupPage'
import Notification from '../Common/Notification'

export default function AuthLayout() {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <>
      {isLogin ? (
        <LoginPage onSwitchToSignup={() => setIsLogin(false)} />
      ) : (
        <SignupPage onSwitchToLogin={() => setIsLogin(true)} />
      )}
      <Notification />
    </>
  )
}
