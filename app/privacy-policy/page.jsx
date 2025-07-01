"use client";
import React, { useState } from "react";
import Link from "next/link";
import NavBar from "../../components/NavBar";
import Footer from "../../components/Footer";

const PrivacyPolicy = () => {
  const [user, setUser] = useState(null);

  return (
    <div className="min-h-screen bg-[#080808] text-white font-inter">
      <NavBar user={user} setUser={setUser} showCategories={false} />

      <main className="max-w-4xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-[#c2c2c2] text-base sm:text-lg max-w-xl mx-auto">
            This Privacy Policy outlines how Lumeroo collects, uses, and protects your personal information.
          </p>
          <div className="text-sm text-[#939393] font-medium mt-2 italic">
            Last updated: July 1, 2025
          </div>
        </div>

        <div className="space-y-12">
          {[
            {
              title: "1. Information We Collect",
              content: [
                "We collect limited information to operate Lumeroo and improve your experience. This includes:",
              ],
              list: [
                "Email address (when provided for registration or communication)",
                "IP address and device information (for analytics and security)",
                "Content uploaded or interacted with on the platform",
                "Basic usage statistics and preferences"
              ]
            },
            {
              title: "2. How We Use Your Information",
              content: [
                "We use your information to:",
              ],
              list: [
                "Provide core platform functionality",
                "Enhance performance, design, and stability",
                "Respond to inquiries or technical issues",
                "Maintain platform security and detect misuse"
              ]
            },
            {
              title: "3. Data Storage and Security",
              content: [
                "Your data is stored securely on our servers or trusted infrastructure partners. We use reasonable technical and organizational measures to protect personal data, but no system is completely immune to breach."
              ]
            },
            {
              title: "4. Cookies and Tracking",
              content: [
                "Lumeroo may use minimal cookies or local storage to remember user preferences or login states. No tracking or advertising cookies are used."
              ]
            },
            {
              title: "5. Third-Party Services",
              content: [
                "We may use trusted tools for analytics or video processing. These tools will only access anonymized or usage-level data. No personal information is sold or shared with advertisers."
              ]
            },
            {
              title: "6. Content and Showcase Usage",
              content: [
                "This is a personal, non-commercial project. Some content may be uploaded for the sole purpose of showcasing the platform’s capabilities. Such content is not intended for public distribution or monetization."
              ]
            },
            {
              title: "7. Account Deletion",
              content: [
                "You may request the deletion of your account and associated data at any time. Contact us at the email below for removal assistance."
              ]
            },
            {
              title: "8. Children's Privacy",
              content: [
                "Lumeroo is not intended for users under the age of 13. We do not knowingly collect data from children under 13. If we learn of such data, it will be promptly deleted."
              ]
            },
            {
              title: "9. Changes to This Policy",
              content: [
                "We may occasionally update this Privacy Policy. Continued use of the platform constitutes acceptance of the updated terms."
              ]
            },
            {
              title: "10. Contact Information",
              content: [
                "For any privacy-related questions or data removal requests, contact us at:"
              ],
              extra: (
                <div className="bg-[#101010] rounded-lg p-5 border border-[#1f1f1f] mt-3 space-y-1">
                  <p>
                    <strong>Email:</strong>{" "}
                    <a
                      href="mailto:siddz.dev@gmail.com"
                      className="text-[#d6d203] hover:underline"
                    >
                      siddz.dev@gmail.com
                    </a>
                  </p>
                  <p>
                    <strong>Project:</strong> Lumeroo Portfolio Demonstration
                  </p>
                </div>
              )
            }
          ].map((section, i) => (
            <section key={i} className="space-y-4 border-b border-[#1a1a1a] pb-8 sm:pb-10">
              <h2 className="text-2xl sm:text-3xl font-semibold text-white">
                {section.title}
              </h2>
              <div className="text-[#c2c2c2] leading-7 sm:leading-8 text-base sm:text-lg tracking-wide space-y-3">
                {section.content?.map((c, j) => (
                  <p key={j}>{c}</p>
                ))}
                {section.list && (
                  <ul className="list-disc list-inside space-y-2 ml-4 sm:ml-6">
                    {section.list.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                )}
                {section.extra && (
                  typeof section.extra === "string"
                    ? <p>{section.extra}</p>
                    : section.extra
                )}
              </div>
            </section>
          ))}
        </div>

        <div className="bg-[#101010] rounded-xl p-6 sm:p-8 border border-[#1f1f1f] mt-10 text-center space-y-4">
          <h3 className="text-2xl sm:text-4xl font-semibold text-white">
            Your Privacy, Your Control
          </h3>
          <p className="text-[#c2c2c2] text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Lumeroo is committed to minimal, respectful data practices. This project was built for demonstration not commercialization.
          </p>
          <div className="flex flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 pt-1">
            <Link
              href="/terms-of-service"
              className="bg-[#1a1a1a] text-[#d6d203] hover:bg-[#202020] transition px-4 py-2 rounded-full text-sm font-medium"
            >
              Terms of Service
            </Link>
            <Link
              href="/dmca"
              className="bg-[#1a1a1a] text-[#d6d203] hover:bg-[#202020] transition px-4 py-2 rounded-full text-sm font-medium"
            >
              DMCA Notice
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
