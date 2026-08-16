/* @ds-bundle: {"format":4,"namespace":"PortfolioBuilderDesignSystem_4996bb","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Modal","sourcePath":"components/feedback/Modal.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"},{"name":"GlassCard","sourcePath":"components/surfaces/GlassCard.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"847396fe730c","components/core/Button.jsx":"36f42921b1d0","components/core/IconButton.jsx":"bee5586d59f3","components/feedback/Modal.jsx":"3f7d9ba759c8","components/forms/Input.jsx":"d63aa88314d0","components/forms/Select.jsx":"d4aeadf24591","components/forms/Switch.jsx":"d3a6f9a06c06","components/navigation/Tabs.jsx":"7f50f6747a59","components/surfaces/GlassCard.jsx":"f9fa44cdf6b2","ui_kits/portfolio-builder/BuilderDashboard.jsx":"aec1def28bc0","ui_kits/portfolio-builder/PublicPortfolio.jsx":"24aa9c9e5f27","ui_kits/portfolio-builder/SettingsScreen.jsx":"b9ed62f4c703","ui_kits/portfolio-builder/TemplateGallery.jsx":"6cacae51f7e3"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.PortfolioBuilderDesignSystem_4996bb = window.PortfolioBuilderDesignSystem_4996bb || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
const COLORS = {
  indigo: 'var(--indigo-500)',
  purple: 'var(--purple-500)',
  orange: 'var(--orange-600)',
  pink: 'var(--pink-500)',
  green: 'var(--green-600)',
  red: 'var(--red-600)'
};
function Badge({
  color = 'indigo',
  children
}) {
  return React.createElement('span', {
    style: {
      background: COLORS[color] || COLORS.indigo,
      color: '#fff',
      fontSize: '12px',
      fontWeight: 600,
      padding: '4px 12px',
      borderRadius: 'var(--radius-pill)',
      display: 'inline-flex',
      alignItems: 'center',
      fontFamily: 'var(--font-sans)',
      letterSpacing: '0.01em'
    }
  }, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
const VARIANTS = {
  primary: {
    background: 'var(--indigo-500)',
    color: '#fff'
  },
  secondary: {
    background: 'var(--purple-500)',
    color: '#fff'
  },
  danger: {
    background: 'var(--red-600)',
    color: '#fff'
  },
  success: {
    background: 'var(--green-600)',
    color: '#fff'
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-body)',
    border: '1px solid var(--border-strong)'
  }
};
function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  children
}) {
  const pad = size === 'sm' ? '8px 16px' : size === 'lg' ? '14px 28px' : '11px 22px';
  const fontSize = size === 'sm' ? '13px' : size === 'lg' ? '16px' : '14px';
  const v = VARIANTS[variant] || VARIANTS.primary;
  const [hover, setHover] = React.useState(false);
  return React.createElement('button', {
    onClick,
    disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      ...v,
      padding: pad,
      fontSize,
      fontWeight: 600,
      borderRadius: 'var(--radius-pill)',
      border: v.border || 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transform: hover && !disabled ? 'scale(1.05)' : 'scale(1)',
      boxShadow: hover && !disabled ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
      transition: 'transform var(--duration-normal) var(--ease-standard), box-shadow var(--duration-normal) var(--ease-standard)',
      fontFamily: 'var(--font-sans)'
    }
  }, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function IconButton({
  icon,
  tone = 'default',
  size = 44,
  onClick,
  title
}) {
  const [hover, setHover] = React.useState(false);
  const bg = tone === 'accent' ? 'var(--indigo-500)' : tone === 'danger' ? 'var(--red-600)' : 'var(--surface-card)';
  const color = tone === 'default' ? 'var(--text-body)' : '#fff';
  return React.createElement('button', {
    onClick,
    title,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      background: bg,
      color,
      border: tone === 'default' ? '1px solid var(--border-default)' : 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontSize: size * 0.45,
      transform: hover ? 'scale(1.1)' : 'scale(1)',
      boxShadow: hover ? 'var(--shadow-md)' : 'none',
      transition: 'transform var(--duration-normal) var(--ease-standard), box-shadow var(--duration-normal) var(--ease-standard)'
    }
  }, icon);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Modal.jsx
try { (() => {
function Modal({
  open,
  title,
  onClose,
  children,
  footer
}) {
  if (!open) return null;
  return React.createElement('div', {
    onClick: onClose,
    style: {
      position: 'fixed',
      inset: 0,
      background: 'var(--surface-overlay)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      fontFamily: 'var(--font-sans)'
    }
  }, React.createElement('div', {
    onClick: e => e.stopPropagation(),
    style: {
      background: 'var(--surface-panel)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-xl)',
      width: 'min(90vw,480px)',
      maxHeight: '85vh',
      display: 'flex',
      flexDirection: 'column',
      padding: 28
    }
  }, React.createElement('div', {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16
    }
  }, React.createElement('h3', {
    style: {
      margin: 0,
      fontSize: 22,
      fontWeight: 700,
      color: 'var(--text-heading)'
    }
  }, title), React.createElement('button', {
    onClick: onClose,
    style: {
      background: 'none',
      border: 'none',
      fontSize: 20,
      color: 'var(--text-muted)',
      cursor: 'pointer'
    }
  }, '✕')), React.createElement('div', {
    style: {
      flex: 1,
      overflowY: 'auto',
      color: 'var(--text-body)',
      fontSize: 14
    }
  }, children), footer && React.createElement('div', {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 10,
      marginTop: 20
    }
  }, footer)));
}
Object.assign(__ds_scope, { Modal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Modal.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function Input({
  label,
  placeholder,
  value,
  onChange,
  type = 'text'
}) {
  return React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      fontFamily: 'var(--font-sans)'
    }
  }, label && React.createElement('label', {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-body)'
    }
  }, label), React.createElement('input', {
    type,
    placeholder,
    value,
    onChange,
    style: {
      padding: '12px 14px',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-default)',
      background: 'var(--surface-card)',
      color: 'var(--text-heading)',
      fontSize: 14,
      outline: 'none',
      fontFamily: 'var(--font-sans)',
      transition: 'border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)'
    },
    onFocus: e => {
      e.target.style.borderColor = 'var(--indigo-500)';
      e.target.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.35)';
    },
    onBlur: e => {
      e.target.style.borderColor = 'var(--border-default)';
      e.target.style.boxShadow = 'none';
    }
  }));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function Select({
  label,
  value,
  onChange,
  options = []
}) {
  return React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      fontFamily: 'var(--font-sans)'
    }
  }, label && React.createElement('label', {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-body)'
    }
  }, label), React.createElement('select', {
    value,
    onChange,
    style: {
      padding: '12px 14px',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-default)',
      background: 'var(--surface-card)',
      color: 'var(--text-heading)',
      fontSize: 14,
      outline: 'none',
      fontFamily: 'var(--font-sans)'
    }
  }, options.map((o, i) => React.createElement('option', {
    key: i,
    value: o.value
  }, o.label))));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function Switch({
  options = ['Light', 'Dark', 'System'],
  value,
  onChange
}) {
  return React.createElement('div', {
    style: {
      display: 'inline-flex',
      background: 'var(--surface-panel)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-pill)',
      padding: 4,
      gap: 2,
      fontFamily: 'var(--font-sans)'
    }
  }, options.map(o => {
    const active = o === value;
    return React.createElement('button', {
      key: o,
      onClick: () => onChange && onChange(o),
      style: {
        padding: '6px 16px',
        borderRadius: 'var(--radius-pill)',
        border: 'none',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 600,
        background: active ? 'var(--indigo-500)' : 'transparent',
        color: active ? '#fff' : 'var(--text-body)',
        transition: 'background var(--duration-fast) var(--ease-standard)'
      }
    }, o);
  }));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function Tabs({
  tabs = [],
  value,
  onChange
}) {
  return React.createElement('div', {
    style: {
      display: 'flex',
      gap: 4,
      borderBottom: '1px solid var(--border-default)',
      fontFamily: 'var(--font-sans)'
    }
  }, tabs.map(t => {
    const active = t === value;
    return React.createElement('button', {
      key: t,
      onClick: () => onChange && onChange(t),
      style: {
        padding: '10px 18px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: 600,
        color: active ? 'var(--indigo-400)' : 'var(--text-muted)',
        borderBottom: active ? '2px solid var(--indigo-400)' : '2px solid transparent',
        transition: 'color var(--duration-fast) var(--ease-standard)'
      }
    }, t);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/GlassCard.jsx
try { (() => {
function GlassCard({
  title,
  subtitle,
  accent = 'indigo',
  onClick,
  children
}) {
  const [hover, setHover] = React.useState(false);
  const accentColor = {
    indigo: 'var(--indigo-400)',
    purple: 'var(--purple-400)',
    orange: 'var(--orange-400)',
    pink: 'var(--pink-500)'
  }[accent] || 'var(--indigo-400)';
  return React.createElement('div', {
    onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      background: 'var(--surface-glass)',
      backdropFilter: 'var(--blur-glass)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-xl)',
      padding: '20px',
      cursor: onClick ? 'pointer' : 'default',
      transform: hover ? 'translateY(-8px)' : 'translateY(0)',
      boxShadow: hover ? 'var(--shadow-lg)' : 'var(--shadow-md)',
      transition: 'transform var(--duration-normal) var(--ease-standard), box-shadow var(--duration-normal) var(--ease-standard)',
      fontFamily: 'var(--font-sans)'
    }
  }, title && React.createElement('h4', {
    style: {
      margin: '0 0 4px',
      color: accentColor,
      fontSize: 18,
      fontWeight: 700
    }
  }, title), subtitle && React.createElement('p', {
    style: {
      margin: '0 0 12px',
      color: 'var(--text-muted)',
      fontSize: 13
    }
  }, subtitle), children);
}
Object.assign(__ds_scope, { GlassCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/GlassCard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/portfolio-builder/BuilderDashboard.jsx
try { (() => {
function BuilderDashboard({
  onOpenGallery,
  onOpenSettings
}) {
  const [sections, setSections] = React.useState([{
    id: 1,
    name: 'Hero',
    color: 'indigo'
  }, {
    id: 2,
    name: 'Work grid',
    color: 'purple'
  }, {
    id: 3,
    name: 'About',
    color: 'orange'
  }, {
    id: 4,
    name: 'Contact',
    color: 'pink'
  }]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      height: '100%',
      fontFamily: 'var(--font-sans)',
      background: 'var(--bg)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 260,
      borderRight: '1px solid var(--border-default)',
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 800,
      fontSize: 18,
      color: 'var(--text-heading)',
      marginBottom: 20
    }
  }, "Jane's site"), sections.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.id,
    draggable: true,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '12px 14px',
      borderRadius: 'var(--radius-md)',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-default)',
      cursor: 'grab',
      transition: 'transform .3s var(--ease-bounce)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)'
    }
  }, "⠿"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: `var(--${s.color}-500)`
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--text-heading)'
    }
  }, s.name))), /*#__PURE__*/React.createElement("button", {
    onClick: onOpenGallery,
    style: {
      marginTop: 8,
      padding: '10px 16px',
      borderRadius: 'var(--radius-pill)',
      border: '1px dashed var(--border-strong)',
      background: 'none',
      color: 'var(--text-muted)',
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer'
    }
  }, "+ Add section")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: 32,
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 22,
      fontWeight: 700,
      color: 'var(--text-heading)'
    }
  }, "Live preview"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onOpenSettings,
    style: {
      width: 40,
      height: 40,
      borderRadius: '50%',
      border: '1px solid var(--border-default)',
      background: 'var(--surface-card)',
      color: 'var(--text-body)',
      cursor: 'pointer'
    }
  }, "⚙"), /*#__PURE__*/React.createElement("button", {
    style: {
      padding: '10px 22px',
      borderRadius: 'var(--radius-pill)',
      background: 'var(--indigo-500)',
      color: '#fff',
      border: 'none',
      fontWeight: 600,
      cursor: 'pointer',
      boxShadow: 'var(--shadow-sm)'
    }
  }, "Publish"))), /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-xl)',
      padding: 24,
      background: 'var(--surface-panel)',
      minHeight: 340
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--text-muted)',
      marginBottom: 16
    }
  }, "Preview — janedoe.portfoliobuilder.co"), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 64,
      borderRadius: 'var(--radius-md)',
      background: 'linear-gradient(90deg,var(--indigo-600),var(--purple-600))',
      marginBottom: 14
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 10
    }
  }, [0, 1, 2].map(i => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      height: 70,
      borderRadius: 'var(--radius-md)',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-default)'
    }
  }))))));
}
window.BuilderDashboard = BuilderDashboard;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/portfolio-builder/BuilderDashboard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/portfolio-builder/PublicPortfolio.jsx
try { (() => {
function PublicPortfolio() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100%',
      background: 'var(--bg)',
      padding: '56px 24px',
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 960,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 64
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 800,
      fontSize: 20,
      color: 'var(--text-heading)'
    }
  }, "Jane Doe"), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      gap: 28,
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "Work"), /*#__PURE__*/React.createElement("span", null, "About"), /*#__PURE__*/React.createElement("span", null, "Contact"))), /*#__PURE__*/React.createElement("section", {
    style: {
      marginBottom: 80
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--indigo-400)',
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      marginBottom: 12
    }
  }, "Product Designer"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 64,
      fontWeight: 800,
      letterSpacing: '-0.02em',
      margin: 0,
      lineHeight: 1.1,
      color: 'var(--text-heading)'
    }
  }, "Designing calm, ", /*#__PURE__*/React.createElement("span", {
    style: {
      background: 'linear-gradient(90deg,var(--indigo-400),var(--purple-400))',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent'
    }
  }, "useful"), " software."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 18,
      color: 'var(--text-body)',
      maxWidth: 560,
      marginTop: 20,
      lineHeight: 1.6
    }
  }, "I partner with startups to turn fuzzy ideas into shipped products — from first sketch to design system.")), /*#__PURE__*/React.createElement("section", {
    style: {
      marginBottom: 80
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 28,
      fontWeight: 700,
      color: 'var(--text-heading)',
      marginBottom: 24
    }
  }, "Selected work"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 20
    }
  }, [{
    t: 'Nimbus Finance',
    c: 'indigo',
    d: 'Redesigning a banking app for clarity'
  }, {
    t: 'Loop Studio',
    c: 'purple',
    d: 'Brand + web for a design collective'
  }, {
    t: 'Fielda',
    c: 'orange',
    d: 'Field-service scheduling, reimagined'
  }].map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: 'var(--surface-glass)',
      backdropFilter: 'var(--blur-glass)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-xl)',
      padding: 24,
      transition: 'transform .3s var(--ease-standard), box-shadow .3s var(--ease-standard)',
      cursor: 'pointer'
    },
    onMouseEnter: e => {
      e.currentTarget.style.transform = 'translateY(-8px)';
      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: 120,
      borderRadius: 'var(--radius-md)',
      background: `var(--${p.c}-500)`,
      marginBottom: 16,
      opacity: 0.85
    }
  }), /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: '0 0 6px',
      fontSize: 17,
      fontWeight: 700,
      color: 'var(--text-heading)'
    }
  }, p.t), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 13,
      color: 'var(--text-muted)'
    }
  }, p.d))))), /*#__PURE__*/React.createElement("footer", {
    style: {
      borderTop: '1px solid var(--border-default)',
      paddingTop: 24,
      display: 'flex',
      justifyContent: 'space-between',
      color: 'var(--text-muted)',
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", null, "\xA9 2026 Jane Doe"), /*#__PURE__*/React.createElement("span", null, "Built with Portfolio Builder"))));
}
window.PublicPortfolio = PublicPortfolio;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/portfolio-builder/PublicPortfolio.jsx", error: String((e && e.message) || e) }); }

// ui_kits/portfolio-builder/SettingsScreen.jsx
try { (() => {
function SettingsScreen({
  onClose
}) {
  const [tab, setTab] = React.useState('Profile');
  const tabs = ['Profile', 'Domain', 'Billing'];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'var(--surface-overlay)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-sans)',
      zIndex: 50
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-panel)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-xl)',
      width: 'min(90vw,560px)',
      maxHeight: '85vh',
      display: 'flex',
      flexDirection: 'column',
      padding: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontSize: 22,
      fontWeight: 700,
      color: 'var(--text-heading)'
    }
  }, "Site settings"), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      background: 'none',
      border: 'none',
      fontSize: 20,
      color: 'var(--text-muted)',
      cursor: 'pointer'
    }
  }, "✕")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      borderBottom: '1px solid var(--border-default)',
      marginBottom: 20
    }
  }, tabs.map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    onClick: () => setTab(t),
    style: {
      padding: '10px 18px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: 14,
      fontWeight: 600,
      color: tab === t ? 'var(--indigo-400)' : 'var(--text-muted)',
      borderBottom: tab === t ? '2px solid var(--indigo-400)' : '2px solid transparent'
    }
  }, t))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, tab === 'Profile' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-body)'
    }
  }, "Site title"), /*#__PURE__*/React.createElement("input", {
    defaultValue: "Jane Doe — Portfolio",
    style: {
      padding: '12px 14px',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-default)',
      background: 'var(--surface-card)',
      color: 'var(--text-heading)',
      fontSize: 14
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-body)'
    }
  }, "Theme"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      background: 'var(--surface-panel)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-pill)',
      padding: 4,
      gap: 2,
      width: 'fit-content'
    }
  }, ['Light', 'Dark', 'System'].map(o => /*#__PURE__*/React.createElement("button", {
    key: o,
    style: {
      padding: '6px 16px',
      borderRadius: 'var(--radius-pill)',
      border: 'none',
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 600,
      background: o === 'Dark' ? 'var(--indigo-500)' : 'transparent',
      color: o === 'Dark' ? '#fff' : 'var(--text-body)'
    }
  }, o))))), tab === 'Domain' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-body)'
    }
  }, "Custom domain"), /*#__PURE__*/React.createElement("input", {
    placeholder: "janedoe.com",
    style: {
      padding: '12px 14px',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-default)',
      background: 'var(--surface-card)',
      color: 'var(--text-heading)',
      fontSize: 14
    }
  })), tab === 'Billing' && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--text-body)'
    }
  }, "Pro plan — $12/mo. ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--indigo-400)',
      fontWeight: 600
    }
  }, "Manage"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 10,
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      padding: '11px 22px',
      borderRadius: 'var(--radius-pill)',
      border: '1px solid var(--border-strong)',
      background: 'none',
      color: 'var(--text-body)',
      fontWeight: 600,
      cursor: 'pointer'
    }
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    style: {
      padding: '11px 22px',
      borderRadius: 'var(--radius-pill)',
      border: 'none',
      background: 'var(--indigo-500)',
      color: '#fff',
      fontWeight: 600,
      cursor: 'pointer'
    }
  }, "Save"))));
}
window.SettingsScreen = SettingsScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/portfolio-builder/SettingsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/portfolio-builder/TemplateGallery.jsx
try { (() => {
function TemplateGallery({
  onClose
}) {
  const templates = [{
    n: 'Monochrome',
    c: 'indigo'
  }, {
    n: 'Warm Studio',
    c: 'orange'
  }, {
    n: 'Bold Grid',
    c: 'purple'
  }, {
    n: 'Editorial',
    c: 'pink500'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'var(--surface-overlay)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-sans)',
      zIndex: 50
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-panel)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-xl)',
      width: 'min(90vw,720px)',
      maxHeight: '85vh',
      padding: 28,
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontSize: 24,
      fontWeight: 700,
      color: 'var(--text-heading)'
    }
  }, "Choose a template"), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      background: 'none',
      border: 'none',
      fontSize: 20,
      color: 'var(--text-muted)',
      cursor: 'pointer'
    }
  }, "✕")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2,1fr)',
      gap: 16
    }
  }, templates.map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'transform .3s var(--ease-standard), box-shadow .3s var(--ease-standard)'
    },
    onMouseEnter: e => {
      e.currentTarget.style.transform = 'translateY(-6px)';
      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 110,
      background: t.c === 'pink500' ? 'linear-gradient(135deg,var(--pink-500),var(--pink-900))' : `linear-gradient(135deg,var(--${t.c}-500),var(--${t.c}-600))`
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700,
      fontSize: 15,
      color: 'var(--text-heading)'
    }
  }, t.n)))))));
}
window.TemplateGallery = TemplateGallery;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/portfolio-builder/TemplateGallery.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Modal = __ds_scope.Modal;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.GlassCard = __ds_scope.GlassCard;

})();
