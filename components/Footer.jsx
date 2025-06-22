import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="border-t border-neutral-800 mt-12 font-inter">
      <div className="max-w-[79rem] mx-auto px-4 lg:px-2 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-white tracking-tight">Lumeroo</h3>
            <p className="text-neutral-400 text-sm leading-relaxed font-normal">
              A project by Siddharth to showcase video streaming and image streaming capabilities. 
            </p>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-neutral-400 font-medium">All systems operational</span>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white tracking-tight">Legal</h4>
            <div className="space-y-2.5">
              <Link 
                href="/terms-of-service" 
                className="block text-neutral-400 hover:text-[#d6d203] transition-colors duration-200 text-sm font-medium"
              >
                Terms of Service
              </Link>
              <Link 
                href="/privacy-policy" 
                className="block text-neutral-400 hover:text-[#d6d203] transition-colors duration-200 text-sm font-medium"
              >
                Privacy Policy
              </Link>
              <Link 
                href="/dmca" 
                className="block text-neutral-400 hover:text-[#d6d203] transition-colors duration-200 text-sm font-medium"
              >
                DMCA Notice
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-white tracking-tight">Contact</h4>
            <div className="flex items-center space-x-3">
              <a 
                href="mailto:siddz.dev@gmail.com" 
                className="text-neutral-400 hover:text-[#d6d203] transition-colors duration-200 text-sm font-medium"
              >
                siddz.dev@gmail.com
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-800 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-neutral-500 text-sm font-normal">
              © {new Date().getFullYear()} Lumeroo. All rights reserved.
            </div>
            {/* <div className="flex items-center space-x-6">
              <span className="text-xs text-neutral-500">
                Powered by Onavix Studio
              </span>
            </div> */}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;