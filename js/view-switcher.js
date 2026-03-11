(function() {
    console.log("Selfware View Switcher v2 Loaded");


    // --- CLEANUP LEGACY UI ---
    // Remove any existing theme-switcher elements that might be lingering
    const legacySwitchers = document.querySelectorAll('.theme-switcher');
    legacySwitchers.forEach(el => el.remove());

    // --- THEME LOGIC START ---
    const themes = [
        { id: 'default', name: 'Dark', color: '#1a1e23', border: '#444' },
        { id: 'minimalist', name: 'Light', color: '#ffffff', border: '#ccc' },
        { id: 'book', name: 'Book', color: '#f4eec0', border: '#d7d3b0' }
    ];

    function setTheme(themeId) {
        themes.forEach(t => {
            if (t.id !== 'default') document.body.classList.remove('theme-' + t.id);
        });
        
        if (themeId !== 'default') {
            document.body.classList.add('theme-' + themeId);
        }
        
        localStorage.setItem('selfware-theme', themeId);
        updateThemeDot(themeId);
    }

    function updateThemeDot(activeThemeId) {
        const dot = document.getElementById('theme-main-dot');
        const theme = themes.find(t => t.id === activeThemeId) || themes[0];
        if (dot) {
            dot.style.backgroundColor = theme.color;
            dot.style.borderColor = theme.border;
        }
    }
    // --- THEME LOGIC END ---

    // 1. Inject CSS
    const style = document.createElement('style');
    style.textContent = `
        /* Main Container for Top Left */
        .top-left-controls {
            position: fixed !important;
            top: 24px !important;
            left: 28px !important;
            z-index: 2147483647 !important; /* MAX Z-INDEX */
            display: flex !important;
            align-items: center !important;
            gap: 16px !important; 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
            pointer-events: auto !important;
        }

        /* --- Language Switcher CSS --- */
        .lang-switcher-wrapper {
            position: relative;
            display: flex;
            align-items: center;
        }
        .lang-btn {
            background: rgba(30, 35, 40, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.12);
            color: rgba(255, 255, 255, 0.92);
            padding: 6px 10px;
            border-radius: 10px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.3px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.18);
            transition: all 0.2s ease;
        }
        .lang-btn:hover {
            border-color: rgba(0, 240, 255, 0.35);
            transform: translateY(-1px);
        }
        .lang-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            margin-top: 12px;
            padding: 8px;
            border-radius: 16px;
            background: rgba(20, 23, 28, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(12px);
            display: flex;
            flex-direction: column;
            gap: 6px;
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            transition: all 0.2s cubic-bezier(0.23, 1, 0.32, 1);
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 10002;
            min-width: 110px;
        }
        .lang-switcher-wrapper.active .lang-dropdown {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }
        .lang-option {
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.12);
            color: rgba(255, 255, 255, 0.9);
            padding: 8px 10px;
            border-radius: 12px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            text-align: left;
            transition: all 0.15s ease;
        }
        .lang-option:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.22);
        }
        .lang-option.current {
            background: rgba(0, 240, 255, 0.12);
            border-color: rgba(0, 240, 255, 0.22);
            color: #00f0ff;
        }

        /* --- Theme Switcher CSS --- */
        .theme-switcher-wrapper {
            position: relative;
            display: flex;
            align-items: center;
        }

        .theme-dot {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            cursor: pointer;
            border: 2px solid rgba(255,255,255,0.2);
            transition: all 0.2s ease;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            background-color: #1a1e23; /* Default fallback */
        }

        .theme-dot:hover {
            transform: scale(1.1);
            border-color: rgba(255,255,255,0.6);
        }

        .theme-dropdown {
            position: absolute;
            top: 100%;
            left: -6px;
            margin-top: 12px;
            background: rgba(20, 23, 28, 0.95);
            backdrop-filter: blur(12px);
            padding: 8px;
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            flex-direction: column;
            gap: 8px;
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            transition: all 0.2s cubic-bezier(0.23, 1, 0.32, 1);
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }

        .theme-switcher-wrapper.active .theme-dropdown {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }

        .theme-option-dot {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            cursor: pointer;
            border: 1px solid rgba(255,255,255,0.1);
            transition: transform 0.2s;
            position: relative;
        }
        
        .theme-option-dot:hover {
            transform: scale(1.2);
            z-index: 2;
        }

        .theme-option-dot::after {
            content: attr(data-tooltip);
            position: absolute;
            left: 140%; 
            top: 50%;
            transform: translateY(-50%);
            background: rgba(0,0,0,0.8);
            color: #fff;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s;
        }
        
        .theme-option-dot:hover::after {
            opacity: 1;
        }

        /* --- View Switcher CSS --- */
        .view-switcher-container {
            position: relative;
            text-align: left;
        }

        .view-switcher-trigger {
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.9);
            padding: 0;
            cursor: pointer;
            font-size: 16px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
            text-shadow: 0 1px 2px rgba(0,0,0,0.5);
            outline: none;
        }

        .view-switcher-trigger:hover {
            color: #00f0ff;
            transform: translateY(-1px);
        }

        .view-switcher-trigger .arrow {
            font-size: 10px;
            opacity: 0.6;
            transition: transform 0.3s ease;
        }

        .view-switcher-container.active .view-switcher-trigger .arrow {
            transform: rotate(180deg);
        }

        .project-name {
            font-weight: 700;
            letter-spacing: 0.5px;
        }

        .divider {
            opacity: 0.3;
            font-weight: 300;
            margin: 0 2px;
        }

        .current-view-name {
            font-weight: 400;
            opacity: 0.9;
            position: relative;
        }
        
        .current-view-name::after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 0;
            width: 0;
            height: 1px;
            background: #00f0ff;
            transition: width 0.3s ease;
        }
        
        .view-switcher-trigger:hover .current-view-name::after {
            width: 100%;
        }

        /* Dropdown Menu */
        .view-switcher-menu {
            position: absolute;
            top: 100%;
            left: -10px;
            margin-top: 16px;
            min-width: 220px;
            background: rgba(20, 23, 28, 0.9);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            padding: 8px !important;
            list-style: none !important;
            box-shadow: 
                0 4px 6px -1px rgba(0, 0, 0, 0.1),
                0 10px 15px -3px rgba(0, 0, 0, 0.1),
                0 20px 40px rgba(0,0,0,0.4);
            
            transform-origin: top left;
            opacity: 0;
            transform: scale(0.9) translateY(-10px);
            pointer-events: none;
            visibility: hidden;
            transition: 
                opacity 0.2s ease,
                transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
                visibility 0.2s;
            z-index: 10001;
        }

        .view-switcher-container.active .view-switcher-menu {
            opacity: 1;
            transform: scale(1) translateY(0);
            pointer-events: auto;
            visibility: visible;
        }

        .view-switcher-menu li {
            margin: 0 0 2px 0 !important;
            padding: 0 !important;
            opacity: 1 !important;
            transform: none !important;
            visibility: visible !important;
            display: block !important;
            border: none !important;
            background: transparent !important;
        }
        
        .view-switcher-menu a {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 16px;
            color: #94a3b8;
            text-decoration: none;
            border-radius: 10px;
            transition: all 0.2s ease;
            font-size: 14px;
            font-weight: 500;
            background: transparent;
        }

        .view-switcher-menu a:hover {
            background: rgba(255, 255, 255, 0.08);
            color: #fff;
            transform: translateX(4px);
        }

        .view-switcher-menu a.current {
            background: rgba(0, 240, 255, 0.1);
            color: #00f0ff;
        }

        .view-switcher-menu a.current .view-icon {
            opacity: 1;
        }

        .view-icon {
            font-size: 16px;
            width: 20px;
            text-align: center;
            opacity: 0.7;
            transition: opacity 0.2s;
        }

        /* Global Top Right Actions */
        .view-actions-container {
            position: fixed;
            top: 16px;
            right: 28px;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .action-btn {
            background: rgba(30, 35, 40, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.15);
            color: rgba(255, 255, 255, 0.9);
            padding: 6px 14px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            transition: all 0.2s cubic-bezier(0.23, 1, 0.32, 1);
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        .action-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            border-color: rgba(255, 255, 255, 0.3);
            transform: translateY(-1px);
        }

        /* Chat Panel */
        #chat-panel-overlay {
            position: fixed;
            top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.45);
            backdrop-filter: blur(4px);
            z-index: 99998;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s;
        }
        #chat-panel-overlay.active { opacity: 1; pointer-events: auto; }

        #chat-panel {
            position: fixed;
            top: 0; right: -420px;
            width: 420px;
            max-width: 90vw;
            height: 100vh;
            background: #0f1115;
            border-left: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: -20px 0 50px rgba(0,0,0,0.5);
            z-index: 99999;
            display: flex;
            flex-direction: column;
            transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        #chat-panel.open { right: 0; }

        .chat-panel-header {
            padding: 18px 20px;
            border-bottom: 1px solid rgba(255,255,255,0.08);
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(255,255,255,0.02);
            flex-shrink: 0;
        }
        .chat-panel-title {
            font-size: 13px;
            font-weight: 700;
            color: #8fdcff;
            letter-spacing: 1.2px;
            text-transform: uppercase;
        }
        #chat-panel-close {
            background: transparent;
            border: none;
            color: #666;
            font-size: 20px;
            cursor: pointer;
            padding: 4px 8px;
            line-height: 1;
            transition: color 0.2s;
        }
        #chat-panel-close:hover { color: #fff; }

        .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 16px 16px 8px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .chat-messages::-webkit-scrollbar { width: 4px; }
        .chat-messages::-webkit-scrollbar-track { background: transparent; }
        .chat-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 2px; }

        .chat-msg {
            max-width: 88%;
            padding: 10px 14px;
            border-radius: 14px;
            font-size: 13.5px;
            line-height: 1.6;
            white-space: pre-wrap;
            word-break: break-word;
        }
        .chat-msg.user {
            align-self: flex-end;
            background: linear-gradient(135deg, rgba(0,240,255,0.18), rgba(176,38,255,0.14));
            border: 1px solid rgba(0,240,255,0.15);
            color: #e0e6ed;
        }
        .chat-msg.user .chat-msg-selection {
            display: block;
            border-left: 2px solid rgba(0,240,255,0.5);
            padding-left: 10px;
            margin-bottom: 8px;
            color: #94a3b8;
            font-size: 12px;
            font-style: italic;
            max-height: 60px;
            overflow: hidden;
        }
        .chat-msg.ai {
            align-self: flex-start;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.06);
            color: #c8d0da;
        }
        .chat-msg.ai.error {
            border-color: rgba(255,100,100,0.2);
            color: #ffb4b4;
        }
        .chat-msg.thinking {
            align-self: flex-start;
            color: #8a94a6;
            font-style: italic;
            background: transparent;
            border: none;
            padding: 6px 14px;
        }
        .chat-msg.thinking::after {
            content: '';
            animation: dotPulse 1.2s infinite;
        }
        @keyframes dotPulse {
            0%, 20% { content: '.'; }
            40% { content: '..'; }
            60%, 100% { content: '...'; }
        }

        .chat-input-area {
            border-top: 1px solid rgba(255,255,255,0.08);
            padding: 12px 14px 16px;
            background: rgba(255,255,255,0.02);
            flex-shrink: 0;
        }
        .chat-selection-quote {
            display: none;
            border-left: 3px solid #00f0ff;
            padding: 8px 10px;
            margin-bottom: 10px;
            background: rgba(0,240,255,0.06);
            border-radius: 0 8px 8px 0;
            position: relative;
        }
        .chat-selection-quote.visible { display: block; }
        .chat-selection-quote .quote-label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #00f0ff;
            margin-bottom: 4px;
        }
        .chat-selection-quote .quote-text {
            font-size: 12px;
            color: #94a3b8;
            line-height: 1.5;
            max-height: 54px;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
        }
        .chat-selection-quote .quote-dismiss {
            position: absolute;
            top: 6px;
            right: 6px;
            background: transparent;
            border: none;
            color: #666;
            cursor: pointer;
            font-size: 14px;
            line-height: 1;
            padding: 2px 4px;
        }
        .chat-selection-quote .quote-dismiss:hover { color: #fff; }

        .chat-input-row {
            display: flex;
            gap: 8px;
            align-items: flex-end;
        }
        #chat-input {
            flex: 1;
            min-height: 40px;
            max-height: 120px;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.12);
            background: rgba(0,0,0,0.2);
            color: #e0e6ed;
            padding: 10px 14px;
            font: inherit;
            font-size: 13.5px;
            line-height: 1.5;
            resize: none;
            outline: none;
            overflow-y: auto;
        }
        #chat-input:focus { border-color: rgba(0,240,255,0.3); }
        #chat-input::placeholder { color: #555; }
        #chat-send-btn {
            width: 40px;
            height: 40px;
            border-radius: 12px;
            border: none;
            background: linear-gradient(135deg, #00f0ff, #b026ff);
            color: #071018;
            font-size: 18px;
            font-weight: 700;
            cursor: pointer;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.15s, box-shadow 0.15s;
        }
        #chat-send-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,240,255,0.3); }
        #chat-send-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }

        .chat-empty-state {
            text-align: center;
            padding: 40px 20px;
            color: #555;
            font-size: 13px;
            line-height: 1.7;
        }
        .chat-empty-state .chat-empty-icon { font-size: 28px; margin-bottom: 12px; }
        /* --- Theme: Minimalist (Light) --- */
        body.theme-minimalist .top-left-controls { color: #111827 !important; }
        body.theme-minimalist .view-switcher-trigger { color: #111827 !important; text-shadow: none !important; }
        body.theme-minimalist .view-switcher-trigger:hover { color: #2563eb !important; }
        body.theme-minimalist .current-view-name::after { background: #2563eb !important; }

        body.theme-minimalist .lang-btn {
            background: #ffffff !important;
            border: 1px solid #e5e7eb !important;
            color: #111827 !important;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08) !important;
        }
        body.theme-minimalist .lang-dropdown {
            background: rgba(255, 255, 255, 0.96) !important;
            border: 1px solid #e5e7eb !important;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1) !important;
        }
        body.theme-minimalist .lang-option {
            border-color: #e5e7eb !important;
            color: #111827 !important;
        }
        body.theme-minimalist .lang-option:hover {
            background: #f3f4f6 !important;
        }
        body.theme-minimalist .lang-option.current {
            background: #eff6ff !important;
            border-color: #bfdbfe !important;
            color: #2563eb !important;
        }
        
        body.theme-minimalist .theme-dot { border-color: rgba(0,0,0,0.2) !important; box-shadow: 0 2px 5px rgba(0,0,0,0.1) !important; }
        body.theme-minimalist .theme-dropdown { 
            background: rgba(255, 255, 255, 0.95) !important; 
            border: 1px solid #e5e7eb !important;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
        }
        body.theme-minimalist .theme-option-dot { border-color: rgba(0,0,0,0.1) !important; }
        
        body.theme-minimalist .view-switcher-menu {
            background: rgba(255, 255, 255, 0.95) !important;
            border: 1px solid #e5e7eb !important;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
        }
        body.theme-minimalist .view-switcher-menu a { color: #4b5563 !important; }
        body.theme-minimalist .view-switcher-menu a:hover { background: #f3f4f6 !important; color: #111827 !important; }
        body.theme-minimalist .view-switcher-menu a.current { background: #eff6ff !important; color: #2563eb !important; }

        body.theme-minimalist .action-btn {
            background: #ffffff !important;
            border: 1px solid #d1d5db !important;
            color: #374151 !important;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
        }
        body.theme-minimalist .action-btn:hover {
            background: #f9fafb !important;
            color: #111827 !important;
            border-color: #9ca3af !important;
        }

        body.theme-minimalist #chat-panel {
            background: #ffffff !important;
            border-left: 1px solid #e5e7eb !important;
            box-shadow: -10px 0 25px rgba(0,0,0,0.1) !important;
        }
        body.theme-minimalist .chat-panel-header {
            background: #f9fafb !important;
            border-bottom: 1px solid #e5e7eb !important;
        }
        body.theme-minimalist .chat-panel-title { color: #2563eb !important; }
        body.theme-minimalist #chat-panel-close { color: #9ca3af !important; }
        body.theme-minimalist #chat-panel-close:hover { color: #111827 !important; }
        body.theme-minimalist .chat-msg.user {
            background: #eff6ff !important;
            border-color: #bfdbfe !important;
            color: #111827 !important;
        }
        body.theme-minimalist .chat-msg.user .chat-msg-selection { color: #6b7280 !important; border-left-color: #2563eb !important; }
        body.theme-minimalist .chat-msg.ai {
            background: #f3f4f6 !important;
            border-color: #e5e7eb !important;
            color: #374151 !important;
        }
        body.theme-minimalist .chat-msg.thinking { color: #9ca3af !important; }
        body.theme-minimalist .chat-input-area { background: #f9fafb !important; border-top-color: #e5e7eb !important; }
        body.theme-minimalist #chat-input {
            background: #ffffff !important;
            border-color: #d1d5db !important;
            color: #111827 !important;
        }
        body.theme-minimalist #chat-input::placeholder { color: #9ca3af !important; }
        body.theme-minimalist #chat-send-btn { background: linear-gradient(135deg, #2563eb, #7c3aed) !important; color: #fff !important; }
        body.theme-minimalist .chat-selection-quote {
            background: rgba(37,99,235,0.06) !important;
            border-left-color: #2563eb !important;
        }
        body.theme-minimalist .chat-selection-quote .quote-label { color: #2563eb !important; }
        body.theme-minimalist .chat-selection-quote .quote-text { color: #6b7280 !important; }
        body.theme-minimalist .chat-selection-quote .quote-dismiss { color: #9ca3af !important; }
        body.theme-minimalist .chat-selection-quote .quote-dismiss:hover { color: #374151 !important; }
        body.theme-minimalist .chat-empty-state { color: #9ca3af !important; }
        body.theme-minimalist .chat-messages::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1) !important; }

        /* --- Theme: Book (Serif) --- */
        body.theme-book .top-left-controls { color: #2c241b !important; font-family: 'Merriweather', serif !important; }
        body.theme-book .view-switcher-trigger { color: #2c241b !important; text-shadow: none !important; font-family: 'Merriweather', serif !important; }
        body.theme-book .view-switcher-trigger:hover { color: #a0522d !important; }
        body.theme-book .current-view-name::after { background: #a0522d !important; }

        body.theme-book .lang-btn {
            background: rgba(253, 251, 247, 0.85) !important;
            border: 1px solid rgba(160, 82, 45, 0.18) !important;
            color: #2c241b !important;
            font-family: 'Merriweather', serif !important;
            box-shadow: 0 2px 10px rgba(44, 36, 27, 0.08) !important;
        }
        body.theme-book .lang-dropdown {
            background: #fdfbf7 !important;
            border: 1px solid #e6e0d2 !important;
            box-shadow: 0 10px 30px rgba(44, 36, 27, 0.15) !important;
        }
        body.theme-book .lang-option {
            border-color: rgba(160, 82, 45, 0.18) !important;
            color: #2c241b !important;
            font-family: 'Merriweather', serif !important;
        }
        body.theme-book .lang-option:hover {
            background: rgba(160, 82, 45, 0.08) !important;
        }
        body.theme-book .lang-option.current {
            background: rgba(160, 82, 45, 0.12) !important;
            border-color: rgba(160, 82, 45, 0.22) !important;
            color: #a0522d !important;
        }

        body.theme-book .theme-dot { border-color: rgba(160, 82, 45, 0.3) !important; box-shadow: 0 2px 4px rgba(60, 50, 40, 0.1) !important; }
        body.theme-book .theme-dropdown {
            background: #fdfbf7 !important;
            border: 1px solid #e6e0d2 !important;
            box-shadow: 0 10px 30px rgba(44, 36, 27, 0.15) !important;
        }
        body.theme-book .theme-option-dot { border-color: rgba(160, 82, 45, 0.2) !important; }

        body.theme-book .view-switcher-menu {
            background: #fdfbf7 !important;
            border: 1px solid #e6e0d2 !important;
            box-shadow: 0 10px 30px rgba(44, 36, 27, 0.15) !important;
        }
        body.theme-book .view-switcher-menu a { color: #5d5446 !important; font-family: 'Merriweather', serif !important; }
        body.theme-book .view-switcher-menu a:hover { background: rgba(160, 82, 45, 0.1) !important; color: #2c241b !important; }
        body.theme-book .view-switcher-menu a.current { background: rgba(160, 82, 45, 0.15) !important; color: #a0522d !important; }

        body.theme-book .action-btn {
            background: #fdfbf7 !important;
            border: 1px solid #e6e0d2 !important;
            color: #5d5446 !important;
            font-family: 'Merriweather', serif !important;
            box-shadow: 0 2px 4px rgba(60, 50, 40, 0.05) !important;
        }
        body.theme-book .action-btn:hover {
            background: #fff !important;
            color: #2c241b !important;
            border-color: #a0522d !important;
        }

        body.theme-book #chat-panel {
            background: #fdfbf7 !important;
            border-left: 1px solid #e6e0d2 !important;
            box-shadow: -10px 0 30px rgba(44, 36, 27, 0.15) !important;
        }
        body.theme-book .chat-panel-header {
            background: #f9f6ef !important;
            border-bottom: 1px solid #e6e0d2 !important;
        }
        body.theme-book .chat-panel-title { color: #a0522d !important; font-family: 'Merriweather', serif !important; }
        body.theme-book #chat-panel-close { color: #8b4513 !important; }
        body.theme-book #chat-panel-close:hover { color: #2c241b !important; }
        body.theme-book .chat-msg.user {
            background: rgba(160,82,45,0.1) !important;
            border-color: rgba(160,82,45,0.15) !important;
            color: #2c241b !important;
        }
        body.theme-book .chat-msg.user .chat-msg-selection { color: #5d5446 !important; border-left-color: #a0522d !important; }
        body.theme-book .chat-msg.ai {
            background: #f5f1e8 !important;
            border-color: #e6e0d2 !important;
            color: #2c241b !important;
        }
        body.theme-book .chat-msg.thinking { color: #8b4513 !important; }
        body.theme-book .chat-input-area { background: #f9f6ef !important; border-top-color: #e6e0d2 !important; }
        body.theme-book #chat-input {
            background: #fdfbf7 !important;
            border-color: #e6e0d2 !important;
            color: #2c241b !important;
            font-family: 'Merriweather', serif !important;
        }
        body.theme-book #chat-input::placeholder { color: #a08060 !important; }
        body.theme-book #chat-send-btn { background: linear-gradient(135deg, #a0522d, #8b4513) !important; color: #fff !important; }
        body.theme-book .chat-selection-quote {
            background: rgba(160,82,45,0.06) !important;
            border-left-color: #a0522d !important;
        }
        body.theme-book .chat-selection-quote .quote-label { color: #a0522d !important; }
        body.theme-book .chat-selection-quote .quote-text { color: #5d5446 !important; font-family: 'Merriweather', serif !important; }
        body.theme-book .chat-selection-quote .quote-dismiss { color: #8b4513 !important; }
        body.theme-book .chat-empty-state { color: #a08060 !important; font-family: 'Merriweather', serif !important; }
        body.theme-book .chat-msg { font-family: 'Merriweather', serif !important; }
        body.theme-book .chat-messages::-webkit-scrollbar-thumb { background: rgba(160,82,45,0.15) !important; }

        /* --- Global Toast --- */
        #audp-global-toast {
            position: fixed;
            left: 50%;
            bottom: 24px;
            transform: translateX(-50%) translateY(120%);
            opacity: 0;
            visibility: hidden;
            background: rgba(0, 240, 255, 0.92);
            color: #000;
            padding: 10px 14px;
            border-radius: 999px;
            font-weight: 700;
            box-shadow: 0 12px 35px rgba(0,240,255,0.22);
            transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.18s ease;
            z-index: 2147483647;
            pointer-events: none;
        }
        #audp-global-toast.show {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
            visibility: visible;
        }
        body.theme-minimalist #audp-global-toast {
            background: #0f172a;
            color: #ffffff;
            box-shadow: 0 12px 35px rgba(15, 23, 42, 0.22);
        }
        body.theme-book #audp-global-toast {
            background: #a0522d;
            color: #ffffff;
            box-shadow: 0 12px 35px rgba(160, 82, 45, 0.18);
        }
    `;
    document.head.appendChild(style);

    // 2. Logic
    const currentPath = window.location.pathname;
    const views = [
        { name: 'Self', file: 'self.html', icon: '🧾' },
        { name: 'Doc', file: 'doc.html', icon: '📄' },
        { name: 'Presentation', file: 'presentation.html', icon: '📊' },
        { name: 'Card', file: 'card.html', icon: '🃏' },
        { name: 'Outline', file: 'outline.html', icon: '📝' },
        { name: 'Mindmap', file: 'mindmap.html', icon: '🧠' },
        { name: 'Canvas', file: 'canvas.html', icon: '🎨' }
    ];

    const activeView = views.find(v => currentPath.includes(v.file)) || views[0];
    const currentLang = (window.selfwareLang || 'zh');
    const withLang = (u) => (window.selfwareWithLang ? window.selfwareWithLang(u) : u);

    // 3. Inject HTML
    // A. Main Control Wrapper (Top Left)
    const mainWrapper = document.createElement('div');
    mainWrapper.className = 'top-left-controls';

    // B. Theme Switcher HTML
    const themeHtml = `
        <div class="theme-switcher-wrapper" id="theme-trigger-wrapper">
            <div class="theme-dot" id="theme-main-dot"></div>
            <div class="theme-dropdown">
                ${themes.map(t => `
                    <div class="theme-option-dot" 
                         style="background:${t.color}; border-color:${t.border}" 
                         data-theme="${t.id}"
                         data-tooltip="${t.name}">
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // C. Language Switcher HTML
    const langHtml = `
        <div class="lang-switcher-wrapper" id="lang-switcher-wrapper">
            <button class="lang-btn" id="lang-btn" title="Language">
                ${(currentLang === 'zh') ? '中文' : 'EN'}
                <span style="opacity:.65;font-size:10px;">▼</span>
            </button>
            <div class="lang-dropdown" id="lang-dropdown">
                <button class="lang-option ${currentLang === 'zh' ? 'current' : ''}" data-lang="zh">中文</button>
                <button class="lang-option ${currentLang === 'en' ? 'current' : ''}" data-lang="en">EN</button>
            </div>
        </div>
    `;

    // D. View Switcher HTML
    const viewSwitcherHtml = `
        <div class="view-switcher-container" id="view-switcher-container">
            <div class="view-switcher-trigger" id="vs-trigger">
                <span class="project-name">Selfware</span>
                <span class="divider">//</span>
                <span class="current-view-name">${activeView.name.toUpperCase()}</span>
                <span class="arrow">▼</span>
            </div>
            <ul class="view-switcher-menu">
                ${views.map(v => {
                    const isCurrent = currentPath.includes(v.file);
                    return `
                        <li>
                            <a href="${withLang(v.file)}" class="${isCurrent ? 'current' : ''}">
                                <span class="view-icon">${v.icon}</span>
                                ${v.name}
                            </a>
                        </li>
                    `;
                }).join('')}
            </ul>
        </div>
    `;

    mainWrapper.innerHTML = themeHtml + langHtml + viewSwitcherHtml;
    
    // SAFE INJECTION
    if (document.body) {
        document.body.appendChild(mainWrapper);
    } else {
        window.addEventListener('DOMContentLoaded', () => {
            document.body.appendChild(mainWrapper);
        });
    }

    // D/E. Global Actions + Chat Panel (always injected)
    {
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'view-actions-container';
        const t = (k, f) => (window.selfwareT ? window.selfwareT(k, f) : (f || k));
        actionsContainer.innerHTML = `
            <button class="action-btn" id="chat-panel-toggle">
                ✨ AI Edit
            </button>
        `;

        const chatHtml = `
            <div id="chat-panel-overlay"></div>
            <div id="chat-panel">
                <div class="chat-panel-header">
                    <span class="chat-panel-title">AI // SELFWARE EDIT</span>
                    <button id="chat-panel-close">×</button>
                </div>
                <div class="chat-messages" id="chat-messages">
                    <div class="chat-empty-state">
                        <div class="chat-empty-icon">✨</div>
                        选中文章中的文字，或直接输入指令<br>让 AI 按 Selfware 协议修改文档
                    </div>
                </div>
                <div class="chat-input-area">
                    <div class="chat-selection-quote" id="chat-selection-quote">
                        <div class="quote-label">选中文本</div>
                        <div class="quote-text" id="chat-quote-text"></div>
                        <button class="quote-dismiss" id="chat-quote-dismiss">×</button>
                    </div>
                    <div class="chat-input-row">
                        <textarea id="chat-input" rows="1" spellcheck="false" placeholder="输入编辑指令…"></textarea>
                        <button id="chat-send-btn">↑</button>
                    </div>
                </div>
            </div>
        `;

        const chatContainer = document.createElement('div');
        chatContainer.innerHTML = chatHtml;

        function safeAppend(el) {
            if (document.body) {
                document.body.appendChild(el);
            } else {
                window.addEventListener('DOMContentLoaded', () => document.body.appendChild(el), { once: true });
            }
        }
        safeAppend(actionsContainer);
        safeAppend(chatContainer);
    }

    // Global toast (used for "Edit Source" save feedback in every view)
    let toastTimer = null;
    function ensureGlobalToastEl() {
        let el = document.getElementById('audp-global-toast');
        if (el) return el;
        el = document.createElement('div');
        el.id = 'audp-global-toast';
        if (document.body) {
            document.body.appendChild(el);
        } else {
            window.addEventListener('DOMContentLoaded', () => document.body.appendChild(el), { once: true });
        }
        return el;
    }
    function showGlobalToast(msg) {
        const el = ensureGlobalToastEl();
        el.textContent = msg;
        el.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove('show'), 1600);
    }

    // 4. Interaction Logic
    
    // Theme Switcher Interaction
    const themeWrapper = document.getElementById('theme-trigger-wrapper');
    const themeMainDot = document.getElementById('theme-main-dot');
    
    if (themeMainDot) {
        themeMainDot.addEventListener('click', (e) => {
            e.stopPropagation();
            themeWrapper.classList.toggle('active');
        });
    }

    document.querySelectorAll('.theme-option-dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            setTheme(dot.dataset.theme);
            if (themeWrapper) themeWrapper.classList.remove('active');
        });
    });

    // View Switcher Interaction
    const vsContainer = document.getElementById('view-switcher-container');
    const vsTrigger = document.getElementById('vs-trigger');

    if (vsTrigger) {
        vsTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            vsContainer.classList.toggle('active');
        });
    }

    // Global Click Handler (Close Menus)
    document.addEventListener('click', (e) => {
        if (themeWrapper && !themeWrapper.contains(e.target)) {
            themeWrapper.classList.remove('active');
        }
        const langWrapper = document.getElementById('lang-switcher-wrapper');
        if (langWrapper && !langWrapper.contains(e.target)) {
            langWrapper.classList.remove('active');
        }
        if (vsContainer && !vsContainer.contains(e.target)) {
            vsContainer.classList.remove('active');
        }
    });

    // Init Theme
    const savedTheme = localStorage.getItem('selfware-theme') || 'book';
    setTheme(savedTheme);

    // Language Switcher Interaction
    const langWrapper = document.getElementById('lang-switcher-wrapper');
    const langBtn = document.getElementById('lang-btn');
    if (langBtn && langWrapper) {
        langBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            langWrapper.classList.toggle('active');
        });
    }
    document.querySelectorAll('.lang-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const lang = btn.dataset.lang;
            if (window.selfwareSetLang) {
                window.selfwareSetLang(lang, { reload: true });
            } else {
                try { localStorage.setItem('selfware-lang', lang); } catch {}
                const url = new URL(window.location.href);
                url.searchParams.set('lang', lang);
                window.location.href = url.toString();
            }
        });
    });

    // 5. Chat Panel Logic
    {
        const panel = document.getElementById('chat-panel');
        const overlay = document.getElementById('chat-panel-overlay');
        const toggleBtn = document.getElementById('chat-panel-toggle');
        const closeBtn = document.getElementById('chat-panel-close');
        const messagesEl = document.getElementById('chat-messages');
        const inputEl = document.getElementById('chat-input');
        const sendBtn = document.getElementById('chat-send-btn');
        const quoteEl = document.getElementById('chat-selection-quote');
        const quoteText = document.getElementById('chat-quote-text');
        const quoteDismiss = document.getElementById('chat-quote-dismiss');

        let currentSelection = '';
        const chatMessages = [];

        function openChatPanel() {
            if (panel) panel.classList.add('open');
            if (overlay) overlay.classList.add('active');
            if (inputEl) inputEl.focus();
        }

        function closeChatPanel() {
            if (panel) panel.classList.remove('open');
            if (overlay) overlay.classList.remove('active');
        }

        function setSelection(text) {
            currentSelection = (text || '').trim();
            if (currentSelection && quoteEl && quoteText) {
                quoteText.textContent = currentSelection;
                quoteEl.classList.add('visible');
            } else {
                clearSelection();
            }
        }

        function clearSelection() {
            currentSelection = '';
            if (quoteEl) quoteEl.classList.remove('visible');
            if (quoteText) quoteText.textContent = '';
        }

        function autoGrowInput() {
            if (!inputEl) return;
            inputEl.style.height = 'auto';
            inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
        }

        function scrollToBottom() {
            if (messagesEl) {
                requestAnimationFrame(() => {
                    messagesEl.scrollTop = messagesEl.scrollHeight;
                });
            }
        }

        function clearEmptyState() {
            const empty = messagesEl && messagesEl.querySelector('.chat-empty-state');
            if (empty) empty.remove();
        }

        function addMessage(role, text, selection) {
            clearEmptyState();
            const msg = document.createElement('div');
            msg.className = 'chat-msg ' + role;
            if (role === 'user' && selection) {
                const selEl = document.createElement('span');
                selEl.className = 'chat-msg-selection';
                selEl.textContent = selection.length > 120 ? selection.slice(0, 120) + '\u2026' : selection;
                msg.appendChild(selEl);
            }
            const textNode = document.createTextNode(text);
            msg.appendChild(textNode);
            if (messagesEl) messagesEl.appendChild(msg);
            chatMessages.push({ role, text, selection: selection || '' });
            scrollToBottom();
            return msg;
        }

        function addThinking() {
            clearEmptyState();
            const msg = document.createElement('div');
            msg.className = 'chat-msg thinking';
            msg.id = 'chat-thinking';
            msg.textContent = 'AI \u6b63\u5728\u6309 Selfware \u534f\u8bae\u4fee\u6539';
            if (messagesEl) messagesEl.appendChild(msg);
            scrollToBottom();
            return msg;
        }

        function removeThinking() {
            const el = document.getElementById('chat-thinking');
            if (el) el.remove();
        }

        async function sendMessage() {
            if (!inputEl) return;
            const instruction = inputEl.value.trim();
            if (!instruction) return;

            const selection = currentSelection;
            addMessage('user', instruction, selection);
            inputEl.value = '';
            autoGrowInput();
            clearSelection();

            sendBtn.disabled = true;
            addThinking();

            try {
                const res = await fetch(withLang('/api/chat_edit'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        instruction: instruction,
                        selection: selection,
                        lang: (window.selfwareLang || 'zh'),
                        history: chatMessages.map(m => ({ role: m.role === 'ai' ? 'assistant' : m.role, text: m.text })),
                    }),
                });
                removeThinking();

                if (!res.ok) {
                    const errText = await res.text();
                    throw new Error(errText || ('HTTP ' + res.status));
                }

                const data = await res.json();
                if (typeof data.content === 'string') {
                    window.dispatchEvent(new CustomEvent('audp-content-updated', { detail: data.content }));
                    const reply = data.reply || '✅ 已应用修改';
                    addMessage('ai', reply);
                    showGlobalToast('AI edit applied');
                } else {
                    addMessage('ai', '⚠️ 模型返回了意外的格式');
                }
            } catch (err) {
                removeThinking();
                const errMsg = document.createElement('div');
                errMsg.className = 'chat-msg ai error';
                errMsg.textContent = '\u274c ' + (err.message || '\u8bf7\u6c42\u5931\u8d25');
                if (messagesEl) messagesEl.appendChild(errMsg);
                scrollToBottom();
                showGlobalToast('AI edit failed');
                console.error(err);
            } finally {
                sendBtn.disabled = false;
                if (inputEl) inputEl.focus();
            }
        }

        // Event listeners
        if (toggleBtn) toggleBtn.addEventListener('click', openChatPanel);
        if (closeBtn) closeBtn.addEventListener('click', closeChatPanel);
        if (overlay) overlay.addEventListener('click', closeChatPanel);
        if (quoteDismiss) quoteDismiss.addEventListener('click', clearSelection);
        if (sendBtn) sendBtn.addEventListener('click', sendMessage);

        if (inputEl) {
            inputEl.addEventListener('input', autoGrowInput);
            inputEl.addEventListener('keydown', (e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault();
                    sendMessage();
                }
            });
        }

        // Text Selection Detection
        let selectionDebounce = null;
        document.addEventListener('mouseup', () => {
            clearTimeout(selectionDebounce);
            selectionDebounce = setTimeout(() => {
                const sel = window.getSelection();
                if (!sel || sel.isCollapsed) return;
                const text = sel.toString().trim();
                if (!text) return;

                // Ignore selections inside the chat panel itself
                const anchor = sel.anchorNode;
                const focus = sel.focusNode;
                const panelEl = document.getElementById('chat-panel');
                if (panelEl && (panelEl.contains(anchor) || panelEl.contains(focus))) return;

                setSelection(text);
                // Auto-open chat panel when text is selected
                if (panel && !panel.classList.contains('open')) {
                    openChatPanel();
                }
            }, 150);
        });

        // Keyboard shortcut: Escape to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && panel && panel.classList.contains('open')) {
                closeChatPanel();
            }
        });
    }

})();
