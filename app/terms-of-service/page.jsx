"use client";
import React, { useState } from "react";
import Link from "next/link";
import NavBar from "../../components/NavBar";
import Footer from "../../components/Footer";

const TermsOfService = () => {
  const [user, setUser] = useState(null);

  return (
    <div className="min-h-screen text-white font-inter">
      <NavBar user={user} setUser={setUser} showCategories={false} />

      <main className="max-w-4xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Terms of Service
          </h1>
          <p className="text-[#c2c2c2] text-base sm:text-lg max-w-xl mx-auto">
            These Terms of Service govern your access to and use of Lumeroo. By using the platform, you agree to these terms.
          </p>
          <div className="text-sm text-[#939393] font-medium mt-2 italic">
            Last updated: July 1, 2025
          </div>
        </div>

        <div className="space-y-12">
          { [
            {
              title: "1. Overview",
              content: [
                "Lumeroo is a content streaming platform where users can discover, view, share, and upload multimedia content. These Terms of Service constitute a legally binding agreement between you and Lumeroo.",
                "By using Lumeroo, you agree to be bound by these Terms. This applies to all users including content creators, viewers, and visitors."
              ]
            },
            {
              title: "2. Eligibility",
              content: [
                "You must be at least 13 years old to use Lumeroo. If you're under 18, you need parental permission to use our services.",
                "By using our platform, you confirm you meet these age requirements and have the authority to enter into this agreement."
              ]
            },
            {
              title: "3. User Accounts",
              content: [
                "Creating an account gives you access to additional features like content uploading and personalized recommendations. When you create an account, you agree to:"
              ],
              list: [
                "Provide accurate and current information",
                "Keep your account secure and confidential",
                "Notify us immediately of any unauthorized use",
                "Take responsibility for all activities under your account"
              ]
            },
            {
              title: "4. Acceptable Use",
              content: [
                "You agree to use Lumeroo only for lawful purposes. The following activities are prohibited:"
              ],
              list: [
                "Uploading content that infringes copyrights or other intellectual property",
                "Harassing, threatening, or abusing other users",
                "Using bots, scripts, or automated tools to access the service",
                "Distributing malware or attempting to hack the platform",
                "Posting illegal, harmful, or objectionable content",
                "Impersonating others or misrepresenting your identity"
              ]
            },
            {
              title: "5. Content and Intellectual Property",
              content: [
                "You retain ownership of content you upload to Lumeroo. However, by uploading content, you grant us a license to use, display, and distribute it in connection with operating our platform.",
                "All platform features, design, and technology remain the property of Lumeroo. You're responsible for ensuring your uploaded content doesn't violate any third-party rights."
              ]
            },
            {
              title: "6. Privacy",
              content: [
                "Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your personal information.",
                "By using Lumeroo, you consent to our data practices as described in our Privacy Policy."
              ]
            },
            {
              title: "7. Service Changes",
              content: [
                "We may modify, suspend, or discontinue any part of our service at any time. While we aim for reliable service, we can't guarantee uninterrupted access.",
                "We continuously improve our platform and may add new features or remove existing ones as needed."
              ]
            },
            {
              title: "8. Account Termination",
              content: [
                "We may suspend or terminate your account if you violate these Terms or engage in harmful conduct.",
                "You can delete your account at any time through your account settings. Upon termination, your access to Lumeroo will cease immediately."
              ]
            },
            {
              title: "9. Disclaimers",
              content: [
                "Lumeroo is provided 'as is' without warranties. We don't guarantee the service will be error-free or always available.",
                "We're not liable for indirect damages, loss of profits, or other consequences resulting from your use of the platform."
              ]
            },
            {
              title: "10. Changes to Terms",
              content: [
                "We may update these Terms periodically. When we make significant changes, we'll notify users appropriately.",
                "Continued use of Lumeroo after updates means you accept the revised Terms."
              ]
            },
            {
              title: "11. Contact Us",
              content: [
                "If you have questions about these Terms or our service, please contact us."
              ],
              extra: (
                <div className="bg-[#101010] rounded-lg p-5 border border-[#1f1f1f] mt-3 space-y-2">
                  <p>
                    <strong>Email:</strong>{" "}
                    <a
                      href="mailto:siddz.dev@gmail.com"
                      className="text-[#d6d203] hover:underline"
                    >
                      siddz.dev@gmail.com
                    </a>
                  </p>
                  <p className="text-sm text-[#888888]">
                    We typically respond within 24-48 hours.
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
                  <p key={j} dangerouslySetInnerHTML={{ __html: c }} />
                ))}
                {section.list && (
                  <ul className="list-disc list-inside space-y-2 ml-4 sm:ml-6">
                    {section.list.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                )}
                {section.extra && (
                  typeof section.extra === 'string'
                    ? <p>{section.extra}</p>
                    : section.extra
                )}
              </div>
            </section>
          ))}
        </div>

        <div className="bg-[#101010] rounded-xl p-6 sm:p-8 border border-[#1f1f1f] mt-10 text-center space-y-4">
          <h3 className="text-2xl sm:text-4xl font-semibold text-white">Agreement Acknowledgment</h3>
          <p className="text-[#c2c2c2] text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
            By using Lumeroo, you confirm that you have read and agreed to be bound by these Terms of Service.
          </p>
          <div className="flex flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 pt-1">
            <Link
              href="/privacy-policy"
              className="bg-[#1a1a1a] text-[#d6d203] hover:bg-[#202020] transition px-4 py-2 rounded-full text-sm font-medium"
            >
              Privacy Policy
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

export default TermsOfService;
