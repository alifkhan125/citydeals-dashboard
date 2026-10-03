"use client";
import Image from "next/image";
import { useState, type FormEvent } from "react";
import hero from "../assets/lending-hero.png";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState<"signin" | "email" | "otp">("signin");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  function changeStep(next: "signin" | "email" | "otp") {
    setStep(next);
    setNotice("");
    setOtp("");
  }
  const [visible, setVisible] = useState(false);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === "email") {
      changeStep("otp");
      return;
    }
    if (step === "otp") {
      if (otp !== "123456") {
        setNotice("Incorrect demo code. Enter 123456 to continue.");
        return;
      }
      setLoading(true);
      router.push("/dashboard");
      return;
    }
    if (step === "signin") {
      setLoading(true);
      setNotice("");
      
      try {
        const formData = new FormData(event.currentTarget);
        const password = formData.get("password") as string;
        
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3004/api";
        const res = await fetch(`${baseUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          const errorMsg = Array.isArray(data.message) ? data.message.join(", ") : data.message;
          throw new Error(errorMsg || "Failed to login");
        }
        
        const user = data.data?.user || data.user;
        const tokens = data.data?.tokens || data.tokens;
        
        if (user?.role !== "ADMIN") {
          throw new Error("Access denied. Only Admins can access the dashboard.");
        }
        
        localStorage.setItem("dashboard_access_token", tokens.accessToken);
        localStorage.setItem("dashboard_user", JSON.stringify(user));
        
        router.push("/dashboard");
      } catch (error: any) {
        setNotice(error.message || "An error occurred during login.");
      } finally {
        setLoading(false);
      }
      return;
    }
  }
  return (
    <main className="sign-in-page">
      <section className="sign-in-layout" aria-labelledby="sign-in-title">
        <div className="hero-panel">
          <div className="relative size-full">
            <Image
              src={hero}
              alt="Local deals shop with an orange discount coupon and shopping bag"
              fill
              priority
              sizes="(max-width: 700px) 100vw, 50vw"
            />
          </div>
        </div>
        <div className="form-panel">
          <form className="sign-in-form" onSubmit={submit} key={step}>
            <header className="form-header">
              <Image className="brand-logo" src="/assets/logo.svg" alt="CityDeals" width={263} height={76} priority />
              <h1 id="sign-in-title">{step === "signin" ? "Sign In to Your Admin Panel" : step === "email" ? "Forgot Password?" : "Verify Your Email"}</h1>
              <p>{step === "signin" ? "Log in to manage businesses, coupons, Location and Redemptions." : step === "email" ? "Enter your email address to continue with account recovery." : <>Enter the six-digit code for <strong className="recovery-email">{email}</strong>.</>}</p>
            </header>
            <div className="form-fields">
              {step !== "otp" && <div className="field-group">
                <label htmlFor="email">Email <span>*</span></label>
                <div className="input-shell"><Image src="/assets/email.svg" alt="" width={22} height={22} /><input id="email" name="email" type="email" autoComplete="username" placeholder="Example@gmail.com" value={email} onChange={(event) => setEmail(event.target.value)} autoFocus={step === "email"} required /></div>
              </div>}
              {step === "signin" && <div className="field-group">
                <label htmlFor="password">Password <span>*</span></label>
                <div className="input-shell"><Image src="/assets/lock.svg" alt="" width={22} height={22} /><input id="password" name="password" type={visible ? "text" : "password"} autoComplete="current-password" placeholder="********" required /><button className="password-toggle" type="button" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} onClick={() => setVisible(!visible)}><Image src="/assets/eye-slash.svg" alt="" width={22} height={22} /></button></div>
                <button className="forgot-password" type="button" onClick={() => changeStep("email")}>Forgot Password?</button>
              </div>}
              {step === "otp" && <div className="field-group">
                <label htmlFor="otp">Verification code <span>*</span></label>
                <div className="input-shell"><input className="otp-input" id="otp" name="otp" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} placeholder="000000" value={otp} onChange={(event) => { setOtp(event.target.value.replace(/\D/g, "").slice(0, 6)); setNotice(""); }} aria-describedby="demo-help" aria-invalid={!!notice} autoFocus required /></div>
                <button className="forgot-password" type="button" onClick={() => changeStep("email")}>Change email</button>
              </div>}
            </div>
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "Signing in..." : step === "signin" ? "Sign in" : step === "email" ? "Send code" : "Verify"}
            </button>
            {step !== "signin" && <div className="recovery-footer">
              <p id="demo-help" className="demo-help">{step === "email" ? "Demo preview: no email will be sent." : "Demo preview: use 123456. This does not authenticate an account."}</p>
              <button className="forgot-password" type="button" onClick={() => changeStep("signin")}>Back to sign in</button>
            </div>}
            {notice && <p className="form-notice" role="status">{notice}</p>}
          </form>
        </div>
      </section>
    </main>
  );
}
