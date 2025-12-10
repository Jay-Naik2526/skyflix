import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Shield, Users, Scale, Heart, Send } from "lucide-react";

export default function Footer() {
  const [openModal, setOpenModal] = useState<string | null>(null);

  const closeModal = () => setOpenModal(null);

  // --- CONTENT DATA ---
  const modalContent: any = {
    privacy: {
      title: "Privacy & Data Handling Policy",
      icon: <Shield className="text-blue-500" size={24} />,
      text: (
        <div className="space-y-4 text-gray-300 leading-relaxed">
          <p>
            We respect the privacy and online rights of all users. This website does not collect personal data unless voluntarily provided by users for communication purposes. Any technical information such as browser type, device details, or general traffic analytics may be collected automatically for improving user experience.
          </p>
          <p>
            This website does not host or store content on its own servers. All media, links, or information displayed here are sourced from publicly accessible platforms, external service providers, or embedded from authorized third-party hosting services. We act only as an indexing service that organizes and shares links which are already available on the internet.
          </p>
          <p>
            We rely on trusted third-party hosting services for media playback. Any data collected by those external services is managed according to their own privacy policies. We do not have control over or access to any user data handled by third parties.
          </p>
          <h4 className="text-white font-bold mt-4">No Ownership & Compliance Statement</h4>
          <p>
            We do not claim ownership of any externally sourced content. If any material is found to be unauthorized or harmful in any manner, concerned rights owners are encouraged to contact us. We will review the complaint and take appropriate action promptly, respecting all legal requirements and intellectual property rights.
          </p>
          <h4 className="text-white font-bold mt-4">Cookies & Tracking</h4>
          <p>
            Some third-party services may use cookies or analytical tools to enhance functionality and measure website performance. Users may disable cookies in their browser settings if they choose.
          </p>
          <h4 className="text-white font-bold mt-4">Policy Modifications</h4>
          <p>
            We may update or revise this privacy policy at any time. Continued use of this website implies acceptance of the latest version of this policy.
          </p>
        </div>
      )
    },
    credits: {
      title: "Credits & Acknowledgements",
      icon: <Users className="text-green-500" size={24} />,
      text: (
        <div className="space-y-6 text-gray-300">
          <p className="text-lg italic text-gray-400 border-l-4 border-green-500 pl-4">
            "All Our Post Are Collected From Multiple Uploaders/Rippers."
          </p>
          
          <div>
            <h4 className="text-white font-bold mb-3 flex items-center gap-2">
              <Heart size={16} className="text-red-500" fill="currentColor" /> Special Thanks To:
            </h4>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-sm leading-7 text-gray-200 font-mono">
              1337x, Archie, Telly, ShiNobi, DNK, BunnyJMB, Arya, Spidey, Dexter, Immortal, Ranvijay, BWT, Dr.Star, Sharespark, Cybertron, $id, HDC, GameData, 1xBet, DDHRipz, DVDWorld, TRC, Saon and Original Post Uploader.
            </div>
          </div>
        </div>
      )
    },
    dmca: {
      title: "DMCA Takedown",
      icon: <Scale className="text-red-500" size={24} />,
      text: (
        <div className="space-y-4 text-gray-300 leading-relaxed">
          <p>
            We fully respect the intellectual property rights of all content owners. If you believe that any material on this website violates your copyright or is posted without proper authorization, please contact us with valid evidence of ownership. Upon receiving your request, we will review the matter and take necessary action within 48 hours.
          </p>
          
          <div className="mt-6 bg-red-900/20 border border-red-500/30 p-4 rounded-lg text-center">
            <h4 className="text-red-200 font-bold mb-2">📩 Contact for DMCA Requests:</h4>
            <a href="mailto:skyflixpro@proton.me" className="text-white text-xl font-bold hover:underline hover:text-blue-400 transition-colors">
              skyflixpro@proton.me
            </a>
          </div>
        </div>
      )
    }
  };

  const currentContent = openModal ? modalContent[openModal] : null;

  return (
    // ✅ FIX: Added 'pb-28' (padding-bottom 7rem) specifically for mobile to clear the Navbar
    <footer className="bg-[#0a0b0f] border-t border-white/5 pt-12 pb-28 md:py-12 px-6 md:pl-32 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-sm text-gray-500">
        
        {/* Left: Copyright */}
        <div className="text-center md:text-left">
          <p>&copy; {new Date().getFullYear()} SkyFlix. All rights reserved.</p>
          <p className="text-xs mt-1 opacity-50">Providing indexing services for public content.</p>
        </div>

        {/* Right: Links - Improved spacing for touch targets */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 font-medium w-full md:w-auto">
          <div className="flex gap-6">
            <button onClick={() => setOpenModal("privacy")} className="hover:text-white transition-colors">Privacy Policy</button>
            <button onClick={() => setOpenModal("dmca")} className="hover:text-white transition-colors">DMCA</button>
            <button onClick={() => setOpenModal("credits")} className="hover:text-white transition-colors">Credits</button>
          </div>
          
          {/* Telegram Link - Made full width on mobile for easier clicking */}
          <a 
            href="https://t.me/Official_SkyFlix" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-blue-400 hover:text-blue-300 transition-colors border border-blue-500/30 px-6 py-2.5 rounded-full hover:bg-blue-500/10 w-full sm:w-auto mt-2 sm:mt-0"
          >
            <Send size={16} /> <span className="font-bold">Join Telegram</span>
          </a>
        </div>

      </div>

      {/* --- MODAL FOR FOOTER LINKS --- */}
      <Transition show={!!openModal} as={Fragment}>
        <Dialog onClose={closeModal} className="relative z-[200]">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl bg-[#16181f] rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
                
                {/* Header */}
                {currentContent && (
                  <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#0f1014]">
                    <div className="flex items-center gap-3">
                      {currentContent.icon}
                      <h2 className="text-xl font-bold text-white">{currentContent.title}</h2>
                    </div>
                    <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                )}

                {/* Content (Scrollable) */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                  {currentContent?.text}
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-[#0f1014] border-t border-white/10 text-right">
                  <button onClick={closeModal} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium text-sm">
                    Close
                  </button>
                </div>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </footer>
  );
}