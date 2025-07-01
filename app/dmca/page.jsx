"use client";
import React from 'react';
import NavBar from '../../components/NavBar';
import Footer from '../../components/Footer';

const DMCA = () => {
  return (
    <div className="min-h-screen text-white font-inter">
      <NavBar showCategories={false} />

      <main className="max-w-4xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
            DMCA Policy
          </h1>
          <p className="text-[#d6d203] text-base sm:text-lg italic">
            Last updated: July 1, 2025
          </p>
        </div>

        <div className="space-y-12 text-[#c2c2c2] text-base sm:text-lg leading-7 sm:leading-8 tracking-wide">
          <section className="space-y-4 border-b border-[#2a2a2a] pb-8">
            <h2 className="text-2xl font-semibold text-white">
              1. Overview
            </h2>
            <p>
              Lumeroo is a personal portfolio project built for demonstration and learning purposes, showcasing advanced web development, content streaming, and platform architecture. While the project includes streaming functionality and sample content, it is not a commercial website and does not intend to distribute or profit from copyrighted material.
            </p>
            <p>
              We respect the intellectual property rights of others and comply with the provisions of the Digital Millennium Copyright Act (“DMCA”). This page explains how to submit takedown requests and how we handle them.
            </p>
          </section>

          <section className="space-y-4 border-b border-[#2a2a2a] pb-8">
            <h2 className="text-2xl font-semibold text-white">
              2. Content Purpose Disclaimer
            </h2>
            <p>
              Any media or content displayed on Lumeroo is used for technical showcase purposes only. It is either:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 sm:ml-6">
              <li>Uploaded as placeholder/test data</li>
              <li>Public domain or openly licensed content</li>
              <li>Used to demonstrate playback, layout, and moderation logic</li>
            </ul>
            <p>
              If you are a rights holder and find your content displayed on Lumeroo without permission, you may request its removal using the DMCA process below.
            </p>
          </section>

          <section className="space-y-4 border-b border-[#2a2a2a] pb-8">
            <h2 className="text-2xl font-semibold text-white">
              3. How to Submit a DMCA Notice
            </h2>
            <p>
              If you believe your copyrighted work has been used on Lumeroo in a way that constitutes copyright infringement, please submit a written DMCA notice including the following:
            </p>
            <ul className="list-decimal list-inside space-y-2 ml-4 sm:ml-6">
              <li>Your physical or electronic signature.</li>
              <li>Identification of the copyrighted work claimed to have been infringed.</li>
              <li>The exact URL(s) or sufficient information to locate the material on Lumeroo.</li>
              <li>Your contact information (full name, address, phone, and email).</li>
              <li>A statement that you have a good faith belief that the disputed use is not authorized.</li>
              <li>A statement under penalty of perjury that the information in the notice is accurate and that you are the copyright owner or authorized to act on behalf of the owner.</li>
            </ul>
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5 mt-5">
              <p><span className="text-[#d6d203] font-semibold">Email:</span>{' '}
                <a href="mailto:siddz.dev@gmail.com" className="text-[#d6d203] hover:underline">
                  siddz.dev@gmail.com
                </a>
              </p>
              <p className="text-sm mt-2 text-[#999] italic">
                Please use subject: <strong>DMCA Notice - [Brief Description]</strong>
              </p>
            </div>
          </section>

          <section className="space-y-4 border-b border-[#2a2a2a] pb-8">
            <h2 className="text-2xl font-semibold text-white">
              4. Counter-Notification
            </h2>
            <p>
              If you believe your content was removed in error, you may submit a counter-notification. It must include:
            </p>
            <ul className="list-decimal list-inside space-y-2 ml-4 sm:ml-6">
              <li>Your signature (physical or electronic).</li>
              <li>Identification of the content removed and its location before removal.</li>
              <li>A statement under penalty of perjury that the material was removed due to mistake or misidentification.</li>
              <li>Your name, address, phone, and consent to jurisdiction of the appropriate court.</li>
              <li>A statement that you will accept service of process from the person who filed the original DMCA notice.</li>
            </ul>
            <p>
              We may restore the removed content within 10–14 business days unless the original complainant files legal action.
            </p>
          </section>

          <section className="space-y-4 border-b border-[#2a2a2a] pb-8">
            <h2 className="text-2xl font-semibold text-white">
              5. Repeat Infringer Policy
            </h2>
            <p>
              As a demonstration project, accounts are rarely persistent. However, if user-uploaded content functionality is added, we will implement a policy to terminate access by users who repeatedly violate copyright law.
            </p>
          </section>

          <section className="space-y-4 border-b border-[#2a2a2a] pb-8">
            <h2 className="text-2xl font-semibold text-white">
              6. False Claims Warning
            </h2>
            <p>
              Submitting false DMCA notices is a legal offense. Under 17 U.S.C. § 512(f), any person who knowingly misrepresents that material is infringing may be liable for damages, including attorney's fees.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">
              7. Contact
            </h2>
            <p>
              For all DMCA-related concerns or questions, please contact:
            </p>
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5">
              <p><strong className="text-[#d6d203]">Email:</strong>{' '}
                <a href="mailto:siddz.dev@gmail.com" className="text-[#d6d203] hover:underline">
                  siddz.dev@gmail.com
                </a>
              </p>
              <p><strong className="text-[#d6d203]">Project:</strong> Lumeroo (Demo Platform)</p>
              <p><strong className="text-[#d6d203]">Response Time:</strong> 24–48 hours for valid notices</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DMCA;
