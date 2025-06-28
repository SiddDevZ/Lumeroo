import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import "remixicon/fonts/remixicon.css";
import { Toaster, toast } from "sonner";
import { useGoogleLogin } from '@react-oauth/google';
import config from "../config.json";

const AuthModel = ({ setShowAuthModel, setUser }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [usernameError, setUsernameError] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const [isOtpVerification, setIsOtpVerification] = useState(false);
  const [otpValues, setOtpValues] = useState(["", "", "", ""]);
  const [otpError, setOtpError] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [screenTransition, setScreenTransition] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(30);

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState(false);

  const modalContentRef = useRef(null);
  const otpInputRefs = useRef([]);
  const cooldownTimerRef = useRef(null);

  useEffect(() => {
    otpInputRefs.current = otpInputRefs.current.slice(0, 4);
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsEntering(false);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isOtpVerification && otpInputRefs.current[0]) {
      setTimeout(() => {
        otpInputRefs.current[0].focus();
      }, 400);
    }
  }, [isOtpVerification]);

  useEffect(() => {
    if (resendCooldown && cooldownTime > 0) {
      cooldownTimerRef.current = setTimeout(() => {
        setCooldownTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (cooldownTime === 0) {
      setResendCooldown(false);
      setCooldownTime(30);
    }

    return () => {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
    };
  }, [resendCooldown, cooldownTime]);

  const handleEye = (field) => {
    if (field === "new") {
      setShowNewPassword(!showNewPassword);
    } else if (field === "confirm") {
      setShowConfirmPassword(!showConfirmPassword);
    } else {
      setShowPassword(!showPassword);
    }
  };

  const toggleAuthMode = () => {
    if (isOtpVerification) {
      setScreenTransition(true);
      setTimeout(() => {
        setIsOtpVerification(false);
        setOtpValues(["", "", "", ""]); // Reset OTP values
        setOtpError(false);
        setScreenTransition(false);
      }, 300);
    } else {
      setScreenTransition(true);
      setTimeout(() => {
        setIsLogin(!isLogin);
        setEmail("");
        setUsername("");
        setPassword("");
        setEmailError(false);
        setPasswordError(false);
        setUsernameError(false);
        setScreenTransition(false);
      }, 300);
    }
  };

  const closeModal = () => {
    setIsExiting(true);
    setTimeout(() => {
      setShowAuthModel(false);
    }, 300);
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        modalContentRef.current &&
        !modalContentRef.current.contains(e.target)
      ) {
        closeModal();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const googleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        setIsVerifying(true);

        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${response.access_token}`,
          },
        });

        if (!userInfoResponse.ok) {
          throw new Error(`HTTP error! status: ${userInfoResponse.status}`);
        }

        const googleUserData = await userInfoResponse.json();

        const serverResponse = await fetch(`${config.url}/api/google-auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(googleUserData),
        });

        if (!serverResponse.ok) {
          console.error(`Server responded with status: ${serverResponse.status}`);
        }

        const text = await serverResponse.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error('Failed to parse response as JSON:', text);
          throw new Error('Invalid JSON response from server');
        }

        setIsVerifying(false);

        if (data.success) {
          if (data.user && data.user.token) {
            localStorage.setItem('token', data.user.token);
            setUser(data.user);
          }

          toast.success(data.message || 'Login successful!', {
            position: 'bottom-right',
          });

          setTimeout(() => {
            closeModal();
            window.location.href = '/profile';
          }, 500);
        } else {
          toast.error(data.message || 'Google authentication failed. Please try again.', {
            position: 'bottom-right',
          });
        }

      } catch (error) {
        setIsVerifying(false);
        console.error('Google login error:', error);
        toast.error('Google authentication failed. Please try again.', {
          position: 'bottom-right',
        });
      }
    },
    onError: (error) => {
      console.error('Google OAuth error:', error);
      toast.error('Google authentication failed. Please try again.', {
        position: 'bottom-right',
      });
    },
  });

  const handleOtpChange = (index, value) => {
    if (otpError) setOtpError(false);

    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").split("").slice(0, 4);
      const newOtpValues = [...otpValues];
      digits.forEach((digit, i) => {
        if (index + i < 4) {
          newOtpValues[index + i] = digit;
        }
      });

      setOtpValues(newOtpValues);

      const nextIndex = Math.min(index + digits.length, 3);
      if (otpInputRefs.current[nextIndex]) {
        otpInputRefs.current[nextIndex].focus();
      }
      return;
    }

    if (value && !/^\d*$/.test(value)) return;

    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);

    if (value && index < 3) {
      otpInputRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1].focus();
    }
  };

  const handleOtpPaste = (e, index) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    if (pastedData) {
      handleOtpChange(index, pastedData);
    }
  };

  const handleEmailAuth = () => {
    if (isOtpVerification) {
      const otp = otpValues.join('');
      if (otp.length !== 4) {
        setOtpError(true);
        return;
      }
      
      setIsVerifying(true);
      
      // Call verification API with baseUrl from config
      fetch(`${config.url}/api/signup/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      })
        .then(response => {
          if (!response.ok) {
            console.error(`Server responded with status: ${response.status}`);
          }
          return response.text();
        })
        .then(text => {
          // Try to parse as JSON, but handle cases where it's not valid JSON
          let data;
          try {
            data = JSON.parse(text);
          } catch (e) {
            console.error('Failed to parse response as JSON:', text);
            throw new Error('Invalid JSON response from server');
          }
          
          setIsVerifying(false);
          
          if (data.success) {
            if (data.user && data.user.token) {
              localStorage.setItem('token', data.user.token);
              setUser(data.user);
            }

            setVerificationSuccess(true);
            toast.success(data.message || 'Account verified successfully!', {
              position: 'bottom-right',
            });
            
            setTimeout(() => {
              closeModal();
            }, 1500);
          } else {
            setOtpError(true);
            toast.error(data.message || 'Verification failed. Please try again.', {
              position: 'bottom-right',
            });
          }
        })
        .catch(error => {
          setIsVerifying(false);
          setOtpError(true);
          toast.error('An error occurred. Please try again.', {
            position: 'bottom-right',
          });
          console.error('Verification error:', error);
        });
    } else if (isLogin) {
      let hasError = false;
      
      if (!email) {
        setEmailError(true);
        hasError = true;
      }
      
      if (!password) {
        setPasswordError(true);
        hasError = true;
      }
      
      if (hasError) {
        return;
      }
      
      setIsVerifying(true);
      
      // Call signin API with baseUrl from config
      fetch(`${config.url}/api/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
        .then(response => {
          if (!response.ok) {
            console.error(`Server responded with status: ${response.status}`);
          }
          return response.text();
        })
        .then(text => {
          // Try to parse as JSON, but handle cases where it's not valid JSON
          let data;
          try {
            data = JSON.parse(text);
          } catch (e) {
            console.error('Failed to parse response as JSON:', text);
            throw new Error('Invalid JSON response from server');
          }
          
          setIsVerifying(false);
          
          if (data.success) {
            if (data.user && data.user.token) {
              localStorage.setItem('token', data.user.token);
              setUser(data.user);
            }

            toast.success(data.message || 'Login successful!', {
              position: 'bottom-right',
            });
            setTimeout(() => {
              closeModal();
              // Navigate to profile page after successful login
              window.location.href = '/profile';
            }, 500);
            } else {
            if (data.message && data.message.toLowerCase().includes('email')) {
              setEmailError(true);
            } else {
              setPasswordError(true);
            }
            toast.error(data.message || 'Login failed. Please check your credentials.', {
              position: 'bottom-right',
            });
          }
        })
        .catch(error => {
          setIsVerifying(false);
          toast.error('An error occurred. Please try again.', {
            position: 'bottom-right',
          });
          console.error('Login error:', error);
        });
    } else {
      let hasError = false;

      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!email || !emailPattern.test(email)) {
        setEmailError(true);
        hasError = true;
      }

      if (!username || username.length < 3 || username.length > 16 || !/^[a-zA-Z0-9]+$/.test(username)) {
        setUsernameError(true);
        hasError = true;
      }

      if (!password || password.length < 6) {
        setPasswordError(true);
        hasError = true;
      }

      if (hasError) {
        return;
      }

      setIsVerifying(true);
      
      // Call signup API with baseUrl from config
      fetch(`${config.url}/api/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      })
        .then(response => {
          if (!response.ok) {
            console.error(`Server responded with status: ${response.status}`);
          }
          return response.text();
        })
        .then(text => {
          let data;
          try {
            data = JSON.parse(text);
          } catch (e) {
            console.error('Failed to parse response as JSON:', text);
            throw new Error('Invalid JSON response from server');
          }
          
          setIsVerifying(false);
          
          if (data.success) {
            toast.success(data.message || 'Registration successful! Please verify your email.', {
              position: 'bottom-right',
            });
            
            setScreenTransition(true);
            setOtpValues(['', '', '', '']);
            setTimeout(() => {
              setIsOtpVerification(true);
              setScreenTransition(false);
            }, 300);
          } else {
            if (data.errors) {
              if (data.errors.email) {
                setEmailError(true);
              }
              if (data.errors.username) {
                setUsernameError(true);
              }
              if (data.errors.password) {
                setPasswordError(true);
              }
            }
            
            toast.error(data.message || 'Registration failed. Please try again.', {
              position: 'bottom-right',
            });
          }
        })
        .catch(error => {
          setIsVerifying(false);
          toast.error('An error occurred. Please try again.', {
            position: 'bottom-right',
          });
          console.error('Registration error:', error);
        });
    }
  };

  const handleResendOtp = (context) => {
    if (resendCooldown) return;

    // Reset values and set cooldown
    setOtpValues(["", "", "", ""]);
    setOtpError(false);
    setResendCooldown(true);

    fetch(`${config.url}/api/signup/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })
      .then(response => {
        if (!response.ok) {
          console.error(`Server responded with status: ${response.status}`);
        }
        return response.text();
      })
      .then(text => {
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error('Failed to parse response as JSON:', text);
          throw new Error('Invalid JSON response from server');
        }
        
        if (data.success) {
          toast.success(data.message || 'Verification code resent to your email!', {
            position: 'bottom-right',
          });
          
          setTimeout(() => {
            if (otpInputRefs.current[0]) {
              otpInputRefs.current[0].focus();
            }
          }, 100);
        } else {
          toast.error(data.message || 'Failed to resend verification code.', {
            position: 'bottom-right',
          });
          setResendCooldown(false);
          setCooldownTime(30);
        }
      })
      .catch(error => {
        console.error('Resend error:', error);
        toast.error('An error occurred. Please try again.', {
          position: 'bottom-right',
        });
        setResendCooldown(false);
        setCooldownTime(30);
      });
  };

  const initiateForgotPassword = () => {
    setScreenTransition(true);
    setTimeout(() => {
      setIsForgotPassword(true);
      setForgotPasswordStep(1);
      setEmail("");
      setOtpValues(["", "", "", ""]);
      setNewPassword("");
      setConfirmPassword("");
      setPasswordsMatch(true);
      setEmailError(false);
      setOtpError(false);
      setResetPasswordSuccess(false);
      setScreenTransition(false);
    }, 300);
  };

  const backToLogin = () => {
    setScreenTransition(true);
    setTimeout(() => {
      setIsForgotPassword(false);
      setIsLogin(true);
      setEmail("");
      setPassword("");
      setScreenTransition(false);
    }, 300);
  };

  const handleForgotPasswordSubmit = () => {
    if (!email || !email.includes("@")) {
      setEmailError(true);
      return;
    }

    setIsVerifying(true);

    fetch(`${config.url}/api/resetpass`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })
      .then(response => {
        if (!response.ok && response.status !== 200) {
          console.error(`Server responded with status: ${response.status}`);
        }
        return response.text();
      })
      .then(text => {
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error('Failed to parse response as JSON:', text);
          throw new Error('Invalid JSON response from server');
        }
        
        setIsVerifying(false);
        
        if (data.success) {
          toast.success(data.message || 'Reset code sent to your email!', {
            position: 'bottom-right',
          });
          
          setScreenTransition(true);
          setTimeout(() => {
            setForgotPasswordStep(2);
            setScreenTransition(false);
          }, 300);
        } else {
          if (data.errors && data.errors.email) {
            setEmailError(true);
          }
          
          toast.error(data.message || 'Failed to send reset code.', {
            position: 'bottom-right',
          });
        }
      })
      .catch(error => {
        setIsVerifying(false);
        toast.error('An error occurred. Please try again.', {
          position: 'bottom-right',
        });
        console.error('Password reset request error:', error);
      });
  };

  const verifyForgotPasswordOtp = () => {
    const otp = otpValues.join("");
    if (otp.length !== 4) {
      setOtpError(true);
      return;
    }

    setIsVerifying(true);

    fetch(`${config.url}/api/resetpass/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp }),
    })
      .then(response => {
        if (!response.ok && response.status !== 200) {
          console.error(`Server responded with status: ${response.status}`);
        }
        return response.text();
      })
      .then(text => {
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error('Failed to parse response as JSON:', text);
          throw new Error('Invalid JSON response from server');
        }
        
        setIsVerifying(false);
        
        if (data.valid) {

          toast.success(data.message || 'Verification successful! Please set your new password.', {
            position: 'bottom-right',
          });
          
          setScreenTransition(true);
          setTimeout(() => {
            setForgotPasswordStep(3);
            setScreenTransition(false);
          }, 300);
        } else {
          setOtpError(true);
          toast.error(data.message || 'Invalid verification code. Please try again.', {
            position: 'bottom-right',
          });
        }
      })
      .catch(error => {
        setIsVerifying(false);
        setOtpError(true);
        toast.error('An error occurred. Please try again.', {
          position: 'bottom-right',
        });
        console.error('Password reset verification error:', error);
      });
  };

  const handleResetPassword = () => {
    if (newPassword.length < 6) {
      setPasswordError(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordsMatch(false);
      return;
    }

    setIsVerifying(true);

    fetch(`${config.url}/api/resetdone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email, 
        otp: otpValues.join(''), 
        newPassword 
      }),
    })
      .then(response => {
        if (!response.ok && response.status !== 200) {
          console.error(`Server responded with status: ${response.status}`);
        }
        return response.text();
      })
      .then(text => {
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error('Failed to parse response as JSON:', text);
          throw new Error('Invalid JSON response from server');
        }
        
        setIsVerifying(false);
        
        if (data.success) {
          setResetPasswordSuccess(true);
          toast.success(data.message || 'Password reset successful!', {
            position: 'bottom-right',
          });

          setTimeout(() => {
            setScreenTransition(true);
            setTimeout(() => {
              setIsForgotPassword(false);
              setIsLogin(true);
              setEmail("");
              setPassword("");
              setScreenTransition(false);
            }, 300);
          }, 2000);
        } else {
          if (data.errors) {
            if (data.errors.password) {
              setPasswordError(true);
            }
            if (data.errors.otp) {
              setOtpError(true);
            }
          }
          
          toast.error(data.message || 'Failed to reset password. Please try again.', {
            position: 'bottom-right',
          });
        }
      })
      .catch(error => {
        setIsVerifying(false);
        toast.error('An error occurred. Please try again.', {
          position: 'bottom-right',
        });
        console.error('Password reset error:', error);
      });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        if (isForgotPassword) {
          if (forgotPasswordStep === 1) {
            handleForgotPasswordSubmit();
          } else if (forgotPasswordStep === 2) {
            verifyForgotPasswordOtp();
          } else if (forgotPasswordStep === 3) {
            handleResetPassword();
          }
        } else if (isOtpVerification) {
          handleEmailAuth();
        } else {
          handleEmailAuth();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isForgotPassword, forgotPasswordStep, isOtpVerification, email, password, username, otpValues, newPassword, confirmPassword, isVerifying]);

  return (
    <div
      className={`fixed top-0 left-0 w-full h-full px-4 z-50 flex items-center justify-center bg-[#000000a1] backdrop-blur-sm transition-all duration-300 ease-in-out ${
        isExiting ? "opacity-0" : isEntering ? "opacity-0" : "opacity-100"
      }`}
    >
      <Toaster theme="dark" position="bottom-right" richColors />
      <div
        ref={modalContentRef}
        className={`w-full max-w-4xl flex flex-col md:flex-row rounded-xl overflow-hidden shadow-2xl bg-black transition-all duration-300 ease-in-out 
        ${
          isExiting
            ? "scale-95 opacity-0"
            : isEntering
            ? "scale-95 opacity-0"
            : "scale-100 opacity-100"
        }`}
      >
        <div className="w-full md:w-2/5 relative hidden md:block md:h-auto overflow-hidden">
          <img
            src="/signin.jpg"
            alt="Sign In Image"
            className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-300 ease-in-out ${
              isLogin ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <img
            src="/signup.jpg"
            alt="Sign Up Image"
            className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-300 ease-in-out ${
              !isLogin ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30"></div>
        </div>

        <div className="w-full md:w-3/5 p-8 md:px-16 bg-black text-white transition-all duration-300 ease-in-out">
          <div className="w-full flex justify-end mb-6">
            <button
              onClick={closeModal}
              className="flex group items-center cursor-pointer gap-1"
            >
              <i className="ri-close-line text-2xl text-[#CCCCCC] group-hover:text-white group-hover:rotate-90 transition-all duration-300 ease-out"></i>
            </button>
          </div>

          {isForgotPassword ? (
            <div
              className={`transition-all duration-300 ease-in-out ${
                screenTransition
                  ? "opacity-0 translate-y-10"
                  : "opacity-100 translate-y-0"
              }`}
            >
              <div className="flex items-center mb-8">
                <button
                  onClick={
                    forgotPasswordStep === 1
                      ? backToLogin
                      : () => {
                          setScreenTransition(true);
                          setTimeout(() => {
                            if (forgotPasswordStep === 2) {
                              setOtpValues(["", "", "", ""]); // Reset OTP values when going back from OTP step
                              setOtpError(false);
                            }
                            setForgotPasswordStep((prev) => prev - 1);
                            setScreenTransition(false);
                          }, 300);
                        }
                  }
                  className="text-[#cccccc] cursor-pointer hover:text-white transition-colors duration-200 flex items-center mr-2 group"
                >
                  <i className="ri-arrow-left-line text-xl group-hover:-translate-x-1 transition-transform duration-200"></i>
                </button>
                <h1 className="font-inter font-semibold text-2xl">
                  {forgotPasswordStep === 1 && "Reset your password"}
                  {forgotPasswordStep === 2 && "Verify your email"}
                  {forgotPasswordStep === 3 && "Create new password"}
                </h1>
              </div>

              <div className="flex items-center justify-center space-x-2 mb-8">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`flex items-center ${step !== 1 && "ml-1"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 
                      ${
                        forgotPasswordStep >= step
                          ? "border-white bg-white text-black"
                          : "border-[#444] text-[#999]"
                      }`}
                    >
                      {forgotPasswordStep > step ? (
                        <i className="ri-check-line text-xl"></i>
                      ) : (
                        step
                      )}
                    </div>
                    {step < 3 && (
                      <div
                        className={`w-12 h-0.5 ${
                          forgotPasswordStep > step ? "bg-white" : "bg-[#444]"
                        }`}
                      ></div>
                    )}
                  </div>
                ))}
              </div>

              {forgotPasswordStep === 1 && (
                <>
                  <p className="text-[#cccccc] text-sm mb-6">
                    Enter your email address and we'll send you a verification
                    code to reset your password.
                  </p>

                  <div className="w-full relative mb-6">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError(false);
                      }}
                      className={`w-full ${
                        emailError
                          ? "bg-[#440b0b] border-red-500"
                          : "bg-[#1f1f1f] border-[#3a3a3a]"
                      } text-white font-inter text-base py-3 px-5 rounded-md border focus:outline-none focus:border-[#cccccc] transition-all duration-200`}
                    />
                    {emailError && (
                      <p className="text-red-500 text-sm mt-2 flex items-center">
                        <i className="ri-error-warning-line mr-1"></i>
                        Please enter a valid email address
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleForgotPasswordSubmit}
                    disabled={isVerifying}
                    className={`relative cursor-pointer flex items-center justify-center bg-[#f2f2f2] text-black font-inter w-full font-medium py-3 px-4 rounded-md transition duration-200 
                      ${
                        isVerifying
                          ? "opacity-70 cursor-not-allowed"
                          : "hover:bg-[#e1e1e1]"
                      }`}
                  >
                    {isVerifying ? (
                      <>
                        <span className="absolute left-1/2 transform -translate-x-1/2">
                          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        </span>
                        <span className="opacity-0">Continue</span>
                      </>
                    ) : (
                      "Continue"
                    )}
                  </button>
                </>
              )}

              {forgotPasswordStep === 2 && (
                <>
                  <p className="text-[#cccccc] mb-6">
                    We've sent a verification code to{" "}
                    <span className="text-white font-medium">{email}</span>
                  </p>

                  <div className="flex justify-center space-x-3 mb-6">
                    {otpValues.map((value, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpInputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={index === 0 ? 4 : 1}
                        value={value}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={(e) => handleOtpPaste(e, index)}
                        className={`w-12 h-12 text-center text-lg font-medium rounded-md focus:outline-none transition-all duration-200
                          ${
                            otpError
                              ? "bg-[#440b0b] border border-red-500"
                              : "bg-[#1f1f1f] border border-[#3a3a3a] focus:border-[#cccccc]"
                          }
                          hover:bg-[#2a2a2a]`}
                      />
                    ))}
                  </div>

                  {otpError && (
                    <p className="text-red-500 text-center text-sm mb-4">
                      Please enter a valid 4-digit verification code
                    </p>
                  )}

                  <button
                    onClick={verifyForgotPasswordOtp}
                    disabled={isVerifying}
                    className={`relative cursor-pointer flex items-center justify-center mt-2 bg-[#f2f2f2] text-black font-inter w-full font-medium py-3 px-4 rounded-md transition duration-200 
                      ${
                        isVerifying
                          ? "opacity-70 cursor-not-allowed"
                          : "hover:bg-[#e1e1e1]"
                      }`}
                  >
                    {isVerifying ? (
                      <>
                        <span className="absolute left-1/2 transform -translate-x-1/2">
                          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        </span>
                        <span className="opacity-0">Verify</span>
                      </>
                    ) : (
                      "Verify"
                    )}
                  </button>

                  <div className="text-center mt-6">
                    <p className="text-[#cccccc] text-sm mb-2">
                      Didn't receive the code?
                    </p>
                    <button
                      onClick={() => handleResendOtp("reset")}
                      disabled={resendCooldown}
                      className={`text-sm ${
                        resendCooldown
                          ? "text-[#777777] cursor-not-allowed"
                          : "text-white cursor-pointer hover:underline"
                      }`}
                    >
                      {resendCooldown
                        ? `Resend code in ${cooldownTime}s`
                        : "Resend code"}
                    </button>
                  </div>
                </>
              )}

              {forgotPasswordStep === 3 && !resetPasswordSuccess && (
                <>
                  <p className="text-[#cccccc] text-sm mb-6">
                    Create a new password for your account.
                  </p>

                  <div className="w-full relative mb-5">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPasswordError(false);
                        setPasswordsMatch(true);
                      }}
                      className={`w-full ${
                        passwordError
                          ? "bg-[#440b0b] border-red-500"
                          : "bg-[#1f1f1f] border-[#3a3a3a]"
                      } text-white font-inter text-base py-3 px-5 rounded-md border focus:outline-none focus:border-[#cccccc] transition-all duration-200`}
                    />
                    <button
                      type="button"
                      onClick={() => handleEye("new")}
                      className={`${
                        showNewPassword ? "ri-eye-line" : "ri-eye-off-line"
                      } absolute right-4 text-xl top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer`}
                    ></button>
                  </div>

                  <div className="w-full relative mb-2">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setPasswordsMatch(true);
                      }}
                      className={`w-full ${
                        !passwordsMatch
                          ? "bg-[#440b0b] border-red-500"
                          : "bg-[#1f1f1f] border-[#3a3a3a]"
                      } text-white font-inter text-base py-3 px-5 rounded-md border focus:outline-none focus:border-[#cccccc] transition-all duration-200`}
                    />
                    <button
                      type="button"
                      onClick={() => handleEye("confirm")}
                      className={`${
                        showConfirmPassword ? "ri-eye-line" : "ri-eye-off-line"
                      } absolute right-4 text-xl top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer`}
                    ></button>
                  </div>

                  {passwordError && (
                    <p className="text-red-500 text-sm mb-4">
                      Password must be at least 6 characters
                    </p>
                  )}

                  {!passwordsMatch && (
                    <p className="text-red-500 text-sm mb-4">
                      Passwords do not match
                    </p>
                  )}

                  <div className="text-[#aaaaaa] text-xs mb-6">
                    <p className="mb-1">Password should:</p>
                    <ul className="list-disc pl-5 space-y-0.5">
                      <li
                        className={
                          newPassword.length >= 6 ? "text-green-500" : ""
                        }
                      >
                        Be at least 6 characters long
                      </li>
                      <li
                        className={
                          /[A-Z]/.test(newPassword) ? "text-green-500" : ""
                        }
                      >
                        Include at least one uppercase letter
                      </li>
                      <li
                        className={
                          /[0-9]/.test(newPassword) ? "text-green-500" : ""
                        }
                      >
                        Include at least one number
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={handleResetPassword}
                    disabled={isVerifying}
                    className={`relative cursor-pointer flex items-center justify-center bg-[#f2f2f2] text-black font-inter w-full font-medium py-3 px-4 rounded-md transition duration-200 
                      ${
                        isVerifying
                          ? "opacity-70 cursor-not-allowed"
                          : "hover:bg-[#e1e1e1]"
                      }`}
                  >
                    {isVerifying ? (
                      <>
                        <span className="absolute left-1/2 transform -translate-x-1/2">
                          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        </span>
                        <span className="opacity-0">Reset Password</span>
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </button>
                </>
              )}

              {resetPasswordSuccess && (
                <div className="flex flex-col items-center justify-center py-8 animate-fadeIn">
                  <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mb-4 animate-scaleIn">
                    <i className="ri-lock-unlock-line text-3xl text-white"></i>
                  </div>
                  <h2 className="text-2xl font-semibold mb-2">
                    Password Reset Successful!
                  </h2>
                  <p className="text-[#cccccc] text-center">
                    Your password has been updated successfully.
                    <br />
                    You'll be redirected to login shortly.
                  </p>
                </div>
              )}
            </div>
          ) : isOtpVerification ? (
            <div
              className={`transition-all duration-300 ease-in-out ${
                screenTransition
                  ? "opacity-0 translate-x-10"
                  : "opacity-100 translate-x-0"
              }`}
            >
              <div className="flex items-center mb-8">
                <button
                  onClick={toggleAuthMode}
                  className="text-[#cccccc] cursor-pointer hover:text-white transition-colors duration-200 flex items-center mr-2 group"
                >
                  <i className="ri-arrow-left-line text-xl group-hover:-translate-x-1 transition-transform duration-200"></i>
                </button>
                <h1 className="font-inter font-semibold text-2xl">
                  Verify your email
                </h1>
              </div>

              {verificationSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 animate-fadeIn">
                  <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mb-4 animate-scaleIn">
                    <i className="ri-check-line text-3xl text-white"></i>
                  </div>
                  <h2 className="text-2xl font-semibold mb-2">
                    Successfully Verified!
                  </h2>
                  <p className="text-[#cccccc] text-center">
                    Your account has been created successfully.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-[#cccccc] mb-8">
                    We've sent a verification code to{" "}
                    <span className="text-white font-medium">{email}</span>
                  </p>

                  <div className="flex justify-center space-x-3 mb-8">
                    {otpValues.map((value, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpInputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={index === 0 ? 4 : 1}
                        value={value}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={(e) => handleOtpPaste(e, index)}
                        className={`w-12 h-12 text-center text-lg font-medium rounded-md focus:outline-none transition-all duration-200
                          ${
                            otpError
                              ? "bg-[#440b0b] border border-red-500"
                              : "bg-[#1f1f1f] border border-[#3a3a3a] focus:border-[#cccccc]"
                          }
                          hover:bg-[#2a2a2a]`}
                      />
                    ))}
                  </div>

                  {otpError && (
                    <p className="text-red-500 text-center text-sm mb-4">
                      Please enter a valid 4-digit verification code
                    </p>
                  )}

                  <button
                    onClick={handleEmailAuth}
                    disabled={isVerifying}
                    className={`relative flex items-center cursor-pointer justify-center mt-2 bg-[#f2f2f2] text-black font-inter w-full font-medium py-3 px-4 rounded-md transition duration-200 ${
                      isVerifying
                        ? "opacity-70 cursor-not-allowed"
                        : "hover:bg-[#e1e1e1]"
                    }`}
                  >
                    {isVerifying ? (
                      <>
                        <span className="absolute left-1/2 transform -translate-x-1/2">
                          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        </span>
                        <span className="opacity-0">Verify</span>
                      </>
                    ) : (
                      "Verify"
                    )}
                  </button>

                  <div className="text-center mt-8">
                    <p className="text-[#cccccc] text-sm mb-2">
                      Didn't receive the code?
                    </p>
                    <button
                      onClick={() => handleResendOtp("verification")}
                      disabled={resendCooldown}
                      className={`text-sm cursor-pointer ${
                        resendCooldown
                          ? "text-[#777777] cursor-not-allowed"
                          : "text-white hover:underline"
                      }`}
                    >
                      {resendCooldown
                        ? `Resend code in ${cooldownTime}s`
                        : "Resend code"}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div
              className={`transition-all duration-300 ease-in-out ${
                screenTransition
                  ? "opacity-0 -translate-x-10"
                  : "opacity-100 translate-x-0"
              }`}
            >
              <h1 className="font-inter font-semibold text-center text-4xl">
                {isLogin ? "Welcome back" : "Let's get started"}
              </h1>
              <h4 className="font-inter text-sm font-medium mt-4 mb-6 tracking-wide leading-5 text-[#cccccc] text-center max-w-[21rem] mx-auto">
                {isLogin
                  ? "You're just One step away from unlocking the best content known to mankind. Log in now!"
                  : "You're just One step away from unlocking the best content known to mankind. Sign up now!"}
              </h4>

              <div className="flex flex-col gap-4 justify-center w-full">
                <button
                  onClick={() => googleLogin()}
                  className="border border-[#acacac] hover:cursor-pointer hover:border-white hover:scale-[1.02] transition-all ease-in-out gap-2 flex items-center justify-center text-white font-inter w-full font-medium py-2.5 px-4 rounded-full duration-300"
                >
                  <img src="google.svg" className="w-[1.7rem]" alt="" />
                  {isLogin ? "Sign in with Google" : "Sign up with Google"}
                </button>
              </div>

              <div className="flex items-center w-[80%] mx-auto my-4">
                <div className="w-[45%] h-[1px] bg-[#8c8c8c]"></div>
                <div className="px-4 text-[#cccccc]">or</div>
                <div className="w-[45%] h-[1px] bg-[#8c8c8c]"></div>
              </div>

              {!isLogin && (
                <div className="w-full relative">
                  <input
                    type="text"
                    placeholder="Enter username"
                    id="username"
                    value={username}
                    onChange={(e) => {
                      // Only allow alphanumeric characters (letters and numbers) and limit to 16 characters
                      const sanitizedValue = e.target.value
                        .replace(/[^a-zA-Z0-9]/g, "")
                        .substring(0, 16);
                      setUsername(sanitizedValue);
                      setUsernameError(false);
                    }}
                    className={`w-full ${
                      usernameError ? "bg-[#440b0b]" : "bg-[#1f1f1f]"
                    } text-white font-inter text-base py-3 px-7 rounded-full focus:outline-none focus:ring-2 focus:ring-[#cccccc] hover:ring-2 hover:ring-[#a2a2a2] focus:border-transparent transition-all ease-out duration-300`}
                  />
                  {usernameError && (
                    <p className="text-red-500 text-xs mt-1 ml-2">
                      Username must be at least 3 characters
                    </p>
                  )}
                </div>
              )}

              <div className={`w-full relative ${!isLogin ? "mt-4" : ""}`}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError(false);
                  }}
                  className={`w-full ${
                    emailError ? "bg-[#440b0b]" : "bg-[#1f1f1f]"
                  } text-white font-inter text-base py-3 px-7 rounded-full focus:outline-none focus:ring-2 focus:ring-[#cccccc] hover:ring-2 hover:ring-[#a2a2a2] focus:border-transparent transition-all ease-out duration-300`}
                />
              </div>

              <div className="w-full relative mt-4">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={
                    isLogin ? "Enter your password" : "Create a password"
                  }
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError(false);
                  }}
                  className={`w-full ${
                    passwordError ? "bg-[#440b0b]" : "bg-[#1f1f1f]"
                  } text-white font-inter text-base py-3 px-7 rounded-full focus:outline-none focus:ring-2 focus:ring-[#cccccc] hover:ring-2 hover:ring-[#a2a2a2] focus:border-transparent transition-all ease-out duration-300`}
                />
                <button
                  type="button"
                  onClick={() => handleEye()}
                  className={`${
                    showPassword ? "ri-eye-line" : "ri-eye-off-line"
                  } absolute right-6 text-xl top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer`}
                ></button>
              </div>
              {/* {passwordError && (
                <p className="text-red-500 text-xs mt-1 ml-2">
                  Password must be at least 6 characters
                </p>
              )} */}

              <button
                onClick={handleEmailAuth}
                disabled={isVerifying}
                className={`relative mt-6 cursor-pointer flex items-center justify-center bg-[#f2f2f2] text-black font-inter w-full font-medium py-3 px-4 rounded-full transition duration-300 ${
                  isVerifying
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:bg-[#e1e1e1] hover:scale-[1.02]"
                }`}
              >
                {isVerifying ? (
                  <>
                    <span className="absolute left-1/2 transform -translate-x-1/2">
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    </span>
                    <span className="opacity-0">
                      {isLogin ? "Login with Email" : "Register with Email"}
                    </span>
                  </>
                ) : isLogin ? (
                  "Login with Email"
                ) : (
                  "Register with Email"
                )}
              </button>

              {isLogin && (
                <div className="text-end mt-1">
                  <button
                    onClick={initiateForgotPassword}
                    className="text-[#cccccc] cursor-pointer text-sm hover:text-white hover:underline transition-colors duration-200"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <h5 className="font-inter text-[#cccccc] mt-5 text-center">
                {isLogin
                  ? "Don't have an account?"
                  : "Already have an account?"}{" "}
                <button
                  onClick={toggleAuthMode}
                  className="ml-0.5 hover:cursor-pointer hover:underline decoration-[#c1c1c1] text-white"
                >
                  {isLogin ? "Sign Up" : "Login"}
                </button>
              </h5>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModel;
