// components/VerifyEmail.jsx (token path -> verify -> refresh -> navigate)
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/context";
import api from "../api/axios";

export default function VerifyEmail() {
  const { user, authLoading, refreshMe, setVerified, isVerified } = useAuth();
  const [params] = useSearchParams();
  const token = useMemo(() => params.get("token"), [params]);
  const navigate = useNavigate();

  const pollRef = useRef(null);
  const [msg, setMsg] = useState("");

  // components/VerifyEmail.jsx (fast and robust)
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    if (isVerified) {
      navigate("/dashboard", { replace: true });
      return;
    }

    const verifyWithToken = async () => {
      try {
        setMsg("Verifying link…");
        const res = await api.get("/auth/verify-email", { params: { token } });
        if (res.data?.success) {
          setVerified();
          await refreshMe();
          navigate("/dashboard", { replace: true });
          return;
        }
        setMsg(res.data?.message || "Verification failed.");
      } catch (e) {
        setMsg(
          e?.response?.data?.message || "Verification link invalid or expired."
        );
      }
    };

    const startPoll = () => {
      if (pollRef.current) return;
      pollRef.current = setInterval(async () => {
        try {
          const r = await api.post("/auth/verified", { email: user.email });
          if (r.data?.isVerified) {
            clearInterval(pollRef.current);
            pollRef.current = null;
            setVerified();
            navigate("/dashboard", { replace: true });
          }
        } catch (e) {
          console.log(e);
        }
      }, 5000);
    };

    if (token) {
      verifyWithToken();
      return;
    }
    startPoll();

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [authLoading, user, isVerified, token, navigate, refreshMe, setVerified]);

  const [sending, setSending] = useState(false);
  const resend = async () => {
    if (sending) return;
    setSending(true);
    try {
      setMsg("Resending…");
      await api.post("/auth/generate-token", { email: user?.email });
      setMsg(`A verification link was sent to ${user?.email}.`);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Could not resend email.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="mx-auto max-w-md px-4 py-8">
      <h2 className="text-xl font-semibold">Verify email</h2>
      <p className="mt-2 text-sm text-gray-700">
        {msg || "Preparing verification…"}
      </p>
      {!token && (
        <div className="mt-4">
          <button
            onClick={resend}
            disabled={sending}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Resend link
          </button>
        </div>
      )}
    </section>
  );
}
