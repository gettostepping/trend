"use client";
import { useActionState, useEffect, useState } from "react"; // Next.js 15 uses useActionState
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import styles from "./contact.module.css";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, CheckCircle, AlertCircle } from "lucide-react";
import { sendEmail } from "@/actions/sendEmail";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { useFormStatus } from "react-dom";
import { useAnalytics } from "@/hooks/useAnalytics";

// Submit Button Component for Loading State
function SubmitButton() {
    const { pending } = useFormStatus();
    const { trackClick } = useAnalytics();

    return (
        <button 
            type="submit" 
            className={styles.submitBtn} 
            disabled={pending}
            onClick={() => trackClick('button', 'contact-form-submit')}
        >
            {pending ? "Sending..." : "Send Message"}
        </button>
    );
}

export default function Contact() {
    const [state, formAction] = useActionState(sendEmail, {
        success: false,
        message: "",
    });
    const [formDisabled, setFormDisabled] = useState<boolean | null>(null);

    useEffect(() => {
        fetch('/api/settings/public', { cache: 'no-store' })
            .then((r) => r.json())
            .then((data) => setFormDisabled(data.contactFormDisabled === true))
            .catch(() => setFormDisabled(false));
    }, []);

    useEffect(() => {
        if (state.success) {
            const form = document.querySelector('form') as HTMLFormElement;
            if (form) form.reset();
        }
    }, [state.success]);

    return (
        <main>
            <Navbar />
            <div className={styles.container}>
                <ScrollReveal delay={0} direction="left">
                    <div className={styles.infoSection}>
                        <h1 className={styles.title}>
                            Let's Start a <br />
                            <span className={styles.gradientText}>Conversation.</span>
                        </h1>
                        <p className={styles.description}>
                            Ready to ignite your brand's potential? Fill out the form or reach out to us directly. We're here to help you go viral.
                        </p>

                        <div className={styles.contactDetails}>
                            <motion.div 
                                className={styles.detailItem}
                                whileHover={{ scale: 1.02, x: 5 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <div className={styles.iconWrapper}>
                                    <Mail size={24} />
                                </div>
                                <div className={styles.detailText}>
                                    <h3>Email Us</h3>
                                    <p>team@trendsignite.com</p>
                                </div>
                            </motion.div>
                            <motion.div 
                                className={styles.detailItem}
                                whileHover={{ scale: 1.02, x: 5 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <div className={styles.iconWrapper}>
                                    <Phone size={24} />
                                </div>
                                <div className={styles.detailText}>
                                    <h3>Call Us</h3>
                                    <p>+1 (555) 123-4567</p>
                                </div>
                            </motion.div>
                            <motion.div 
                                className={styles.detailItem}
                                whileHover={{ scale: 1.02, x: 5 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <div className={styles.iconWrapper}>
                                    <MapPin size={24} />
                                </div>
                                <div className={styles.detailText}>
                                    <h3>Visit Us</h3>
                                    <p>Los Angeles, CA</p>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </ScrollReveal>

                <ScrollReveal delay={0.2} direction="right">
                    <motion.div
                        className={styles.formCard}
                        whileHover={formDisabled ? undefined : { scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 200 }}
                    >
                    {formDisabled ? (
                        <div className={styles.disabledMessage}>
                            <p>The contact form is temporarily unavailable. Please reach out to us directly at team@trendsignite.com</p>
                        </div>
                    ) : (
                    <form action={formAction}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Name</label>
                            <input name="name" type="text" className={styles.input} placeholder="John Doe" required />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Email</label>
                            <input name="email" type="email" className={styles.input} placeholder="john@example.com" required />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Message</label>
                            <textarea name="message" className={styles.textarea} placeholder="Tell us about your project..." required></textarea>
                        </div>

                        <SubmitButton />

                        {state.message && (
                            <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: state.success ? "green" : "red", fontWeight: 600 }}>
                                {state.success ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                <span>{state.message}</span>
                            </div>
                        )}
                    </form>
                    )}
                    </motion.div>
                </ScrollReveal>
            </div>
            <Footer />
        </main>
    );
}
