import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const initialSignupData = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  inviteCode: "",
  termsAccepted: false,
};

const initialLoginData = {
  email: "",
  password: "",
  rememberMe: false,
};

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidSingaporePhone(value) {
  return /^[89]\d{7}$/.test(value);
}

function getPasswordChecks(value) {
  return {
    length: value.length >= 8,
    uppercase: /[A-Z]/.test(value),
    lowercase: /[a-z]/.test(value),
    number: /\d/.test(value),
    special: /[^A-Za-z0-9]/.test(value),
  };
}

function getPasswordStrength(value) {
  const checks = Object.values(getPasswordChecks(value)).filter(Boolean).length;

  if (!value) {
    return "Add a password";
  }

  if (checks <= 2) {
    return "Weak password";
  }

  if (checks <= 4) {
    return "Good password";
  }

  return "Strong password";
}

function AuthPage({ initialMode = "login" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState(initialMode);
  const [signupData, setSignupData] = useState(initialSignupData);
  const [loginData, setLoginData] = useState(initialLoginData);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (location.pathname === "/register") {
      setMode("signup");
    } else {
      setMode("login");
    }
  }, [location.pathname]);

  const passwordChecks = useMemo(
    () => getPasswordChecks(signupData.password),
    [signupData.password]
  );

  const signupErrors = useMemo(() => {
    const errors = {};

    if (!signupData.fullName.trim()) {
      errors.fullName = "Please enter your full name.";
    }

    if (!signupData.email.trim()) {
      errors.email = "Please enter your email address.";
    } else if (!isValidEmail(signupData.email)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!signupData.phone.trim()) {
      errors.phone = "Please enter your phone number.";
    } else if (!isValidSingaporePhone(signupData.phone)) {
      errors.phone = "Use an 8-digit Singapore mobile number after +65.";
    }

    if (!signupData.password) {
      errors.password = "Please create a password.";
    } else if (!Object.values(passwordChecks).every(Boolean)) {
      errors.password =
        "Use at least 8 characters with uppercase, lowercase, number, and symbol.";
    }

    if (!signupData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (signupData.confirmPassword !== signupData.password) {
      errors.confirmPassword = "Passwords do not match yet.";
    }

    if (!signupData.termsAccepted) {
      errors.termsAccepted = "Please accept the terms to continue.";
    }

    return errors;
  }, [passwordChecks, signupData]);

  const loginErrors = useMemo(() => {
    const errors = {};

    if (!loginData.email.trim()) {
      errors.email = "Please enter your email address.";
    } else if (!isValidEmail(loginData.email)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!loginData.password) {
      errors.password = "Please enter your password.";
    }

    return errors;
  }, [loginData]);

  const handleSignupChange = (event) => {
    const { name, value, type, checked } = event.target;

    setSignupData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleLoginChange = (event) => {
    const { name, value, type, checked } = event.target;

    setLoginData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const switchTo = (nextMode) => {
    setMode(nextMode);
    navigate(nextMode === "signup" ? "/register" : "/login");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const hasErrors =
      mode === "signup"
        ? Object.keys(signupErrors).length > 0
        : Object.keys(loginErrors).length > 0;

    if (hasErrors) {
      return;
    }

    navigate("/dashboard");
  };

  const isSignup = mode === "signup";

  return (
    <div className="auth-page">
      <div className="container-xxl py-4 py-lg-5">
        <div className="auth-shell">
          <section className="auth-visual">
            <p className="eyebrow">Family scrapbook access</p>
            <h1>Keep the trip plans, little reminders, and favourite memories close.</h1>
            <p className="auth-visual__text">
              This shared space is made for family travel. Sign in to continue
              planning together, or create an account and keep every trip in one
              warm, easy-to-revisit place.
            </p>

            <div className="auth-polaroids">
              <article className="auth-polaroid auth-polaroid--main">
                <p className="mockup-label">Trip note</p>
                <h3>Next up: family getaway</h3>
                <ul className="postcard-list">
                  <li>Saved places to eat</li>
                  <li>Flight reminders and packing notes</li>
                  <li>Photo corners we do not want to miss</li>
                </ul>
              </article>

              <article className="auth-polaroid auth-polaroid--small auth-polaroid--top">
                <p className="mockup-label">Memory</p>
                <span>Small details stay easier to find when everyone shares one home.</span>
              </article>

              <article className="auth-polaroid auth-polaroid--small auth-polaroid--bottom">
                <p className="mockup-label">Together</p>
                <span>Built for phones, tablets, and laptops while travelling.</span>
              </article>
            </div>
          </section>

          <section className="auth-card">
            <div className="auth-card__header">
              <p className="eyebrow">{isSignup ? "Create access" : "Welcome back"}</p>
              <h2>{isSignup ? "Create your family account" : "Sign in to continue"}</h2>
              <p>
                {isSignup
                  ? "Set up your account now, then connect it to the backend later."
                  : "Use your email first for now. More login methods can be connected later."}
              </p>
            </div>

            <div className="auth-switch">
              <span>
                {isSignup ? "Already have an account?" : "Do not have an account yet?"}
              </span>
              <button
                type="button"
                className="auth-switch__link"
                onClick={() => switchTo(isSignup ? "login" : "signup")}
              >
                {isSignup ? "Sign in" : "Create one"}
              </button>
            </div>

            <div className="auth-provider-group">
              <button type="button" className="auth-provider">
                Continue with Google
              </button>
              <button type="button" className="auth-provider">
                Continue with phone
              </button>
            </div>

            <div className="auth-divider">
              <span>or continue with email</span>
            </div>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              {isSignup ? (
                <>
                  <label className="auth-field">
                    <span>Full name</span>
                    <input
                      type="text"
                      name="fullName"
                      value={signupData.fullName}
                      onChange={handleSignupChange}
                      placeholder="Enter your full name"
                    />
                    <small className={signupErrors.fullName ? "is-error" : "is-success"}>
                      {signupErrors.fullName || "Looks good for a family account."}
                    </small>
                  </label>

                  <label className="auth-field">
                    <span>Email address</span>
                    <input
                      type="email"
                      name="email"
                      value={signupData.email}
                      onChange={handleSignupChange}
                      placeholder="name@example.com"
                    />
                    <small className={signupErrors.email ? "is-error" : "is-success"}>
                      {signupErrors.email || "We will use this as the main login method."}
                    </small>
                  </label>

                  <label className="auth-field">
                    <span>Phone number</span>
                    <div className="auth-phone">
                      <span className="auth-phone__prefix">+65</span>
                      <input
                        type="tel"
                        name="phone"
                        inputMode="numeric"
                        maxLength="8"
                        value={signupData.phone}
                        onChange={handleSignupChange}
                        placeholder="81234567"
                      />
                    </div>
                    <small className={signupErrors.phone ? "is-error" : "is-success"}>
                      {signupErrors.phone || "Singapore mobile format is ready."}
                    </small>
                  </label>

                  <label className="auth-field">
                    <span>Password</span>
                    <div className="auth-password">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={signupData.password}
                        onChange={handleSignupChange}
                        placeholder="Create a password"
                      />
                      <button
                        type="button"
                        className="auth-inline-button"
                        onClick={() => setShowPassword((current) => !current)}
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    <small className={signupErrors.password ? "is-error" : "is-success"}>
                      {signupErrors.password || getPasswordStrength(signupData.password)}
                    </small>
                    <ul className="password-checks">
                      <li className={passwordChecks.length ? "is-pass" : ""}>
                        At least 8 characters
                      </li>
                      <li className={passwordChecks.uppercase ? "is-pass" : ""}>
                        One uppercase letter
                      </li>
                      <li className={passwordChecks.lowercase ? "is-pass" : ""}>
                        One lowercase letter
                      </li>
                      <li className={passwordChecks.number ? "is-pass" : ""}>
                        One number
                      </li>
                      <li className={passwordChecks.special ? "is-pass" : ""}>
                        One special character
                      </li>
                    </ul>
                  </label>

                  <label className="auth-field">
                    <span>Confirm password</span>
                    <div className="auth-password">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={signupData.confirmPassword}
                        onChange={handleSignupChange}
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        className="auth-inline-button"
                        onClick={() =>
                          setShowConfirmPassword((current) => !current)
                        }
                      >
                        {showConfirmPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    <small
                      className={
                        signupErrors.confirmPassword ? "is-error" : "is-success"
                      }
                    >
                      {signupErrors.confirmPassword || "Passwords match."}
                    </small>
                  </label>

                  <label className="auth-field">
                    <span>Family invite code</span>
                    <input
                      type="text"
                      name="inviteCode"
                      value={signupData.inviteCode}
                      onChange={handleSignupChange}
                      placeholder="Optional for now"
                    />
                    <small className="is-success">
                      You can leave this blank until invite codes are connected.
                    </small>
                  </label>

                  <label className="auth-checkbox">
                    <input
                      type="checkbox"
                      name="termsAccepted"
                      checked={signupData.termsAccepted}
                      onChange={handleSignupChange}
                    />
                    <span>
                      I agree to the terms and understand this is a shared family
                      travel space.
                    </span>
                  </label>
                  <small
                    className={
                      signupErrors.termsAccepted ? "is-error auth-checkbox__hint" : "is-success auth-checkbox__hint"
                    }
                  >
                    {signupErrors.termsAccepted || "Thank you. You are ready to continue."}
                  </small>
                </>
              ) : (
                <>
                  <label className="auth-field">
                    <span>Email address</span>
                    <input
                      type="email"
                      name="email"
                      value={loginData.email}
                      onChange={handleLoginChange}
                      placeholder="name@example.com"
                    />
                    <small className={loginErrors.email ? "is-error" : "is-success"}>
                      {loginErrors.email || "Email login is the primary option for now."}
                    </small>
                  </label>

                  <label className="auth-field">
                    <span>Password</span>
                    <div className="auth-password">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={loginData.password}
                        onChange={handleLoginChange}
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        className="auth-inline-button"
                        onClick={() => setShowPassword((current) => !current)}
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    <small className={loginErrors.password ? "is-error" : "is-success"}>
                      {loginErrors.password || "Password field is ready."}
                    </small>
                  </label>

                  <div className="auth-row">
                    <label className="auth-checkbox auth-checkbox--inline">
                      <input
                        type="checkbox"
                        name="rememberMe"
                        checked={loginData.rememberMe}
                        onChange={handleLoginChange}
                      />
                      <span>Remember me</span>
                    </label>

                    <Link to="/register" className="auth-forgot" onClick={() => switchTo("signup")}>
                      Forgot password?
                    </Link>
                  </div>
                </>
              )}

              <button type="submit" className="btn btn--primary btn--large auth-submit">
                {isSignup ? "Create account" : "Sign in"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
