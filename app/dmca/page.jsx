import React from 'react';
import NavBar from '../../components/NavBar';
import Footer from '../../components/Footer';

const DMCAPage = () => {
  return (
    <div className="bg-black text-white font-inter min-h-screen">
      <NavBar showCategories={true} />
      
      <main className="max-w-[79rem] mx-auto px-4 lg:px-2 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">DMCA Notice</h1>
            <p className="text-neutral-400 text-lg">Last updated: December 27, 2024</p>
          </div>

          <div className="prose prose-invert prose-lg max-w-none text-neutral-300 space-y-8">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 mb-8">
              <h3 className="text-xl font-semibold text-[#d6d203] mb-3">Copyright Protection Notice</h3>
              <p className="text-neutral-300">
                Lumeroo respects intellectual property rights and is committed to complying with the Digital Millennium Copyright Act (DMCA). 
                This page explains our procedures for handling copyright infringement claims. Please note that this is a 
                <strong> personal portfolio project</strong>, not a commercial platform.
              </p>
            </div>
            
            <p className="text-lg leading-relaxed">
              Lumeroo respects the intellectual property rights of others and expects its users to do the same. 
              In accordance with the Digital Millennium Copyright Act (DMCA) of 1998, we will respond promptly 
              to properly formatted notices of alleged copyright infringement committed using our service.
            </p>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">1. Portfolio Project Context</h2>
              <p className="mb-4">
                <strong>Important:</strong> Lumeroo is a non-commercial portfolio project created to demonstrate 
                technical capabilities in video streaming and content management. The platform serves the following purposes:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>Showcasing advanced web development and streaming technologies</li>
                <li>Demonstrating user-generated content management systems</li>
                <li>Highlighting expertise in modern web application architecture</li>
                <li>Providing a functional example of video and image hosting platforms</li>
                <li>Testing and refining content delivery and user experience features</li>
              </ul>
              <p className="mb-4">
                The creator does not intend to infringe on any copyrights and is committed to maintaining a platform 
                that respects intellectual property rights. All content moderation and DMCA compliance measures are 
                implemented to ensure legal operation of this demonstration project.
              </p>
              
              <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 mb-4">
                <h4 className="text-lg font-semibold text-yellow-400 mb-3">📢 Showcase Content Notice</h4>
                <p className="text-neutral-300 mb-3">
                  This platform may contain some copyrighted content uploaded by administrators or site owners 
                  for demonstration and showcase purposes only. This content is used to:
                </p>
                <ul className="list-disc list-inside space-y-1 mb-3 ml-4 text-neutral-300">
                  <li>Demonstrate the platform's video streaming and content management capabilities</li>
                  <li>Provide examples of how the system handles different types of media content</li>
                  <li>Test and showcase the user interface and experience features</li>
                  <li>Illustrate the technical functionality for portfolio purposes</li>
                </ul>
                <p className="text-neutral-300">
                  <strong>If you are a copyright owner and object to your content being used for demonstration purposes, 
                  please contact us directly and we will remove it immediately.</strong> We respect intellectual property 
                  rights and will honor all legitimate removal requests promptly.
                </p>
              </div>

              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                <p className="text-[#d6d203] font-semibold mb-2">⚠️ Important Monitoring Notice</p>
                <p className="text-neutral-300">
                  As this is a personal project, the automated reporting mechanisms on the website may not be 
                  monitored regularly or in real-time. For the fastest response to copyright concerns, please 
                  contact us directly via email.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">2. Our Commitment to Copyright Protection</h2>
              <p className="mb-4">
                Lumeroo is committed to protecting intellectual property rights through the following measures:
              </p>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">2.1 Proactive Measures</h3>
                <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                  <li><strong>User Education:</strong> Clear guidelines about uploading only owned or properly licensed content</li>
                  <li><strong>Upload Policies:</strong> Terms of service that prohibit copyright infringement</li>
                  <li><strong>Content Guidelines:</strong> Community standards that promote respect for intellectual property</li>
                  <li><strong>User Accountability:</strong> Account-based system that tracks content ownership and responsibility</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">2.2 Response Procedures</h3>
                <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                  <li><strong>Fast Response:</strong> Prompt review and action on valid DMCA notices</li>
                  <li><strong>Content Removal:</strong> Quick removal of infringing content when properly notified</li>
                  <li><strong>User Notification:</strong> Informing users when their content is removed for copyright issues</li>
                  <li><strong>Appeal Process:</strong> Counter-notification procedures for disputed claims</li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">3. How to Report Copyright Infringement</h2>
              <p className="mb-4">
                If you are a copyright owner or an agent thereof and believe that any content on Lumeroo infringes 
                upon your copyrights, you may submit a DMCA takedown notice. For the quickest resolution, 
                please submit your notice directly via email rather than using automated reporting systems.
              </p>

              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 mb-6">
                <h4 className="text-lg font-semibold text-[#d6d203] mb-3">📧 Direct Contact (Recommended)</h4>
                <p className="mb-2"><strong>Email:</strong> <a href="mailto:siddz.dev@gmail.com" className="text-[#d6d203] hover:underline">siddz.dev@gmail.com</a></p>
                <p className="text-sm text-neutral-400">
                  Subject line: "DMCA Takedown Notice - [Brief Description]"<br/>
                  Expected response time: 24-48 hours for valid claims
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">3.1 Required Information for DMCA Notice</h3>
                <p className="mb-4">
                  To be effective under the DMCA, your notice must include the following information:
                </p>
                <div className="space-y-4">
                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                    <h4 className="text-base font-semibold text-white mb-2">1. Authorized Signature</h4>
                    <p className="text-sm text-neutral-300">
                      A physical or electronic signature of a person authorized to act on behalf of the owner 
                      of an exclusive right that is allegedly infringed.
                    </p>
                  </div>
                  
                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                    <h4 className="text-base font-semibold text-white mb-2">2. Copyrighted Work Identification</h4>
                    <p className="text-sm text-neutral-300">
                      Identification of the copyrighted work claimed to have been infringed, or if multiple 
                      copyrighted works are covered by a single notification, a representative list of such works.
                    </p>
                  </div>
                  
                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                    <h4 className="text-base font-semibold text-white mb-2">3. Infringing Material Location</h4>
                    <p className="text-sm text-neutral-300">
                      Identification of the material that is claimed to be infringing and information reasonably 
                      sufficient to permit us to locate the material. Please provide specific URLs or detailed 
                      descriptions of where the content appears on Lumeroo.
                    </p>
                  </div>
                  
                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                    <h4 className="text-base font-semibold text-white mb-2">4. Contact Information</h4>
                    <p className="text-sm text-neutral-300">
                      Information reasonably sufficient to permit us to contact you, such as:
                    </p>
                    <ul className="list-disc list-inside text-sm text-neutral-300 mt-2 ml-4">
                      <li>Full name and address</li>
                      <li>Telephone number</li>
                      <li>Email address</li>
                      <li>Preferred method of contact</li>
                    </ul>
                  </div>
                  
                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                    <h4 className="text-base font-semibold text-white mb-2">5. Good Faith Statement</h4>
                    <p className="text-sm text-neutral-300">
                      A statement that you have a good faith belief that use of the material in the manner 
                      complained of is not authorized by the copyright owner, its agent, or the law.
                    </p>
                  </div>
                  
                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                    <h4 className="text-base font-semibold text-white mb-2">6. Accuracy Statement</h4>
                    <p className="text-sm text-neutral-300">
                      A statement that the information in the notification is accurate, and under penalty of 
                      perjury, that you are authorized to act on behalf of the owner of an exclusive right 
                      that is allegedly infringed.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">3.2 Additional Helpful Information</h3>
                <p className="mb-4">To expedite the review process, please also include:</p>
                <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                  <li><strong>Evidence of Ownership:</strong> Copyright registration, creation timestamps, or other proof of ownership</li>
                  <li><strong>Original Work Location:</strong> Where the original work can be found (your website, platform, etc.)</li>
                  <li><strong>Detailed Description:</strong> Specific details about how the work is being infringed</li>
                  <li><strong>Screenshots or Evidence:</strong> Visual proof of the alleged infringement</li>
                  <li><strong>Previous Attempts:</strong> Any previous contact with the user who uploaded the content</li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">4. Our Response Process</h2>
              <p className="mb-4">
                Upon receiving a valid DMCA notice, Lumeroo will take the following actions:
              </p>

              <div className="space-y-4 mb-6">
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                  <h4 className="text-base font-semibold text-[#d6d203] mb-2">Step 1: Notice Review (24-48 hours)</h4>
                  <p className="text-sm text-neutral-300">
                    We will review your notice to ensure it contains all required DMCA elements and appears to be valid.
                  </p>
                </div>
                
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                  <h4 className="text-base font-semibold text-[#d6d203] mb-2">Step 2: Content Removal (Upon validation)</h4>
                  <p className="text-sm text-neutral-300">
                    If the notice is valid, we will promptly remove or disable access to the allegedly infringing material.
                  </p>
                </div>
                
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                  <h4 className="text-base font-semibold text-[#d6d203] mb-2">Step 3: User Notification (Within 48 hours)</h4>
                  <p className="text-sm text-neutral-300">
                    We will notify the user who uploaded the content about the removal and provide information about the counter-notification process.
                  </p>
                </div>
                
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                  <h4 className="text-base font-semibold text-[#d6d203] mb-2">Step 4: Confirmation (Within 72 hours)</h4>
                  <p className="text-sm text-neutral-300">
                    We will send you confirmation that the content has been removed and provide any relevant reference numbers.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">5. Counter-Notification Process</h2>
              <p className="mb-4">
                If you believe your content was wrongly removed due to a mistake or misidentification, you may submit a counter-notification.
              </p>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">5.1 Counter-Notification Requirements</h3>
                <p className="mb-4">A valid counter-notification must include:</p>
                <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                  <li>Your physical or electronic signature</li>
                  <li>Identification of the material that was removed and its previous location</li>
                  <li>A statement under penalty of perjury that you have a good faith belief that the material was removed due to mistake or misidentification</li>
                  <li>Your name, address, and telephone number</li>
                  <li>A statement that you consent to the jurisdiction of the federal district court for your address</li>
                  <li>A statement that you will accept service of process from the person who provided the original DMCA notice</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">5.2 Counter-Notification Process</h3>
                <p className="mb-4">Upon receiving a valid counter-notification:</p>
                <ol className="list-decimal list-inside space-y-2 mb-4 ml-4">
                  <li>We will promptly provide the original complainant with a copy of the counter-notification</li>
                  <li>We will inform them that we will replace the removed material in 10-14 business days</li>
                  <li>We will restore the content unless the original complainant files a court action seeking an injunction</li>
                </ol>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">6. Repeat Infringer Policy</h2>
              <p className="mb-4">
                Lumeroo has adopted a policy of terminating users who are repeat infringers in appropriate circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li><strong>First Offense:</strong> Warning and content removal</li>
                <li><strong>Second Offense:</strong> Temporary account suspension and mandatory copyright education</li>
                <li><strong>Third Offense:</strong> Extended suspension and review period</li>
                <li><strong>Subsequent Offenses:</strong> Permanent account termination</li>
              </ul>
              <p className="mb-4">
                Users may appeal these actions through our standard appeal process. Each case is reviewed individually, 
                and we consider factors such as the nature of the infringement and the user's history on the platform.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">7. False Claims and Perjury Warning</h2>
              <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 mb-4">
                <h4 className="text-lg font-semibold text-red-400 mb-3">⚠️ Important Legal Warning</h4>
                <p className="text-neutral-300 mb-3">
                  Please be aware that if you knowingly materially misrepresent that material or activity is infringing 
                  your copyright, you may be held liable for damages under Section 512(f) of the DMCA, including:
                </p>
                <ul className="list-disc list-inside space-y-1 mb-3 ml-4 text-neutral-300">
                  <li>Costs and attorneys' fees incurred by the alleged infringer</li>
                  <li>Costs and attorneys' fees incurred by the service provider</li>
                  <li>Damages for harm caused by the wrongful removal of content</li>
                </ul>
                <p className="text-neutral-300">
                  Only submit DMCA notices if you have a good faith belief that the use of copyrighted material 
                  is not authorized by the copyright owner, its agent, or the law.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">8. Fair Use and Educational Content</h2>
              <p className="mb-4">
                Lumeroo recognizes that some uses of copyrighted material may qualify as fair use under copyright law. 
                We consider the following factors when evaluating fair use claims:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li><strong>Purpose of Use:</strong> Educational, commentary, criticism, or transformative purposes</li>
                <li><strong>Nature of Work:</strong> Whether the original work is factual or creative</li>
                <li><strong>Amount Used:</strong> The proportion of the original work that was used</li>
                <li><strong>Market Impact:</strong> Whether the use affects the market for the original work</li>
              </ul>
              <p className="mb-4">
                Users claiming fair use should be prepared to provide detailed explanations of how their use qualifies 
                under these criteria. However, fair use is a complex legal doctrine that often requires judicial determination.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">9. International Copyright Considerations</h2>
              <p className="mb-4">
                While Lumeroo operates under U.S. copyright law and the DMCA, we respect international copyright treaties and agreements:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li><strong>Berne Convention:</strong> Recognition of copyright protection across member countries</li>
                <li><strong>WIPO Treaties:</strong> Compliance with World Intellectual Property Organization standards</li>
                <li><strong>Bilateral Agreements:</strong> Respect for specific international copyright agreements</li>
                <li><strong>Local Laws:</strong> Consideration of applicable local copyright laws where relevant</li>
              </ul>
              <p className="mb-4">
                Copyright owners from any country may submit DMCA notices for content hosted on Lumeroo, provided 
                they follow the procedures outlined in this policy.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">10. Contact Information and Support</h2>
              <p className="mb-4">
                For all DMCA-related matters, copyright questions, or to submit takedown notices:
              </p>
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 mb-4">
                <h4 className="text-lg font-semibold text-[#d6d203] mb-3">DMCA Contact Information</h4>
                <div className="space-y-2 text-neutral-300">
                  <p><strong>Email:</strong> <a href="mailto:siddz.dev@gmail.com" className="text-[#d6d203] hover:underline">siddz.dev@gmail.com</a></p>
                  <p><strong>Subject Line:</strong> "DMCA Notice - [Type: Takedown/Counter/Question]"</p>
                  <p><strong>Project:</strong> Lumeroo Portfolio Demonstration</p>
                  <p><strong>Designated DMCA Agent:</strong> Portfolio Creator (Developer/Administrator)</p>
                  <p><strong>Response Time:</strong> 24-48 hours for urgent copyright matters</p>
                </div>
              </div>
              
              <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 mb-4">
                <h4 className="text-lg font-semibold text-yellow-400 mb-3">📝 Communication Tips</h4>
                <ul className="list-disc list-inside space-y-1 text-neutral-300 ml-4">
                  <li>Use clear, descriptive subject lines</li>
                  <li>Include all required DMCA information in your initial email</li>
                  <li>Attach relevant evidence or documentation</li>
                  <li>Provide multiple contact methods for follow-up</li>
                  <li>Be specific about the location of allegedly infringing content</li>
                </ul>
              </div>

              <p className="mb-4">
                <strong>Portfolio Project Note:</strong> As this is a personal demonstration project, direct email 
                communication is the most effective way to address copyright concerns. Automated reporting systems 
                on the website may not be monitored in real-time, so please use email for time-sensitive matters.
              </p>
              
              <p>
                We are committed to working cooperatively with copyright owners to address legitimate concerns while 
                maintaining a platform that allows for creative expression and fair use of copyrighted materials.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DMCAPage;
