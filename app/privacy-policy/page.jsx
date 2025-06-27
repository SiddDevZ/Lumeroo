import React from 'react';
import NavBar from '../../components/NavBar';
import Footer from '../../components/Footer';

const PrivacyPolicyPage = () => {
  return (
    <div className="bg-black text-white font-inter min-h-screen">
      <NavBar showCategories={true} />
      
      <main className="max-w-[79rem] mx-auto px-4 lg:px-2 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">Privacy Policy</h1>
            <p className="text-neutral-400 text-lg">Last updated: December 27, 2024</p>
          </div>

          <div className="prose prose-invert prose-lg max-w-none text-neutral-300 space-y-8">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 mb-8">
              <h3 className="text-xl font-semibold text-[#d6d203] mb-3">Privacy Notice</h3>
              <p className="text-neutral-300">
                This Privacy Policy describes how Lumeroo, a <strong>personal portfolio project</strong>, 
                collects, uses, and protects your information. This is a demonstration platform designed to showcase 
                technical capabilities in video streaming and content management - not a commercial service.
              </p>
            </div>
            
            <p className="text-lg leading-relaxed">
              This Privacy Policy describes our policies and procedures on the collection, use, and disclosure of your information 
              when you use our service. It also explains your privacy rights and how the law protects you. By using Lumeroo, 
              you agree to the collection and use of information in accordance with this Privacy Policy.
            </p>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">1. Project Context and Data Philosophy</h2>
              <p className="mb-4">
                Lumeroo is a personal, non-commercial portfolio project developed to demonstrate expertise in:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>Modern web application development and user experience design</li>
                <li>Video streaming technologies and content delivery systems</li>
                <li>Image hosting, processing, and gallery management</li>
                <li>User authentication, authorization, and profile management</li>
                <li>Database design and API architecture</li>
                <li>Privacy-conscious data handling practices</li>
              </ul>
              <p>
                As a showcase project, data collection is minimal and purposeful. We believe in transparency about what 
                information we collect, why we collect it, and how it's used. This platform is not designed for business 
                purposes, advertising, or data monetization.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">2. Information We Collect</h2>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">2.1 Personal Information You Provide</h3>
                <p className="mb-3">When you use our service, we may collect the following information that you voluntarily provide:</p>
                <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                  <li><strong>Email Address:</strong> Required for account creation, authentication, and essential communications</li>
                  <li><strong>Username:</strong> Your chosen display name for the platform</li>
                  <li><strong>Profile Information:</strong> Optional profile picture, bio, and other profile customizations</li>
                  <li><strong>Content Data:</strong> Videos, images, titles, descriptions, and tags you upload</li>
                  <li><strong>Interaction Data:</strong> Comments, likes, and other engagement activities</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">2.2 Automatically Collected Information</h3>
                <p className="mb-3">We automatically collect certain technical information to ensure proper functionality:</p>
                <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                  <li><strong>Usage Analytics:</strong> Pages visited, time spent, features used (to improve the platform)</li>
                  <li><strong>Device Information:</strong> Browser type, operating system, screen resolution (for responsive design)</li>
                  <li><strong>IP Address:</strong> For security, geolocation-based content delivery, and abuse prevention</li>
                  <li><strong>Session Data:</strong> Login sessions, preferences, and temporary data for functionality</li>
                  <li><strong>Performance Metrics:</strong> Load times, error rates, and system performance data</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">2.3 Uploaded Content Metadata</h3>
                <p className="mb-3">When you upload content, we may automatically extract and store:</p>
                <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                  <li><strong>File Properties:</strong> File size, format, resolution, duration (for videos)</li>
                  <li><strong>Upload Timestamps:</strong> When content was uploaded and last modified</li>
                  <li><strong>Processing Data:</strong> Thumbnails, compressed versions, and streaming formats</li>
                  <li><strong>Technical Metadata:</strong> Encoding information, quality settings, and delivery optimization data</li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">3. How We Use Your Information</h2>
              <p className="mb-4">We use the collected information exclusively for the following purposes:</p>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">3.1 Core Service Functionality</h3>
                <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                  <li>Creating and managing your user account</li>
                  <li>Authenticating your identity and maintaining login sessions</li>
                  <li>Storing, processing, and delivering your uploaded content</li>
                  <li>Enabling social features like comments, likes, and user interactions</li>
                  <li>Providing personalized content recommendations and user experience</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">3.2 Platform Improvement and Development</h3>
                <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                  <li>Analyzing usage patterns to improve user interface and experience</li>
                  <li>Identifying and fixing technical issues and bugs</li>
                  <li>Optimizing performance and loading speeds</li>
                  <li>Developing new features based on user behavior insights</li>
                  <li>Testing and implementing security improvements</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">3.3 Security and Compliance</h3>
                <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                  <li>Preventing fraud, abuse, and unauthorized access</li>
                  <li>Monitoring for spam, inappropriate content, and policy violations</li>
                  <li>Responding to legal requests and compliance requirements</li>
                  <li>Protecting the rights and safety of users and the platform</li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">4. Data Sharing and Disclosure</h2>
              <p className="mb-4">
                As a personal portfolio project, we have a strict policy regarding data sharing:
              </p>
              
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 mb-4">
                <p className="text-[#d6d203] font-semibold mb-2">Important: We Do Not Sell Your Data</p>
                <p className="text-neutral-300">
                  Lumeroo does not sell, rent, or trade your personal information to third parties for commercial purposes. 
                  This is a non-commercial demonstration project.
                </p>
              </div>

              <p className="mb-4">We may share information only in the following limited circumstances:</p>
              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li><strong>Public Content:</strong> Content you choose to make public (videos, images, profiles) is visible to other users</li>
                <li><strong>Service Providers:</strong> Trusted third-party services that help operate the platform (hosting, CDN, email)</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or to protect legal rights</li>
                <li><strong>Safety Purposes:</strong> To prevent harm, fraud, or abuse of the service</li>
                <li><strong>Business Transfers:</strong> In the unlikely event of a business transfer or acquisition</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">5. Data Security and Protection</h2>
              <p className="mb-4">
                The security of your personal data is a top priority. We implement multiple layers of protection:
              </p>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">5.1 Technical Safeguards</h3>
                <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                  <li><strong>Encryption:</strong> Data is encrypted both in transit (HTTPS/SSL) and at rest</li>
                  <li><strong>Access Controls:</strong> Strict authentication and authorization mechanisms</li>
                  <li><strong>Regular Updates:</strong> Security patches and software updates are applied promptly</li>
                  <li><strong>Monitoring:</strong> Continuous monitoring for unauthorized access and suspicious activities</li>
                  <li><strong>Backup Systems:</strong> Regular secure backups to prevent data loss</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">5.2 Operational Security</h3>
                <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                  <li>Limited access to personal data on a need-to-know basis</li>
                  <li>Regular security audits and vulnerability assessments</li>
                  <li>Incident response procedures for potential security breaches</li>
                  <li>Secure development practices and code reviews</li>
                </ul>
              </div>

              <p className="mb-4">
                <strong>Important Note:</strong> While we implement industry-standard security measures, no method of 
                transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security, 
                but we are committed to protecting your data to the best of our ability.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">6. Your Privacy Rights and Choices</h2>
              <p className="mb-4">You have several rights regarding your personal information:</p>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">6.1 Access and Control</h3>
                <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                  <li><strong>Account Access:</strong> View and edit your profile information through your account settings</li>
                  <li><strong>Content Management:</strong> Upload, edit, or delete your videos, images, and other content</li>
                  <li><strong>Privacy Settings:</strong> Control the visibility of your profile and content</li>
                  <li><strong>Communication Preferences:</strong> Manage email notifications and communications</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">6.2 Data Portability and Deletion</h3>
                <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                  <li><strong>Data Export:</strong> Request a copy of your personal data in a portable format</li>
                  <li><strong>Account Deletion:</strong> Delete your account and associated personal information</li>
                  <li><strong>Content Removal:</strong> Remove specific pieces of content or information</li>
                  <li><strong>Correction Rights:</strong> Update or correct inaccurate personal information</li>
                </ul>
              </div>

              <p className="mb-4">
                To exercise these rights, please contact us directly at 
                <a href="mailto:siddz.dev@gmail.com" className="text-[#d6d203] hover:underline ml-1">siddz.dev@gmail.com</a>. 
                We will respond to your request within a reasonable timeframe.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">7. Data Retention and Storage</h2>
              <p className="mb-4">We retain your information for the following periods:</p>

              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li><strong>Account Data:</strong> Retained while your account is active and for a reasonable period after deletion</li>
                <li><strong>Content Data:</strong> Stored until you delete it or close your account</li>
                <li><strong>Usage Analytics:</strong> Aggregated and anonymized data may be retained for platform improvement</li>
                <li><strong>Security Logs:</strong> Maintained for security and fraud prevention purposes</li>
                <li><strong>Legal Compliance:</strong> Some data may be retained longer if required by law</li>
              </ul>

              <p className="mb-4">
                When you delete your account, we will remove your personal information and content within a reasonable timeframe. 
                Some information may persist in backups for a limited period for technical and security reasons.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">8. Cookies and Tracking Technologies</h2>
              <p className="mb-4">Lumeroo uses cookies and similar technologies to enhance your experience:</p>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">8.1 Types of Cookies We Use</h3>
                <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                  <li><strong>Essential Cookies:</strong> Required for basic functionality like login sessions and security</li>
                  <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                  <li><strong>Analytics Cookies:</strong> Help us understand how users interact with the platform</li>
                  <li><strong>Performance Cookies:</strong> Monitor and improve site performance and loading speeds</li>
                </ul>
              </div>

              <p className="mb-4">
                You can control cookies through your browser settings. However, disabling certain cookies may limit 
                the functionality of the platform.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">9. Third-Party Services and Integrations</h2>
              <p className="mb-4">
                Lumeroo may integrate with third-party services to provide enhanced functionality. These services have 
                their own privacy policies:
              </p>

              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li><strong>Content Delivery Networks (CDN):</strong> For fast, global content delivery</li>
                <li><strong>Cloud Storage Services:</strong> For secure and scalable file storage</li>
                <li><strong>Email Services:</strong> For account-related communications</li>
                <li><strong>Analytics Tools:</strong> For understanding platform usage and performance</li>
              </ul>

              <p className="mb-4">
                We carefully select third-party providers that maintain high privacy and security standards. 
                However, we encourage you to review their privacy policies as well.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">10. International Data Transfers</h2>
              <p className="mb-4">
                Lumeroo may store and process data in various locations to ensure optimal performance and reliability. 
                When data is transferred internationally, we ensure appropriate safeguards are in place to protect your information.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">11. Children's Privacy</h2>
              <p className="mb-4">
                Lumeroo is not intended for children under the age of 13. We do not knowingly collect personal information 
                from children under 13. If you are a parent or guardian and believe your child has provided personal information, 
                please contact us immediately so we can remove such information.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">12. Changes to This Privacy Policy</h2>
              <p className="mb-4">
                We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. 
                We will notify users of significant changes through:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>Posting the updated policy on this page with a new effective date</li>
                <li>Email notifications to registered users for major changes</li>
                <li>In-platform notifications or announcements</li>
              </ul>
              <p className="mb-4">
                We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">13. Contact Information and Support</h2>
              <p className="mb-4">
                For privacy-related questions, concerns, or requests, please contact us directly:
              </p>
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 mb-4">
                <p className="mb-2"><strong>Email:</strong> <a href="mailto:siddz.dev@gmail.com" className="text-[#d6d203] hover:underline">siddz.dev@gmail.com</a></p>
                <p className="mb-2"><strong>Project:</strong> Lumeroo Portfolio Demonstration</p>
                <p className="mb-2"><strong>Developer:</strong> Portfolio Creator</p>
                <p className="text-sm text-neutral-400">
                  Response time: Typically within 24-48 hours for privacy-related inquiries
                </p>
              </div>
              <p className="mb-4">
                As this is a personal portfolio project, direct email communication is the most effective way to address 
                privacy concerns. The automated reporting systems on the website may not be monitored in real-time.
              </p>
              <p>
                When contacting us about privacy matters, please include relevant details about your request to help us 
                assist you more effectively.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicyPage;
