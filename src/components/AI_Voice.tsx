"use client";

/**
 * @author: @kokonutui
 * @description: AI Voice
 * @version: 1.0.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

import { Mic } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AI_VoiceProps {
  isRecording: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export default function AI_Voice({ isRecording, onClick, disabled }: AI_VoiceProps) {
    const [time, setTime] = useState(0);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (isRecording) {
            intervalId = setInterval(() => {
                setTime((t) => t + 1);
            }, 1000);
        } else {
            setTime(0);
        }

        return () => clearInterval(intervalId);
    }, [isRecording]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`;
    };

    const handleClick = () => {
        onClick();
    };

    return (
        <div className="flex items-center gap-2">
            <button
                className={cn(
                    "group w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                    isRecording
                        ? "bg-none"
                        : "bg-none hover:bg-black/5 dark:hover:bg-white/5"
                )}
                type="button"
                disabled={disabled}
                onClick={handleClick}
            >
                {isRecording ? (
                    <div
                        className="w-4 h-4 rounded-sm animate-spin bg-black dark:bg-white cursor-pointer pointer-events-auto"
                        style={{ animationDuration: "3s" }}
                    />
                ) : (
                    <Mic className="w-4 h-4 text-black/90 dark:text-white/90" />
                )}
            </button>

            {isRecording && (
                <>
                    <span
                        className={cn(
                            "font-mono text-sm transition-opacity duration-300",
                            "text-black/70 dark:text-white/70"
                        )}
                    >
                        {formatTime(time)}
                    </span>

                    <div className="h-4 w-32 flex items-center justify-center gap-0.5">
                        {[...Array(24)].map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "w-0.5 rounded-full transition-all duration-300",
                                    "bg-black/50 dark:bg-white/50 animate-pulse"
                                )}
                                style={
                                    isClient
                                        ? {
                                              height: `${20 + Math.random() * 80}%`,
                                              animationDelay: `${i * 0.05}s`,
                                          }
                                        : undefined
                                }
                            />
                        ))}
                    </div>

                    <p className="h-4 text-xs text-black/70 dark:text-white/70">
                        Listening...
                    </p>
                </>
            )}
        </div>
    );
}