import React from 'react';
import { Recycle, ExternalLink, Leaf, Shield, Heart } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-20 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & mission */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white">
                <Recycle className="w-5 h-5 text-emerald-300" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Eco<span className="text-emerald-400">Sort</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Empowering sustainable communities through computer vision. EcoSort leverages a fine-tuned
              YOLOv8 deep learning model to accurately identify waste types, guiding responsible recycling
              and minimizing landfill waste.
            </p>
            <div className="flex items-center gap-3 text-xs text-emerald-400 font-medium">
              <span className="flex items-center gap-1">
                <Leaf className="w-3.5 h-3.5" /> 100% Eco-Driven
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> YOLOv8 Architecture
              </span>
            </div>
          </div>

          {/* Model & Architecture */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
              Model & Tech Stack
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <span className="text-slate-300 font-medium">Model:</span> YOLOv8n fine-tuned
              </li>
              <li>
                <span className="text-slate-300 font-medium">Classes:</span> 5 Waste Categories
              </li>
              <li>
                <span className="text-slate-300 font-medium">Backend:</span> FastAPI & PyTorch
              </li>
              <li>
                <span className="text-slate-300 font-medium">Frontend:</span> React, TypeScript & Vite
              </li>
              <li>
                <span className="text-slate-300 font-medium">Storage:</span> Local Browser & SQLite
              </li>
            </ul>
          </div>

          {/* Quick links & API Docs */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
              Developer & API
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <a
                  href={`${API_BASE_URL}/docs`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <span>FastAPI Swagger Docs</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </li>
              <li>
                <a
                  href={`${API_BASE_URL}/health`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-slate-200 transition-colors"
                >
                  Health Check Endpoint
                </a>
              </li>
              <li>
                <a
                  href={`${API_BASE_URL}/classes`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-slate-200 transition-colors"
                >
                  Class Definitions API
                </a>
              </li>
              <li>
                <span className="text-xs text-slate-500">
                  Runs locally at {API_BASE_URL}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} EcoSort Project. Dedicated to zero-waste innovation.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3 h-3 text-emerald-500 fill-emerald-500" /> for a cleaner, greener future.
          </p>
        </div>
      </div>
    </footer>
  );
};
