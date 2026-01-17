import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface ButtonProps extends HTMLMotionProps<"button"> {
    variant?: "primary" | "secondary" | "danger";
    size?: "sm" | "md" | "lg";
}

export function Button({ className, variant = "primary", size = "md", children, ...props }: ButtonProps) {
    const variants = {
        primary: "bg-gradient-to-br from-gold via-[#fff0a0] to-gold-dim text-navy border-b-4 border-[#b49000] active:border-b-0 active:translate-y-1 shadow-lg shadow-gold/20 hover:shadow-gold/40 hover:brightness-110",
        secondary: "bg-white/10 backdrop-blur text-white border-b-4 border-white/20 active:border-b-0 active:translate-y-1 hover:bg-white/20",
        danger: "bg-red-600 text-white border-b-4 border-red-800 active:border-b-0 active:translate-y-1 hover:bg-red-500",
    };

    const sizes = {
        sm: "px-3 py-1 text-sm rounded-lg",
        md: "px-6 py-3 text-lg rounded-xl font-bold font-cinzel tracking-wider",
        lg: "px-8 py-4 text-2xl rounded-2xl font-bold font-cinzel tracking-widest",
    };

    return (
        <motion.button
            whileTap={{ scale: 0.98 }}
            className={cn(
                "relative transition-all duration-100 uppercase flex items-center justify-center outline-none focus:ring-2 focus:ring-gold/50",
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </motion.button>
    );
}
