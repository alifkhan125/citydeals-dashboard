"use client";
import Image from "next/image";
import { AxiosError } from "axios";
import { useState, type FormEvent } from "react";
import hero from "../assets/lending-hero.png";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

import { authApi, type AuthResponse } from "@/api/auth";
import { toast } from "@/components/Toast";
import { useAuthStore } from "@/store/useAuthStore";

export default function Home() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [step, setStep] = useState<"signin" | "email" | "otp" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [newPasswordError, setNewPasswordError] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);
  const [newPasswordErrorMsg, setNewPasswordErrorMsg] = useState("");
  const [confirmPasswordErrorMsg, setConfirmPasswordErrorMsg] = useState("");

  const [visible, setVisible] = useState(false);
  const [resetVisible, setResetVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const loginMutation = useMutation({
    mutationFn: authApi.login,
  });
  const forgotPasswordMutation = useMutation({
    mutationFn: authApi.forgotPassword,
  });
  const verifyOtpMutation = useMutation({
    mutationFn: authApi.verifyOtp,
  });
  const resetPasswordMutation = useMutation({
    mutationFn: authApi.resetPassword,
  });

  function changeStep(next: "signin" | "email" | "otp" | "reset") {
    setStep(next);
    setNotice("");
    setEmailError(false);
    setPasswordError(false);
    setOtpError(false);
    setNewPasswordError(false);
    setConfirmPasswordError(false);
    setNewPasswordErrorMsg("");
    setConfirmPasswordErrorMsg("");

    if (next === "signin") {
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  function getApiErrorMessage(error: unknown, defaultMsg: string): string {
    if (error instanceof AxiosError) {
      const data = error.response?.data as { message?: string | string[]; error?: string } | undefined;
      if (Array.isArray(data?.message)) return data.message.join(", ");
      if (typeof data?.message === "string") return data.message;
      if (typeof data?.error === "string") return data.error;
      if (error.response?.status === 401) return "Invalid email or password.";
      if (error.response?.status === 404) return "Account not found with this email.";
      if (error.response?.status === 500) return "Internal server error. Please try again later.";
    }
    if (error instanceof Error) return error.message;
    return defaultMsg;
  }

  async function handleResendCode() {
    if (!email.trim() || resending) return;
    setResending(true);
    setNotice("");

    try {
      const data = await forgotPasswordMutation.mutateAsync({ email: email.trim() });

      toast.success(`A new verification code was sent to ${email.trim()}`, { title: "Code Resent" });
      const devOtp = data?.otp;
      if (devOtp) {
        toast.info(`Dev Code: ${devOtp}`, { title: "OTP Received" });
      }
    } catch (err: unknown) {
      const errorMsg = getApiErrorMessage(err, "Failed to resend verification code");
      toast.error(errorMsg, { title: "Error" });
    } finally {
      setResending(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // 1. STEP: EMAIL (Request Forgot Password OTP)
    if (step === "email") {
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        setEmailError(true);
        toast.error("Please enter a valid email address.", { title: "Email Required" });
        return;
      }
      setEmailError(false);
      setLoading(true);
      setNotice("");

      try {
        const data = await forgotPasswordMutation.mutateAsync({ email: trimmedEmail });

        toast.success(`Verification code sent to ${trimmedEmail}`, { title: "Code Sent" });
        const devOtp = data?.otp;
        if (devOtp) {
          toast.info(`Dev Code: ${devOtp}`, { title: "OTP Received" });
        }

        changeStep("otp");
      } catch (err: unknown) {
        const errorMsg = getApiErrorMessage(err, "Failed to send verification code.");
        setNotice(errorMsg);
        toast.error(errorMsg, { title: "Request Failed" });
      } finally {
        setLoading(false);
      }
      return;
    }

    // 2. STEP: OTP (Verify Verification Code)
    if (step === "otp") {
      const trimmedOtp = otp.trim();
      if (trimmedOtp.length !== 6) {
        setOtpError(true);
        const errorMsg = "Please enter the complete 6-digit verification code.";
        setNotice(errorMsg);
        toast.error(errorMsg, { title: "Invalid Code" });
        return;
      }
      setOtpError(false);
      setLoading(true);
      setNotice("");

      try {
        await verifyOtpMutation.mutateAsync({ email: email.trim(), otp: trimmedOtp });

        toast.success("Verification code verified! Create your new password.", { title: "Verified" });
        changeStep("reset");
      } catch (err: unknown) {
        setOtpError(true);
        const errorMsg = getApiErrorMessage(err, "Invalid or expired verification code.");
        setNotice(errorMsg);
        toast.error(errorMsg, { title: "Verification Failed" });
      } finally {
        setLoading(false);
      }
      return;
    }

    // 3. STEP: RESET (Set New Password)
    if (step === "reset") {
      let hasError = false;
      if (!newPassword || newPassword.length < 6) {
        setNewPasswordError(true);
        setNewPasswordErrorMsg(newPassword ? "Password must be at least 6 characters" : "New password is required");
        hasError = true;
      } else {
        setNewPasswordError(false);
        setNewPasswordErrorMsg("");
      }

      if (!confirmPassword) {
        setConfirmPasswordError(true);
        setConfirmPasswordErrorMsg("Confirm password is required");
        hasError = true;
      } else if (newPassword && newPassword !== confirmPassword) {
        setConfirmPasswordError(true);
        setConfirmPasswordErrorMsg("Passwords do not match");
        hasError = true;
      } else {
        setConfirmPasswordError(false);
        setConfirmPasswordErrorMsg("");
      }

      if (hasError) {
        if (!newPassword && !confirmPassword) {
          toast.error("Please enter both password fields.", { title: "Fields Required" });
        } else if (newPassword && confirmPassword && newPassword !== confirmPassword) {
          toast.error("New password and confirm password do not match.", { title: "Password Mismatch" });
        } else if (newPassword && newPassword.length < 6) {
          toast.error("Password must be at least 6 characters long.", { title: "Password Too Short" });
        } else {
          toast.error("Please fill in the required password fields.", { title: "Password Required" });
        }
        return;
      }

      setLoading(true);
      setNotice("");

      try {
        await resetPasswordMutation.mutateAsync({
          email: email.trim(),
          otp: otp.trim(),
          newPassword,
          confirmPassword,
        });

        toast.success("Password reset successfully! You can now sign in with your new password.", {
          title: "Password Reset Successful",
        });

        setPassword("");
        changeStep("signin");
      } catch (err: unknown) {
        const errorMsg = getApiErrorMessage(err, "Failed to reset password.");
        setNotice(errorMsg);
        toast.error(errorMsg, { title: "Reset Failed" });
      } finally {
        setLoading(false);
      }
      return;
    }

    // 4. STEP: SIGNIN
    if (step === "signin") {
      const trimmedEmail = email.trim();

      let hasError = false;
      if (!trimmedEmail) {
        setEmailError(true);
        hasError = true;
      } else {
        setEmailError(false);
      }

      if (!password) {
        setPasswordError(true);
        hasError = true;
      } else {
        setPasswordError(false);
      }

      if (hasError) {
        if (!trimmedEmail && !password) {
          toast.error("Please enter both email and password.", { title: "Required Fields" });
        } else if (!trimmedEmail) {
          toast.error("Please enter your email address.", { title: "Email Required" });
        } else {
          toast.error("Please enter your password.", { title: "Password Required" });
        }
        return;
      }

      setLoading(true);
      setNotice("");

      try {
        const data: AuthResponse = await loginMutation.mutateAsync({ email: trimmedEmail, password });

        const user = data?.user;
        const tokens = data?.tokens;

        if (!user || !tokens?.accessToken) {
          throw new Error("Invalid response received from authentication server.");
        }

        if (user?.role !== "ADMIN") {
          throw new Error("Access denied. Only Admins can access the dashboard.");
        }

        setSession(user, tokens.accessToken, tokens.refreshToken);
        localStorage.setItem("dashboard_user", JSON.stringify(user));

        toast.success(`Welcome back, ${user.fullName || user.email}! Login successful.`, {
          title: "Login Successful",
        });

        setTimeout(() => {
          router.push("/dashboard");
        }, 600);
      } catch (error: unknown) {
        const errorMsg = getApiErrorMessage(error, "An error occurred during login.");
        setNotice(errorMsg);
        toast.error(errorMsg, { title: "Login Failed" });
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
              <h1 id="sign-in-title">
                {step === "signin"
                  ? "Sign In to Your Admin Panel"
                  : step === "email"
                  ? "Forgot Password?"
                  : step === "otp"
                  ? "Verify Your Email"
                  : "Reset Your Password"}
              </h1>
              <p>
                {step === "signin" ? (
                  "Log in to manage businesses, coupons, Location and Redemptions."
                ) : step === "email" ? (
                  "Enter your email address to continue with account recovery."
                ) : step === "otp" ? (
                  <>Enter the six-digit code sent to <strong className="recovery-email">{email}</strong>.</>
                ) : (
                  <>Create a new secure password for <strong className="recovery-email">{email}</strong>.</>
                )}
              </p>
            </header>
            <div className="form-fields">
              {(step === "signin" || step === "email") && (
                <div className="field-group">
                  <label htmlFor="email">Email <span>*</span></label>
                  <div className={`input-shell ${emailError ? "!border-rose-500 bg-rose-50/20" : ""}`}>
                    <Image src="/assets/email.svg" alt="" width={22} height={22} />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="username"
                      placeholder="Example@gmail.com"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        if (emailError) setEmailError(false);
                      }}
                      autoFocus={step === "email"}
                      required
                    />
                  </div>
                  {emailError && <span className="text-xs text-rose-500 font-medium -mt-1 ml-1">Email is required</span>}
                </div>
              )}

              {step === "signin" && (
                <div className="field-group">
                  <label htmlFor="password">Password <span>*</span></label>
                  <div className={`input-shell ${passwordError ? "!border-rose-500 bg-rose-50/20" : ""}`}>
                    <Image src="/assets/lock.svg" alt="" width={22} height={22} />
                    <input
                      id="password"
                      name="password"
                      type={visible ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="********"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        if (passwordError) setPasswordError(false);
                      }}
                      required
                    />
                    <button
                      className="password-toggle"
                      type="button"
                      aria-label={visible ? "Hide password" : "Show password"}
                      aria-pressed={visible}
                      onClick={() => setVisible(!visible)}
                    >
                      <Image src="/assets/eye-slash.svg" alt="" width={22} height={22} />
                    </button>
                  </div>
                  {passwordError && <span className="text-xs text-rose-500 font-medium -mt-1 ml-1">Password is required</span>}
                  <button className="forgot-password" type="button" onClick={() => changeStep("email")}>Forgot Password?</button>
                </div>
              )}

              {step === "otp" && (
                <div className="field-group">
                  <label htmlFor="otp">Verification code <span>*</span></label>
                  <div className={`input-shell ${otpError ? "!border-rose-500 bg-rose-50/20" : ""}`}>
                    <input
                      className="otp-input"
                      id="otp"
                      name="otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      placeholder="000000"
                      value={otp}
                      onChange={(event) => {
                        setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));
                        setNotice("");
                        if (otpError) setOtpError(false);
                      }}
                      aria-describedby="demo-help"
                      aria-invalid={!!notice || otpError}
                      autoFocus
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between w-full mt-1">
                    <button className="forgot-password" type="button" onClick={() => changeStep("email")}>
                      Change email
                    </button>
                    <button
                      className="forgot-password"
                      type="button"
                      disabled={resending}
                      onClick={handleResendCode}
                    >
                      {resending ? "Resending..." : "Resend code"}
                    </button>
                  </div>
                </div>
              )}

              {step === "reset" && (
                <>
                  <div className="field-group">
                    <label htmlFor="newPassword">New Password <span>*</span></label>
                    <div className={`input-shell ${newPasswordError ? "!border-rose-500 bg-rose-50/20" : ""}`}>
                      <Image src="/assets/lock.svg" alt="" width={22} height={22} />
                      <input
                        id="newPassword"
                        name="newPassword"
                        type={resetVisible ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="At least 6 characters"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (newPasswordError) setNewPasswordError(false);
                        }}
                        autoFocus
                        required
                      />
                      <button
                        className="password-toggle"
                        type="button"
                        aria-label={resetVisible ? "Hide password" : "Show password"}
                        aria-pressed={resetVisible}
                        onClick={() => setResetVisible(!resetVisible)}
                      >
                        <Image src="/assets/eye-slash.svg" alt="" width={22} height={22} />
                      </button>
                    </div>
                    {newPasswordError && (
                      <span className="text-xs text-rose-500 font-medium -mt-1 ml-1">
                        {newPasswordErrorMsg || "New password is required"}
                      </span>
                    )}
                  </div>

                  <div className="field-group">
                    <label htmlFor="confirmPassword">Confirm Password <span>*</span></label>
                    <div className={`input-shell ${confirmPasswordError ? "!border-rose-500 bg-rose-50/20" : ""}`}>
                      <Image src="/assets/lock.svg" alt="" width={22} height={22} />
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={confirmVisible ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (confirmPasswordError) setConfirmPasswordError(false);
                        }}
                        required
                      />
                      <button
                        className="password-toggle"
                        type="button"
                        aria-label={confirmVisible ? "Hide password" : "Show password"}
                        aria-pressed={confirmVisible}
                        onClick={() => setConfirmVisible(!confirmVisible)}
                      >
                        <Image src="/assets/eye-slash.svg" alt="" width={22} height={22} />
                      </button>
                    </div>
                    {confirmPasswordError && (
                      <span className="text-xs text-rose-500 font-medium -mt-1 ml-1">
                        {confirmPasswordErrorMsg || "Please confirm your password"}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            <button className="primary-button" type="submit" disabled={loading}>
              {loading
                ? step === "signin"
                  ? "Signing in..."
                  : step === "email"
                  ? "Sending code..."
                  : step === "otp"
                  ? "Verifying code..."
                  : "Resetting password..."
                : step === "signin"
                ? "Sign in"
                : step === "email"
                ? "Send code"
                : step === "otp"
                ? "Verify code"
                : "Reset Password"}
            </button>

            {step !== "signin" && (
              <div className="recovery-footer">
                <p id="demo-help" className="demo-help">
                  {step === "email"
                    ? "Enter your registered email address to receive a recovery code."
                    : step === "otp"
                    ? "Check your inbox for the 6-digit verification code."
                    : "Password must be at least 6 characters long."}
                </p>
                <button className="forgot-password" type="button" onClick={() => changeStep("signin")}>
                  Back to sign in
                </button>
              </div>
            )}
            {notice && <p className="form-notice" role="status">{notice}</p>}
          </form>
        </div>
      </section>
    </main>
  );
}
