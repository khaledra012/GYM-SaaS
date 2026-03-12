import React from 'react';
import { MessageCircle } from 'lucide-react';

const SUPPORT_NUMBER = '01060508475';

const SupportFooter = () => {
    return (
        <footer className="support-footer" role="contentinfo" aria-label="WhatsApp support link">
            <span className="support-footer-label">WhatsApp</span>
            <a className="support-footer-link" href="https://wa.me/201060508475" dir="ltr" target="_blank" rel="noreferrer noopener">
                <MessageCircle size={12} />
                <span>{SUPPORT_NUMBER}</span>
            </a>
        </footer>
    );
};

export default SupportFooter;
