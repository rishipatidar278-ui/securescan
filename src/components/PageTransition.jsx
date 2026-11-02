import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

export default function PageTransition({ children, className }) {
  const { pathname } = useLocation();

  return (
    <motion.div
      key={pathname}
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}