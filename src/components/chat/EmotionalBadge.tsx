"use client";

import React from "react";
import { EmotionalProfile } from "@/lib/eq/types";

interface EmotionalBadgeProps {
  profile: EmotionalProfile;
}

export const EmotionalBadge: React.FC<EmotionalBadgeProps> = ({ profile }) => {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${profile.badgeColor} shadow-sm backdrop-blur-md mb-2 transition-all`}
      title={`Tone Guidance: ${profile.toneAdvice}`}
    >
      <span>{profile.emoji}</span>
      <span>{profile.label}</span>
    </div>
  );
};
