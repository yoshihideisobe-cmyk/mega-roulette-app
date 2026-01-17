import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, ...props }, ref) => {
        return (
            <div className="flex flex-col gap-2 w-full">
                {label && <label className="text-sm font-bold text-gold uppercase tracking-wider pl-1">{label}</label>}
                <input
                    ref={ref}
                    className={cn(
                        "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg text-white placeholder-white/30 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all shadow-inner",
                        "backdrop-blur-sm hover:bg-white/10",
                        className
                    )}
                    {...props}
                />
            </div>
        );
    }
);
Input.displayName = "Input";
