import React from 'react';
import Link from 'next/link';
import NavBar from '../../components/NavBar';
import Footer from '../../components/Footer';

const TermsOfServicePage = () => {
  return (
    <div className="bg-black text-white font-inter min-h-screen">
      <NavBar showCategories={true} />
      
      <main className="max-w-[79rem] mx-auto px-4 lg:px-2 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">Terms of Service</h1>
            <p className="text-neutral-400 text-lg">Last updated: December 27, 2024</p>
          </div>

          <div className="prose prose-invert prose-lg max-w-none text-neutral-300 space-y-8">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 mb-8">
              <h3 className="text-xl font-semibold text-[#d6d203] mb-3">Important Notice</h3>
              <p className="text-neutral-300">
                Welcome to Lumeroo! These terms and conditions outline the rules and regulations for the use of Lumeroo's website and services. 
                This platform is a <strong>personal portfolio project</strong> created to demonstrate advanced video streaming, 
                image hosting, and content management capabilities. It is not intended for commercial use or profit generation.
              </p>
            </div>
            
            <p className="text-lg leading-relaxed">
              By accessing this website located at this domain, we assume you accept these terms and conditions in full. 
              Do not continue to use Lumeroo if you do not agree to all of the terms and conditions stated on this page. 
              These terms apply to all visitors, users, and others who access or use the service.
            </p>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">1. Project Nature and Purpose</h2>
              <p className="mb-4">
                Lumeroo is a comprehensive showcase project developed to demonstrate technical proficiency in:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>Advanced video streaming technologies including HLS (HTTP Live Streaming)</li>
                <li>Image hosting and gallery management systems</li>
                <li>User authentication and profile management</li>
                <li>Content upload, processing, and delivery mechanisms</li>
                <li>Responsive web design and user interface development</li>
                <li>Database management and API development</li>
              </ul>
              <p>
                This platform is <strong>not intended for profit, commercial use, or to cause any harm</strong>. All content and features 
                are designed for demonstration purposes to showcase technical capabilities and development skills. The project serves 
                as a portfolio piece to highlight expertise in modern web development technologies.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">2. Content Guidelines and Responsibilities</h2>
              <p className="mb-4">
                The content uploaded to Lumeroo is entirely user-generated. While we strive to maintain a safe and respectful 
                environment for all users, please understand the following:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>All uploaded content (videos, images, descriptions, comments) is the sole responsibility of the user who uploaded it</li>
                <li>Users are expected to upload only content they own or have proper rights to share</li>
                <li>Content should be appropriate and not violate any laws or regulations</li>
                <li>We reserve the right to remove content that violates these guidelines</li>
                <li>Users should respect intellectual property rights and not upload copyrighted material without permission</li>
              </ul>
              <p>
                By uploading content, you grant Lumeroo a non-exclusive license to store, process, and display your content 
                for the purposes of operating this demonstration platform.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">3. Acceptable Use Policy</h2>
              <p className="mb-4">
                When using Lumeroo, you agree to the following acceptable use guidelines:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>You must not use this website to upload, share, or distribute illegal, harmful, or offensive content</li>
                <li>You must not attempt to gain unauthorized access to any part of the service or other users' accounts</li>
                <li>You must not use the service to spam, harass, or abuse other users</li>
                <li>You must not attempt to overload or disrupt the service through automated means or excessive requests</li>
                <li>You must not use the service for any commercial purposes without explicit permission</li>
                <li>You must not impersonate other individuals or entities</li>
              </ul>
              <p>
                Violation of these guidelines may result in immediate suspension or termination of your access to the service.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">4. Reporting Issues and Direct Communication</h2>
              <p className="mb-4">
                <strong>Important:</strong> This is a personal portfolio project maintained by a single developer. 
                The automated reporting features and moderation systems on the website may not be monitored regularly or in real-time.
              </p>
              <p className="mb-4">
                For the fastest and most effective response to any concerns, please contact the developer directly via email:
              </p>
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 mb-4">
                <p className="text-center">
                  <strong>Email:</strong> <a href="mailto:siddz.dev@gmail.com" className="text-[#d6d203] hover:underline">siddz.dev@gmail.com</a>
                </p>
              </div>
              <p className="mb-4">
                Please include the following information when reporting issues:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>Detailed description of the issue or concern</li>
                <li>URL or location of problematic content (if applicable)</li>
                <li>Your contact information for follow-up</li>
                <li>Any relevant screenshots or evidence</li>
              </ul>
              <p>
                The developer is committed to addressing legitimate concerns promptly and maintaining a positive experience for all users of this demonstration platform.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">5. Privacy and Data Handling</h2>
              <p className="mb-4">
                Your privacy is important to us. This service collects minimal personal information necessary for functionality:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>Email addresses for account creation and authentication</li>
                <li>User-provided content such as videos, images, and profile information</li>
                <li>Basic usage analytics to improve the service</li>
              </ul>
              <p>
                For detailed information about how we collect, use, and protect your data, please review our 
                <Link href="/privacy-policy" className="text-[#d6d203] hover:underline">Privacy Policy</Link>.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">6. Limitation of Liability</h2>
              <p className="mb-4">
                This website and service are provided "as is" without any representations or warranties of any kind. 
                To the fullest extent permitted by law:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>We disclaim all warranties, express or implied, including merchantability and fitness for a particular purpose</li>
                <li>We are not liable for any damages arising from your use of the service</li>
                <li>We do not guarantee uninterrupted or error-free operation of the service</li>
                <li>We are not responsible for user-generated content or third-party actions</li>
              </ul>
              <p>
                As this is a demonstration project, users should not rely on it for critical or important data storage.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">7. Intellectual Property</h2>
              <p className="mb-4">
                The Lumeroo platform, including its design, code, and functionality, is the intellectual property of the developer. 
                However, users retain ownership of their uploaded content. By using the service, you agree that:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>You will not copy, reproduce, or reverse engineer the platform's code or design</li>
                <li>You grant us necessary rights to store and display your content on the platform</li>
                <li>You will respect the intellectual property rights of others</li>
                <li>You will not upload content that infringes on copyrights or other intellectual property rights</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">8. Modifications to Terms</h2>
              <p className="mb-4">
                We reserve the right to modify these terms of service at any time. Changes will be effective immediately upon posting 
                to this page. Continued use of the service after changes constitutes acceptance of the new terms.
              </p>
              <p>
                We recommend reviewing these terms periodically to stay informed of any updates. Significant changes may be 
                announced through the platform or via email to registered users.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">9. Termination</h2>
              <p className="mb-4">
                We may terminate or suspend your access to the service immediately, without prior notice or liability, 
                for any reason whatsoever, including without limitation if you breach the terms of service.
              </p>
              <p>
                Upon termination, your right to use the service will cease immediately. User content may be retained 
                for a reasonable period but will not be accessible through your account.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">10. Contact Information</h2>
              <p className="mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                <p><strong>Email:</strong> <a href="mailto:siddz.dev@gmail.com" className="text-[#d6d203] hover:underline">siddz.dev@gmail.com</a></p>
                <p><strong>Project:</strong> Lumeroo Portfolio Demonstration</p>
                <p><strong>Developer:</strong> Portfolio Creator</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfServicePage;
