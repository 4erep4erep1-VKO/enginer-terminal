/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Car, BodyType } from '../types';
import { detectBodyType } from '../lib/vehicleImages';

interface VehiclePhotoProps {
  car?: Partial<Car> | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
  showBadge?: boolean;
  altText?: string;
}

/**
 * Modern High-Tech Cyber Automotive Blueprint Silhouettes
 * Precision geometric vectors with crisp angles, aerospace HUD styling, and cyan neon glow.
 */
function VehicleSilhouette({ bodyType = 'sedan', size = 'md' }: { bodyType: BodyType; size: string }) {
  return (
    <div className="w-full h-full relative flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#090E17] via-[#060A12] to-[#030508]">
      {/* Background Blueprint Precision Grid */}
      <div 
        className="absolute inset-0 opacity-[0.15] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(to right, #06b6d4 1px, transparent 1px), linear-gradient(to bottom, #06b6d4 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      />

      {/* Cyber HUD Corner Crosshairs */}
      <div className="absolute top-1.5 left-1.5 w-2 h-2 border-t-2 border-l-2 border-cyan-400/60" />
      <div className="absolute top-1.5 right-1.5 w-2 h-2 border-t-2 border-r-2 border-cyan-400/60" />
      <div className="absolute bottom-1.5 left-1.5 w-2 h-2 border-b-2 border-l-2 border-cyan-400/60" />
      <div className="absolute bottom-1.5 right-1.5 w-2 h-2 border-b-2 border-r-2 border-cyan-400/60" />

      {/* Tech HUD Metadata Tag */}
      <div className="absolute top-1.5 left-4 text-[7.5px] font-mono text-cyan-400/60 tracking-wider hidden sm:flex items-center gap-1.5">
        <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
        <span>SYS_CHASSIS // {bodyType.toUpperCase()}</span>
      </div>

      {/* Vector Silhouette Profile */}
      <svg
        viewBox="0 0 240 86"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[94%] h-[94%] max-h-full object-contain relative z-10 filter drop-shadow-[0_0_10px_rgba(6,182,212,0.45)]"
      >
        <defs>
          <linearGradient id="bodyStrokeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0891B2" />
            <stop offset="30%" stopColor="#06B6D4" />
            <stop offset="70%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>

          <linearGradient id="bodyFillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0D1929" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#040810" stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id="glassFillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0891B2" stopOpacity="0.08" />
          </linearGradient>

          <radialGradient id="wheelRimGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.9" />
            <stop offset="55%" stopColor="#0B1322" />
            <stop offset="100%" stopColor="#03060B" />
          </radialGradient>

          <linearGradient id="aeroUnderglow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0" />
            <stop offset="25%" stopColor="#06B6D4" stopOpacity="0.5" />
            <stop offset="75%" stopColor="#22D3EE" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Laser Ground Datum Line */}
        <line x1="6" y1="72" x2="234" y2="72" stroke="url(#aeroUnderglow)" strokeWidth="2.2" />
        <line x1="12" y1="72" x2="228" y2="72" stroke="#22D3EE" strokeWidth="0.7" strokeDasharray="6 3" opacity="0.4" />

        {/* 1. SEDAN (Современный спортивный седан с чёткими гранями) */}
        {bodyType === 'sedan' && (
          <g>
            {/* Outer Chiseled Body Shell */}
            <path
              d="M 14 62
                 L 12 55
                 L 18 52
                 L 44 49
                 L 76 46
                 L 104 22
                 L 150 22
                 L 182 46
                 L 216 48
                 L 224 53
                 L 222 62
                 L 214 65
                 L 194 65
                 A 16 16 0 0 0 162 65
                 L 86 65
                 A 16 16 0 0 0 54 65
                 L 24 65
                 Z"
              fill="url(#bodyFillGrad)"
              stroke="url(#bodyStrokeGrad)"
              strokeWidth="2"
              strokeLinejoin="miter"
            />
            {/* Aerodynamic Greenhouse Windows */}
            <path
              d="M 105 25
                 L 148 25
                 L 177 45
                 L 80 45
                 Z"
              fill="url(#glassFillGrad)"
              stroke="#06B6D4"
              strokeWidth="1.2"
              strokeLinejoin="miter"
            />
            {/* B-Pillar */}
            <line x1="126" y1="25" x2="124" y2="45" stroke="#22D3EE" strokeWidth="2" opacity="0.95" />
            {/* Door Panel Seams & Shoulder Character Line */}
            <line x1="28" y1="52" x2="216" y2="50" stroke="#06B6D4" strokeWidth="1" opacity="0.6" />
            <line x1="84" y1="46" x2="84" y2="65" stroke="#06B6D4" strokeWidth="0.8" opacity="0.4" />
            <line x1="124" y1="45" x2="122" y2="65" stroke="#06B6D4" strokeWidth="0.8" opacity="0.4" />
            <line x1="164" y1="46" x2="164" y2="65" stroke="#06B6D4" strokeWidth="0.8" opacity="0.4" />
            {/* Front Cyber DRL Headlight Blade (Cyan) */}
            <polygon points="13,54 36,50 36,52 14,56" fill="#22D3EE" />
            {/* Rear Sport LED Tail Strip (Neon Pink/Red) */}
            <polygon points="214,49 224,53 222,56 212,52" fill="#F43F5E" />
            {/* Front Alloy Wheel with 5-Spoke Cyber Geometry */}
            <circle cx="70" cy="65" r="14" fill="#05080E" stroke="#22D3EE" strokeWidth="2" />
            <circle cx="70" cy="65" r="9" fill="url(#wheelRimGrad)" stroke="#0891B2" strokeWidth="1" />
            <line x1="70" y1="56" x2="70" y2="74" stroke="#22D3EE" strokeWidth="1.2" />
            <line x1="61" y1="65" x2="79" y2="65" stroke="#22D3EE" strokeWidth="1.2" />
            <circle cx="70" cy="65" r="3" fill="#22D3EE" />
            {/* Rear Alloy Wheel with 5-Spoke Cyber Geometry */}
            <circle cx="178" cy="65" r="14" fill="#05080E" stroke="#22D3EE" strokeWidth="2" />
            <circle cx="178" cy="65" r="9" fill="url(#wheelRimGrad)" stroke="#0891B2" strokeWidth="1" />
            <line x1="178" y1="56" x2="178" y2="74" stroke="#22D3EE" strokeWidth="1.2" />
            <line x1="169" y1="65" x2="187" y2="65" stroke="#22D3EE" strokeWidth="1.2" />
            <circle cx="178" cy="65" r="3" fill="#22D3EE" />
          </g>
        )}

        {/* 2. CROSSOVER (Кроссовер - атлетичный силуэт с увеличенным просветом) */}
        {bodyType === 'crossover' && (
          <g>
            {/* Body Frame */}
            <path
              d="M 14 60
                 L 12 52
                 L 22 47
                 L 50 45
                 L 80 43
                 L 104 20
                 L 160 20
                 L 196 44
                 L 220 50
                 L 222 60
                 L 214 63
                 L 196 63
                 A 17 17 0 0 0 160 63
                 L 88 63
                 A 17 17 0 0 0 52 63
                 L 22 63
                 Z"
              fill="url(#bodyFillGrad)"
              stroke="url(#bodyStrokeGrad)"
              strokeWidth="2"
              strokeLinejoin="miter"
            />
            {/* Roof Rails */}
            <line x1="102" y1="16" x2="164" y2="16" stroke="#22D3EE" strokeWidth="2" strokeLinecap="square" />
            <line x1="112" y1="16" x2="112" y2="20" stroke="#06B6D4" strokeWidth="1.2" />
            <line x1="154" y1="16" x2="154" y2="20" stroke="#06B6D4" strokeWidth="1.2" />
            {/* Windows */}
            <path
              d="M 106 23
                 L 158 23
                 L 188 43
                 L 86 43
                 Z"
              fill="url(#glassFillGrad)"
              stroke="#06B6D4"
              strokeWidth="1.2"
            />
            <line x1="134" y1="23" x2="132" y2="43" stroke="#22D3EE" strokeWidth="2" opacity="0.95" />
            <line x1="162" y1="23" x2="160" y2="43" stroke="#06B6D4" strokeWidth="1.2" opacity="0.7" />
            {/* Shoulder Line */}
            <line x1="30" y1="48" x2="214" y2="47" stroke="#06B6D4" strokeWidth="1" opacity="0.6" />
            {/* Headlight & Taillight */}
            <polygon points="13,50 36,46 36,48 14,53" fill="#22D3EE" />
            <polygon points="214,48 222,51 220,55 212,51" fill="#F43F5E" />
            {/* High Clearance Wheels */}
            <circle cx="70" cy="63" r="15" fill="#05080E" stroke="#22D3EE" strokeWidth="2.2" />
            <circle cx="70" cy="63" r="9.5" fill="url(#wheelRimGrad)" stroke="#0891B2" strokeWidth="1" />
            <line x1="70" y1="54" x2="70" y2="72" stroke="#22D3EE" strokeWidth="1.2" />
            <line x1="61" y1="63" x2="79" y2="63" stroke="#22D3EE" strokeWidth="1.2" />
            <circle cx="70" cy="63" r="3" fill="#22D3EE" />
            <circle cx="178" cy="63" r="15" fill="#05080E" stroke="#22D3EE" strokeWidth="2.2" />
            <circle cx="178" cy="63" r="9.5" fill="url(#wheelRimGrad)" stroke="#0891B2" strokeWidth="1" />
            <line x1="178" y1="54" x2="178" y2="72" stroke="#22D3EE" strokeWidth="1.2" />
            <line x1="169" y1="63" x2="187" y2="63" stroke="#22D3EE" strokeWidth="1.2" />
            <circle cx="178" cy="63" r="3" fill="#22D3EE" />
          </g>
        )}

        {/* 3. SUV / 4X4 (Внедорожник - строгая брутальная геометрия) */}
        {bodyType === 'suv' && (
          <g>
            {/* Rugged Angular Monolith Body */}
            <path
              d="M 12 60
                 L 12 48
                 L 26 44
                 L 56 44
                 L 78 18
                 L 190 18
                 L 214 42
                 L 220 48
                 L 218 60
                 L 210 63
                 L 196 63
                 A 18 18 0 0 0 158 63
                 L 90 63
                 A 18 18 0 0 0 52 63
                 L 20 63
                 Z"
              fill="url(#bodyFillGrad)"
              stroke="url(#bodyStrokeGrad)"
              strokeWidth="2.2"
              strokeLinejoin="miter"
            />
            {/* Heavy Duty Roof Frame */}
            <line x1="76" y1="14" x2="192" y2="14" stroke="#22D3EE" strokeWidth="2.2" />
            <line x1="96" y1="14" x2="96" y2="18" stroke="#06B6D4" strokeWidth="1.5" />
            <line x1="134" y1="14" x2="134" y2="18" stroke="#06B6D4" strokeWidth="1.5" />
            <line x1="172" y1="14" x2="172" y2="18" stroke="#06B6D4" strokeWidth="1.5" />
            {/* Greenhouse */}
            <path
              d="M 82 21
                 L 186 21
                 L 206 42
                 L 66 42
                 Z"
              fill="url(#glassFillGrad)"
              stroke="#06B6D4"
              strokeWidth="1.2"
            />
            <line x1="120" y1="21" x2="120" y2="42" stroke="#22D3EE" strokeWidth="2" opacity="0.95" />
            <line x1="158" y1="21" x2="158" y2="42" stroke="#22D3EE" strokeWidth="2" opacity="0.95" />
            {/* Side Crease */}
            <line x1="28" y1="46" x2="216" y2="46" stroke="#06B6D4" strokeWidth="1" opacity="0.6" />
            {/* Off-road LED */}
            <polygon points="12,47 34,44 34,47 13,50" fill="#22D3EE" />
            <polygon points="214,46 220,48 218,54 212,50" fill="#F43F5E" />
            {/* Big Rugged Wheels */}
            <circle cx="71" cy="63" r="16" fill="#05080E" stroke="#22D3EE" strokeWidth="2.4" />
            <circle cx="71" cy="63" r="10" fill="url(#wheelRimGrad)" stroke="#0891B2" strokeWidth="1.2" />
            <polygon points="71,53 74,63 71,73 68,63" fill="#22D3EE" />
            <polygon points="61,63 71,66 81,63 71,60" fill="#22D3EE" />
            <circle cx="71" cy="63" r="3.5" fill="#22D3EE" />
            <circle cx="177" cy="63" r="16" fill="#05080E" stroke="#22D3EE" strokeWidth="2.4" />
            <circle cx="177" cy="63" r="10" fill="url(#wheelRimGrad)" stroke="#0891B2" strokeWidth="1.2" />
            <polygon points="177,53 180,63 177,73 174,63" fill="#22D3EE" />
            <polygon points="167,63 177,66 187,63 177,60" fill="#22D3EE" />
            <circle cx="177" cy="63" r="3.5" fill="#22D3EE" />
          </g>
        )}

        {/* 4. HATCHBACK (Хэтчбек - динамичный городской компакт) */}
        {bodyType === 'hatchback' && (
          <g>
            {/* Body */}
            <path
              d="M 16 63
                 L 14 55
                 L 22 51
                 L 52 48
                 L 80 46
                 L 102 22
                 L 164 22
                 L 204 46
                 L 214 56
                 L 210 63
                 L 194 65
                 A 16 16 0 0 0 162 65
                 L 86 65
                 A 16 16 0 0 0 54 65
                 L 24 65
                 Z"
              fill="url(#bodyFillGrad)"
              stroke="url(#bodyStrokeGrad)"
              strokeWidth="2"
              strokeLinejoin="miter"
            />
            {/* Sport Roof Wing */}
            <polygon points="160,20 178,18 174,22 158,22" fill="#22D3EE" />
            {/* Glass */}
            <path
              d="M 104 25
                 L 162 25
                 L 194 45
                 L 84 45
                 Z"
              fill="url(#glassFillGrad)"
              stroke="#06B6D4"
              strokeWidth="1.2"
            />
            <line x1="134" y1="25" x2="132" y2="45" stroke="#22D3EE" strokeWidth="2" opacity="0.95" />
            {/* Shoulder */}
            <line x1="28" y1="51" x2="204" y2="49" stroke="#06B6D4" strokeWidth="1" opacity="0.6" />
            {/* Lights */}
            <polygon points="15,53 36,50 36,52 16,56" fill="#22D3EE" />
            <polygon points="202,48 212,54 210,58 200,52" fill="#F43F5E" />
            {/* Wheels */}
            <circle cx="70" cy="65" r="14" fill="#05080E" stroke="#22D3EE" strokeWidth="2" />
            <circle cx="70" cy="65" r="9" fill="url(#wheelRimGrad)" stroke="#0891B2" strokeWidth="1" />
            <line x1="70" y1="56" x2="70" y2="74" stroke="#22D3EE" strokeWidth="1.2" />
            <line x1="61" y1="65" x2="79" y2="65" stroke="#22D3EE" strokeWidth="1.2" />
            <circle cx="70" cy="65" r="3" fill="#22D3EE" />
            <circle cx="178" cy="65" r="14" fill="#05080E" stroke="#22D3EE" strokeWidth="2" />
            <circle cx="178" cy="65" r="9" fill="url(#wheelRimGrad)" stroke="#0891B2" strokeWidth="1" />
            <line x1="178" y1="56" x2="178" y2="74" stroke="#22D3EE" strokeWidth="1.2" />
            <line x1="169" y1="65" x2="187" y2="65" stroke="#22D3EE" strokeWidth="1.2" />
            <circle cx="178" cy="65" r="3" fill="#22D3EE" />
          </g>
        )}

        {/* 5. WAGON (Универсал - удлинённый спортивный туринг) */}
        {bodyType === 'wagon' && (
          <g>
            {/* Body */}
            <path
              d="M 14 62
                 L 12 55
                 L 18 52
                 L 44 49
                 L 76 46
                 L 102 22
                 L 186 22
                 L 214 48
                 L 222 55
                 L 220 63
                 L 212 65
                 L 194 65
                 A 16 16 0 0 0 162 65
                 L 86 65
                 A 16 16 0 0 0 54 65
                 L 24 65
                 Z"
              fill="url(#bodyFillGrad)"
              stroke="url(#bodyStrokeGrad)"
              strokeWidth="2"
              strokeLinejoin="miter"
            />
            {/* Low Profile Roof Rails */}
            <line x1="102" y1="18" x2="188" y2="18" stroke="#22D3EE" strokeWidth="2" />
            {/* Panoramic Touring Glass */}
            <path
              d="M 104 25
                 L 184 25
                 L 204 46
                 L 80 46
                 Z"
              fill="url(#glassFillGrad)"
              stroke="#06B6D4"
              strokeWidth="1.2"
            />
            <line x1="130" y1="25" x2="128" y2="46" stroke="#22D3EE" strokeWidth="2" opacity="0.95" />
            <line x1="160" y1="25" x2="158" y2="46" stroke="#06B6D4" strokeWidth="1.5" opacity="0.8" />
            {/* Side Crease */}
            <line x1="26" y1="52" x2="216" y2="50" stroke="#06B6D4" strokeWidth="1" opacity="0.6" />
            {/* Lights */}
            <polygon points="13,54 36,50 36,52 14,56" fill="#22D3EE" />
            <polygon points="214,50 222,54 220,58 212,54" fill="#F43F5E" />
            {/* Wheels */}
            <circle cx="70" cy="65" r="14" fill="#05080E" stroke="#22D3EE" strokeWidth="2" />
            <circle cx="70" cy="65" r="9" fill="url(#wheelRimGrad)" stroke="#0891B2" strokeWidth="1" />
            <line x1="70" y1="56" x2="70" y2="74" stroke="#22D3EE" strokeWidth="1.2" />
            <line x1="61" y1="65" x2="79" y2="65" stroke="#22D3EE" strokeWidth="1.2" />
            <circle cx="70" cy="65" r="3" fill="#22D3EE" />
            <circle cx="178" cy="65" r="14" fill="#05080E" stroke="#22D3EE" strokeWidth="2" />
            <circle cx="178" cy="65" r="9" fill="url(#wheelRimGrad)" stroke="#0891B2" strokeWidth="1" />
            <line x1="178" y1="56" x2="178" y2="74" stroke="#22D3EE" strokeWidth="1.2" />
            <line x1="169" y1="65" x2="187" y2="65" stroke="#22D3EE" strokeWidth="1.2" />
            <circle cx="178" cy="65" r="3" fill="#22D3EE" />
          </g>
        )}

        {/* 6. COUPE (Купе - агрессивный низкий фастбэк) */}
        {bodyType === 'coupe' && (
          <g>
            {/* Low Wedge Fastback Silhouette */}
            <path
              d="M 12 64
                 L 10 57
                 L 22 53
                 L 58 49
                 L 86 46
                 L 118 20
                 L 156 20
                 L 218 52
                 L 226 58
                 L 220 64
                 L 212 65
                 L 194 65
                 A 16 16 0 0 0 162 65
                 L 86 65
                 A 16 16 0 0 0 54 65
                 L 22 65
                 Z"
              fill="url(#bodyFillGrad)"
              stroke="url(#bodyStrokeGrad)"
              strokeWidth="2"
              strokeLinejoin="miter"
            />
            {/* Fastback Glass */}
            <path
              d="M 119 23
                 L 154 23
                 L 204 49
                 L 90 47
                 Z"
              fill="url(#glassFillGrad)"
              stroke="#06B6D4"
              strokeWidth="1.2"
            />
            <line x1="144" y1="23" x2="140" y2="48" stroke="#22D3EE" strokeWidth="1.8" opacity="0.9" />
            {/* Sharp Aero Character Line */}
            <line x1="28" y1="53" x2="220" y2="53" stroke="#06B6D4" strokeWidth="1" opacity="0.6" />
            {/* Headlight & Taillight */}
            <polygon points="11,56 38,51 38,53 12,58" fill="#22D3EE" />
            <polygon points="216,52 226,57 222,61 214,56" fill="#F43F5E" />
            {/* Performance Wheels */}
            <circle cx="70" cy="65" r="14.5" fill="#05080E" stroke="#22D3EE" strokeWidth="2.2" />
            <circle cx="70" cy="65" r="9" fill="url(#wheelRimGrad)" stroke="#0891B2" strokeWidth="1" />
            <line x1="70" y1="55" x2="70" y2="75" stroke="#22D3EE" strokeWidth="1.2" />
            <line x1="60" y1="65" x2="80" y2="65" stroke="#22D3EE" strokeWidth="1.2" />
            <circle cx="70" cy="65" r="3" fill="#22D3EE" />
            <circle cx="178" cy="65" r="14.5" fill="#05080E" stroke="#22D3EE" strokeWidth="2.2" />
            <circle cx="178" cy="65" r="9" fill="url(#wheelRimGrad)" stroke="#0891B2" strokeWidth="1" />
            <line x1="178" y1="55" x2="178" y2="75" stroke="#22D3EE" strokeWidth="1.2" />
            <line x1="168" y1="65" x2="188" y2="65" stroke="#22D3EE" strokeWidth="1.2" />
            <circle cx="178" cy="65" r="3" fill="#22D3EE" />
          </g>
        )}

        {/* 7. PICKUP (Пикап - двухкабинник с открытым кузовом) */}
        {bodyType === 'pickup' && (
          <g>
            {/* Body */}
            <path
              d="M 12 60
                 L 12 48
                 L 26 44
                 L 56 44
                 L 80 18
                 L 146 18
                 L 146 44
                 L 220 44
                 L 222 60
                 L 210 63
                 L 196 63
                 A 18 18 0 0 0 158 63
                 L 90 63
                 A 18 18 0 0 0 52 63
                 L 20 63
                 Z"
              fill="url(#bodyFillGrad)"
              stroke="url(#bodyStrokeGrad)"
              strokeWidth="2.2"
              strokeLinejoin="miter"
            />
            {/* Roll Bar */}
            <polygon points="146,20 154,20 178,44 168,44" fill="#22D3EE" opacity="0.8" />
            {/* Glass */}
            <path
              d="M 83 22
                 L 142 22
                 L 142 42
                 L 66 42
                 Z"
              fill="url(#glassFillGrad)"
              stroke="#06B6D4"
              strokeWidth="1.2"
            />
            <line x1="114" y1="22" x2="114" y2="42" stroke="#22D3EE" strokeWidth="1.8" opacity="0.9" />
            {/* Bed Divider */}
            <line x1="146" y1="44" x2="146" y2="63" stroke="#06B6D4" strokeWidth="1.2" opacity="0.6" />
            {/* Lights */}
            <polygon points="12,47 34,44 34,47 13,50" fill="#22D3EE" />
            <polygon points="216,46 222,48 220,54 214,50" fill="#F43F5E" />
            {/* Heavy Wheels */}
            <circle cx="71" cy="63" r="16" fill="#05080E" stroke="#22D3EE" strokeWidth="2.4" />
            <circle cx="71" cy="63" r="10" fill="url(#wheelRimGrad)" stroke="#0891B2" strokeWidth="1.2" />
            <circle cx="71" cy="63" r="3.5" fill="#22D3EE" />
            <circle cx="177" cy="63" r="16" fill="#05080E" stroke="#22D3EE" strokeWidth="2.4" />
            <circle cx="177" cy="63" r="10" fill="url(#wheelRimGrad)" stroke="#0891B2" strokeWidth="1.2" />
            <circle cx="177" cy="63" r="3.5" fill="#22D3EE" />
          </g>
        )}

        {/* 8. MINIVAN (Минивэн - аэродинамичный однообъёмник) */}
        {bodyType === 'minivan' && (
          <g>
            {/* Body */}
            <path
              d="M 16 62
                 L 12 52
                 L 28 38
                 L 58 26
                 L 86 18
                 L 194 18
                 L 218 36
                 L 222 58
                 L 214 63
                 L 196 63
                 A 17 17 0 0 0 160 63
                 L 88 63
                 A 17 17 0 0 0 52 63
                 L 22 63
                 Z"
              fill="url(#bodyFillGrad)"
              stroke="url(#bodyStrokeGrad)"
              strokeWidth="2.2"
              strokeLinejoin="miter"
            />
            {/* Glass */}
            <path
              d="M 64 28
                 L 190 22
                 L 208 42
                 L 38 42
                 Z"
              fill="url(#glassFillGrad)"
              stroke="#06B6D4"
              strokeWidth="1.2"
            />
            <line x1="102" y1="23" x2="100" y2="42" stroke="#22D3EE" strokeWidth="1.8" opacity="0.9" />
            <line x1="150" y1="21" x2="148" y2="42" stroke="#22D3EE" strokeWidth="1.8" opacity="0.9" />
            {/* Sliding Door Rail */}
            <line x1="130" y1="46" x2="198" y2="46" stroke="#06B6D4" strokeWidth="1" strokeDasharray="3 2" opacity="0.7" />
            {/* Lights */}
            <polygon points="14,48 34,41 34,44 15,51" fill="#22D3EE" />
            <polygon points="216,42 222,46 220,52 214,48" fill="#F43F5E" />
            {/* Wheels */}
            <circle cx="70" cy="63" r="15" fill="#05080E" stroke="#22D3EE" strokeWidth="2.2" />
            <circle cx="70" cy="63" r="9.5" fill="url(#wheelRimGrad)" stroke="#0891B2" strokeWidth="1" />
            <line x1="70" y1="54" x2="70" y2="72" stroke="#22D3EE" strokeWidth="1.2" />
            <line x1="61" y1="63" x2="79" y2="63" stroke="#22D3EE" strokeWidth="1.2" />
            <circle cx="70" cy="63" r="3" fill="#22D3EE" />
            <circle cx="178" cy="63" r="15" fill="#05080E" stroke="#22D3EE" strokeWidth="2.2" />
            <circle cx="178" cy="63" r="9.5" fill="url(#wheelRimGrad)" stroke="#0891B2" strokeWidth="1" />
            <line x1="178" y1="54" x2="178" y2="72" stroke="#22D3EE" strokeWidth="1.2" />
            <line x1="169" y1="63" x2="187" y2="63" stroke="#22D3EE" strokeWidth="1.2" />
            <circle cx="178" cy="63" r="3" fill="#22D3EE" />
          </g>
        )}
      </svg>
    </div>
  );
}

export function VehiclePhoto({
  car,
  size = 'md',
  className = '',
  showBadge = false,
  altText,
}: VehiclePhotoProps) {
  const [imageError, setImageError] = useState(false);

  const bodyType: BodyType = (car?.bodyType as BodyType) || detectBodyType(car?.make, car?.model);
  const hasValidCustomPhoto = Boolean(car?.imageUrl && !imageError);

  // Responsive container sizing
  let sizeClasses = 'w-full h-32 rounded-xl';
  if (size === 'xs') sizeClasses = 'w-9 h-9 rounded-lg';
  else if (size === 'sm') sizeClasses = 'w-16 h-12 rounded-lg';
  else if (size === 'md') sizeClasses = 'w-full sm:w-48 h-28 rounded-xl';
  else if (size === 'lg') sizeClasses = 'w-full h-44 rounded-2xl';
  else if (size === 'hero') sizeClasses = 'w-full h-48 sm:h-56 rounded-2xl';

  const bodyTypeRussianLabel: Record<BodyType, string> = {
    sedan: 'Седан',
    crossover: 'Кроссовер',
    suv: 'Внедорожник',
    hatchback: 'Хэтчбек',
    wagon: 'Универсал',
    coupe: 'Купе',
    pickup: 'Пикап',
    minivan: 'Минивэн',
  };

  return (
    <div className={`relative overflow-hidden border border-cyan-500/20 bg-[#090C12] shrink-0 group select-none shadow-[inset_0_0_20px_rgba(0,0,0,0.6)] ${sizeClasses} ${className}`}>
      {hasValidCustomPhoto ? (
        <div className="w-full h-full relative overflow-hidden bg-[#06080E]">
          {/* Framed Image with object-cover and centered focus */}
          <img
            src={car?.imageUrl}
            alt={altText || `${car?.make || 'Автомобиль'} ${car?.model || ''}`}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />

          {/* Dark Cyber Vignette & Edge Shadows to blend photo seamlessly with UI */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#090C12] via-transparent to-[#090C12]/40 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#090C12]/60 via-transparent to-[#090C12]/60 pointer-events-none" />
          <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(9,12,18,0.9)] pointer-events-none" />
        </div>
      ) : (
        <VehicleSilhouette bodyType={bodyType} size={size} />
      )}

      {/* Cyber/Tech Badge overlay */}
      {showBadge && (
        <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-[#090C12]/90 border border-cyan-500/30 text-[9px] font-mono font-semibold text-[#06B6D4] backdrop-blur-md z-20 shadow-sm">
          {bodyTypeRussianLabel[bodyType] || 'Автомобиль'}
        </div>
      )}
    </div>
  );
}
