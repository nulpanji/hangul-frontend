import React, { useState } from 'react';
import { X } from 'lucide-react';
import { aboutContent, languages } from './aboutContent';

function AboutModal({ isOpen, onClose }) {
  const [selectedLang, setSelectedLang] = useState('en');

  if (!isOpen) return null;

  const content = aboutContent[selectedLang];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">About</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 언어 선택 버튼 */}
        <div className="p-6 border-b border-gray-700">
          <p className="text-sm text-gray-400 mb-3">Select your language:</p>
          <div className="flex flex-wrap gap-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLang(lang.code)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  selectedLang === lang.code
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <span className="text-sm font-medium">{lang.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="p-6 text-gray-300">
          <h3 className="text-2xl font-bold text-white mb-6">
            {content.title}
          </h3>
          
          {content.paragraphs.map((paragraph, index) => (
            <p key={index} className="mb-4 leading-relaxed text-base">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 text-center">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default AboutModal;"