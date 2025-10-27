"use client";
import { useState } from "react";

export default function Home() {
  const [outletName, setOutletName] = useState("");
  const [websiteURL, setWebsiteURL] = useState("");
  const [journalists, setJournalists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [extractLoading, setExtractLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!outletName.trim()) {
      setError("Please enter a news outlet name");
      return;
    }

    setLoading(true);
    setError("");
    setWebsiteURL("");
    setJournalists([]);

    try {
      console.log("submitted", outletName);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/detect-website`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ outlet_name: outletName })
      });
      
      const data = await res.json();
      console.log(data);
      
      if (data.status === "success") {
        setWebsiteURL(data.website);
      } else {
        setError(data.message || "Failed to detect website");
      }
    } catch (err) {
      setError("Failed to connect to server");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleExtractJournalists() {
    if (!websiteURL) {
      setError("Please detect website first");
      return;
    }

    setExtractLoading(true);
    setError("");
    setJournalists([]);

    try {
      console.log("Extracting journalists from:", websiteURL);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/extract-journalists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ website_url: websiteURL })
      });
      
      const data = await res.json();
      console.log(data);
      
      if (data.status === "success") {
        setJournalists(data.journalists);
      } else {
        setError(data.error || "Failed to extract journalists");
      }
    } catch (err) {
      setError("Failed to connect to server");
      console.error(err);
    } finally {
      setExtractLoading(false);
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            News<span className="text-blue-600">Trace</span>
          </h1>
          <p className="text-xl text-gray-600">
            Media Intelligence & Journalist Profiling System
          </p>
           <p className="text-lg pt-2 text-gray-600">
            Server sleeps and it might take a bit longer to respond for the first request.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
          <div className="mb-8">
            <label htmlFor="outlet-input" className="block text-sm font-semibold text-gray-700 mb-3">
              Enter News Outlet Name
            </label>
            <div className="relative">
              <textarea
                id="outlet-input"
                value={outletName}
                onChange={(e) => setOutletName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., The New York Times, BBC News, CNN..."
                className="w-full h-24 p-4 border-2 border-gray-200 rounded-xl resize-none focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all duration-300 text-lg placeholder-gray-400 text-black font-semibold"
                disabled={loading}
              />
              <div className="absolute bottom-3 right-3 text-sm text-gray-400">
                Press Enter to search
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !outletName.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mb-4"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                Detecting Website...
              </div>
            ) : (
              "🔍 Detect Official Website"
            )}
          </button>

          {/* NEW: Extract Journalists Button */}
          {websiteURL && (
            <button
              onClick={handleExtractJournalists}
              disabled={extractLoading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {extractLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  Extracting Journalists...
                </div>
              ) : (
                "👥 Extract Journalists"
              )}
            </button>
          )}
        </div>

        {/* Website Results Section */}
        {websiteURL && (
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 mb-6 animate-fade-in">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Website Detected Successfully!</h3>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <p className="text-sm text-gray-600 mb-1">Official Website:</p>
                  <p className="text-lg font-mono text-green-700 break-all">{websiteURL}</p>
                </div>
                <button
                  onClick={() => window.open(websiteURL, '_blank')}
                  className="mt-3 inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  Visit Website
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Journalists Results Section */}
        {journalists.length > 0 && (
          <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-6 mb-6 animate-fade-in">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-purple-800 mb-4">
                  Found {journalists.length} Journalists
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {journalists.map((journalist, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 border border-purple-200">
                      <h4 className="font-semibold text-purple-700 mb-2">{journalist.name}</h4>
                      <a 
                        href={journalist.profile_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 break-all"
                      >
                        {journalist.profile_url}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Section */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 animate-fade-in">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white rounded-xl p-6 shadow-lg text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🌐</span>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Website Detection</h3>
            <p className="text-gray-600 text-sm">Automatically find official news outlet websites</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Journalist Profiling</h3>
            <p className="text-gray-600 text-sm">Extract and analyze journalist information</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Media Intelligence</h3>
            <p className="text-gray-600 text-sm">Gain insights into media ecosystem structure</p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}