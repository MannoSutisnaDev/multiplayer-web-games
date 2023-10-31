'use client';

import { useContext } from "react"

import { ToastMessageContextWrapper } from "../toast-messages/ToastMessageContext"

export default function Login() {
  const {
    addSuccessMessage,
    addErrorMessage
  } = useContext(ToastMessageContextWrapper);
  return <div className="login">
    <h1>Set username</h1>
    <input type="text" placeholder="enter a username" />
    <button className="btn" onClick={() => addSuccessMessage?.('fail....')}>Submit</button>
  </div>
}