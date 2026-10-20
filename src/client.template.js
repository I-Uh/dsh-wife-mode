window.__ModuleLoader__.load({
  id: 'dsh-wife-mode',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /**
     * Palette sampled from the "Wife Mode" poster: powder-blue paper, ink-navy
     * lettering, royal-blue accents, teal/rose status marks, and the deep
     * midnight-blue counterpart for dark mode. Only alias tokens are touched,
     * so every host component keeps its own geometry and behavior.
     */
    const TOKENS = {
      '--dsw-alias-bg-base': { light: '#eef4fd', dark: '#0c1422' },
      '--dsw-alias-bg-layer-1': { light: '#fbfdff', dark: '#141f33' },
      '--dsw-alias-bg-layer-2': { light: '#e4edfa', dark: '#1b2a43' },
      '--dsw-alias-bg-overlay': { light: '#ffffff', dark: '#18243b' },
      '--dsw-alias-border-l1': { light: '#d7e2f4', dark: '#27374f' },
      '--dsw-alias-border-l2': { light: '#b7cbe8', dark: '#374c70' },
      '--dsw-alias-brand-primary': { light: '#3368cc', dark: '#7fa9f0' },
      '--dsw-alias-label-primary': { light: '#182a52', dark: '#e9efff' },
      '--dsw-alias-label-secondary': { light: '#526a8c', dark: '#a7b8d6' },
      '--dsw-alias-state-error-primary': { light: '#c94f63', dark: '#f2808f' },
      '--dsw-alias-state-idle-primary': { light: '#8ba2c0', dark: '#5d7395' },
      '--dsw-alias-state-success-primary': { light: '#2f8f7d', dark: '#5cc0a6' },
      '--dsw-alias-state-warn-primary': { light: '#b8791f', dark: '#e2b063' },
      '--dsw-specific-sidebar-fill': { light: '#e7effc', dark: '#0f1a2b' },
    };

    // assets/wallpaper.webp, inlined by assets/build-client.mjs so the client
    // bundle stays one self-contained module.
    const WALLPAPER = '__WALLPAPER_DATA_URI__';

    /** Settings namespace shared with the Host half. */
    const WIFE_MODE_NAMESPACE = 'mist-whale-theme';
    /** Client locale namespace for this bundle's own strings. */
    const LOCALE_NAMESPACE = 'mist-whale-theme';

    const WALLPAPER_CSS = `
.mwt-wallpaper {
  position: fixed;
  inset: 0 0 0 auto;
  width: min(38vw, 420px);
  pointer-events: none;
  user-select: none;
  background-repeat: no-repeat;
  background-position: 50% 0;
  background-size: cover;
  opacity: 0.26;
  -webkit-mask-image: linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.55) 42%, #000 100%);
  mask-image: linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.55) 42%, #000 100%);
}
body[data-ds-dark-theme] .mwt-wallpaper {
  opacity: 0.16;
  filter: saturate(0.9) brightness(1.08);
}
@media (max-width: 900px) {
  .mwt-wallpaper { width: 52vw; opacity: 0.18; }
}`;

    const DICT_ZH = {
      label: '人妻模式',
      on: '本对话已开启人妻模式：回复会带着温柔、黏人的妻子语气。',
      off: '本对话未开启人妻模式，点一下开启。',
      pending: '正在切换人妻模式…',
      failed: '人妻模式切换失败，稍后再试。',
    };
    const DICT_EN = {
      label: 'Wife Mode',
      on: 'Wife Mode is on for this conversation: replies follow the wife persona.',
      off: 'Wife Mode is off for this conversation. Click to turn it on.',
      pending: 'Switching Wife Mode…',
      failed: 'Could not switch Wife Mode. Try again.',
    };

    /**
     * One in-page store for the switch, shared by the composer control and the
     * wallpaper layer: the control owns the current Session, the layer only
     * paints when that Session is on. `ids` is null until the first read lands.
     */
    const wifeState = { ids: null, current: null, loading: null };
    const wifeSubscribers = new Set();

    function publish(patch) {
      Object.assign(wifeState, patch);
      for (const listener of [...wifeSubscribers]) listener();
    }

    /** Re-render the caller on every switch change. */
    function useWifeState() {
      const [, bump] = React.useState(0);
      React.useEffect(() => {
        const listener = () => bump((value) => value + 1);
        wifeSubscribers.add(listener);
        return () => {
          wifeSubscribers.delete(listener);
        };
      }, []);
      return wifeState;
    }

    /** Remembered across reloads so a cold start keeps the last look. */
    const LAST_SESSION_KEY = 'dsh-wife-mode.last-session';

    /** Read the enabled list once; later mounts reuse it. */
    function ensureIds(settings) {
      if (wifeState.ids !== null || wifeState.loading) return;
      wifeState.loading = readSessions(settings).then(
        (ids) => {
          publish({ ids: new Set(ids), loading: null });
        },
        () => {
          wifeState.loading = null;
        },
      );
    }

    function readLastSession() {
      try {
        return window.localStorage.getItem(LAST_SESSION_KEY);
      } catch (error) {
        return null;
      }
    }

    function rememberSession(sessionId) {
      try {
        window.localStorage.setItem(LAST_SESSION_KEY, sessionId);
      } catch (error) {
        /* storage is optional */
      }
    }

    /**
     * Build the always-mounted visual layer. It owns both the palette override
     * and the portrait, so the look survives leaving the conversation: the
     * widget only unmounts together with the plugin.
     * @param options - the theme service and the settings namespace service.
     * @returns the layer component.
     */
    function createWallpaperLayer(options) {
      const { theme, settings } = options;

      return function WallpaperLayer() {
        const state = useWifeState();
        const active = !!(state.ids && state.current && state.ids.has(state.current));

        // A cold start may open on a non-conversation panel: restore the last
        // Session from storage and read the switch list here as well, so the
        // look is right without waiting for a composer to mount.
        React.useEffect(() => {
          if (!wifeState.current) {
            const last = readLastSession();
            if (last) publish({ current: last });
          }
          ensureIds(settings);
        }, []);

        // The palette belongs to the switch, not to the plugin: it is stacked
        // while the last shown Session is on and removed the moment it is not.
        React.useEffect(() => {
          if (!active || !theme) return undefined;
          const remove = theme.overrideTokens('mist-whale-theme', TOKENS);
          return () => remove();
        }, [active]);

        if (!active) return null;
        return h(
          React.Fragment,
          null,
          h('style', { key: 'style' }, WALLPAPER_CSS),
          h('div', {
            key: 'art',
            className: 'mwt-wallpaper',
            'aria-hidden': 'true',
            style: { backgroundImage: 'url("' + WALLPAPER + '")' },
          }),
        );
      };
    }

    /**
     * Find the enabled-Session list inside the Host settings view. The wire
     * view is a redacted projection; this reads the namespace entry wherever it
     * nests rather than pinning one field name that a Host release may rename.
     * @param view - value returned by `settings.describe()`.
     * @returns the stored Session ids, or undefined when they are not present.
     */
    function pickSessions(view) {
      const read = (section) =>
        section && typeof section === 'object' && Array.isArray(section.sessions)
          ? section.sessions.map(String)
          : undefined;
      const stack = [view];
      const seen = new Set();
      while (stack.length > 0) {
        const node = stack.pop();
        if (!node || typeof node !== 'object' || seen.has(node)) continue;
        seen.add(node);
        if (Array.isArray(node)) {
          for (const item of node) stack.push(item);
          continue;
        }
        const id = node.ns ?? node.namespace ?? node.id ?? node.name;
        if (id === WIFE_MODE_NAMESPACE) {
          const section = node.value ?? node.values ?? node.section ?? node.resolved;
          const direct = read(section) ?? read(node);
          if (direct) return direct;
        }
        for (const key of Object.keys(node)) {
          if (key === WIFE_MODE_NAMESPACE) {
            const entry = node[key];
            if (entry && typeof entry === 'object') {
              const section = entry.value ?? entry.values ?? entry.section ?? entry;
              const direct = read(section) ?? read(entry);
              if (direct) return direct;
            }
          }
          stack.push(node[key]);
        }
      }
      return undefined;
    }

    /**
     * Read the enabled-Session list from the Host settings document.
     * @param settings - the `remote.settings` namespace service.
     * @returns the stored Session ids, empty when unreadable.
     */
    async function readSessions(settings) {
      if (!settings || typeof settings.describe !== 'function') return [];
      let view;
      try {
        view = await settings.describe();
      } catch (error) {
        return [];
      }
      if (view && view.ok === false) return [];
      return pickSessions(view && view.ok === true ? view.value : view) ?? [];
    }

    /**
     * Toggle one Session without dropping the other Sessions' choices: read the
     * current list, change this entry, and write the whole list back.
     * @param settings - the `remote.settings` namespace service.
     * @param sessionId - the Session whose switch is being flipped.
     * @param next - the requested value for that Session.
     */
    async function writeSessionMode(settings, sessionId, next) {
      if (!settings || typeof settings.update !== 'function') {
        throw new Error('settings remote unavailable');
      }
      const current = await readSessions(settings);
      const ids = new Set(current);
      if (next) ids.add(sessionId);
      else ids.delete(sessionId);
      const answer = await settings.update(WIFE_MODE_NAMESPACE, { sessions: [...ids] }, undefined);
      if (answer && answer.ok === false) {
        throw new Error((answer.error && answer.error.message) || 'settings write rejected');
      }
    }

    /**
     * Build the composer control. It sits in the composer's right control row,
     * so the current Session always shows whether the persona is in force.
     * @param options - settings namespace service, translate function, and locale service.
     * @returns the control component.
     */
    function createWifeModeControl(options) {
      const { settings, t, locale } = options;

      return function WifeModeControl(props) {
        const sessionId = props && props.sessionId ? String(props.sessionId) : '';
        const state = useWifeState();
        const [busy, setBusy] = React.useState(false);
        const [, tick] = React.useState(0);

        const on = !!(state.ids && sessionId && state.ids.has(sessionId));
        const active = on && state.current === sessionId;

        React.useEffect(() => {
          if (!locale || typeof locale.subscribe !== 'function') return undefined;
          return locale.subscribe(() => tick((value) => value + 1));
        }, []);

        // This control is mounted only for the Session on screen, so it owns the
        // shared "last shown Session" and the first settings read. That value is
        // deliberately not cleared on unmount: leaving the conversation keeps
        // the look of whatever was last on screen.
        React.useEffect(() => {
          if (!sessionId) return undefined;
          publish({ current: sessionId });
          rememberSession(sessionId);
          ensureIds(settings);
          return undefined;
        }, [sessionId]);

        const toggle = React.useCallback(() => {
          if (busy || !sessionId) return;
          const next = !on;
          const optimistic = new Set(wifeState.ids || []);
          if (next) optimistic.add(sessionId);
          else optimistic.delete(sessionId);
          setBusy(true);
          publish({ ids: optimistic });
          writeSessionMode(settings, sessionId, next)
            .then(() => readSessions(settings))
            .then((ids) => publish({ ids: new Set(ids) }))
            .catch(() => {
              const reverted = new Set(wifeState.ids || []);
              if (next) reverted.delete(sessionId);
              else reverted.add(sessionId);
              publish({ ids: reverted });
            })
            .then(() => setBusy(false));
        }, [busy, on, sessionId]);
        const label = t('label', DICT_ZH.label);

        return h(
          'button',
          {
            type: 'button',
            onClick: toggle,
            disabled: busy || !sessionId,
            'aria-pressed': active,
            title: active ? t('on', DICT_ZH.on) : t('off', DICT_ZH.off),
            style: {
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              height: 24,
              padding: '0 9px',
              borderRadius: 999,
              border: '1px solid ' + (active ? 'var(--dsw-alias-brand-primary)' : 'var(--dsw-alias-border-l1)'),
              background: active ? 'var(--dsw-alias-brand-primary)' : 'transparent',
              color: active ? 'var(--dsw-alias-bg-base)' : 'var(--dsw-alias-label-secondary)',
              font: 'inherit',
              fontSize: 12,
              lineHeight: '22px',
              cursor: busy ? 'default' : 'pointer',
              opacity: busy ? 0.65 : 1,
              whiteSpace: 'nowrap',
              transition: 'background-color 150ms ease, color 150ms ease, border-color 150ms ease',
            },
          },
          h('span', { key: 'heart', 'aria-hidden': 'true', style: { fontSize: 11 } }, '♡'),
          label,
        );
      };
    }

    return {
      inject: ['theme', 'slots'],
      apply(ctx) {
        const theme = ctx.theme;
        const locale = ctx.get('locale');
        if (locale) {
          const addDict = (id, dict) => {
            ctx.effect(() => {
              try {
                return locale.register(LOCALE_NAMESPACE, id, dict);
              } catch (error) {
                return () => {};
              }
            });
          };
          addDict('zh', DICT_ZH);
          addDict('en', DICT_EN);
        }
        const translate = (key, fallback) => {
          if (!locale) return fallback;
          try {
            const value = locale.bind(LOCALE_NAMESPACE)(key);
            return value === key ? fallback : value;
          } catch (error) {
            return fallback;
          }
        };

        // `ctx.get` reads a namespaced service without the façade property
        // guard, which rejects `remote.settings` unless the name is injected.
        const settings = ctx.get('remote.settings');

        const WallpaperLayer = createWallpaperLayer({ theme, settings });
        ctx.slots.inject('shell.overlay', () =>
          ctx.slots.register(
            { name: 'shell.overlay', id: 'mist-whale-wallpaper', order: -100 },
            WallpaperLayer,
          ),
        );

        const WifeModeControl = createWifeModeControl({ settings, t: translate, locale });
        ctx.slots.inject('conversation.input.right', () =>
          ctx.slots.register(
            { name: 'conversation.input.right', id: 'mist-whale-wife-mode', order: 30 },
            WifeModeControl,
          ),
        );
      },
    };
  },
});
